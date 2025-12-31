const mongoose = require('mongoose');
const Order = require('../models/order.model');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model'); // Phải import Product
const Invoice = require('../models/invoice.model');
const Quote = require('../models/quote.model');
const { getNextSequence } = require('../utils/sequence');
const { PREFIXES } = require('../utils/constants');

// 1. Lấy danh sách Order
exports.getOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { search, status, isDelivery } = req.query;
        const organizationId = req.organizationId;

        let query = { organizationId };
        
        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } }
            ];
        }
        if (status && status !== 'all') query.status = status;
        if (isDelivery === 'true') query.isDelivery = true;

        const total = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({ data: orders, total, totalPages: Math.ceil(total / limit), currentPage: page });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 2. TẠO ĐƠN HÀNG (Logic chặt chẽ)
exports.createOrder = async (req, res) => {
    const { organizationId } = req;
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { customerId, items, paymentAmount, deliveryInfo, note } = req.body;

        // A. Lấy thông tin khách hàng
        let customerName = 'Khách lẻ';
        if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
            const customer = await Customer.findOne({ _id: customerId, organizationId }).session(session);
            if (customer) customerName = customer.name;
        }

        // B. Xử lý sản phẩm & Tính toán
        // [QUAN TRỌNG] Lấy giá vốn (buyPrice) từ DB để snapshot lại
        let totalAmount = 0;
        const processedItems = [];

        for (const item of items) {
            const product = await Product.findOne({ _id: item.productId, organizationId }).session(session);
            if (!product) throw new Error(`Sản phẩm ID ${item.productId} không tồn tại`);

            const itemPrice = Number(item.price) || product.price; // Cho phép bán giá khác niêm yết
            const itemTotal = itemPrice * item.quantity;
            totalAmount += itemTotal;

            processedItems.push({
                productId: product._id,
                name: product.name,
                quantity: item.quantity,
                price: itemPrice,
                costPrice: product.buyPrice || 0, // [SNAPSHOT GIÁ VỐN TẠI THỜI ĐIỂM ĐẶT]
                unit: product.unit || 'Cái'
            });
        }

        // C. Phí vận chuyển
        const shipFee = deliveryInfo?.isDelivery ? (Number(deliveryInfo.shipFee) || 0) : 0;
        const finalTotal = totalAmount + shipFee;

        // D. Tạo số đơn hàng
        const orderNumber = await getNextSequence(Order, PREFIXES.ORDER, organizationId);

        // E. Lưu đơn hàng
        const newOrder = new Order({
            organizationId,
            orderNumber,
            customerId: customerId || null,
            customerName,
            items: processedItems,
            totalAmount: finalTotal,
            depositAmount: paymentAmount || 0, // Tiền cọc
            paidAmount: paymentAmount || 0,    // Tạm tính là đã trả (cọc)
            status: 'Mới',
            note,
            isDelivery: deliveryInfo?.isDelivery || false,
            delivery: deliveryInfo?.isDelivery ? {
                address: deliveryInfo.address,
                shipFee: shipFee,
                status: 'Chờ giao'
            } : undefined
        });

        await newOrder.save({ session });
        await session.commitTransaction();
        res.status(201).json(newOrder);

    } catch (err) {
        await session.abortTransaction();
        res.status(400).json({ message: err.message });
    } finally {
        session.endSession();
    }
};

// 3. Cập nhật trạng thái (Hủy đơn, v.v)
exports.updateOrder = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findOneAndUpdate(
            { _id: req.params.id, organizationId: req.organizationId },
            { status },
            { new: true }
        );
        if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
// [MỚI] 4. Chuyển Đơn hàng -> Hóa đơn
exports.convertOrderToInvoice = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const order = await Order.findOne({ _id: req.params.id, organizationId: req.organizationId }).session(session);
        if (!order) throw new Error('Đơn hàng không tồn tại');

        // Tạo Invoice từ Order
        const invoiceNumber = await getNextSequence(Invoice, PREFIXES.INVOICE || 'HD', req.organizationId);
        const newInvoice = new Invoice({
            organizationId: req.organizationId,
            invoiceNumber,
            customerId: order.customerId,
            customerName: order.customerName,
            items: order.items, // Copy items
            totalAmount: order.totalAmount,
            discountAmount: 0, // Tạm tính
            finalAmount: order.totalAmount, // Tạm tính
            paidAmount: order.depositAmount || 0, // Chuyển cọc sang đã thanh toán
            status: 'Chưa thanh toán',
            issueDate: new Date(),
            note: `Chuyển từ đơn hàng #${order.orderNumber}`
        });

        await newInvoice.save({ session });

        // Cập nhật Order -> Hoàn thành
        order.status = 'Hoàn thành';
        await order.save({ session });

        await session.commitTransaction();
        res.json(newInvoice);
    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({ message: err.message });
    } finally {
        session.endSession();
    }
};
// [MỚI] 5. Chuyển Báo giá -> Đơn hàng
exports.convertQuoteToOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const quote = await Quote.findOne({ _id: req.params.id, organizationId: req.organizationId }).session(session);
        if (!quote) throw new Error('Báo giá không tồn tại');

        const orderNumber = await getNextSequence(Order, PREFIXES.ORDER, req.organizationId);
        const newOrder = new Order({
            organizationId: req.organizationId,
            orderNumber,
            customerId: quote.customerId,
            customerName: quote.customerName,
            items: quote.items,
            totalAmount: quote.totalAmount,
            depositAmount: 0,
            status: 'Mới',
            note: `Chuyển từ báo giá #${quote.quoteNumber}`
        });

        await newOrder.save({ session });
        
        // Cập nhật Quote -> Đã chốt
        quote.status = 'Đã chốt';
        await quote.save({ session });

        await session.commitTransaction();
        res.json(newOrder);
    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({ message: err.message });
    } finally {
        session.endSession();
    }
};
// 6. XÓA ĐƠN HÀNG (Bổ sung hàm này)
exports.deleteOrder = async (req, res) => {
    try {
        const order = await Order.findOneAndDelete({ 
            _id: req.params.id, 
            organizationId: req.organizationId 
        });

        if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        
        res.json({ message: 'Đã xóa đơn hàng thành công' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};