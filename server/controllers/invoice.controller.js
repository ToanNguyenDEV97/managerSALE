const mongoose = require('mongoose');
const Invoice = require('../models/invoice.model');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');
const CashFlowTransaction = require('../models/cashFlowTransaction.model');
const Delivery = require('../models/delivery.model');
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
                $lte: new Date(new Date(endDate).setHours(23,59,59)) 
            };
        }

        const total = await Invoice.countDocuments(query);
        const invoices = await Invoice.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('items.productId', 'sku unit');

        res.json({ data: invoices, total, totalPages: Math.ceil(total / limit), currentPage: page });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// 2. Chi tiết
exports.getInvoiceById = async (req, res) => {
    try {
        const { organizationId } = req;
        const invoice = await Invoice.findOne({ _id: req.params.id, organizationId })
            // [THÊM DÒNG NÀY] Lấy chi tiết khách hàng (tên, sđt, địa chỉ, công ty)
            .populate('customerId', 'name phone address companyName taxCode') 
            .populate('items.productId', 'sku name unit');
        if (!invoice) return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
        res.json(invoice);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// 3. TẠO HÓA ĐƠN
exports.createInvoice = async (req, res) => {
    const { organizationId } = req;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { customerId, items, discountAmount, paymentAmount, paymentMethod, deliveryInfo, note } = req.body;
        
        let customer = null;
        let customerName = 'Khách lẻ';
        if (customerId) {
            customer = await Customer.findOne({ _id: customerId, organizationId }).session(session);
            if (customer) customerName = customer.name;
        }

        let processedItems = [];
        let totalAmount = 0;

        for (const item of items) {
            const product = await Product.findOne({ _id: item.productId, organizationId }).session(session);
            if (!product) throw new Error(`Sản phẩm ID ${item.productId} không tồn tại`);

            await changeStock({
                session, organizationId, productId: item.productId, quantityChange: -item.quantity,
                type: 'Xuất hàng', referenceNumber: 'POS', 
                note: `Bán cho ${customerName}`
            });

            const itemTotal = item.quantity * item.price;
            totalAmount += itemTotal;

            processedItems.push({
                productId: product._id,
                name: product.name,
                quantity: item.quantity,
                price: item.price,
                costPrice: product.buyPrice || 0,
                discount: item.discount || 0
            });
        }

        const shipFee = deliveryInfo?.isDelivery ? (Number(deliveryInfo.shipFee) || 0) : 0;
        const finalAmount = totalAmount - (Number(discountAmount) || 0) + shipFee;
        
        let status = 'Chưa thanh toán';
        if (paymentAmount >= finalAmount) status = 'Đã thanh toán';
        else if (paymentAmount > 0) status = 'Thanh toán một phần';

        const invoiceNumber = await getNextSequence(Invoice, 'HD', organizationId);

        // Lưu Hóa đơn
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
            delivery: deliveryInfo?.isDelivery ? { ...deliveryInfo, status: 'PENDING' } : undefined
        });
        await newInvoice.save({ session });

        // [MỚI] === TỰ ĐỘNG TẠO PHIẾU GIAO HÀNG (DELIVERY) ===
        if (deliveryInfo?.isDelivery) {
            const Delivery = require('../models/delivery.model'); // Đảm bảo đã import
            const { DELIVERY_STATUS } = require('../utils/constants'); // Import constant

            const deliveryNumber = await getNextSequence(Delivery, 'VC', organizationId); // Đổi tên biến thành deliveryNumber cho khớp model
            
            const codAmount = Math.max(0, finalAmount - (paymentAmount || 0));

            const newDelivery = new Delivery({
                organizationId,
                deliveryNumber: deliveryNumber, // [Mapping đúng] deliveryCode -> deliveryNumber
                invoiceId: newInvoice._id.toString(), // Chuyển ObjectId sang String
                
                customerId: customerId || 'GUEST', // Xử lý trường hợp khách lẻ
                customerName: customerName,
                customerPhone: deliveryInfo.phone, // [Mapping đúng] phone -> customerPhone
                customerAddress: deliveryInfo.address, // [Mapping đúng] address -> customerAddress
                
                issueDate: new Date(),   // [Thêm] Ngày tạo
                deliveryDate: new Date(), // [Thêm] Ngày giao dự kiến (mặc định hôm nay)
                
                items: processedItems, // Đã thêm vào model
                shipFee: shipFee,      // Đã thêm vào model
                codAmount: codAmount,  // Đã thêm vào model
                
                status: DELIVERY_STATUS.PENDING, // [SỬA QUAN TRỌNG] Dùng Value ('Chờ giao') thay vì Key ('PENDING')
                
                driverName: deliveryInfo.shipperName || '', 
                notes: note // [Mapping đúng] note -> notes
            });
            await newDelivery.save({ session });
        }

        // Cập nhật công nợ khách hàng
        const debtChange = finalAmount - (paymentAmount || 0);
        if (customer && debtChange > 0) {
            await Customer.findByIdAndUpdate(customerId, { $inc: { totalDebt: debtChange } }).session(session);
        }

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
        res.status(400).json({ message: err.message }); 
    } finally { session.endSession(); }
};

