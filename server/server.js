const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

const connectDB = require('./db');

// --- DATABASE MODELS ---
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

const mongoose = require('mongoose');

// --- APP SETUP ---
const app = express();
const port = process.env.PORT || 5001;

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// --- PASSPORT CONFIG ---
app.use(passport.initialize());
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        if (user) return done(null, user);
        
        const newOrg = new Organization({ name: `Cửa hàng của ${profile.displayName}` });
        await newOrg.save();
        
        const newUser = new User({
            email: profile.emails[0].value,
            googleId: profile.id,
            role: 'owner',
            organizationId: newOrg._id,
        });
        await newUser.save();
        newOrg.ownerId = newUser._id;
        await newOrg.save();
        return done(null, newUser);
    } catch (err) { return done(err, null); }
  }
));

// --- HELPER FUNCTIONS ---
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '30d' });
};

const getNextSequence = async (model, prefix, organizationId) => {
    const sequenceField = {
        'HD': 'invoiceNumber', 'PT': 'transactionNumber', 'PC': 'transactionNumber',
        'PN': 'purchaseNumber', 'BG': 'quoteNumber', 'DH': 'orderNumber',
        'PGH': 'deliveryNumber', 'PKK': 'checkNumber', 'SP': 'sku',
        'TH': 'returnNumber' // Trả hàng
    }[prefix];
    
    const lastDoc = await model.findOne({ organizationId, [sequenceField]: new RegExp('^' + prefix) }).sort({ [sequenceField]: -1 });
    if (!lastDoc || !lastDoc[sequenceField]) return `${prefix}-00001`;

    const lastNumStr = lastDoc[sequenceField].split('-')[1];
    const lastNum = parseInt(lastNumStr, 10);
    return `${prefix}-${(lastNum + 1).toString().padStart(5, '0')}`;
};

// [CORE] HÀM QUẢN LÝ KHO TRUNG TÂM
const changeStock = async ({ session, organizationId, productId, quantityChange, type, referenceId, referenceNumber, note }) => {
    const product = await Product.findOne({ _id: productId, organizationId }).session(session);
    if (!product) throw new Error(`Không tìm thấy sản phẩm ID: ${productId}`);

    // Chặn xuất âm kho (Tùy chọn: có thể bỏ nếu cho phép bán âm)
    if (quantityChange < 0 && product.stock + quantityChange < 0) {
        throw new Error(`SP "${product.name}" không đủ hàng! Tồn: ${product.stock}, Cần: ${Math.abs(quantityChange)}`);
    }

    const newStock = product.stock + quantityChange;
    product.stock = newStock;
    await product.save({ session });

    // Ghi thẻ kho
    const history = new StockHistory({
        organizationId, productId: product._id, productName: product.name, sku: product.sku,
        changeAmount: quantityChange, balanceAfter: newStock,
        type, referenceId, referenceNumber, note, date: new Date()
    });
    await history.save({ session });
    return newStock;
};

// =================================================================
// --- API ROUTES ---
// =================================================================
const apiRouter = express.Router();

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) return res.status(401).json({ message: 'User not found' });
            req.organizationId = req.user.organizationId.toString(); 
            next();
        } catch (error) { res.status(401).json({ message: 'Token failed' }); }
    } else { res.status(401).json({ message: 'No token' }); }
};

// --- AUTH ---
const authRouter = express.Router();
authRouter.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !user.password || !(await user.comparePassword(password))) 
            return res.status(400).json({ message: 'Email hoặc mật khẩu sai' });
        
        const token = generateToken(user.id);
        res.json({ token, user: { id: user._id, email: user.email, role: user.role, organizationId: user.organizationId } });
    } catch (err) { res.status(500).json({ message: err.message }); }
});
authRouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
authRouter.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => { res.redirect(`http://localhost:3000?token=${generateToken(req.user.id)}`); }
);
app.use('/api/auth', authRouter);

// --- PROTECTED ENDPOINTS ---
apiRouter.use(protect);
apiRouter.get('/auth/me', async (req, res) => res.json(req.user));

