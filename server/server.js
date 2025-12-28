const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./db');

// --- IMPORTS MỚI (TỪ CÁC FILE ĐÃ TÁCH) ---
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const { protect } = require('./middleware/authMiddleware');
const { getNextSequence } = require('./utils/sequence');
const { changeStock } = require('./utils/stockUtils');

// --- DATABASE MODELS ---
// (Vẫn giữ lại để dùng cho các API logic bên dưới)
const Organization = require('./models/organization.model');
const User = require('./models/user.model');
const Product = require('./models/product.model');
const Category = require('./models/category.model');
const Customer = require('./models/customer.model');
const Supplier = require('./models/supplier.model');
const Quote = require('./models/quote.model');
const Order = require('./models/order.model');
const Invoice = require('./models/invoice.model');
const Purchase = require('./models/purchase.model');
const Delivery = require('./models/delivery.model');
const InventoryCheck = require('./models/inventoryCheck.model');
const CashFlowTransaction = require('./models/cashFlowTransaction.model');
const StockHistory = require('./models/stockHistory.model');

// --- APP SETUP ---
const app = express();
const port = process.env.PORT || 5001;

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// =================================================================
// 1. MODULE AUTH (ĐÃ TÁCH RA ROUTE RIÊNG)
// =================================================================
app.use('/api/auth', authRoutes);
// Lưu ý: Dùng protect ở đây để bảo vệ toàn bộ API Products
app.use('/api/products', protect, productRoutes);

// =================================================================
// 2. API ROUTES (LOGIC BÁN HÀNG - VẪN GIỮ TRONG NÀY TẠM THỜI)
// =================================================================
const apiRouter = express.Router();
apiRouter.use(protect); // Sử dụng Middleware bảo vệ mới