// 4. TRẢ HÀNG / HỦY HÓA ĐƠN (Soft Delete)
// [SỬA LỖI] Đổi tên từ deleteInvoice -> returnInvoice để khớp với route
exports.returnInvoice = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const invoice = await Invoice.findOne({ _id: req.params.id, organizationId: req.organizationId }).session(session);
        if (!invoice) throw new Error('Hóa đơn không tồn tại');
        if (invoice.status === 'Hủy') throw new Error('Hóa đơn này đã hủy rồi');

        // Hoàn kho
        for (const item of invoice.items) {
            await changeStock({
                session, organizationId: req.organizationId, productId: item.productId, 
                quantityChange: item.quantity, 
                type: 'Nhập hàng trả', 
                referenceNumber: invoice.invoiceNumber, note: 'Hủy hóa đơn bán hàng'
            });
        }

        // Trừ nợ khách
        const currentDebtOfInvoice = invoice.finalAmount - invoice.paidAmount;
        if (invoice.customerId && currentDebtOfInvoice > 0) {
            await Customer.findByIdAndUpdate(invoice.customerId, { $inc: { totalDebt: -currentDebtOfInvoice } }).session(session);
        }

        // Hoàn tiền nếu cần
        if (invoice.paidAmount > 0) {
            const transactionNumber = await getNextSequence(CashFlowTransaction, PREFIXES.PAYMENT_SLIP, req.organizationId);
            await new CashFlowTransaction({
                transactionNumber, type: 'chi', date: new Date(),
                amount: invoice.paidAmount,
                paymentMethod: 'Tiền mặt',
                payerReceiverName: invoice.customerName,
                description: `Hoàn tiền do hủy đơn ${invoice.invoiceNumber}`,
                category: 'Hoàn tiền', referenceId: invoice._id, organizationId: req.organizationId
            }).save({ session });
        }

        invoice.status = 'Hủy';
        invoice.note = (invoice.note || '') + ' [Đã hủy đơn]';
        await invoice.save({ session });

        await session.commitTransaction();
        res.json({ message: 'Đã hủy hóa đơn, hoàn kho thành công.' });
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
            await Customer.findByIdAndUpdate(invoice.customerId, { $inc: { totalDebt: -payAmount } }).session(session);
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

// 6. Xóa hóa đơn (Xóa vĩnh viễn)
exports.deleteInvoice = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const invoice = await Invoice.findOne({ _id: req.params.id, organizationId: req.organizationId }).session(session);
        if (!invoice) throw new Error('Hóa đơn không tồn tại');

        for (const item of invoice.items) {
            await changeStock({
                session, organizationId: req.organizationId, productId: item.productId, 
                quantityChange: item.quantity, type: 'Hủy hóa đơn', 
                referenceNumber: invoice.invoiceNumber, note: 'Xóa đơn bán hàng'
            });
        }

        const debtAmount = invoice.totalAmount - invoice.paidAmount;
        if (invoice.customerId && debtAmount > 0) {
            await Customer.findByIdAndUpdate(invoice.customerId, { $inc: { totalDebt: -debtAmount } }).session(session);
        }

        await Invoice.deleteOne({ _id: invoice._id }).session(session);
        await session.commitTransaction();
        res.json({ message: 'Đã xóa hóa đơn thành công' });
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