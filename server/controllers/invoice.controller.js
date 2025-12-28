const mongoose = require('mongoose');
const Invoice = require('../models/invoice.model');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');
const StockHistory = require('../models/stockHistory.model');
const CashFlowTransaction = require('../models/cashFlowTransaction.model');
const { getNextSequence } = require('../utils/sequence');
const { changeStock } = require('../utils/stockUtils');

// 1. Lấy danh sách hóa đơn (Lọc + Phân trang)
exports.getInvoices = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status || 'all';
        const search = req.query.search || '';
        const { startDate, endDate } = req.query;
        const organizationId = req.organizationId;

        let query = { organizationId };
        if (search) {
            query.$or = [ { invoiceNumber: { $regex: search, $options: 'i' } }, { customerName: { $regex: search, $options: 'i' } } ];
        }
        if (status === 'debt') query.$expr = { $gt: ["$totalAmount", "$paidAmount"] };
        else if (status === 'paid') query.$expr = { $lte: ["$totalAmount", "$paidAmount"] };
        if (startDate && endDate) query.issueDate = { $gte: startDate, $lte: endDate };

        const total = await Invoice.countDocuments(query);
        const invoices = await Invoice.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);

        res.json({ data: invoices, total, totalPages: Math.ceil(total / limit), currentPage: page });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// 2. Lấy chi tiết hóa đơn
exports.getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ _id: req.params.id, organizationId: req.organizationId });
        if (!invoice) return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
        res.json(invoice);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// 3. Tạo hóa đơn mới (Bán hàng POS)
exports.createInvoice = async (req, res) => {
    const { organizationId } = req;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { customerId, items, totalAmount, paymentAmount, deliveryInfo, note } = req.body;
        
        let customer = null;
        let customerName = 'Khách lẻ';
        if (customerId) {
            customer = await Customer.findOne({ _id: customerId, organizationId }).session(session);
            if (customer) customerName = customer.name;
        }

        // Trừ kho
        for (const item of items) {
             await changeStock({
                 session, organizationId, productId: item.productId, quantityChange: -item.quantity,
                 type: 'Xuất hàng', referenceNumber: 'POS', 
                 note: deliveryInfo?.isDelivery ? `Xuất giao cho ${customerName}` : `Bán lẻ cho ${customerName}`
             });
        }
        
        const invoiceNumber = await getNextSequence(Invoice, 'HD', organizationId);
        
        const shipFee = deliveryInfo?.isDelivery ? (Number(deliveryInfo.shipFee) || 0) : 0;
        const finalTotalAmount = Number(totalAmount) + shipFee;
        const status = paymentAmount >= finalTotalAmount ? 'Đã thanh toán' : (paymentAmount > 0 ? 'Thanh toán một phần' : 'Chưa thanh toán');

        const newInvoice = new Invoice({
            invoiceNumber, customerId, customerName,
            issueDate: new Date().toLocaleDateString('en-CA'),
            items, totalAmount: finalTotalAmount, paidAmount: paymentAmount,
            status, organizationId, note,
            isDelivery: deliveryInfo?.isDelivery || false,
            delivery: deliveryInfo?.isDelivery ? {
                address: deliveryInfo.address || '',
                receiverName: deliveryInfo.receiverName || customerName,
                phone: deliveryInfo.phone || (customer ? customer.phone : ''),
                shipFee: shipFee,
                status: 'Chờ giao'
            } : undefined
        });
        await newInvoice.save({ session });

        // Cộng nợ
        const debt = finalTotalAmount - paymentAmount;
        if (customer && debt > 0) {
            await Customer.findByIdAndUpdate(customerId, { $inc: { debt: debt } }).session(session);
        }

        // Tạo phiếu thu
        let savedVoucher = null;
        if (paymentAmount > 0) {
            const transactionNumber = await getNextSequence(CashFlowTransaction, 'PT', organizationId);
            savedVoucher = new CashFlowTransaction({
                transactionNumber, type: 'thu', date: new Date(), amount: paymentAmount,
                payerReceiverName: customerName, description: `Thu tiền POS ${invoiceNumber}`,
                category: 'Doanh thu bán hàng', organizationId 
            });
            await savedVoucher.save({ session });
        }
        
        await session.commitTransaction();
        res.status(201).json({ newInvoice, voucherId: savedVoucher ? savedVoucher._id : null });
    } catch (err) { await session.abortTransaction(); res.status(400).json({ message: err.message }); }
    finally { session.endSession(); }
};

// 4. Khách trả hàng (Return)
exports.returnInvoice = async (req, res) => {
    const { organizationId } = req;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { reason } = req.body; 
        const invoice = await Invoice.findOne({ _id: req.params.id, organizationId }).session(session);
        if (!invoice) throw new Error('Không tìm thấy hóa đơn');

        // Nhập lại kho
        for (const item of invoice.items) {
             await changeStock({
                 session, organizationId, productId: item.productId, quantityChange: item.quantity,
                 type: 'Nhập hàng trả', referenceNumber: invoice.invoiceNumber, 
                 note: reason || 'Khách trả lại hàng'
             });
        }

        // Trừ nợ
        if (invoice.customerId && invoice.status === 'Còn nợ') {
             const debtToReduce = invoice.totalAmount - invoice.paidAmount;
             await Customer.findByIdAndUpdate(invoice.customerId, { $inc: { debt: -debtToReduce } }).session(session);
        }

        // Hoàn tiền
        if (invoice.paidAmount > 0) {
            const transactionNumber = await getNextSequence(CashFlowTransaction, 'PC', organizationId);
            await new CashFlowTransaction({
                transactionNumber, type: 'chi', date: new Date(), amount: invoice.paidAmount,
                payerReceiverName: invoice.customerName, 
                description: `Hoàn tiền trả hàng ${invoice.invoiceNumber}`,
                category: 'Khác', organizationId
            }).save({ session });
        }

        invoice.status = 'Hủy';
        if (reason) invoice.note = (invoice.note ? invoice.note + '. ' : '') + `Lý do trả: ${reason}`;
        await invoice.save({ session });

        await session.commitTransaction();
        res.json({ message: 'Đã xử lý trả hàng thành công' });
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

        const transactionNumber = await getNextSequence(CashFlowTransaction, 'PT', organizationId);
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