// --- TOOL SỬA LỖI DATA ---
apiRouter.get('/fix-invoices-data', async (req, res) => {
    try {
        const invoices = await Invoice.find({});
        const customers = await Customer.find({}, '_id');
        const validCustomerIds = new Set(customers.map(c => c._id.toString()));
        let count = 0;
        
        for (const inv of invoices) {
            let changed = false;
            if (!inv.items || !Array.isArray(inv.items)) { inv.items = []; changed = true; }
            let needCustomer = false;
            if (!inv.customerId) needCustomer = true;
            else if (!validCustomerIds.has(inv.customerId.toString())) needCustomer = true;

            if (needCustomer) {
                let guest = await Customer.findOne({ organizationId: inv.organizationId, name: 'Khách lẻ' });
                if (!guest) {
                    guest = await new Customer({ name: 'Khách lẻ', phone: '0000000000', address: 'Tại quầy', organizationId: inv.organizationId }).save();
                    validCustomerIds.add(guest._id.toString());
                }
                inv.customerId = guest._id; inv.customerName = guest.name; changed = true;
            }
            if (!inv.issueDate) { inv.issueDate = new Date().toISOString().split('T')[0]; changed = true; }
            else if (typeof inv.issueDate !== 'string') { try { inv.issueDate = new Date(inv.issueDate).toISOString().split('T')[0]; changed = true; } catch (e) {} }

            if (inv.paidAmount === undefined || inv.paidAmount === null) { inv.paidAmount = 0; changed = true; }
            const debt = (inv.totalAmount || 0) - (inv.paidAmount || 0);
            if (debt <= 0 && inv.status !== 'Đã thanh toán') { inv.status = 'Đã thanh toán'; changed = true; }
            else if (debt > 0) {
                 if (inv.paidAmount > 0 && inv.status !== 'Thanh toán một phần') { inv.status = 'Thanh toán một phần'; changed = true; }
                 else if (inv.paidAmount === 0 && inv.status !== 'Chưa thanh toán') { inv.status = 'Chưa thanh toán'; changed = true; }
            }
            if (changed) { await inv.save(); count++; }
        }
        res.json({ message: `✅ Đã sửa lỗi thành công ${count} hóa đơn!` });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// --- PROTECTED ENDPOINTS ---
apiRouter.get('/auth/me', async (req, res) => res.json(req.user));

// --- SETTINGS ---
apiRouter.get('/organization', async (req, res) => {
    try {
        const org = await Organization.findById(req.organizationId);
        if (!org) return res.status(404).json({ message: 'Chưa có thông tin công ty' });
        res.json(org);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

apiRouter.put('/organization', async (req, res) => {
    try {
        const { name, address, phone, email, website, taxCode, logoUrl, bankAccount, bankName, bankOwner } = req.body;
        const org = await Organization.findByIdAndUpdate(req.organizationId, { name, address, phone, email, website, taxCode, logoUrl, bankAccount, bankName, bankOwner }, { new: true });
        res.json(org);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- PURCHASES ---
apiRouter.get('/purchases', async (req, res) => {
    try { const data = await Purchase.find({ organizationId: req.organizationId }).sort({ createdAt: -1 }); res.json({ data }); } 
    catch (err) { res.status(500).json({ message: err.message }); }
});

apiRouter.post('/purchases', async (req, res) => {
    const { organizationId } = req;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { supplierId, items, totalAmount, issueDate, paidAmount } = req.body; 
        const supplier = await Supplier.findOne({ _id: supplierId, organizationId }).session(session);
        if (!supplier) throw new Error("Nhà cung cấp không tồn tại.");

        const purchaseNumber = await getNextSequence(Purchase, 'PN', organizationId);
        const validDate = issueDate || new Date();

        for (const item of items) {
             await changeStock({
                 session, organizationId, productId: item.productId,
                 quantityChange: item.quantity,
                 type: 'Nhập hàng', referenceNumber: purchaseNumber, note: `Nhập từ ${supplier.name}`
             });
        }

        const debtAmount = totalAmount - (paidAmount || 0);
        if (debtAmount > 0) {
            await Supplier.findOneAndUpdate({ _id: supplierId, organizationId }, { $inc: { debt: debtAmount } }).session(session);
        }

        if ((paidAmount || 0) > 0) {
            const transactionNumber = await getNextSequence(CashFlowTransaction, 'PC', organizationId);
            await new CashFlowTransaction({
                transactionNumber, type: 'chi', date: validDate, amount: paidAmount,
                payerReceiverName: supplier.name, description: `Thanh toán nhập hàng ${purchaseNumber}`,
                category: 'Trả NCC', organizationId
            }).save({ session });
        }

        const newPurchase = new Purchase({ 
            supplierId, supplierName: supplier.name, items, totalAmount, 
            issueDate: validDate, purchaseNumber, paidAmount: paidAmount || 0, 
            status: (paidAmount || 0) >= totalAmount ? 'Đã thanh toán' : 'Còn nợ', organizationId 
        });
        
        await newPurchase.save({ session });
        await session.commitTransaction();
        res.status(201).json(newPurchase);

    } catch (err) { await session.abortTransaction(); res.status(500).json({ message: err.message }); } 
    finally { session.endSession(); }
});

apiRouter.post('/purchases/:id/return', async (req, res) => {
    const { organizationId } = req;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const purchase = await Purchase.findOne({ _id: req.params.id, organizationId }).session(session);
        if (!purchase) throw new Error('Không tìm thấy phiếu nhập');

        for (const item of purchase.items) {
             await changeStock({
                 session, organizationId, productId: item.productId,
                 quantityChange: -item.quantity, 
                 type: 'Xuất trả NCC', referenceNumber: purchase.purchaseNumber, note: 'Trả hàng nhập lỗi'
             });
        }

        if (purchase.supplierId) {
            await Supplier.findOneAndUpdate({ _id: purchase.supplierId, organizationId }, { $inc: { debt: -purchase.totalAmount } }).session(session);
        }
        
        purchase.status = 'Đã trả hàng';
        await purchase.save({ session });
        
        await session.commitTransaction();
        res.json({ message: 'Đã trả hàng thành công' });
    } catch (err) { await session.abortTransaction(); res.status(500).json({ message: err.message }); }
    finally { session.endSession(); }
});

// --- SALES (INVOICES) ---
apiRouter.post('/invoices', async (req, res) => {
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

        const debt = finalTotalAmount - paymentAmount;
        if (customer && debt > 0) {
            await Customer.findByIdAndUpdate(customerId, { $inc: { debt: debt } }).session(session);
        }

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

    } catch (err) { 
        await session.abortTransaction(); 
        res.status(400).json({ message: err.message }); 
    }
    finally { session.endSession(); }
});

apiRouter.post('/invoices/:id/return', async (req, res) => {
    const { organizationId } = req;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { reason } = req.body; 
        const invoice = await Invoice.findOne({ _id: req.params.id, organizationId }).session(session);
        if (!invoice) throw new Error('Không tìm thấy hóa đơn');

        for (const item of invoice.items) {
             await changeStock({
                 session, organizationId, productId: item.productId, quantityChange: item.quantity,
                 type: 'Nhập hàng trả', referenceNumber: invoice.invoiceNumber, 
                 note: reason || 'Khách trả lại hàng'
             });
        }

        if (invoice.customerId && invoice.status === 'Còn nợ') {
             const debtToReduce = invoice.totalAmount - invoice.paidAmount;
             await Customer.findByIdAndUpdate(invoice.customerId, { $inc: { debt: -debtToReduce } }).session(session);
        }

        if (invoice.paidAmount > 0) {
            const transactionNumber = await getNextSequence(CashFlowTransaction, 'PC', organizationId);
            await new CashFlowTransaction({
                transactionNumber, type: 'chi', date: new Date(), amount: invoice.paidAmount,
                payerReceiverName: invoice.customerName, 
                description: `Hoàn tiền trả hàng ${invoice.invoiceNumber} (${reason || 'Lý do khác'})`,
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
});

apiRouter.get('/invoices', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status || 'all';
        const search = req.query.search || '';
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        const organizationId = req.organizationId;

        let query = { organizationId };
        if (search) {
            query.$or = [ { invoiceNumber: { $regex: search, $options: 'i' } }, { customerName: { $regex: search, $options: 'i' } } ];
        }
        if (status === 'debt') query.$expr = { $gt: ["$totalAmount", "$paidAmount"] };
        else if (status === 'paid') query.$expr = { $lte: ["$totalAmount", "$paidAmount"] };

        if (startDate && endDate) {
            query.issueDate = { $gte: startDate, $lte: endDate };
        }

        const total = await Invoice.countDocuments(query);
        const invoices = await Invoice.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);

        res.json({ data: invoices, total, totalPages: Math.ceil(total / limit), currentPage: page });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

apiRouter.get('/invoices/:invoiceNumber/history', async (req, res) => {
    try {
        const { invoiceNumber } = req.params;
        const history = await CashFlowTransaction.find({
            organizationId: req.organizationId,
            description: { $regex: invoiceNumber, $options: 'i' } 
        }).sort({ createdAt: -1 }); 
        res.json(history);
    } catch (e) { res.status(500).json({ message: e.message }); }
});

apiRouter.get('/invoices/:id', async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ _id: req.params.id, organizationId: req.organizationId });
        if (!invoice) return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
        res.json(invoice);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

apiRouter.post('/invoices', async (req, res) => {
    try {
        const { organizationId } = req;
        let invoiceNumber = req.body.invoiceNumber;
        if (!invoiceNumber) { invoiceNumber = await getNextSequence(Invoice, 'HD', organizationId); }
        const newInvoice = new Invoice({ ...req.body, invoiceNumber, organizationId });
        await newInvoice.save();
        res.status(201).json(newInvoice);
    } catch (e) { res.status(500).json({ message: e.message }); }
});

apiRouter.put('/invoices/:id', async (req, res) => {
    try {
        const updatedInvoice = await Invoice.findOneAndUpdate(
            { _id: req.params.id, organizationId: req.organizationId }, req.body, { new: true }
        );
        if (!updatedInvoice) return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
        res.json(updatedInvoice);
    } catch (e) { res.status(500).json({ message: e.message }); }
});

apiRouter.post('/invoices/:id/payment', async (req, res) => {
    const { organizationId } = req;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { amount } = req.body; 
        const invoice = await Invoice.findOne({ _id: req.params.id, organizationId }).session(session);
        if (!invoice) throw new Error('Hóa đơn không tồn tại');

        const currentDebt = invoice.totalAmount - (invoice.paidAmount || 0);
        const payAmount = parseInt(amount);
        if (payAmount > currentDebt) throw new Error(`Khách chỉ còn nợ ${currentDebt.toLocaleString()}đ. Bạn đang thu ${payAmount.toLocaleString()}đ!`);

        invoice.paidAmount = (invoice.paidAmount || 0) + payAmount;
        const total = invoice.totalAmount || 0;
        if (invoice.paidAmount >= total) invoice.status = 'Đã thanh toán'; 
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
    } catch (err) { await session.abortTransaction(); res.status(500).json({ message: err.message }); } finally { session.endSession(); }
});

apiRouter.delete('/invoices/:id', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const invoice = await Invoice.findOne({ _id: req.params.id, organizationId: req.organizationId }).session(session);
        if (!invoice) throw new Error('Hóa đơn không tồn tại');

        for (const item of invoice.items) {
             const product = await Product.findOne({ _id: item.productId, organizationId: req.organizationId }).session(session);
             if (product) {
                 product.stock += item.quantity; 
                 await product.save({ session });
                 await new StockHistory({
                     organizationId: req.organizationId, productId: product._id, productName: product.name, sku: product.sku,
                     changeAmount: item.quantity, balanceAfter: product.stock,
                     type: 'Hủy hóa đơn', referenceNumber: invoice.invoiceNumber, note: 'Hủy đơn bán hàng', date: new Date()
                 }).save({ session });
             }
        }

        const debtAmount = invoice.totalAmount - invoice.paidAmount;
        if (invoice.customerId && debtAmount > 0) {
            await Customer.findByIdAndUpdate(invoice.customerId, { $inc: { debt: -debtAmount } }).session(session);
        }

        await Invoice.deleteOne({ _id: invoice._id }).session(session);
        await session.commitTransaction();
        res.json({ message: 'Đã hủy hóa đơn thành công' });
    } catch (err) { await session.abortTransaction(); res.status(500).json({ message: err.message }); } finally { session.endSession(); }
});

// --- ORDERS ---
apiRouter.get('/orders', async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status, startDate, endDate } = req.query;
        const { organizationId } = req;
        
        let query = { organizationId };
        if (status && status !== 'all') query.status = status;
        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };
            query.$or = [ { customerName: searchRegex }, { orderNumber: searchRegex } ];
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

        const ordersPromise = Order.find(query).sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit);
        const [statsResult, orders] = await Promise.all([statsPromise, ordersPromise]);
        const count = await Order.countDocuments(query);
        const stats = statsResult[0] || { totalRevenue: 0, totalOrders: 0, pendingCount: 0, doneCount: 0 };

        res.json({ data: orders, total: count, totalPages: Math.ceil(count / limit), currentPage: page, stats: stats });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

apiRouter.post('/orders', async (req, res) => {
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

        const orderNumber = await getNextSequence(Order, 'DH', organizationId);
        const shipFee = deliveryInfo?.isDelivery ? (Number(deliveryInfo.shipFee) || 0) : 0;
        const finalTotal = Number(totalAmount) + shipFee;

        const newOrder = new Order({
            organizationId, orderNumber, customerId, customerName, items,
            totalAmount: finalTotal, paidAmount: paymentAmount, status: 'Mới', note,
            isDelivery: deliveryInfo?.isDelivery || false,
            delivery: deliveryInfo?.isDelivery ? {
                address: deliveryInfo.address || '',
                receiverName: deliveryInfo.receiverName || customerName,
                phone: deliveryInfo.phone || (customer ? customer.phone : ''),
                shipFee: shipFee,
                status: 'Chờ giao'
            } : undefined
        });

        await newOrder.save({ session });
        await session.commitTransaction();
        res.status(201).json(newOrder);
    } catch (err) { await session.abortTransaction(); res.status(400).json({ message: err.message }); } finally { session.endSession(); }
});

apiRouter.post('/quotes/:id/convert-to-order', async (req, res) => {
    try {
        const { id } = req.params;
        const quote = await Quote.findOne({ _id: id, organizationId: req.organizationId });
        if (!quote) return res.status(404).json({ message: 'Không tìm thấy báo giá' });
        if (quote.status === 'Đã chuyển đổi') return res.status(400).json({ message: 'Báo giá này đã được chuyển đổi thành đơn hàng rồi!' });

        const orderNumber = await getNextSequence(Order, 'DH', req.organizationId);
        const newOrder = new Order({
            organizationId: req.organizationId, orderNumber, customerId: quote.customerId, customerName: quote.customerName,
            items: quote.items.map(item => ({
                productId: item.productId, name: item.name, quantity: item.quantity, price: item.price,
                unit: 'Cái', costPrice: 0 
            })),
            totalAmount: quote.totalAmount, status: 'Mới', note: `Được chuyển đổi từ Báo giá số: ${quote.quoteNumber}`, issueDate: new Date()
        });

        const savedOrder = await newOrder.save(); 
        quote.status = 'Đã chuyển đổi';
        await quote.save();

        res.status(200).json({ message: 'Chuyển đổi thành công', orderId: savedOrder._id });
    } catch (err) { console.error(err); res.status(500).json({ message: err.message }); }
});

apiRouter.post('/orders/:id/to-invoice', async (req, res) => {
    const { organizationId } = req;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await Order.findOne({ _id: req.params.id, organizationId }).session(session);
        if (!order || order.status === 'Hoàn thành') throw new Error('Đơn lỗi hoặc đã hoàn thành');

        const { paymentAmount } = req.body;

        for (const item of order.items) {
            await changeStock({
                session, organizationId, productId: item.productId, quantityChange: -item.quantity,
                type: 'Xuất hàng', referenceNumber: order.orderNumber, note: `Xuất kho đơn ${order.orderNumber}`
            });
        }

        const invoiceItems = await Promise.all(order.items.map(async (item) => {
            const itemObj = item.toObject ? item.toObject() : item;
            let finalCostPrice = itemObj.costPrice;
            if (finalCostPrice === undefined || finalCostPrice === null) {
                const product = await Product.findOne({ _id: item.productId, organizationId }).session(session);
                finalCostPrice = product ? (product.costPrice || 0) : 0;
            }
            return {
                ...itemObj,
                vat: (itemObj.vat !== undefined) ? itemObj.vat : 0, 
                costPrice: finalCostPrice 
            };
        }));

        let status = 'Chưa thanh toán';
        const paid = paymentAmount || 0;
        const total = order.totalAmount;

        if (paid >= total) status = 'Đã thanh toán';
        else if (paid > 0) status = 'Thanh toán một phần';

        const invoiceNumber = await getNextSequence(Invoice, 'HD', organizationId);
        
        const newInvoice = new Invoice({
            invoiceNumber, customerId: order.customerId, customerName: order.customerName,
            issueDate: new Date().toLocaleDateString('en-CA'), items: invoiceItems, 
            totalAmount: total, paidAmount: paid, status: status, 
            note: `Xuất từ đơn hàng ${order.orderNumber}`, organizationId
        });
        await newInvoice.save({ session });

        const debtToAdd = total - paid;
        if (debtToAdd > 0) {
            await Customer.findByIdAndUpdate(order.customerId, { $inc: { debt: debtToAdd } }).session(session);
        }

        if (paid > 0) {
            const transactionNumber = await getNextSequence(CashFlowTransaction, 'PT', organizationId);
            await new CashFlowTransaction({
                transactionNumber, type: 'thu', date: new Date(), amount: paid,
                description: `Thanh toán hóa đơn ${invoiceNumber}`,
                payerReceiverName: order.customerName, category: 'Khác', organizationId
            }).save({ session });
        }
        
        order.status = 'Hoàn thành';
        await order.save({ session });

        await session.commitTransaction();
        res.status(201).json(newInvoice);
    } catch (err) { await session.abortTransaction(); res.status(400).json({ message: err.message }); } finally { session.endSession(); }
});

// --- DASHBOARD ---
apiRouter.get('/dashboard/stats', async (req, res) => {
    const { organizationId } = req;
    try {
        const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(); endOfDay.setHours(23,59,59,999);

        const todaySales = await Invoice.aggregate([
            { $match: { organizationId, createdAt: { $gte: startOfDay, $lte: endOfDay } } },
            { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
        ]);

        const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
        const cashFlow = await CashFlowTransaction.aggregate([
            { $match: { organizationId, createdAt: { $gte: startOfMonth } } },
            { $group: { _id: "$type", total: { $sum: "$amount" } } }
        ]);

        const lowStockCount = await Product.countDocuments({ organizationId, stock: { $lte: 10 } });

        res.json({
            salesToday: todaySales[0]?.total || 0,
            ordersToday: todaySales[0]?.count || 0,
            incomeMonth: cashFlow.find(c => c._id === 'thu')?.total || 0,
            expenseMonth: cashFlow.find(c => c._id === 'chi')?.total || 0,
            lowStockCount
        });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

apiRouter.post('/quotes', async (req, res) => {
    try {
        const quoteNumber = await getNextSequence(Quote, 'BG', req.organizationId);
        const newQuote = new Quote({ ...req.body, quoteNumber, organizationId: req.organizationId });
        await newQuote.save();
        res.status(201).json(newQuote);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- COMMON CRUD ---
const createTenantCrudEndpoints = (model, pathName) => {
    apiRouter.get(`/${pathName}`, async (req, res) => {
        try { const data = await model.find({ organizationId: req.organizationId }).sort({ createdAt: -1 }); res.json({ data }); } 
        catch (e) { res.status(500).json({ message: e.message }); }
    });
    apiRouter.get(`/${pathName}/:id`, async (req, res) => {
        try { 
            const item = await model.findOne({ _id: req.params.id, organizationId: req.organizationId });
            if (!item) return res.status(404).json({ message: 'Không tìm thấy' });
            res.json(item); 
        } catch (e) { res.status(500).json({ message: e.message }); }
    });
    apiRouter.post(`/${pathName}`, async (req, res) => {
        try { res.status(201).json(await new model({ ...req.body, organizationId: req.organizationId }).save()); } 
        catch (e) { res.status(500).json({ message: e.message }); }
    });
    apiRouter.put(`/${pathName}/:id`, async (req, res) => {
        try { res.json(await model.findOneAndUpdate({ _id: req.params.id, organizationId: req.organizationId }, req.body, { new: true })); }
        catch (e) { res.status(500).json({ message: e.message }); }
    });
    apiRouter.delete(`/${pathName}/:id`, async (req, res) => {
        try { await model.findOneAndDelete({ _id: req.params.id, organizationId: req.organizationId }); res.status(204).send(); }
        catch (e) { res.status(500).json({ message: e.message }); }
    });
};

apiRouter.delete('/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { organizationId } = req;
        const categoryDoc = await Category.findOne({ _id: id, organizationId });
        if (!categoryDoc) return res.status(404).json({ message: 'Không tìm thấy danh mục cần xóa' });
        const productCount = await Product.countDocuments({ organizationId, category: categoryDoc.name });
        if (productCount > 0) return res.status(400).json({ message: `Không thể xóa! Danh mục "${categoryDoc.name}" đang chứa ${productCount} sản phẩm. ` });
        await Category.deleteOne({ _id: id });
        res.json({ message: 'Đã xóa danh mục thành công' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});
createTenantCrudEndpoints(Category, 'categories');
createTenantCrudEndpoints(Customer, 'customers');
createTenantCrudEndpoints(Supplier, 'suppliers');
createTenantCrudEndpoints(Quote, 'quotes');
createTenantCrudEndpoints(Order, 'orders');
createTenantCrudEndpoints(Delivery, 'deliveries');
createTenantCrudEndpoints(CashFlowTransaction, 'cashflow-transactions');
createTenantCrudEndpoints(InventoryCheck, 'inventory-checks');

// =================================================================
// 3. MAIN APP ROUTER
// =================================================================
app.use('/api', apiRouter);

// --- STATIC FILES ---
app.use(express.static(path.join(__dirname, '..')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));

// --- START SERVER ---
app.listen(port, () => console.log(`Server running on port ${port}`));