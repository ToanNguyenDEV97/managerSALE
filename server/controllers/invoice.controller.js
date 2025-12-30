const mongoose = require('mongoose');
const Invoice = require('../models/invoice.model');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');
const CashFlowTransaction = require('../models/cashFlowTransaction.model');
const { getNextSequence } = require('../utils/sequence');
const { changeStock } = require('../utils/stockUtils');
const { PREFIXES } = require('../utils/constants');

// 1. Lấy danh sách
exports.getInvoices = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { status, search, startDate, endDate } = req.query;
        const organizationId = req.organizationId;

        let query = { organizationId };
        
        // Tìm kiếm đa năng
        if (search) {
            query.$or = [
                { invoiceNumber: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter Status
        if (status && status !== 'all') {
            if (status === 'debt') query.$expr = { $gt: ["$finalAmount", "$paidAmount"] }; // Còn nợ
            else if (status === 'paid') query.$expr = { $lte: ["$finalAmount", "$paidAmount"] }; // Hết nợ
            else query.status = status; // Status cụ thể (Hủy, Hoàn trả)
        }

        // Filter Date
        if (startDate && endDate) {
            query.createdAt = { 
                $gte: new Date(startDate), 
                $lte: new Date(new Date(endDate).setHours(23,59,59)) 
            };
        }

        const total = await Invoice.countDocuments(query);
        const invoices = await Invoice.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('items.productId', 'sku unit'); // Lấy thêm Unit/SKU nếu cần

        res.json({ data: invoices, total, totalPages: Math.ceil(total / limit), currentPage: page });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// 2. Chi tiết
exports.getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ _id: req.params.id, organizationId: req.organizationId });
        if (!invoice) return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
        res.json(invoice);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// 3. TẠO HÓA ĐƠN (Quan trọng)
exports.createInvoice = async (req, res) => {
    const { organizationId } = req;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { customerId, items, discountAmount, paymentAmount, paymentMethod, deliveryInfo, note } = req.body;
        
        // A. Lấy thông tin khách
        let customer = null;
        let customerName = 'Khách lẻ';
        if (customerId) {
            customer = await Customer.findOne({ _id: customerId, organizationId }).session(session);
            if (customer) customerName = customer.name;
        }

        // B. Xử lý sản phẩm & Tính toán (BẢO MẬT GIÁ VỐN)
        let processedItems = [];
        let totalAmount = 0;

        for (const item of items) {
            // Lấy giá gốc từ DB để đảm bảo chính xác
            const product = await Product.findOne({ _id: item.productId, organizationId }).session(session);
            if (!product) throw new Error(`Sản phẩm ID ${item.productId} không tồn tại`);

            // 1. Trừ kho
            await changeStock({
                session, organizationId, productId: item.productId, quantityChange: -item.quantity,
                type: 'Xuất hàng', referenceNumber: 'POS', 
                note: `Bán cho ${customerName}`
            });

            // 2. Tính tiền item
            const itemTotal = item.quantity * item.price;
            totalAmount += itemTotal;

            // 3. Snapshot dữ liệu item (Lưu giá vốn tại thời điểm bán)
            processedItems.push({
                productId: product._id,
                name: product.name,
                quantity: item.quantity,
                price: item.price,
                costPrice: product.buyPrice || 0, // [QUAN TRỌNG] Lấy giá nhập làm giá vốn
                discount: item.discount || 0
            });
        }

        // C. Tính tổng đơn
        const shipFee = deliveryInfo?.isDelivery ? (Number(deliveryInfo.shipFee) || 0) : 0;
        const finalAmount = totalAmount - (Number(discountAmount) || 0) + shipFee;
        
        // Xác định trạng thái
        let status = 'Chưa thanh toán';
        if (paymentAmount >= finalAmount) status = 'Đã thanh toán';
        else if (paymentAmount > 0) status = 'Thanh toán một phần';

        // D. Tạo Invoice Number
        const invoiceNumber = await getNextSequence(Invoice, 'HD', organizationId);

        // E. Lưu Hóa Đơn
        const newInvoice = new Invoice({
            invoiceNumber, organizationId,
            customerId: customerId || null, customerName,
            issueDate: new Date(),
            items: processedItems,
            totalAmount, discountAmount: discountAmount || 0, finalAmount,
            paidAmount: paymentAmount || 0,
            paymentMethod: paymentMethod || 'Tiền mặt',
            status, note,
            isDelivery: deliveryInfo?.isDelivery || false,
            delivery: deliveryInfo?.isDelivery ? {
                ...deliveryInfo,
                status: 'Chờ giao'
            } : undefined
        });
        await newInvoice.save({ session });

        // F. Cập nhật công nợ Khách hàng
        const debtChange = finalAmount - (paymentAmount || 0);
        if (customer && debtChange > 0) {
            await Customer.findByIdAndUpdate(customerId, { $inc: { totalDebt: debtChange } }).session(session);
        }

        // G. Tạo Phiếu Thu (Nếu có trả tiền)
        let savedVoucher = null;
        if (paymentAmount > 0) {
            const transactionNumber = await getNextSequence(CashFlowTransaction, PREFIXES.PAYMENT, organizationId);
            savedVoucher = new CashFlowTransaction({
                transactionNumber, type: 'thu', date: new Date(), 
                amount: paymentAmount,
                paymentMethod: paymentMethod || 'Tiền mặt',
                payerReceiverName: customerName, 
                description: `Thu tiền bán hàng ${invoiceNumber}`,
                category: 'Doanh thu bán hàng', referenceId: newInvoice._id, organizationId 
            });
            await savedVoucher.save({ session });
        }
        
        await session.commitTransaction();
        res.status(201).json({ newInvoice, voucher: savedVoucher });

    } catch (err) { 
        await session.abortTransaction(); 
        console.error(err);
        res.status(400).json({ message: err.message }); 
    } finally { 
        session.endSession(); 
    }
};