// ---------------------------------------------------------
// 1. PRODUCTS (SẢN PHẨM)
// ---------------------------------------------------------
apiRouter.get('/products', async (req, res) => {
    const { organizationId } = req;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;
    try {
        const query = { organizationId, $or: [{ name: { $regex: search, $options: 'i' } }, { sku: { $regex: search, $options: 'i' } }] };
        if (req.query.category && req.query.category !== 'all') query.category = req.query.category;
        
        const products = await Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
        const total = await Product.countDocuments(query);
        res.json({ data: products, total, page, totalPages: Math.ceil(total / limit) });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

apiRouter.post('/products', async (req, res) => {
    try {
        let sku = req.body.sku;
        if (!sku) sku = await getNextSequence(Product, 'SP', req.organizationId);
        
        const productData = { ...req.body, sku, organizationId: req.organizationId };
        if (productData.vat === undefined) productData.vat = 0;

        const newProduct = await new Product(productData).save();
        
        // Ghi thẻ kho tồn đầu
        if (req.body.stock > 0) {
             const session = await mongoose.startSession();
             session.startTransaction();
             try {
                await new StockHistory({
                    organizationId: req.organizationId, productId: newProduct._id, productName: newProduct.name, sku: newProduct.sku,
                    changeAmount: req.body.stock, balanceAfter: req.body.stock, type: 'Khởi tạo', note: 'Tồn đầu kỳ', date: new Date()
                }).save({ session });
                await session.commitTransaction();
             } catch(e) { await session.abortTransaction(); } finally { session.endSession(); }
        }
        res.status(201).json(newProduct);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// [FIX] Sửa kho bằng tay -> Ghi lịch sử
apiRouter.put('/products/:id', async (req, res) => {
    const { organizationId } = req;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const oldProduct = await Product.findOne({ _id: req.params.id, organizationId }).session(session);
        if (!oldProduct) throw new Error("SP không tồn tại");

        if (req.body.stock !== undefined && parseInt(req.body.stock) !== oldProduct.stock) {
            const diff = parseInt(req.body.stock) - oldProduct.stock;
            await changeStock({
                session, organizationId, productId: oldProduct._id, quantityChange: diff,
                type: 'Điều chỉnh kho', referenceNumber: 'Sửa tay', note: `Cập nhật trực tiếp`
            });
        }
        
        const updated = await Product.findOneAndUpdate({ _id: req.params.id, organizationId }, req.body, { new: true, session });
        await session.commitTransaction();
        res.json(updated);
    } catch (err) { await session.abortTransaction(); res.status(500).json({ message: err.message }); }
    finally { session.endSession(); }
});

apiRouter.delete('/products/:id', async (req, res) => {
    try { await Product.findOneAndDelete({ _id: req.params.id, organizationId: req.organizationId }); res.status(204).send(); }
    catch (err) { res.status(500).json({ message: err.message }); }
});

apiRouter.get('/stock-history/:productId', async (req, res) => {
    try {
        const history = await StockHistory.find({ organizationId: req.organizationId, productId: req.params.productId }).sort({ date: -1 }).limit(100);
        res.json(history);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ---------------------------------------------------------
// 2. PURCHASES (NHẬP HÀNG)
// ---------------------------------------------------------
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

        // Cộng kho & Ghi lịch sử
        for (const item of items) {
             await changeStock({
                 session, organizationId, productId: item.productId,
                 quantityChange: item.quantity,
                 type: 'Nhập hàng', referenceNumber: purchaseNumber, note: `Nhập từ ${supplier.name}`
             });
        }

        // Công nợ
        const debtAmount = totalAmount - (paidAmount || 0);
        if (debtAmount > 0) {
            await Supplier.findOneAndUpdate({ _id: supplierId, organizationId }, { $inc: { debt: debtAmount } }).session(session);
        }

        // Tạo Phiếu Chi (nếu trả tiền)
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

// [MỚI] TRẢ HÀNG NHÀ CUNG CẤP (RETURN TO SUPPLIER)
apiRouter.post('/purchases/:id/return', async (req, res) => {
    const { organizationId } = req;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const purchase = await Purchase.findOne({ _id: req.params.id, organizationId }).session(session);
        if (!purchase) throw new Error('Không tìm thấy phiếu nhập');

        // Logic: Xuất kho trả lại -> Giảm nợ NCC (hoặc NCC trả lại tiền)
        // Đơn giản hóa: Giảm nợ NCC tương ứng giá trị trả
        for (const item of purchase.items) {
             await changeStock({
                 session, organizationId, productId: item.productId,
                 quantityChange: -item.quantity, // Trừ kho
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

// ---------------------------------------------------------
// 3. SALES (BÁN HÀNG)
// ---------------------------------------------------------
apiRouter.post('/sales', async (req, res) => {
    const { organizationId } = req;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { customerId, items, totalAmount, paymentAmount } = req.body;
        
        let customer = null;
        let customerName = 'Khách lẻ';
        if (customerId) {
            customer = await Customer.findOne({ _id: customerId, organizationId }).session(session);
            if (customer) customerName = customer.name;
        }

        // 1. Trừ kho
        for (const item of items) {
             await changeStock({
                 session, organizationId, productId: item.productId, quantityChange: -item.quantity,
                 type: 'Xuất hàng', referenceNumber: 'POS', note: `Bán lẻ cho ${customerName}`
             });
        }
        
        const invoiceNumber = await getNextSequence(Invoice, 'HD', organizationId);
        
        // [ĐÃ SỬA LỖI] 'Còn nợ' -> 'Chưa thanh toán' (Để khớp với Database)
        const status = paymentAmount >= totalAmount ? 'Đã thanh toán' : (paymentAmount > 0 ? 'Thanh toán một phần' : 'Chưa thanh toán');

        const newInvoice = new Invoice({
            invoiceNumber, customerId, customerName,
            issueDate: new Date().toISOString().split('T')[0],
            items, totalAmount, paidAmount: paymentAmount,
            status, organizationId
        });
        await newInvoice.save({ session });

        // 2. Cộng nợ khách
        if (customer && totalAmount > paymentAmount) {
            await Customer.findByIdAndUpdate(customerId, { $inc: { debt: totalAmount - paymentAmount } }).session(session);
        }

        // 3. Tạo phiếu thu
        let savedVoucher = null;
        if (paymentAmount > 0) {
            const transactionNumber = await getNextSequence(CashFlowTransaction, 'PT', organizationId);
            
            // [ĐÃ SỬA LỖI] 'Doanh thu' -> 'Khác' (Để tránh lỗi validation category)
            savedVoucher = new CashFlowTransaction({
                transactionNumber, type: 'thu', date: new Date(), amount: paymentAmount,
                payerReceiverName: customerName, description: `Thu tiền POS ${invoiceNumber}`,
                category: 'Khác', organizationId 
            });
            await savedVoucher.save({ session });
        }
        
        await session.commitTransaction();
        res.status(201).json({ newInvoice, voucherId: savedVoucher ? savedVoucher._id : null });

    } catch (err) { await session.abortTransaction(); res.status(400).json({ message: err.message }); }
    finally { session.endSession(); }
});

// [MỚI] KHÁCH TRẢ HÀNG (RETURN FROM CUSTOMER)
apiRouter.post('/invoices/:id/return', async (req, res) => {
    const { organizationId } = req;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const invoice = await Invoice.findOne({ _id: req.params.id, organizationId }).session(session);
        if (!invoice) throw new Error('Không tìm thấy hóa đơn');

        // Nhập lại kho
        for (const item of invoice.items) {
             await changeStock({
                 session, organizationId, productId: item.productId, quantityChange: item.quantity,
                 type: 'Nhập hàng trả', referenceNumber: invoice.invoiceNumber, note: 'Khách trả lại hàng'
             });
        }

        // Trừ nợ khách (nếu khách mua nợ)
        if (invoice.customerId && invoice.status === 'Còn nợ') {
             const debtToReduce = invoice.totalAmount - invoice.paidAmount;
             await Customer.findByIdAndUpdate(invoice.customerId, { $inc: { debt: -debtToReduce } }).session(session);
        }

        // Nếu khách đã trả tiền -> Tạo phiếu Chi trả lại tiền khách (Refund)
        if (invoice.paidAmount > 0) {
            const transactionNumber = await getNextSequence(CashFlowTransaction, 'PC', organizationId);
            await new CashFlowTransaction({
                transactionNumber, type: 'chi', date: new Date(), amount: invoice.paidAmount,
                payerReceiverName: invoice.customerName, description: `Hoàn tiền trả hàng ${invoice.invoiceNumber}`,
                category: 'Hoàn tiền', organizationId
            }).save({ session });
        }

        invoice.status = 'Đã hoàn trả';
        await invoice.save({ session });

        await session.commitTransaction();
        res.json({ message: 'Đã xử lý trả hàng thành công' });
    } catch (err) { await session.abortTransaction(); res.status(500).json({ message: err.message }); }
    finally { session.endSession(); }
});

// ---------------------------------------------------------
// 4. ORDERS (ĐƠN HÀNG)
// ---------------------------------------------------------
// API tạo Đơn hàng mới (Sinh mã tự động DH-xxxxx)
apiRouter.post('/orders', async (req, res) => {
    try {
        const orderNumber = await getNextSequence(Order, 'DH', req.organizationId);
        
        // Mặc định trạng thái là 'Mới' nếu không gửi lên
        const newOrder = new Order({ 
            ...req.body, 
            orderNumber, 
            status: 'Mới',
            organizationId: req.organizationId 
        });
        
        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// API: Chuyển đổi Báo giá -> Đơn hàng
apiRouter.post('/quotes/:id/convert-to-order', async (req, res) => {
    try {
        const { id } = req.params;
        
        // 1. Tìm báo giá gốc
        const quote = await Quote.findOne({ _id: id, organizationId: req.organizationId });
        if (!quote) return res.status(404).json({ message: 'Không tìm thấy báo giá' });
        
        // 2. Kiểm tra trạng thái
        if (quote.status === 'Đã chuyển đổi') {
            return res.status(400).json({ message: 'Báo giá này đã được chuyển đổi thành đơn hàng rồi!' });
        }

        // 3. Sinh mã Đơn hàng mới (DH-xxxxx)
        const orderNumber = await getNextSequence(Order, 'DH', req.organizationId);

        // 4. Tạo Đơn hàng từ dữ liệu Báo giá
        const newOrder = new Order({
            organizationId: req.organizationId,
            orderNumber,
            customerId: quote.customerId,
            customerName: quote.customerName,
            // Copy danh sách sản phẩm
            items: quote.items.map(item => ({
                productId: item.productId,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                unit: 'Cái', // Hoặc lấy từ item.unit nếu model Báo giá của bạn có lưu
                costPrice: 0 // Tạm thời để 0 hoặc lấy giá vốn từ bảng Product nếu cần
            })),
            totalAmount: quote.totalAmount,
            status: 'Mới', // Trạng thái đơn hàng khởi tạo
            note: `Được chuyển đổi từ Báo giá số: ${quote.quoteNumber}`,
            issueDate: new Date()
        });

        const savedOrder = await newOrder.save({ session }); 

        // 5. Cập nhật lại trạng thái Báo giá để khóa lại
        quote.status = 'Đã chuyển đổi';
        await quote.save({ session });

        res.status(200).json({ message: 'Chuyển đổi thành công', orderId: savedOrder._id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// Chuyển Đơn hàng thành Hóa đơn (Kèm xuất kho & tạo phiếu thu nếu có)
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

        const invoiceNumber = await getNextSequence(Invoice, 'HD', organizationId);
        const newInvoice = new Invoice({
            invoiceNumber, customerId: order.customerId, customerName: order.customerName,
            issueDate: new Date().toISOString().split('T')[0],
            items: order.items, totalAmount: order.totalAmount, paidAmount: paymentAmount || 0,
            status: (paymentAmount || 0) >= order.totalAmount ? 'Đã thanh toán' : 'Còn nợ', 
            note: `Xuất từ đơn hàng ${order.orderNumber}`, organizationId
        });
        await newInvoice.save({ session });

        const debtToAdd = order.totalAmount - (paymentAmount || 0);
        if (debtToAdd > 0) {
            await Customer.findByIdAndUpdate(order.customerId, { $inc: { debt: debtToAdd } }).session(session);
        }

        if ((paymentAmount || 0) > 0) {
            const transactionNumber = await getNextSequence(CashFlowTransaction, 'PT', organizationId);
            await new CashFlowTransaction({
                transactionNumber, type: 'thu', date: new Date(), amount: paymentAmount,
                description: `Thanh toán hóa đơn ${invoiceNumber}`,
                payerReceiverName: order.customerName, category: 'Doanh thu bán hàng', organizationId
            }).save({ session });
        }
        
        order.status = 'Hoàn thành';
        await order.save({ session });

        await session.commitTransaction();
        res.status(201).json(newInvoice);
    } catch (err) { await session.abortTransaction(); res.status(400).json({ message: err.message }); }
    finally { session.endSession(); }
});

// ---------------------------------------------------------
// 5. DASHBOARD STATS (THỐNG KÊ)
// ---------------------------------------------------------
apiRouter.get('/dashboard/stats', async (req, res) => {
    const { organizationId } = req;
    try {
        // Tổng doanh thu hôm nay
        const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(); endOfDay.setHours(23,59,59,999);

        const todaySales = await Invoice.aggregate([
            { $match: { organizationId, createdAt: { $gte: startOfDay, $lte: endOfDay } } },
            { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
        ]);

        // Tổng thu - chi trong tháng
        const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
        const cashFlow = await CashFlowTransaction.aggregate([
            { $match: { organizationId, createdAt: { $gte: startOfMonth } } },
            { $group: { _id: "$type", total: { $sum: "$amount" } } }
        ]);

        // Sản phẩm sắp hết hàng (< 10)
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

// API riêng cho Báo giá để sinh mã tự động (Tránh lỗi quoteNumber is required)
apiRouter.post('/quotes', async (req, res) => {
    try {
        const quoteNumber = await getNextSequence(Quote, 'BG', req.organizationId);
        const newQuote = new Quote({ ...req.body, quoteNumber, organizationId: req.organizationId });
        await newQuote.save();
        res.status(201).json(newQuote);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ---------------------------------------------------------
// 6. COMMON CRUD
// ---------------------------------------------------------
const createTenantCrudEndpoints = (model, pathName) => {
    apiRouter.get(`/${pathName}`, async (req, res) => {
        try { 
            const data = await model.find({ organizationId: req.organizationId }).sort({ createdAt: -1 });
            res.json({ data }); 
        } catch (e) { res.status(500).json({ message: e.message }); }
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

createTenantCrudEndpoints(Category, 'categories');
createTenantCrudEndpoints(Customer, 'customers');
createTenantCrudEndpoints(Supplier, 'suppliers');
createTenantCrudEndpoints(Quote, 'quotes');
createTenantCrudEndpoints(Order, 'orders');
createTenantCrudEndpoints(Delivery, 'deliveries');
createTenantCrudEndpoints(CashFlowTransaction, 'cashflow-transactions');
createTenantCrudEndpoints(InventoryCheck, 'inventory-checks');
createTenantCrudEndpoints(Invoice, 'invoices');

// Fix dữ liệu tồn kho cũ
apiRouter.get('/fix-stock-history', async (req, res) => {
    try {
        const products = await Product.find({ organizationId: req.organizationId });
        let count = 0;
        for (const p of products) {
            const exist = await StockHistory.exists({ productId: p._id });
            if (!exist && p.stock > 0) {
                await new StockHistory({
                    organizationId: p.organizationId, productId: p._id, productName: p.name, sku: p.sku,
                    changeAmount: p.stock, balanceAfter: p.stock, type: 'Khởi tạo', note: 'Fix tồn đầu', date: p.createdAt
                }).save();
                count++;
            }
        }
        res.json({ message: `Đã fix ${count} sản phẩm.` });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.use('/api', apiRouter);
app.use(express.static(path.join(__dirname, '..')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));

app.listen(port, () => console.log(`Server running on port ${port}`));