const mongoose = require('mongoose');
const Invoice = require('../models/invoice.model');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');
const StockHistory = require('../models/stockHistory.model');
const CashFlowTransaction = require('../models/cashFlowTransaction.model');
const Delivery = require('../models/delivery.model');
const { getNextSequence } = require('../utils/sequence');
const { changeStock } = require('../utils/stockUtils'); // Dùng cho deleteInvoice
const { PREFIXES, DELIVERY_STATUS } = require('../utils/constants');

// 1. LẤY DANH SÁCH HÓA ĐƠN
exports.getInvoices = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { status, search, startDate, endDate } = req.query;
        const organizationId = req.organizationId;

        let query = { organizationId };

        if (search) {
            query.$or = [
                { invoiceNumber: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } }
            ];
        }

        if (status && status !== 'all') {
            if (status === 'debt') query.$expr = { $gt: ["$finalAmount", "$paidAmount"] };
            else if (status === 'paid') query.$expr = { $lte: ["$finalAmount", "$paidAmount"] };
            else query.status = status;
        }

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59))
            };
        }

        const total = await Invoice.countDocuments(query);
        const invoices = await Invoice.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('items.productId', 'sku unit');

        res.json({
            data: invoices,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 2. CHI TIẾT HÓA ĐƠN
exports.getInvoiceById = async (req, res) => {
    try {
        const { organizationId } = req;
        const invoice = await Invoice.findOne({ _id: req.params.id, organizationId })
            .populate('customerId', 'name phone address companyName taxCode')
            .populate('items.productId', 'sku name unit');

        if (!invoice) return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
        res.json(invoice);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 3. TẠO HÓA ĐƠN MỚI (Logic Thẻ kho đã được sửa)
exports.createInvoice = async (req, res) => {
    const { organizationId } = req;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { customerId, items, discountAmount, paymentAmount, paymentMethod, deliveryInfo, note } = req.body;

        // Lấy thông tin khách hàng
        let customer = null;
        let customerName = 'Khách lẻ';
        if (customerId) {
            customer = await Customer.findOne({ _id: customerId, organizationId }).session(session);
            if (customer) customerName = customer.name;
        }

        // Tạo mã hóa đơn trước
        const invoiceNumber = await getNextSequence(Invoice, 'HD', organizationId);

        let processedItems = [];
        let totalAmount = 0;

        // --- BẮT ĐẦU VÒNG LẶP XỬ LÝ SẢN PHẨM & KHO ---
        for (const item of items) {
            const productId = item.productId || item.id;
            const quantitySold = Number(item.quantity);
            const price = Number(item.price);

            // 1. Tìm sản phẩm (Bắt buộc dùng session)
            const product = await Product.findOne({ _id: productId, organizationId }).session(session);

            if (!product) {
                throw new Error(`Sản phẩm ID ${productId} không tồn tại hoặc đã bị xóa`);
            }

            // 2. Tính toán tồn kho chính xác
            const currentStock = Number(product.quantity) || 0;
            const newStock = currentStock - quantitySold;

            // 3. Cập nhật tồn kho vào DB
            product.quantity = newStock;
            await product.save({ session });

            // 4. GHI THẺ KHO (StockHistory) - Quan trọng để hiển thị đúng
            await StockHistory.create([{
                organizationId,
                productId: product._id,
                type: 'export',               // Loại: Xuất kho
                quantity: -quantitySold,      // Số lượng: Số âm
                oldStock: currentStock,       // Tồn cũ
                newStock: newStock,           // Tồn mới
                reference: invoiceNumber,     // Mã hóa đơn
                note: `Bán hàng: ${customerName}`,
                createdBy: req.user.userId
            }], { session });

            // 5. Thêm vào danh sách item của hóa đơn
            processedItems.push({
                productId: product._id,
                name: product.name,
                sku: product.sku,
                unit: product.unit,
                quantity: quantitySold,
                price: price,
                total: quantitySold * price
            });

            totalAmount += (quantitySold * price);
        }
        // --- KẾT THÚC VÒNG LẶP ---

        // Tính toán tiền
        const shipFee = deliveryInfo?.isDelivery ? (Number(deliveryInfo.shipFee) || 0) : 0;
        const finalAmount = totalAmount - (Number(discountAmount) || 0) + shipFee;

        let status = 'Chưa thanh toán';
        if (paymentAmount >= finalAmount) status = 'Đã thanh toán';
        else if (paymentAmount > 0) status = 'Thanh toán một phần';

        // Lưu Hóa Đơn
        const newInvoice = new Invoice({
            invoiceNumber,
            organizationId,
            customerId: customerId || null,
            customerName,
            customerPhone: req.body.customerPhone, // Lưu thêm SĐT nếu có
            issueDate: new Date(),
            items: processedItems,
            totalAmount,
            discountAmount: discountAmount || 0,
            finalAmount,
            paidAmount: paymentAmount || 0,
            paymentMethod: paymentMethod || 'Tiền mặt',
            status,
            note,
            createdBy: req.user.userId,
            isDelivery: deliveryInfo?.isDelivery || false,
            delivery: deliveryInfo?.isDelivery ? { ...deliveryInfo, status: 'PENDING' } : undefined
        });

        await newInvoice.save({ session });

        // Tự động tạo Phiếu Giao Hàng (Nếu có)
        if (deliveryInfo?.isDelivery) {
            const deliveryNumber = await getNextSequence(Delivery, 'VC', organizationId);
            const codAmount = Math.max(0, finalAmount - (paymentAmount || 0));

            const newDelivery = new Delivery({
                organizationId,
                deliveryNumber,
                invoiceId: newInvoice._id.toString(),
                customerId: customerId || 'GUEST',
                customerName: customerName,
                customerPhone: deliveryInfo.phone,
                customerAddress: deliveryInfo.address,
                issueDate: new Date(),
                deliveryDate: new Date(),
                items: processedItems,
                shipFee: shipFee,
                codAmount: codAmount,
                status: DELIVERY_STATUS?.PENDING || 'Chờ giao',
                driverName: deliveryInfo.shipperName || '',
                notes: note
            });
            await newDelivery.save({ session });
        }

        // Cập nhật công nợ khách hàng
        const debtChange = finalAmount - (paymentAmount || 0);
        if (customer && debtChange > 0) {
            await Customer.findByIdAndUpdate(
                customerId,
                { $inc: { totalDebt: debtChange } }
            ).session(session);
        }

        // Lưu phiếu thu (Nếu có thanh toán)
        let savedVoucher = null;
        if (paymentAmount > 0) {
            const transactionNumber = await getNextSequence(CashFlowTransaction, PREFIXES.PAYMENT, organizationId);
            savedVoucher = new CashFlowTransaction({
                transactionNumber,
                type: 'thu',
                date: new Date(),
                amount: paymentAmount,
                paymentMethod: paymentMethod || 'Tiền mặt',
                payerReceiverName: customerName,
                description: `Thu tiền bán hàng ${invoiceNumber}`,
                category: 'Doanh thu bán hàng',
                referenceId: newInvoice._id,
                organizationId
            });
            await savedVoucher.save({ session });
        }

        await session.commitTransaction();
        res.status(201).json({ newInvoice, voucher: savedVoucher });

    } catch (err) {
        await session.abortTransaction();
        console.error("Create Invoice Error:", err);
        res.status(500).json({ message: err.message });
    } finally {
        session.endSession();
    }
};

// 4. HỦY HÓA ĐƠN / TRẢ HÀNG
exports.returnInvoice = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const invoice = await Invoice.findOne({ _id: req.params.id, organizationId: req.organizationId }).session(session);
        if (!invoice) throw new Error('Hóa đơn không tồn tại');
        if (invoice.status === 'Hủy') throw new Error('Hóa đơn này đã hủy rồi');

        // --- HOÀN KHO & GHI THẺ KHO ---
        for (const item of invoice.items) {
            const product = await Product.findOne({ _id: item.productId, organizationId: req.organizationId }).session(session);
            
            if (product) {
                const quantityReturn = Number(item.quantity);
                const currentStock = Number(product.quantity) || 0;
                const newStock = currentStock + quantityReturn; // Cộng lại kho

                product.quantity = newStock;
                await product.save({ session });

                // Ghi thẻ kho (Loại: return)
                await StockHistory.create([{
                    organizationId: req.organizationId,
                    productId: product._id,
                    type: 'return',             // Loại: Trả hàng
                    quantity: quantityReturn,   // Số dương (cộng lại)
                    oldStock: currentStock,
                    newStock: newStock,
                    reference: invoice.invoiceNumber,
                    note: 'Hủy hóa đơn / Khách trả hàng',
                    createdBy: req.user.userId
                }], { session });
            }
        }

        // Trừ nợ khách (nếu đã ghi nợ)
        const currentDebtOfInvoice = invoice.finalAmount - invoice.paidAmount;
        if (invoice.customerId && currentDebtOfInvoice > 0) {
            await Customer.findByIdAndUpdate(
                invoice.customerId, 
                { $inc: { totalDebt: -currentDebtOfInvoice } }
            ).session(session);
        }

        // Hoàn tiền (Nếu khách đã trả tiền)
        if (invoice.paidAmount > 0) {
            const transactionNumber = await getNextSequence(CashFlowTransaction, PREFIXES.PAYMENT_SLIP, req.organizationId);
            await new CashFlowTransaction({
                transactionNumber,
                type: 'chi',
                date: new Date(),
                amount: invoice.paidAmount,
                paymentMethod: 'Tiền mặt',
                payerReceiverName: invoice.customerName,
                description: `Hoàn tiền do hủy đơn ${invoice.invoiceNumber}`,
                category: 'Hoàn tiền',
                referenceId: invoice._id,
                organizationId: req.organizationId
            }).save({ session });
        }

        invoice.status = 'Hủy';
        invoice.note = (invoice.note || '') + ' [Đã hủy đơn]';
        await invoice.save({ session });

        await session.commitTransaction();
        res.json({ message: 'Đã hủy hóa đơn, hoàn kho thành công.' });
    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({ message: err.message });
    } finally {
        session.endSession();
    }
};

// 5. THANH TOÁN CÔNG NỢ
exports.payInvoice = async (req, res) => {
    const { organizationId } = req;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { amount } = req.body;
        const invoice = await Invoice.findOne({ _id: req.params.id, organizationId }).session(session);
        if (!invoice) throw new Error('Hóa đơn không tồn tại');

        const currentDebt = invoice.totalAmount - (invoice.paidAmount || 0);
        const payAmount = parseInt(amount);

        if (payAmount > currentDebt + 1000) { // Cho phép lệch nhỏ do làm tròn
             throw new Error(`Khách chỉ còn nợ ${currentDebt.toLocaleString()}đ.`);
        }

        invoice.paidAmount = (invoice.paidAmount || 0) + payAmount;
        if (invoice.paidAmount >= invoice.finalAmount) invoice.status = 'Đã thanh toán';
        else invoice.status = 'Thanh toán một phần';
        
        await invoice.save({ session });

        if (invoice.customerId) {
            await Customer.findByIdAndUpdate(
                invoice.customerId, 
                { $inc: { totalDebt: -payAmount } }
            ).session(session);
        }

        const transactionNumber = await getNextSequence(CashFlowTransaction, PREFIXES.PAYMENT, organizationId);
        await new CashFlowTransaction({
            transactionNumber,
            type: 'thu',
            date: new Date(),
            amount: payAmount,
            payerReceiverName: invoice.customerName,
            description: `Thu nợ hóa đơn ${invoice.invoiceNumber}`,
            category: 'Thu nợ khách hàng',
            organizationId
        }).save({ session });

        await session.commitTransaction();
        res.json({ message: 'Thanh toán thành công', invoice });
    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({ message: err.message });
    } finally {
        session.endSession();
    }
};