// 4. HỦY HÓA ĐƠN (Soft Delete + Revert Money)
exports.deleteInvoice = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const invoice = await Invoice.findOne({ _id: req.params.id, organizationId: req.organizationId }).session(session);
        if (!invoice) throw new Error('Hóa đơn không tồn tại');
        if (invoice.status === 'Hủy') throw new Error('Hóa đơn này đã hủy rồi');

        // 1. Trả hàng về kho
        for (const item of invoice.items) {
            await changeStock({
                session, organizationId: req.organizationId, productId: item.productId, 
                quantityChange: item.quantity, // Cộng lại kho
                type: 'Nhập hàng trả', 
                referenceNumber: invoice.invoiceNumber, note: 'Hủy hóa đơn bán hàng'
            });
        }

        // 2. Trừ bớt nợ khách (Nếu đơn đó khách đang nợ)
        const currentDebtOfInvoice = invoice.finalAmount - invoice.paidAmount;
        if (invoice.customerId && currentDebtOfInvoice > 0) {
            await Customer.findByIdAndUpdate(invoice.customerId, { $inc: { totalDebt: -currentDebtOfInvoice } }).session(session);
        }

        // 3. Hoàn tiền (Nếu khách đã trả tiền -> Tạo phiếu chi hoàn lại)
        // [QUAN TRỌNG] Logic chuẩn: Nếu đã thu tiền, giờ hủy đơn thì phải trả lại tiền khách
        if (invoice.paidAmount > 0) {
            const transactionNumber = await getNextSequence(CashFlowTransaction, PREFIXES.PAYMENT_SLIP, req.organizationId);
            await new CashFlowTransaction({
                transactionNumber, type: 'chi', date: new Date(),
                amount: invoice.paidAmount,
                paymentMethod: 'Tiền mặt', // Mặc định trả tiền mặt hoặc theo thực tế
                payerReceiverName: invoice.customerName,
                description: `Hoàn tiền do hủy đơn ${invoice.invoiceNumber}`,
                category: 'Hoàn tiền', referenceId: invoice._id, organizationId: req.organizationId
            }).save({ session });
        }

        // 4. Cập nhật trạng thái Hủy (Không xóa vĩnh viễn)
        invoice.status = 'Hủy';
        invoice.note = (invoice.note || '') + ' [Đã hủy đơn]';
        await invoice.save({ session });

        await session.commitTransaction();
        res.json({ message: 'Đã hủy hóa đơn, hoàn kho và xử lý tài chính thành công.' });
    } catch (err) { await session.abortTransaction(); res.status(500).json({ message: err.message }); } 
    finally { session.endSession(); }
};

