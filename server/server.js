const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Đảm bảo đã cài: npm install bcryptjs
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

const mongoose = require('mongoose'); // Cần import thêm để dùng mongoose.startSession()

// --- APP SETUP ---
const app = express();
const port = process.env.PORT || 5001;

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// --- PASSPORT (GOOGLE OAUTH) CONFIG ---
app.use(passport.initialize());
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
            return done(null, user);
        } else {
            // User mới -> Tạo Organization + User Owner
            const newOrg = new Organization({
                name: `Cửa hàng của ${profile.displayName}`
            });
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
        }
    } catch (err) {
        return done(err, null);
    }
  }
));

// --- HELPER FUNCTIONS ---
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret_key', {
        expiresIn: '30d',
    });
};

const getNextSequence = async (model, prefix, organizationId) => {
    const sequenceField = {
        'HD': 'invoiceNumber', 
        'PT': 'transactionNumber', 
        'PC': 'transactionNumber',
        'PN': 'purchaseNumber', 
        'BG': 'quoteNumber', 
        'DH': 'orderNumber',
        'PGH': 'deliveryNumber', 
        'PKK': 'checkNumber',
        'SP': 'sku'
    }[prefix];

    if (!sequenceField) throw new Error(`Invalid prefix: ${prefix}`);
    
    const lastDoc = await model.findOne({ 
        organizationId, 
        [sequenceField]: new RegExp('^' + prefix) 
    }).sort({ [sequenceField]: -1 });
    
    if (!lastDoc || !lastDoc[sequenceField] || !lastDoc[sequenceField].startsWith(prefix)) {
      return `${prefix}-00001`;
    }

    const lastNumStr = lastDoc[sequenceField].split('-')[1];
    const lastNum = parseInt(lastNumStr, 10);
    return `${prefix}-${(lastNum + 1).toString().padStart(5, '0')}`;
};

// =================================================================
// --- 1. PUBLIC AUTH ROUTER (Không cần Token) ---
// =================================================================
const authRouter = express.Router();

// 1.1. Login với Email/Password (Đã sửa: Đưa lên Public Router)
authRouter.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Tìm user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Email không tồn tại' });
        }

        // Kiểm tra mật khẩu (Nếu user có pass)
        if (!user.password) {
             return res.status(400).json({ message: 'Tài khoản này đăng nhập bằng Google.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu sai' });
        }

        // Tạo Token
        const token = generateToken(user.id);

        res.json({ 
            token, 
            user: { 
                id: user._id, 
                email: user.email, 
                role: user.role, 
                organizationId: user.organizationId 
            } 
        });
    } catch (err) {
        console.error("Lỗi đăng nhập:", err);
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// 1.2. Google OAuth
authRouter.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

authRouter.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    const token = generateToken(req.user.id);
    // Redirect về Frontend kèm token
    res.redirect(`http://localhost:3000?token=${token}`);
  }
);

app.use('/api/auth', authRouter);


// =================================================================
// --- 2. PROTECTION MIDDLEWARE ---
// =================================================================
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Gán ID Tổ chức vào request để dùng chung
            req.organizationId = req.user.organizationId.toString(); 
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'owner')) {
        next();
    } else {
        res.status(403).json({ message: 'Không có quyền truy cập.' });
    }
};

// =================================================================
// --- 3. PROTECTED API ROUTER ---
// =================================================================
const apiRouter = express.Router();
apiRouter.use(protect); // Tất cả API dưới đây đều yêu cầu Token

// --- AUTH PROTECTED ROUTES ---

// Lấy thông tin User hiện tại (Frontend gọi cái này sau khi login)
apiRouter.get('/auth/me', async (req, res) => {
    try {
        // req.user đã có sẵn do middleware protect gán
        res.json(req.user);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Đổi mật khẩu
apiRouter.put('/auth/profile', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user.password) return res.status(400).json({ message: 'Tài khoản Google không thể đổi mật khẩu.' });

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });

        user.password = newPassword; 
        await user.save(); // Model sẽ tự hash lại password

        res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});

