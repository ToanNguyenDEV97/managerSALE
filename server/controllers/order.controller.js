const mongoose = require('mongoose');
const Order = require('../models/order.model');
const Invoice = require('../models/invoice.model');
const Quote = require('../models/quote.model');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');
const CashFlowTransaction = require('../models/cashFlowTransaction.model');
const { getNextSequence } = require('../utils/sequence');
const { changeStock } = require('../utils/stockUtils');
const { PREFIXES } = require('../utils/constants');

// 1. Lấy danh sách đơn hàng (Kèm thống kê KPI)
exports.getOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status, startDate, endDate } = req.query;
        const { organizationId } = req;
        
        let query = { organizationId };
        if (status && status !== 'all') query.status = status;
        if (search) {
            query.$or = [ { customerName: { $regex: search, $options: 'i' } }, { orderNumber: { $regex: search, $options: 'i' } } ];
        }
        if (startDate && endDate) {
            query.createdAt = { $gte: new Date(startDate), $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
        }

        const statsPromise = Order.aggregate([
            { $match: query },
            { $group: {
                _id: null,
                totalRevenue: { $sum: "$totalAmount" }, 
                totalOrders: { $sum: 1 }, 
                pendingCount: { $sum: { $cond: [{ $eq: ["$status", "Mới"] }, 1, 0] } },
                doneCount: { $sum: { $cond: [{ $eq: ["$status", "Hoàn thành"] }, 1, 0] } }
            }}
        ]);

        const orders = await Order.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit * 1);
        const count = await Order.countDocuments(query);
        const stats = (await statsPromise)[0] || { totalRevenue: 0, totalOrders: 0, pendingCount: 0, doneCount: 0 };

        res.json({ data: orders, total: count, totalPages: Math.ceil(count / limit), currentPage: page, stats });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// 2. Tạo đơn hàng mới
exports.createOrder = async (req, res) => {
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

        const orderNumber = await getNextSequence(Order, PREFIXES.ORDER, organizationId);
        const shipFee = deliveryInfo?.isDelivery ? (Number(deliveryInfo.shipFee) || 0) : 0;
        const finalTotal = Number(totalAmount) + shipFee;

        const newOrder = new Order({
            organizationId, orderNumber, customerId, customerName, items,
            totalAmount: finalTotal, paidAmount: paymentAmount, status: 'Mới', note,
            isDelivery: deliveryInfo?.isDelivery || false,
            delivery: deliveryInfo?.isDelivery ? {
                address: deliveryInfo.address || '', receiverName: deliveryInfo.receiverName || customerName,
                phone: deliveryInfo.phone || (customer ? customer.phone : ''), shipFee, status: 'Chờ giao'
            } : undefined
        });

        await newOrder.save({ session });
        await session.commitTransaction();
        res.status(201).json(newOrder);
    } catch (err) { await session.abortTransaction(); res.status(400).json({ message: err.message }); } 
    finally { session.endSession(); }
};

// 3. Chuyển Đơn hàng -> Hóa đơn (Xuất kho thật)
exports.convertOrderToInvoice = async (req, res) => {
    const { organizationId } = req;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await Order.findOne({ _id: req.params.id, organizationId }).session(session);
        if (!order || order.status === 'Hoàn thành') throw new Error('Đơn lỗi hoặc đã hoàn thành');
        const { paymentAmount } = req.body;

        // Trừ kho
        for (const item of order.items) {
            await changeStock({
                session, organizationId, productId: item.productId, quantityChange: -item.quantity,
                type: 'Xuất hàng', referenceNumber: order.orderNumber, note: `Xuất kho đơn ${order.orderNumber}`
            });
        }

        // Tạo Items cho hóa đơn (Bổ sung costPrice)
        const invoiceItems = await Promise.all(order.items.map(async (item) => {
            const itemObj = item.toObject ? item.toObject() : item;
            let finalCostPrice = itemObj.costPrice;
            if (finalCostPrice === undefined) {
                const product = await Product.findOne({ _id: item.productId, organizationId }).session(session);
                finalCostPrice = product ? (product.costPrice || 0) : 0;
            }
            return { ...itemObj, vat: itemObj.vat || 0, costPrice: finalCostPrice };
        }));

        const status = (paymentAmount || 0) >= order.totalAmount ? 'Đã thanh toán' : ((paymentAmount || 0) > 0 ? 'Thanh toán một phần' : 'Chưa thanh toán');
        const invoiceNumber = await getNextSequence(Invoice, PREFIXES.INVOICE, organizationId);
        
        const newInvoice = new Invoice({
            invoiceNumber, customerId: order.customerId, customerName: order.customerName,
            issueDate: new Date().toLocaleDateString('en-CA'), items: invoiceItems, 
            totalAmount: order.totalAmount, paidAmount: paymentAmount || 0, status, 
            note: `Xuất từ đơn hàng ${order.orderNumber}`, organizationId
        });
        await newInvoice.save({ session });

        // Cộng nợ
        const debtToAdd = order.totalAmount - (paymentAmount || 0);
        if (debtToAdd > 0) {
            await Customer.findByIdAndUpdate(order.customerId, { $inc: { debt: debtToAdd } }).session(session);
        }

        // Phiếu thu
        if ((paymentAmount || 0) > 0) {
            const transactionNumber = await getNextSequence(CashFlowTransaction, PREFIXES.PAYMENT, organizationId);
            await new CashFlowTransaction({
                transactionNumber, type: 'thu', date: new Date(), amount: paymentAmount,
                description: `Thanh toán hóa đơn ${invoiceNumber}`, payerReceiverName: order.customerName, 
                category: 'Khác', organizationId
            }).save({ session });
        }
        
        order.status = 'Hoàn thành';
        await order.save({ session });

        await session.commitTransaction();
        res.status(201).json(newInvoice);
    } catch (err) { await session.abortTransaction(); res.status(400).json({ message: err.message }); } 
    finally { session.endSession(); }
};

// 4. Chuyển Báo giá -> Đơn hàng
exports.convertQuoteToOrder = async (req, res) => {
    try {
        const quote = await Quote.findOne({ _id: req.params.id, organizationId: req.organizationId });
        if (!quote) return res.status(404).json({ message: 'Không tìm thấy báo giá' });
        if (quote.status === 'Đã chuyển đổi') return res.status(400).json({ message: 'Báo giá này đã chuyển đổi rồi!' });

        const orderNumber = await getNextSequence(Order, PREFIXES.ORDER, req.organizationId);
        const newOrder = new Order({
            organizationId: req.organizationId, orderNumber, customerId: quote.customerId, customerName: quote.customerName,
            items: quote.items.map(item => ({
                productId: item.productId, name: item.name, quantity: item.quantity, price: item.price,
                unit: 'Cái', costPrice: 0 
            })),
            totalAmount: quote.totalAmount, status: 'Mới', note: `Từ báo giá: ${quote.quoteNumber}`, issueDate: new Date()
        });

        const savedOrder = await newOrder.save(); 
        quote.status = 'Đã chuyển đổi';
        await quote.save();

        res.status(200).json({ message: 'Chuyển đổi thành công', orderId: savedOrder._id });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// 5. Cập nhật đơn hàng
exports.updateOrder = async (req, res) => {
    try {
        const updated = await Order.findOneAndUpdate({ _id: req.params.id, organizationId: req.organizationId }, req.body, { new: true });
        res.json(updated);
    } catch (e) { res.status(500).json({ message: e.message }); }
};