// 5. Thanh toán công nợ
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
        if (payAmount > currentDebt) throw new Error(`Khách chỉ còn nợ ${currentDebt.toLocaleString()}đ.`);

        invoice.paidAmount = (invoice.paidAmount || 0) + payAmount;
        if (invoice.paidAmount >= invoice.totalAmount) invoice.status = 'Đã thanh toán'; 
        else invoice.status = 'Thanh toán một phần';
        await invoice.save({ session });

        if (invoice.customerId) {
            await Customer.findByIdAndUpdate(invoice.customerId, { $inc: { debt: -payAmount } }).session(session);
        }

        const transactionNumber = await getNextSequence(CashFlowTransaction, PREFIXES.PAYMENT, organizationId);
        await new CashFlowTransaction({
            transactionNumber, type: 'thu', date: new Date(), amount: payAmount,
            payerReceiverName: invoice.customerName, description: `Thu nợ hóa đơn ${invoice.invoiceNumber}`,
            category: 'Thu nợ khách hàng', organizationId
        }).save({ session });

        await session.commitTransaction();
        res.json({ message: 'Thanh toán thành công', invoice });
    } catch (err) { await session.abortTransaction(); res.status(500).json({ message: err.message }); } 
    finally { session.endSession(); }
};

// 6. Xóa hóa đơn (Hủy)
exports.deleteInvoice = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const invoice = await Invoice.findOne({ _id: req.params.id, organizationId: req.organizationId }).session(session);
        if (!invoice) throw new Error('Hóa đơn không tồn tại');

        // Trả hàng về kho
        for (const item of invoice.items) {
            await changeStock({
                session, organizationId: req.organizationId, productId: item.productId, 
                quantityChange: item.quantity, type: 'Hủy hóa đơn', 
                referenceNumber: invoice.invoiceNumber, note: 'Hủy đơn bán hàng'
            });
        }

        // Trừ nợ
        const debtAmount = invoice.totalAmount - invoice.paidAmount;
        if (invoice.customerId && debtAmount > 0) {
            await Customer.findByIdAndUpdate(invoice.customerId, { $inc: { debt: -debtAmount } }).session(session);
        }

        await Invoice.deleteOne({ _id: invoice._id }).session(session);
        await session.commitTransaction();
        res.json({ message: 'Đã hủy hóa đơn thành công' });
    } catch (err) { await session.abortTransaction(); res.status(500).json({ message: err.message }); } 
    finally { session.endSession(); }
};

// 7. Lịch sử thanh toán
exports.getInvoiceHistory = async (req, res) => {
    try {
        const history = await CashFlowTransaction.find({
            organizationId: req.organizationId,
            description: { $regex: req.params.invoiceNumber, $options: 'i' } 
        }).sort({ createdAt: -1 }); 
        res.json(history);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// 8. Cập nhật hóa đơn
exports.updateInvoice = async (req, res) => {
    try {
        const updated = await Invoice.findOneAndUpdate({ _id: req.params.id, organizationId: req.organizationId }, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
        res.json(updated);
    } catch (e) { res.status(500).json({ message: e.message }); }
};