// 6. XÓA HÓA ĐƠN (Xóa vĩnh viễn - Dùng cẩn thận)
exports.deleteInvoice = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const invoice = await Invoice.findOne({ _id: req.params.id, organizationId: req.organizationId }).session(session);
        if (!invoice) throw new Error('Hóa đơn không tồn tại');

        // Hoàn kho (Dùng hàm changeStock tiện ích hoặc viết tay cũng được, ở đây dùng changeStock cho gọn)
        for (const item of invoice.items) {
            await changeStock({
                session,
                organizationId: req.organizationId,
                productId: item.productId,
                quantityChange: item.quantity, // Cộng lại kho
                type: 'adjustment', // Loại điều chỉnh
                referenceNumber: invoice.invoiceNumber,
                note: 'Xóa vĩnh viễn hóa đơn'
            });
        }

        const debtAmount = invoice.finalAmount - invoice.paidAmount;
        if (invoice.customerId && debtAmount > 0) {
            await Customer.findByIdAndUpdate(
                invoice.customerId, 
                { $inc: { totalDebt: -debtAmount } }
            ).session(session);
        }

        await Invoice.deleteOne({ _id: invoice._id }).session(session);
        await session.commitTransaction();
        res.json({ message: 'Đã xóa hóa đơn thành công' });
    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({ message: err.message });
    } finally {
        session.endSession();
    }
};

// 7. LỊCH SỬ THANH TOÁN
exports.getInvoiceHistory = async (req, res) => {
    try {
        const history = await CashFlowTransaction.find({
            organizationId: req.organizationId,
            description: { $regex: req.params.invoiceNumber, $options: 'i' }
        }).sort({ createdAt: -1 });
        res.json(history);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// 8. CẬP NHẬT HÓA ĐƠN
exports.updateInvoice = async (req, res) => {
    try {
        const updated = await Invoice.findOneAndUpdate(
            { _id: req.params.id, organizationId: req.organizationId }, 
            req.body, 
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
        res.json(updated);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};