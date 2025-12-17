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
        'HD': 'invoiceNumber', 'PT': 'transactionNumber', 'PC': 'transactionNumber',
        'PN': 'purchaseNumber', 'BG': 'quoteNumber', 'DH': 'orderNumber',
        'PGH': 'deliveryNumber', 'PKK': 'checkNumber'
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

// Áp dụng CRUD chuẩn cho các model đơn giản
createTenantCrudEndpoints(Supplier, 'suppliers');
createTenantCrudEndpoints(Quote, 'quotes');
createTenantCrudEndpoints(Order, 'orders');

// --- PRODUCTS (CUSTOM SEARCH) ---
apiRouter.get('/products', async (req, res) => {
    const { organizationId } = req;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    try {
        const query = { 
            organizationId,
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } }
            ]
        };
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
createTenantCrudEndpoints(Product, 'products'); // Vẫn dùng Create/Update/Delete chuẩn

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
    try {
        const { customerId, items, totalAmount, paymentAmount, saleType } = req.body;
        
        const customer = await Customer.findOne({ _id: customerId, organizationId });
        if (!customer) return res.status(404).json({ message: 'Khách hàng không tồn tại' });
        
        const invoiceNumber = await getNextSequence(Invoice, 'HD', organizationId);
        
        // Trừ kho & tạo hóa đơn
        for (const item of items) {
             await Product.findOneAndUpdate({ _id: item.productId, organizationId }, { $inc: { stock: -item.quantity } });
        }
        
        const status = paymentAmount >= totalAmount ? 'Đã thanh toán' : (paymentAmount > 0 ? 'Thanh toán một phần' : 'Chưa thanh toán');
        const newInvoice = await new Invoice({
            invoiceNumber, customerId, customerName: customer.name,
            issueDate: new Date().toISOString().split('T')[0],
            items, totalAmount, paidAmount: paymentAmount, status, organizationId
        }).save();

        // Cộng nợ (Tổng tiền - Đã trả)
        const debtToAdd = totalAmount - paymentAmount;
        if (debtToAdd > 0) {
            await Customer.findByIdAndUpdate(customerId, { $inc: { debt: debtToAdd } });
        }

        // Tạo phiếu thu nếu có trả tiền
        let savedVoucher = null;
        if (paymentAmount > 0) {
            const transactionNumber = await getNextSequence(CashFlowTransaction, 'PT', organizationId);
            savedVoucher = await new CashFlowTransaction({
                transactionNumber, type: 'thu',
                date: new Date().toISOString().split('T')[0],
                amount: paymentAmount,
                description: `Thanh toán cho hóa đơn ${invoiceNumber}`,
                payerReceiverName: customer.name, category: 'Thu nợ KH', organizationId
            }).save();
        }
        
        res.status(201).json({ 
            savedInvoice: newInvoice, 
            voucherId: savedVoucher ? savedVoucher.id : null 
        });
    } catch (err) { res.status(500).json({ message: err.message }); }
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
createTenantCrudEndpoints(Category, 'categories');
apiRouter.put('/categories/:id', async (req, res) => {
    // Override PUT để update sản phẩm liên quan
    try {
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
        
        const count = await Product.countDocuments({ category: cat.name, organizationId: req.organizationId });
        if (count > 0) return res.status(400).json({ message: `Đang có ${count} sản phẩm thuộc danh mục này.` });

        await cat.deleteOne();
        res.status(204).send();
     } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- PURCHASES ---
createTenantCrudEndpoints(Purchase, 'purchases'); // Logic trừ kho/cộng nợ NCC nên viết thêm ở đây nếu cần

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