// --- DATA ROUTES ---

// Lấy toàn bộ dữ liệu (cho lần tải đầu tiên - cân nhắc bỏ nếu dùng React Query từng phần)
apiRouter.get('/all-data', async (req, res) => {
    try {
        const { organizationId } = req;
        const promises = [
            Product.find({ organizationId }), 
            Category.find({ organizationId }), 
            Customer.find({ organizationId }), 
            Supplier.find({ organizationId }),
            Quote.find({ organizationId }), 
            Order.find({ organizationId }), 
            Invoice.find({ organizationId }), 
            Purchase.find({ organizationId }),
            Delivery.find({ organizationId }), 
            InventoryCheck.find({ organizationId }), 
            CashFlowTransaction.find({ organizationId })
        ];
        if (req.user.role === 'admin' || req.user.role === 'owner') {
            promises.push(User.find({ organizationId }).select('-password'));
        }

        const results = await Promise.all(promises);

        const data = {
            products: results[0], categories: results[1], customers: results[2], suppliers: results[3],
            quotes: results[4], orders: results[5], invoices: results[6], purchases: results[7],
            deliveries: results[8], inventoryChecks: results[9], cashFlowTransactions: results[10],
            users: (req.user.role === 'admin' || req.user.role === 'owner') ? results[11] : undefined
        };
        
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- USER MANAGEMENT ---
apiRouter.get('/users', admin, async (req, res) => {
    const users = await User.find({ organizationId: req.organizationId }).select('-password');
    res.json(users);
});

apiRouter.post('/users', admin, async (req, res) => {
    const { email, password, role } = req.body;
    if (req.user.role === 'admin' && role === 'admin') return res.status(403).json({ message: 'Admin không thể tạo Admin khác.' });
    if (role === 'owner') return res.status(403).json({ message: 'Không thể tạo Owner.' });
    
    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'Email đã tồn tại.' });

        const user = await User.create({ 
            email, password, role, organizationId: req.organizationId 
        });
        res.status(201).json(user);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

apiRouter.put('/users/:id', admin, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, organizationId: req.organizationId });
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        if (user.role === 'owner') return res.status(403).json({ message: 'Không thể sửa Owner' });
        
        user.email = req.body.email || user.email;
        user.role = req.body.role || user.role;
        if (req.body.password) user.password = req.body.password;
        
        await user.save();
        res.json(user);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

apiRouter.delete('/users/:id', admin, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, organizationId: req.organizationId });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.role === 'owner') return res.status(403).json({ message: 'Không thể xóa Owner' });
        
        await user.deleteOne();
        res.status(204).send();
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- CRUD GENERATOR (CHO CÁC MODEL CƠ BẢN) ---
const createTenantCrudEndpoints = (model, modelName) => {
    // GET List (with Pagination)
    apiRouter.get(`/${modelName}`, async (req, res) => {
        const { organizationId } = req;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 1000; // Default lấy nhiều nếu không phân trang
        const skip = (page - 1) * limit;

        try {
            const data = await model.find({ organizationId }).sort({ createdAt: -1 }).skip(skip).limit(limit);
            const total = await model.countDocuments({ organizationId });
            res.json({ data, total, page, totalPages: Math.ceil(total / limit) });
        } catch (err) { res.status(500).json({ message: err.message }); }
    });

    // POST Create
    apiRouter.post(`/${modelName}`, async (req, res) => {
        try {
            const doc = await new model({ ...req.body, organizationId: req.organizationId }).save();
            res.status(201).json(doc);
        } catch (err) { res.status(500).json({ message: err.message }); }
    });

    // PUT Update
    apiRouter.put(`/${modelName}/:id`, async (req, res) => {
        try {
            const doc = await model.findOneAndUpdate({ _id: req.params.id, organizationId: req.organizationId }, req.body, { new: true });
            if (!doc) return res.status(404).json({ message: 'Not found' });
            res.json(doc);
        } catch (err) { res.status(500).json({ message: err.message }); }
    });

    // DELETE
    apiRouter.delete(`/${modelName}/:id`, async (req, res) => {
        try {
            const doc = await model.findOneAndDelete({ _id: req.params.id, organizationId: req.organizationId });
            if (!doc) return res.status(404).json({ message: 'Not found' });
            res.status(204).send();
        } catch (err) { res.status(500).json({ message: err.message }); }
    });
};

