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

// --- TOOL SỬA LỖI V4 (Fix lỗi "customerId required" & Chuẩn hóa dữ liệu) ---
apiRouter.get('/fix-invoices-data', async (req, res) => {
    try {
        const invoices = await Invoice.find({});
        
        // Lấy danh sách ID khách hàng hợp lệ
        const customers = await Customer.find({}, '_id');
        const validCustomerIds = new Set(customers.map(c => c._id.toString()));

        let count = 0;
        
        for (const inv of invoices) {
            let changed = false;

            // 1. [QUAN TRỌNG] FIX LỖI ITEMS BỊ NULL (Nguyên nhân sập giao diện)
            if (!inv.items || !Array.isArray(inv.items)) {
                inv.items = []; // Gán mảng rỗng để không bị lỗi .map()
                changed = true;
            }

            // 2. [QUAN TRỌNG] FIX LỖI THIẾU KHÁCH HÀNG (Nguyên nhân không lưu được)
            let needCustomer = false;
            if (!inv.customerId) needCustomer = true;
            else if (!validCustomerIds.has(inv.customerId.toString())) needCustomer = true;

            if (needCustomer) {
                // Tìm khách lẻ của cửa hàng này
                let guest = await Customer.findOne({ 
                    organizationId: inv.organizationId, 
                    name: 'Khách lẻ' 
                });
                
                // Nếu chưa có thì tạo mới
                if (!guest) {
                    guest = await new Customer({
                        name: 'Khách lẻ',
                        phone: '0000000000',
                        address: 'Tại quầy',
                        organizationId: inv.organizationId
                    }).save();
                    validCustomerIds.add(guest._id.toString());
                }
                
                // Gán khách lẻ vào hóa đơn lỗi
                inv.customerId = guest._id;
                inv.customerName = guest.name;
                changed = true;
            }

            // 3. FIX NGÀY THÁNG (Chuyển về chuỗi YYYY-MM-DD)
            if (!inv.issueDate) {
                inv.issueDate = new Date().toISOString().split('T')[0];
                changed = true;
            } else if (typeof inv.issueDate !== 'string') {
                try {
                    inv.issueDate = new Date(inv.issueDate).toISOString().split('T')[0];
                    changed = true;
                } catch (e) {}
            }

            // 4. FIX TRẠNG THÁI & TIỀN
            if (inv.paidAmount === undefined || inv.paidAmount === null) {
                inv.paidAmount = 0;
                changed = true;
            }
            
            // Tính lại trạng thái
            const debt = (inv.totalAmount || 0) - (inv.paidAmount || 0);
            if (debt <= 0 && inv.status !== 'Đã thanh toán') {
                inv.status = 'Đã thanh toán';
                changed = true;
            } else if (debt > 0) {
                 if (inv.paidAmount > 0 && inv.status !== 'Thanh toán một phần') {
                     inv.status = 'Thanh toán một phần';
                     changed = true;
                 } else if (inv.paidAmount === 0 && inv.status !== 'Chưa thanh toán') {
                     inv.status = 'Chưa thanh toán';
                     changed = true;
                 }
            }

            // LƯU LẠI
            if (changed) {
                await inv.save();
                count++;
            }
        }
        res.json({ message: `✅ Đã sửa lỗi thành công ${count} hóa đơn! (Đã fix items null & gán Khách lẻ)` });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

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
apiRouter.post('/invoices', async (req, res) => {
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
            issueDate: new Date().toLocaleDateString('en-CA'), // Kết quả: "2025-12-23"
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
        const { reason } = req.body; // <--- LẤY LÝ DO TỪ CLIENT
        const invoice = await Invoice.findOne({ _id: req.params.id, organizationId }).session(session);
        if (!invoice) throw new Error('Không tìm thấy hóa đơn');

        // Nhập lại kho
        for (const item of invoice.items) {
             await changeStock({
                 session, organizationId, productId: item.productId, quantityChange: item.quantity,
                 type: 'Nhập hàng trả', referenceNumber: invoice.invoiceNumber, 
                 note: reason || 'Khách trả lại hàng' // <--- GHI LÝ DO VÀO THẺ KHO
             });
        }

        // Trừ nợ khách
        if (invoice.customerId && invoice.status === 'Còn nợ') {
             const debtToReduce = invoice.totalAmount - invoice.paidAmount;
             await Customer.findByIdAndUpdate(invoice.customerId, { $inc: { debt: -debtToReduce } }).session(session);
        }

        // Hoàn tiền (Nếu có)
        if (invoice.paidAmount > 0) {
            const transactionNumber = await getNextSequence(CashFlowTransaction, 'PC', organizationId);
            await new CashFlowTransaction({
                transactionNumber, type: 'chi', date: new Date(), amount: invoice.paidAmount,
                payerReceiverName: invoice.customerName, 
                description: `Hoàn tiền trả hàng ${invoice.invoiceNumber} (${reason || 'Lý do khác'})`, // <--- GHI LÝ DO VÀO PHIẾU CHI
                category: 'Khác', organizationId
            }).save({ session });
        }

        invoice.status = 'Hủy';
        // Có thể lưu thêm reason vào invoice nếu Model Invoice của bạn có trường note/cancelReason
        if (reason) invoice.note = (invoice.note ? invoice.note + '. ' : '') + `Lý do trả: ${reason}`;
        
        await invoice.save({ session });

        await session.commitTransaction();
        res.json({ message: 'Đã xử lý trả hàng thành công' });
    } catch (err) { await session.abortTransaction(); res.status(500).json({ message: err.message }); }
    finally { session.endSession(); }
});

// API RIÊNG CHO HÓA ĐƠN (Thay thế cho generic CRUD)
// 1. Lấy danh sách hóa đơn (Tích hợp Tìm kiếm + Phân trang + Lọc ngày)
apiRouter.get('/invoices', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status || 'all';
        const search = req.query.search || '';
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        const organizationId = req.organizationId;

        // Tạo bộ lọc cơ bản
        let query = { organizationId };

        // A. Xử lý Tìm kiếm (Mã HĐ hoặc Tên khách)
        if (search) {
            query.$or = [
                { invoiceNumber: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } }
            ];
        }

        // B. Xử lý Lọc theo trạng thái (Nợ/Đã trả)
        if (status === 'debt') {
            query.$expr = { $gt: ["$totalAmount", "$paidAmount"] };
        } else if (status === 'paid') {
            query.$expr = { $lte: ["$totalAmount", "$paidAmount"] };
        }

        // C. Xử lý Lọc ngày (Logic chuẩn đầu ngày - cuối ngày)
        if (startDate && endDate) {
            // Vì trong DB lưu là chuỗi "YYYY-MM-DD" nên ta so sánh chuỗi luôn
            // Không được new Date() ở đây nữa
            query.issueDate = {
                $gte: startDate, // Ví dụ: "2025-12-01"
                $lte: endDate    // Ví dụ: "2025-12-31"
            };
        }

        // D. Thực hiện truy vấn (Chỉ khai báo 'total' 1 lần ở đây)
        const total = await Invoice.countDocuments(query);
        const invoices = await Invoice.find(query)
            .sort({ createdAt: -1 }) // Mới nhất lên đầu
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            data: invoices,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// [MỚI] API Lấy lịch sử thanh toán của 1 hóa đơn
apiRouter.get('/invoices/:invoiceNumber/history', async (req, res) => {
    try {
        const { invoiceNumber } = req.params;
        // Tìm các phiếu thu/chi có nội dung chứa số hóa đơn (Ví dụ: "Thu nợ HD-00099")
        const history = await CashFlowTransaction.find({
            organizationId: req.organizationId,
            description: { $regex: invoiceNumber, $options: 'i' } 
        }).sort({ createdAt: -1 }); // Mới nhất lên đầu
        
        res.json(history);
    } catch (e) { 
        res.status(500).json({ message: e.message }); 
    }
});

// 2. Lấy chi tiết 1 hóa đơn
apiRouter.get('/invoices/:id', async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ _id: req.params.id, organizationId: req.organizationId });
        if (!invoice) return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
        res.json(invoice);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// 3. Tạo hóa đơn mới (Thường dùng cho form sửa/tạo thủ công)
apiRouter.post('/invoices', async (req, res) => {
    try {
        const { organizationId } = req;
        // Nếu không gửi mã HĐ thì tự sinh
        let invoiceNumber = req.body.invoiceNumber;
        if (!invoiceNumber) {
            invoiceNumber = await getNextSequence(Invoice, 'HD', organizationId);
        }

        const newInvoice = new Invoice({ 
            ...req.body, 
            invoiceNumber,
            organizationId 
        });
        await newInvoice.save();
        res.status(201).json(newInvoice);
    } catch (e) { 
        res.status(500).json({ message: e.message }); 
    }
});

// 4. Cập nhật hóa đơn (Sửa thông tin)
apiRouter.put('/invoices/:id', async (req, res) => {
    try {
        const updatedInvoice = await Invoice.findOneAndUpdate(
            { _id: req.params.id, organizationId: req.organizationId }, 
            req.body, 
            { new: true }
        );
        if (!updatedInvoice) return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
        res.json(updatedInvoice);
    } catch (e) { 
        res.status(500).json({ message: e.message }); 
    }
});

// [MỚI] API THANH TOÁN CÔNG NỢ HÓA ĐƠN
apiRouter.post('/invoices/:id/payment', async (req, res) => {
    const { organizationId } = req;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { amount } = req.body; // Số tiền khách trả
        
        // 1. Tìm hóa đơn
        const invoice = await Invoice.findOne({ _id: req.params.id, organizationId }).session(session);
        if (!invoice) throw new Error('Hóa đơn không tồn tại');

        // --- SỬA LỖI Ở ĐÂY: Tính toán trước rồi mới kiểm tra ---
        const currentDebt = invoice.totalAmount - (invoice.paidAmount || 0);
        const payAmount = parseInt(amount);

        // Kiểm tra nếu trả quá số nợ
        if (payAmount > currentDebt) {
            throw new Error(`Khách chỉ còn nợ ${currentDebt.toLocaleString()}đ. Bạn đang thu ${payAmount.toLocaleString()}đ!`);
        }
        // -----------------------------------------------------

        // 2. Cập nhật số tiền đã trả và trạng thái
        invoice.paidAmount = (invoice.paidAmount || 0) + payAmount;
        
        // Logic trạng thái
        const total = invoice.totalAmount || 0;
        if (invoice.paidAmount >= total) {
            invoice.status = 'Đã thanh toán'; 
        } else {
            invoice.status = 'Thanh toán một phần';
        }
        await invoice.save({ session });

        // 3. Trừ nợ khách hàng (nếu có khách)
        if (invoice.customerId) {
            await Customer.findByIdAndUpdate(invoice.customerId, { $inc: { debt: -payAmount } }).session(session);
        }

        // 4. Tạo Phiếu Thu (CashFlow)
        const transactionNumber = await getNextSequence(CashFlowTransaction, 'PT', organizationId);
        await new CashFlowTransaction({
            transactionNumber,
            type: 'thu',
            date: new Date(),
            amount: payAmount,
            payerReceiverName: invoice.customerName,
            description: `Thu nợ hóa đơn ${invoice.invoiceNumber}`,
            
            // SỬA LỖI: Đổi thành 'Khác' hoặc 'Doanh thu bán hàng' để tránh lỗi validation
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
});

// 3. Xóa hóa đơn (Logic hủy đơn & trả hàng)
apiRouter.delete('/invoices/:id', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const invoice = await Invoice.findOne({ _id: req.params.id, organizationId: req.organizationId }).session(session);
        if (!invoice) throw new Error('Hóa đơn không tồn tại');

        // A. Trả hàng về kho
        for (const item of invoice.items) {
             const product = await Product.findOne({ _id: item.productId, organizationId: req.organizationId }).session(session);
             if (product) {
                 product.stock += item.quantity; // Cộng lại kho
                 await product.save({ session });
                 
                 // Ghi log trả hàng
                 await new StockHistory({
                     organizationId: req.organizationId, productId: product._id, productName: product.name, sku: product.sku,
                     changeAmount: item.quantity, balanceAfter: product.stock,
                     type: 'Hủy hóa đơn', referenceNumber: invoice.invoiceNumber, note: 'Hủy đơn bán hàng', date: new Date()
                 }).save({ session });
             }
        }

        // B. Trừ bớt nợ khách hàng (nếu họ mua nợ)
        const debtAmount = invoice.totalAmount - invoice.paidAmount;
        if (invoice.customerId && debtAmount > 0) {
            await Customer.findByIdAndUpdate(invoice.customerId, { $inc: { debt: -debtAmount } }).session(session);
        }

        // C. Xóa Invoice
        await Invoice.deleteOne({ _id: invoice._id }).session(session);
        
        await session.commitTransaction();
        res.json({ message: 'Đã hủy hóa đơn thành công' });
    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({ message: err.message });
    } finally {
        session.endSession();
    }
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
// Chuyển Đơn hàng thành Hóa đơn (Kèm xuất kho & tạo phiếu thu nếu có)
apiRouter.post('/orders/:id/to-invoice', async (req, res) => {
    const { organizationId } = req;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await Order.findOne({ _id: req.params.id, organizationId }).session(session);
        if (!order || order.status === 'Hoàn thành') throw new Error('Đơn lỗi hoặc đã hoàn thành');

        const { paymentAmount } = req.body;

        // 1. Trừ kho
        for (const item of order.items) {
            await changeStock({
                session, organizationId, productId: item.productId, quantityChange: -item.quantity,
                type: 'Xuất hàng', referenceNumber: order.orderNumber, note: `Xuất kho đơn ${order.orderNumber}`
            });
        }

        // 2. [SỬA LỖI QUAN TRỌNG] Chuẩn hóa danh sách hàng hóa
        // Lỗi cũ: Thiếu costPrice (giá vốn) dẫn đến validation failed
        // Fix: Dùng Promise.all để map dữ liệu và bổ sung costPrice
        const invoiceItems = await Promise.all(order.items.map(async (item) => {
            const itemObj = item.toObject ? item.toObject() : item;
            
            // Logic: Nếu item trong đơn không có giá vốn, thử tìm trong bảng Product gốc
            let finalCostPrice = itemObj.costPrice;
            
            // Nếu không có hoặc bằng 0, tìm lại trong kho để lấy giá vốn hiện tại (nếu cần chính xác)
            if (finalCostPrice === undefined || finalCostPrice === null) {
                const product = await Product.findOne({ _id: item.productId, organizationId }).session(session);
                finalCostPrice = product ? (product.costPrice || 0) : 0;
            }

            return {
                ...itemObj,
                vat: (itemObj.vat !== undefined) ? itemObj.vat : 0, // Fix lỗi thiếu VAT
                costPrice: finalCostPrice // Fix lỗi thiếu costPrice
            };
        }));

        // 3. Logic tính trạng thái
        let status = 'Chưa thanh toán';
        const paid = paymentAmount || 0;
        const total = order.totalAmount;

        if (paid >= total) {
            status = 'Đã thanh toán';
        } else if (paid > 0) {
            status = 'Thanh toán một phần';
        }

        const invoiceNumber = await getNextSequence(Invoice, 'HD', organizationId);
        
        const newInvoice = new Invoice({
            invoiceNumber, 
            customerId: order.customerId, 
            customerName: order.customerName,
            issueDate: new Date().toLocaleDateString('en-CA'), 
            items: invoiceItems, // Đã có đủ costPrice
            totalAmount: total, 
            paidAmount: paid,
            status: status, 
            note: `Xuất từ đơn hàng ${order.orderNumber}`, 
            organizationId
        });
        await newInvoice.save({ session });

        // 4. Cộng nợ khách hàng
        const debtToAdd = total - paid;
        if (debtToAdd > 0) {
            await Customer.findByIdAndUpdate(order.customerId, { $inc: { debt: debtToAdd } }).session(session);
        }

        // 5. Tạo phiếu thu (nếu có trả trước)
        if (paid > 0) {
            const transactionNumber = await getNextSequence(CashFlowTransaction, 'PT', organizationId);
            await new CashFlowTransaction({
                transactionNumber, type: 'thu', date: new Date(), amount: paid,
                description: `Thanh toán hóa đơn ${invoiceNumber}`,
                payerReceiverName: order.customerName, 
                category: 'Khác', // Fix lỗi category
                organizationId
            }).save({ session });
        }
        
        order.status = 'Hoàn thành';
        await order.save({ session });

        await session.commitTransaction();
        res.status(201).json(newInvoice);
    } catch (err) { 
        await session.abortTransaction(); 
        console.error(err); // Log lỗi ra console server để dễ debug
        res.status(400).json({ message: err.message }); 
    }
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

// [FIX] API Xóa danh mục (Kiểm tra ràng buộc sản phẩm trước khi xóa)
// Đặt đoạn này TRƯỚC dòng createTenantCrudEndpoints(Category...) để nó được ưu tiên chạy trước
apiRouter.delete('/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { organizationId } = req;

        // BƯỚC 1: Tìm danh mục để lấy cái Tên (VD: "Sách")
        const categoryDoc = await Category.findOne({ _id: id, organizationId });
        
        if (!categoryDoc) {
            return res.status(404).json({ message: 'Không tìm thấy danh mục cần xóa' });
        }

        // BƯỚC 2: Đếm số lượng sản phẩm đang dùng tên danh mục này
        const productCount = await Product.countDocuments({ 
            organizationId,
            category: categoryDoc.name 
        });
        
        if (productCount > 0) {
            // Trả về thông báo lỗi kèm số lượng cụ thể
            return res.status(400).json({ 
                message: `Không thể xóa! Danh mục "${categoryDoc.name}" đang chứa ${productCount} sản phẩm. ` 
            });
        }

        // BƯỚC 3: Nếu số lượng = 0, tiến hành xóa
        await Category.deleteOne({ _id: id });

        res.json({ message: 'Đã xóa danh mục thành công' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
createTenantCrudEndpoints(Category, 'categories');

createTenantCrudEndpoints(Customer, 'customers');
createTenantCrudEndpoints(Supplier, 'suppliers');
createTenantCrudEndpoints(Quote, 'quotes');
createTenantCrudEndpoints(Order, 'orders');
createTenantCrudEndpoints(Delivery, 'deliveries');
createTenantCrudEndpoints(CashFlowTransaction, 'cashflow-transactions');
createTenantCrudEndpoints(InventoryCheck, 'inventory-checks');

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