// --- QUOTES (BÁO GIÁ) - ĐÃ SỬA ---

// 1. GET: Lấy danh sách (Giữ nguyên logic phân trang)
apiRouter.get('/quotes', async (req, res) => {
    const { organizationId } = req;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const skip = (page - 1) * limit;

    try {
        const data = await Quote.find({ organizationId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await Quote.countDocuments({ organizationId });
        
        res.json({ data, total, page, totalPages: Math.ceil(total / limit) });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// 2. POST: Tạo mới (QUAN TRỌNG: Thêm logic sinh mã BG-xxxxx)
apiRouter.post('/quotes', async (req, res) => {
    try {
        const { organizationId } = req;
        
        // --- ĐOẠN MỚI THÊM: Sinh mã tự động ---
        const quoteNumber = await getNextSequence(Quote, 'BG', organizationId);
        // ---------------------------------------

        const newQuote = new Quote({ 
            ...req.body, 
            quoteNumber: quoteNumber, // Gắn mã vừa sinh vào
            organizationId 
        });
        
        await newQuote.save();
        res.status(201).json(newQuote);
    } catch (err) { 
        console.error("Lỗi tạo báo giá:", err);
        res.status(500).json({ message: err.message }); 
    }
});

// 3. PUT & DELETE (Giữ nguyên logic chuẩn)
apiRouter.put('/quotes/:id', async (req, res) => {
    try {
        const doc = await Quote.findOneAndUpdate(
            { _id: req.params.id, organizationId: req.organizationId }, 
            req.body, 
            { new: true }
        );
        res.json(doc);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

apiRouter.delete('/quotes/:id', async (req, res) => {
    try {
        await Quote.findOneAndDelete({ _id: req.params.id, organizationId: req.organizationId });
        res.status(204).send();
    } catch (err) { res.status(500).json({ message: err.message }); }
});

createTenantCrudEndpoints(Order, 'orders');

// --- PRODUCTS (CUSTOM SEARCH) ---
// --- PRODUCTS (CUSTOM API) ---

// 1. GET: Lấy danh sách (Tìm kiếm + Lọc danh mục)
// --- PRODUCTS (CUSTOM FULL CRUD) ---

// 1. GET: Lấy danh sách (Có tìm kiếm & Lọc danh mục)
apiRouter.get('/products', async (req, res) => {
    const { organizationId } = req;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const skip = (page - 1) * limit;

    try {
        const query = { 
            organizationId,
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } }
            ]
        };
        // Logic lọc danh mục
        if (category && category !== 'all') {
            query.category = category;
        }

        const products = await Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
        const total = await Product.countDocuments(query);

        res.json({
            data: products,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// 2. POST: Thêm sản phẩm (Validate kỹ)
apiRouter.post('/products', async (req, res) => {
    try {
        if (!req.body.name) return res.status(400).json({ message: 'Tên sản phẩm là bắt buộc' });

        let sku = req.body.sku;
        // Nếu không nhập SKU -> Tự sinh mã SP-00001
        if (!sku) {
            sku = await getNextSequence(Product, 'SP', req.organizationId);
        }

        const newProduct = new Product({
            ...req.body,
            sku: sku, // Gán SKU tự sinh vào
            organizationId: req.organizationId
        });
        
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi thêm sản phẩm: ' + err.message });
    }
});

// 3. PUT: Cập nhật
apiRouter.put('/products/:id', async (req, res) => {
    try {
        const updated = await Product.findOneAndUpdate({ _id: req.params.id, organizationId: req.organizationId }, req.body, { new: true });
        res.json(updated);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// 4. DELETE: Xóa
apiRouter.delete('/products/:id', async (req, res) => {
    try {
        await Product.findOneAndDelete({ _id: req.params.id, organizationId: req.organizationId });
        res.status(204).send();
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// LƯU Ý: ĐÃ XÓA DÒNG createTenantCrudEndpoints(Product...) ĐỂ TRÁNH XUNG ĐỘT

// --- INVOICES (CUSTOM LOGIC) ---
createTenantCrudEndpoints(Invoice, 'invoices'); // GET/POST chuẩn

// Sửa hóa đơn (Transaction Revert & Apply)
apiRouter.put('/invoices/:id', async (req, res) => {
    const { organizationId } = req;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const oldInvoice = await Invoice.findOne({ _id: req.params.id, organizationId }).session(session);
        if (!oldInvoice) throw new Error('Không tìm thấy hóa đơn.');
        if (oldInvoice.status === 'Đã thanh toán') throw new Error('Không thể sửa hóa đơn đã thanh toán hết.');

        // Revert cũ
        for (const item of oldInvoice.items) {
            await Product.findOneAndUpdate({ _id: item.productId, organizationId }, { $inc: { stock: item.quantity } }).session(session);
        }
        const oldDebt = oldInvoice.totalAmount - oldInvoice.paidAmount;
        if (oldDebt > 0) await Customer.findOneAndUpdate({ _id: oldInvoice.customerId, organizationId }, { $inc: { debt: -oldDebt } }).session(session);

        // Apply mới
        const { items, totalAmount, customerId, customerName } = req.body;
        for (const item of items) {
             const product = await Product.findOne({ _id: item.productId, organizationId }).session(session);
             if (product.stock < item.quantity) throw new Error(`Sản phẩm ${item.name} không đủ hàng.`);
             await Product.findOneAndUpdate({ _id: item.productId, organizationId }, { $inc: { stock: -item.quantity } }).session(session);
        }
        
        // Tính nợ mới (giữ nguyên paidAmount cũ)
        const newDebt = totalAmount - oldInvoice.paidAmount;
        if (newDebt > 0) await Customer.findOneAndUpdate({ _id: customerId, organizationId }, { $inc: { debt: newDebt } }).session(session);
        else if (newDebt < 0) throw new Error('Tổng tiền mới nhỏ hơn số tiền đã trả.');

        const updatedInvoice = await Invoice.findOneAndUpdate(
            { _id: req.params.id, organizationId },
            { 
                items, totalAmount, customerId, customerName,
                status: oldInvoice.paidAmount >= totalAmount ? 'Đã thanh toán' : 'Thanh toán một phần'
            },
            { new: true, session }
        );

        await session.commitTransaction();
        res.json(updatedInvoice);
    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({ message: err.message });
    } finally {
        session.endSession();
    }
});

apiRouter.delete('/invoices/:id', async (req, res) => {
    const { organizationId } = req;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const invoice = await Invoice.findOne({ _id: req.params.id, organizationId }).session(session);
        if (!invoice) throw new Error('Invoice not found');

        // Hoàn trả kho
        for (const item of invoice.items) {
            await Product.findOneAndUpdate({ _id: item.productId, organizationId }, { $inc: { stock: item.quantity } }).session(session);
        }
        // Hoàn trả nợ
        const debtToRevert = invoice.totalAmount - invoice.paidAmount;
        if (debtToRevert > 0) {
            await Customer.findOneAndUpdate({ _id: invoice.customerId, organizationId }, { $inc: { debt: -debtToRevert } }).session(session);
        }
        
        await invoice.deleteOne({ session });
        await session.commitTransaction();
        res.status(204).send();
    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({ message: err.message });
    } finally {
        session.endSession();
    }
});

// --- CUSTOMERS ---
createTenantCrudEndpoints(Customer, 'customers');
apiRouter.delete('/customers/:id', async (req, res) => {
    const { organizationId } = req;
    try {
        const customer = await Customer.findOne({ _id: req.params.id, organizationId });
        if (!customer) return res.status(404).json({ message: 'Not found' });
        
        if (customer.debt !== 0) return res.status(400).json({ message: 'Không thể xóa khách hàng đang có dư nợ.' });
        const hasInvoices = await Invoice.exists({ customerId: req.params.id, organizationId });
        if (hasInvoices) return res.status(400).json({ message: 'Không thể xóa khách hàng đã có lịch sử mua hàng.' });

        await customer.deleteOne();
        res.status(204).send();
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- SALES (POS) ---
apiRouter.post('/sales', async (req, res) => {
    const { organizationId } = req;
    // Sử dụng Session để đảm bảo an toàn dữ liệu (giống như bạn đã làm ở phần DELETE)
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { customerId, items, totalAmount, paymentAmount } = req.body;
        
        const customer = await Customer.findOne({ _id: customerId, organizationId }).session(session);
        if (!customer) throw new Error('Khách hàng không tồn tại');
        
        // --- BƯỚC 1: KIỂM TRA & TRỪ KHO ---
        for (const item of items) {
             const product = await Product.findOne({ _id: item.productId, organizationId }).session(session);
             
             if (!product) throw new Error(`Sản phẩm ${item.productName || item.productId} không tồn tại.`);
             
             // LOGIC MỚI: Kiểm tra số lượng tồn
             if (product.stock < item.quantity) {
                 throw new Error(`Sản phẩm "${product.name}" không đủ hàng! Tồn: ${product.stock}, Mua: ${item.quantity}`);
             }

             // Nếu đủ hàng thì trừ
             product.stock -= item.quantity;
             await product.save({ session });
        }
        
        // --- BƯỚC 2: TẠO HÓA ĐƠN ---
        const invoiceNumber = await getNextSequence(Invoice, 'HD', organizationId);
        const status = paymentAmount >= totalAmount ? 'Đã thanh toán' : (paymentAmount > 0 ? 'Thanh toán một phần' : 'Chưa thanh toán');
        
        const newInvoice = new Invoice({
            invoiceNumber, 
            customerId, 
            customerName: customer.name,
            issueDate: new Date().toISOString().split('T')[0],
            items, 
            totalAmount, 
            paidAmount: paymentAmount, 
            status, 
            organizationId
        });
        await newInvoice.save({ session });

        // --- BƯỚC 3: CẬP NHẬT CÔNG NỢ & PHIẾU THU ---
        const debtToAdd = totalAmount - paymentAmount;
        if (debtToAdd > 0) {
            await Customer.findByIdAndUpdate(customerId, { $inc: { debt: debtToAdd } }).session(session);
        }

        let savedVoucher = null;
        if (paymentAmount > 0) {
            const transactionNumber = await getNextSequence(CashFlowTransaction, 'PT', organizationId);
            savedVoucher = new CashFlowTransaction({
                transactionNumber, type: 'thu',
                date: new Date().toISOString().split('T')[0],
                amount: paymentAmount,
                description: `Thanh toán cho hóa đơn ${invoiceNumber}`,
                payerReceiverName: customer.name, category: 'Thu nợ KH', organizationId
            });
            await savedVoucher.save({ session });
        }
        
        await session.commitTransaction();
        res.status(201).json({ 
            savedInvoice: newInvoice, 
            voucherId: savedVoucher ? savedVoucher.id : null 
        });

    } catch (err) { 
        await session.abortTransaction();
        res.status(400).json({ message: err.message }); // Trả về 400 để Frontend hiển thị thông báo lỗi
    } finally {
        session.endSession();
    }
});

// --- PAYMENTS ---
apiRouter.post('/invoices/:id/payment', async (req, res) => {
    const { organizationId } = req;
    try {
        const { amount, updateDebt } = req.body;
        const invoice = await Invoice.findOne({ _id: req.params.id, organizationId });
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        invoice.paidAmount += amount;
        if (invoice.paidAmount >= invoice.totalAmount) invoice.status = 'Đã thanh toán';
        else invoice.status = 'Thanh toán một phần';
        await invoice.save();

        if (updateDebt) {
            await Customer.findOneAndUpdate({ _id: invoice.customerId, organizationId }, { $inc: { debt: -amount } });
        }
        
        // Tạo phiếu thu
        const transactionNumber = await getNextSequence(CashFlowTransaction, 'PT', organizationId);
        const newVoucher = await new CashFlowTransaction({
            transactionNumber, type: 'thu',
            date: new Date().toISOString().split('T')[0], amount,
            description: `Thanh toán bổ sung HĐ ${invoice.invoiceNumber}`,
            payerReceiverName: invoice.customerName, category: 'Thu nợ KH', organizationId
        }).save();

        res.status(201).json({ newVoucher });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- CATEGORIES ---
apiRouter.put('/categories/:id', async (req, res) => {
    try {
        // Logic cập nhật tên danh mục trong cả bảng Product
        const oldCat = await Category.findOne({ _id: req.params.id, organizationId: req.organizationId });
        if (oldCat && oldCat.name !== req.body.name) {
             await Product.updateMany({ category: oldCat.name, organizationId: req.organizationId }, { category: req.body.name });
        }
        const newCat = await Category.findOneAndUpdate({ _id: req.params.id, organizationId: req.organizationId }, req.body, { new: true });
        res.json(newCat);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

apiRouter.delete('/categories/:id', async (req, res) => {
     try {
        const cat = await Category.findOne({ _id: req.params.id, organizationId: req.organizationId });
        if (!cat) return res.status(404).json({ message: 'Not found' });
        
        // KIỂM TRA: Có sản phẩm thì không cho xóa
        const count = await Product.countDocuments({ category: cat.name, organizationId: req.organizationId });
        if (count > 0) return res.status(400).json({ message: `Không thể xóa! Đang có ${count} sản phẩm thuộc danh mục này.` });

        await cat.deleteOne();
        res.status(204).send();
     } catch (err) { res.status(500).json({ message: err.message }); }
});

// Đưa dòng này xuống CUỐI CÙNG
createTenantCrudEndpoints(Category, 'categories');

// --- PURCHASES (NHẬP HÀNG) ---
// GET: Vẫn dùng logic lấy danh sách cơ bản
apiRouter.get('/purchases', async (req, res) => {
    const { organizationId } = req;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        const data = await Purchase.find({ organizationId }).sort({ createdAt: -1 }).skip(skip).limit(limit);
        const total = await Purchase.countDocuments({ organizationId });
        res.json({ data, total, page, totalPages: Math.ceil(total / limit) });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST: Tạo phiếu nhập + Cộng kho + Tính nợ NCC
apiRouter.post('/purchases', async (req, res) => {
    const { organizationId } = req;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { supplierId, items, totalAmount, paidAmount, discount, notes } = req.body;

        // 1. Kiểm tra Nhà cung cấp
        const supplier = await Supplier.findOne({ _id: supplierId, organizationId }).session(session);
        if (!supplier) throw new Error('Nhà cung cấp không tồn tại');

        // 2. CỘNG TỒN KHO
        for (const item of items) {
             // Tìm sản phẩm
             const product = await Product.findOne({ _id: item.productId, organizationId }).session(session);
             if (!product) throw new Error(`Sản phẩm ${item.productId} không tồn tại`);

             // Cộng số lượng nhập vào kho
             product.stock += item.quantity;
             
             // (Nâng cao: Có thể cập nhật lại giá vốn (Cost Price) trung bình tại đây nếu muốn)
             // product.costPrice = ((product.stock cũ * giá cũ) + (sl nhập * giá nhập)) / tổng sl...
             
             await product.save({ session });
        }

        // 3. TẠO PHIẾU NHẬP
        const purchaseNumber = await getNextSequence(Purchase, 'PN', organizationId);
        const status = paidAmount >= totalAmount ? 'Đã thanh toán' : (paidAmount > 0 ? 'Thanh toán một phần' : 'Chưa thanh toán');

        const newPurchase = new Purchase({
            purchaseNumber,
            supplierId,
            supplierName: supplier.name,
            purchaseDate: new Date().toISOString().split('T')[0],
            items,
            totalAmount,
            paidAmount,
            discount: discount || 0,
            status,
            notes,
            organizationId
        });
        await newPurchase.save({ session });

        // 4. CẬP NHẬT CÔNG NỢ NHÀ CUNG CẤP (Mình nợ người ta -> Tăng nợ)
        const debtToAdd = totalAmount - paidAmount;
        if (debtToAdd > 0) {
             // Lưu ý: Logic nợ NCC thường là số dương (Amount Payable)
             await Supplier.findByIdAndUpdate(supplierId, { $inc: { debt: debtToAdd } }).session(session);
        }

        // 5. TẠO PHIẾU CHI (Nếu có trả tiền ngay lúc nhập)
        let savedVoucher = null;
        if (paidAmount > 0) {
            const transactionNumber = await getNextSequence(CashFlowTransaction, 'PC', organizationId); // PC = Phiếu Chi
            savedVoucher = new CashFlowTransaction({
                transactionNumber, 
                type: 'chi', // Loại là Chi tiền
                date: new Date().toISOString().split('T')[0],
                amount: paidAmount,
                description: `Thanh toán nhập hàng phiếu ${purchaseNumber}`,
                payerReceiverName: supplier.name, 
                category: 'Trả NCC', 
                organizationId
            });
            await savedVoucher.save({ session });
        }

        await session.commitTransaction();
        res.status(201).json({ 
            newPurchase, 
            voucherId: savedVoucher ? savedVoucher.id : null 
        });

    } catch (err) {
        await session.abortTransaction();
        res.status(400).json({ message: err.message });
    } finally {
        session.endSession();
    }
});

// =================================================================
// --- WORKFLOW: CONVERSION (CHUYỂN ĐỔI CHỨNG TỪ) ---
// =================================================================

// 1. Chuyển Báo Giá -> Đơn Hàng (Quote -> Order)
apiRouter.post('/quotes/:id/to-order', async (req, res) => {
    const { organizationId } = req;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // A. Lấy Báo giá gốc
        const quote = await Quote.findOne({ _id: req.params.id, organizationId }).session(session);
        if (!quote) throw new Error('Không tìm thấy báo giá');
        if (quote.status === 'Đã chốt' || quote.status === 'Đã hủy') throw new Error('Báo giá này đã được xử lý rồi.');

        // B. Tạo Đơn hàng mới (Copy dữ liệu từ Báo giá)
        const orderNumber = await getNextSequence(Order, 'DH', organizationId);
        const newOrder = new Order({
            orderNumber,
            customerId: quote.customerId,
            customerName: quote.customerName,
            items: quote.items, // Copy y nguyên danh sách hàng
            totalAmount: quote.totalAmount,
            status: 'Mới', // Trạng thái đơn hàng mới
            note: `Được tạo từ báo giá ${quote.quoteNumber}`,
            organizationId
        });
        await newOrder.save({ session });

        // C. Cập nhật trạng thái Báo giá cũ -> Đã chốt
        quote.status = 'Đã chốt';
        await quote.save({ session });

        await session.commitTransaction();
        res.status(201).json(newOrder);

    } catch (err) {
        await session.abortTransaction();
        res.status(400).json({ message: err.message });
    } finally {
        session.endSession();
    }
});

// 2. Chuyển Đơn Hàng -> Hóa Đơn (Order -> Invoice)
// LƯU Ý: Bước này sẽ TRỪ KHO thật sự
apiRouter.post('/orders/:id/to-invoice', async (req, res) => {
    const { organizationId } = req;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // A. Lấy Đơn hàng gốc
        const order = await Order.findOne({ _id: req.params.id, organizationId }).session(session);
        if (!order) throw new Error('Không tìm thấy đơn hàng');
        if (order.status === 'Hoàn thành' || order.status === 'Đã hủy') throw new Error('Đơn hàng này đã hoàn thành hoặc bị hủy.');

        const { paymentAmount } = req.body; // Số tiền khách trả ngay lúc giao hàng

        // B. KIỂM TRA & TRỪ KHO (Giống logic bán hàng POS)
        for (const item of order.items) {
            const product = await Product.findOne({ _id: item.productId, organizationId }).session(session);
            if (!product) throw new Error(`Sản phẩm ${item.name} không tồn tại`);
            
            if (product.stock < item.quantity) {
                throw new Error(`Sản phẩm "${product.name}" không đủ hàng để xuất hóa đơn (Tồn: ${product.stock}, Cần: ${item.quantity})`);
            }
            
            // Trừ kho
            product.stock -= item.quantity;
            await product.save({ session });
        }

        // C. Tạo Hóa đơn (Invoice)
        const invoiceNumber = await getNextSequence(Invoice, 'HD', organizationId);
        const invoiceStatus = (paymentAmount || 0) >= order.totalAmount ? 'Đã thanh toán' : ((paymentAmount || 0) > 0 ? 'Thanh toán một phần' : 'Chưa thanh toán');
        
        const newInvoice = new Invoice({
            invoiceNumber,
            customerId: order.customerId,
            customerName: order.customerName,
            issueDate: new Date().toISOString().split('T')[0],
            items: order.items,
            totalAmount: order.totalAmount,
            paidAmount: paymentAmount || 0,
            status: invoiceStatus,
            note: `Xuất từ đơn hàng ${order.orderNumber}`,
            organizationId
        });
        await newInvoice.save({ session });

        // D. Cập nhật Công nợ & Tạo Phiếu thu (Nếu có trả tiền)
        const debtToAdd = order.totalAmount - (paymentAmount || 0);
        if (debtToAdd > 0) {
            await Customer.findByIdAndUpdate(order.customerId, { $inc: { debt: debtToAdd } }).session(session);
        }
        if ((paymentAmount || 0) > 0) {
            const transactionNumber = await getNextSequence(CashFlowTransaction, 'PT', organizationId);
            await new CashFlowTransaction({
                transactionNumber, type: 'thu',
                date: new Date().toISOString().split('T')[0],
                amount: paymentAmount,
                description: `Thanh toán cho hóa đơn ${invoiceNumber}`,
                payerReceiverName: order.customerName, category: 'Thu nợ KH', organizationId
            }).save({ session });
        }

        // E. Cập nhật trạng thái Đơn hàng -> Hoàn thành
        order.status = 'Hoàn thành';
        await order.save({ session });

        await session.commitTransaction();
        res.status(201).json(newInvoice);

    } catch (err) {
        await session.abortTransaction();
        res.status(400).json({ message: err.message });
    } finally {
        session.endSession();
    }
});

// --- DELIVERIES ---
createTenantCrudEndpoints(Delivery, 'deliveries');

// --- CASHFLOW ---
createTenantCrudEndpoints(CashFlowTransaction, 'cashflow-transactions');

// --- INVENTORY CHECKS ---
createTenantCrudEndpoints(InventoryCheck, 'inventory-checks');

// =================================================================
// --- SERVE FRONTEND ---
// =================================================================
app.use('/api', apiRouter);

app.use(express.static(path.join(__dirname, '..'))); // Giả sử server.js nằm trong thư mục con của root
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});