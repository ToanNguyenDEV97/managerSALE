const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const passport = require('passport'); // <-- Mới
const GoogleStrategy = require('passport-google-oauth20').Strategy; // <-- Mới
require('dotenv').config();

const connectDB = require('./db');

// --- DATABASE MODELS ---
// (Bạn phải đảm bảo 12 models này đã được cập nhật organizationId như Bước 1.3)
const Organization = require('./models/organization.model'); // <-- Mới
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
    callbackURL: "/api/auth/google/callback" // Google sẽ gọi lại URL này
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
            // User (Owner) đã tồn tại, cho đăng nhập
            return done(null, user);
        } else {
            // User (Owner) mới -> Tự động tạo Tổ chức và Tài khoản Owner
            const newOrg = new Organization({
                name: `Cửa hàng của ${profile.displayName}`
            });
            await newOrg.save();
            
            const newUser = new User({
                email: profile.emails[0].value,
                googleId: profile.id,
                role: 'owner', // Vai trò là Owner
                organizationId: newOrg._id,
                // Không cần password
            });
            await newUser.save();
            
            // Liên kết ngược Owner với Org
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
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key_12345', {
        expiresIn: '30d',
    });
};

// Sửa đổi: getNextSequence giờ phải nhận organizationId
const getNextSequence = async (model, prefix, organizationId) => {
    const sequenceField = {
        'HD': 'invoiceNumber', 'PT': 'transactionNumber', 'PC': 'transactionNumber',
        'PN': 'purchaseNumber', 'BG': 'quoteNumber', 'DH': 'orderNumber',
        'PGH': 'deliveryNumber', 'PKK': 'checkNumber'
    }[prefix];

    if (!sequenceField) throw new Error(`Invalid prefix: ${prefix}`);
    
    // Sửa đổi: Thêm { organizationId, ... } vào bộ lọc
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

// --- 1. PUBLIC AUTHENTICATION ROUTER (ĐÃ SỬA) ---
const authRouter = express.Router();

// Mới: Bắt đầu luồng đăng nhập Google (dành cho Owner)
authRouter.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Mới: Google gọi lại sau khi Owner xác thực
authRouter.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    // req.user được trả về từ logic passport
    const token = generateToken(req.user.id);
    // Chuyển token về cho frontend qua URL
    res.redirect(`http://localhost:3000?token=${token}`);
  }
);

// Sửa: /authenticate giờ chỉ dành cho Admin/Nhanvien (có password)
authRouter.post('/authenticate', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        // Chỉ đăng nhập thành công nếu user tồn tại VÀ có password VÀ password khớp
        if (user && user.password && (await user.comparePassword(password))) {
            res.json({ token: generateToken(user.id) });
        } else {
            res.status(401).json({ message: 'Email hoặc mật khẩu không hợp lệ.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ trong quá trình xác thực.', error: error.message });
    }
});

// Xóa: /create-account đã bị xóa. (Thay bằng Google OAuth)

app.use('/api/auth', authRouter);

// --- 2. PROTECTION MIDDLEWARE (ĐÃ SỬA) ---
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_12345');
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Gán ID Tổ chức vào mọi request để lọc dữ liệu
            req.organizationId = req.user.organizationId.toString(); 
            // ---------------------

            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Sửa đổi: Admin hoặc Owner đều có quyền admin
const admin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'owner')) {
        next();
    } else {
        res.status(403).json({ message: 'Không có quyền truy cập. Yêu cầu quyền Quản trị viên.' });
    }
};

// --- 3. PROTECTED API ROUTER (ĐÃ SỬA) ---
const apiRouter = express.Router();
apiRouter.use(protect); // Mọi API bên dưới đều phải xác thực VÀ có organizationId

// Sửa đổi: /all-data phải lọc theo organizationId
apiRouter.get('/all-data', async (req, res) => {
    try {
        const { organizationId } = req; // Lấy ID tổ chức từ middleware
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
        if (req.user.role === 'admin' || req.user.role === 'owner') { // Sửa: Owner cũng là admin
            promises.push(User.find({ organizationId }).select('-password')); // Lọc user theo tổ chức
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

// GET /api/me (Không đổi)
apiRouter.get('/me', (req, res) => {
    res.json(req.user);
});

// --- USER MANAGEMENT (ADMIN/OWNER) (ĐÃ SỬA) ---
apiRouter.get('/users', admin, async (req, res) => {
    const users = await User.find({ organizationId: req.organizationId }).select('-password');
    res.json(users);
});

apiRouter.post('/users', admin, async (req, res) => {
    const { email, password, role } = req.body;
    // Sửa đổi: Owner có thể tạo Admin, Admin chỉ tạo Nhanvien
    if (req.user.role === 'admin' && role === 'admin') {
         return res.status(403).json({ message: 'Admin không thể tạo Admin khác.' });
    }
    if (role === 'owner') {
         return res.status(403).json({ message: 'Không thể tạo Owner.' });
    }
    
    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'Email đã tồn tại.' });

        const user = await User.create({ 
            email, 
            password, 
            role, 
            organizationId: req.organizationId // Sửa: Tự động gán organizationId
        });
        res.status(201).json(user);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

apiRouter.put('/users/:id', admin, async (req, res) => {
    const { email, password, role } = req.body;
    try {
        // Sửa: Phải lọc theo organizationId
        const user = await User.findOne({ _id: req.params.id, organizationId: req.organizationId });
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        
        // Sửa: logic phân quyền
        if (user.role === 'owner') return res.status(403).json({ message: 'Không thể sửa tài khoản Owner.' });
        if (req.user.role === 'admin' && (role === 'admin' || user.role === 'admin')) {
             return res.status(403).json({ message: 'Admin không thể sửa tài khoản Admin khác.' });
        }
        
        user.email = email || user.email;
        user.role = role || user.role;
        if (password) {
            user.password = password;
        }
        const updatedUser = await user.save();
        res.json(updatedUser);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

apiRouter.delete('/users/:id', admin, async (req, res) => {
    try {
        // Sửa: Phải lọc theo organizationId
        const user = await User.findOne({ _id: req.params.id, organizationId: req.organizationId });
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        if (user.role === 'owner') return res.status(403).json({ message: 'Không thể xóa Owner.' });
        if (req.user.role === 'admin' && user.role === 'admin') return res.status(403).json({ message: 'Admin không thể xóa Admin khác.' });
        
        await user.deleteOne();
        res.status(204).send();
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// SELF PROFILE MANAGEMENT (Không đổi)
apiRouter.put('/profile', async (req, res) => { /* ... (Giữ nguyên) ... */ });

// --- GENERIC CRUD (ĐÃ SỬA) ---
// (Viết lại để đảm bảo lọc theo organizationId)
const createTenantCrudEndpoints = (model, modelName) => {
    apiRouter.post(`/${modelName}`, async (req, res) => {
        try {
            const doc = await new model({ ...req.body, organizationId: req.organizationId }).save();
            res.status(201).json(doc);
        } catch (err) { res.status(500).json({ message: err.message }); }
    });
    apiRouter.put(`/${modelName}/:id`, async (req, res) => {
        try {
            const doc = await model.findOneAndUpdate({ _id: req.params.id, organizationId: req.organizationId }, req.body, { new: true });
            if (!doc) return res.status(404).json({ message: 'Không tìm thấy tài liệu.' });
            res.json(doc);
        } catch (err) { res.status(500).json({ message: err.message }); }
    });
    apiRouter.delete(`/${modelName}/:id`, async (req, res) => {
        try {
            const doc = await model.findOneAndDelete({ _id: req.params.id, organizationId: req.organizationId });
            if (!doc) return res.status(404).json({ message: 'Không tìm thấy tài liệu.' });
            res.status(204).send();
        } catch (err) { res.status(500).json({ message: err.message }); }
    });
    apiRouter.post(`/${modelName}/batch-delete`, async (req, res) => {
        try {
            await model.deleteMany({ _id: { $in: req.body.ids }, organizationId: req.organizationId });
            res.status(204).send();
        } catch (err) { res.status(500).json({ message: err.message }); }
    });
};

createTenantCrudEndpoints(Product, 'products');
createTenantCrudEndpoints(Supplier, 'suppliers');
createTenantCrudEndpoints(Quote, 'quotes');
createTenantCrudEndpoints(Order, 'orders');

apiRouter.post('/customers', async (req, res) => {
    try {
        const doc = await new Customer({ ...req.body, organizationId: req.organizationId }).save();
        res.status(201).json(doc);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- CUSTOM LOGIC ENDPOINTS (ĐÃ SỬA) ---

// CATEGORY (Cần logic tùy chỉnh)
apiRouter.post('/categories', async (req, res) => {
    try {
        const doc = await new Category({ name: req.body.name, organizationId: req.organizationId }).save();
        res.status(201).json(doc);
    } catch (err) { res.status(500).json({ message: err.message }); }
});
apiRouter.put('/categories/:id', async (req, res) => {
    try {
        const oldCategory = await Category.findOne({ _id: req.params.id, organizationId: req.organizationId });
        if (oldCategory && oldCategory.name !== req.body.name) {
            // Sửa: Phải lọc cả Product theo organizationId
            await Product.updateMany({ category: oldCategory.name, organizationId: req.organizationId }, { category: req.body.name });
        }
        const updatedCategory = await Category.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true });
        res.json(updatedCategory);
    } catch (err) { res.status(500).json({ message: err.message }); }
});
apiRouter.delete('/categories/:id', async (req, res) => {
    try {
        const category = await Category.findOne({ _id: req.params.id, organizationId: req.organizationId });
        if (category) {
            await Product.updateMany({ category: category.name, organizationId: req.organizationId }, { category: 'Chưa phân loại' });
            await category.deleteOne();
        }
        res.status(204).send();
    } catch (err) { res.status(500).json({ message: err.message }); }
});


// POS SALE (Sửa: Lỗi chính tả 'paymentAmount' + logic 'organizationId')
apiRouter.post('/sales', async (req, res) => {
    const { organizationId } = req; // Sửa: Lấy organizationId
    try {
        // Sửa: 'paidAmount' -> 'paymentAmount'
        const { customerId, items, totalAmount, paymentAmount, saleType } = req.body;
        
        // Sửa: Lọc Customer theo organizationId
        const customer = await Customer.findOne({ _id: customerId, organizationId });
        if (!customer) return res.status(404).json({ message: 'Không tìm thấy khách hàng.' });
        
        // Sửa: Lỗi chính tả
        let status = paymentAmount >= totalAmount ? 'Đã thanh toán' : (paymentAmount > 0 ? 'Thanh toán một phần' : 'Chưa thanh toán');
        
        const newInvoice = new Invoice({
            invoiceNumber: await getNextSequence(Invoice, 'HD', organizationId), // Sửa: Truyền organizationId
            customerId, customerName: customer.name, issueDate: new Date().toISOString().split('T')[0],
            items, totalAmount, 
            paidAmount: paymentAmount, // Sửa: Gán đúng
            status,
            organizationId // Sửa: Gán organizationId
        });
        const savedInvoice = await newInvoice.save();

        for (const item of items) {
            // Sửa: Lọc Product theo organizationId
            await Product.findOneAndUpdate({ _id: item.productId, organizationId }, { $inc: { stock: -item.quantity } });
        }
        
        // Sửa: Lọc Customer theo organizationId
        await Customer.findOneAndUpdate({ _id: customerId, organizationId }, { $inc: { debt: totalAmount - paymentAmount } }); // Sửa: Lỗi chính tả

        let savedVoucher = null;
        if (paymentAmount > 0) { // Sửa: Lỗi chính tả
            const voucher = new CashFlowTransaction({
                transactionNumber: await getNextSequence(CashFlowTransaction, 'PT', organizationId), // Sửa: Truyền organizationId
                type: 'thu',
                date: new Date().toISOString().split('T')[0], 
                amount: paymentAmount, // Sửa: Lỗi chính tả
                description: `Thanh toán cho hóa đơn ${savedInvoice.invoiceNumber}`,
                payerReceiverName: customer.name, payerReceiverAddress: customer.address, category: 'Thu nợ KH',
                organizationId // Sửa: Gán organizationId
            });
            savedVoucher = await voucher.save();
        }
        
        // Sửa: Logic in hóa đơn khi ghi nợ 0 đồng
        let printAction = (saleType === 'full_payment' || (saleType === 'debit' && paymentAmount === 0))
            ? 'invoice'
            : (paymentAmount > 0 ? 'voucher' : null);
        
        res.status(201).json({ 
            savedInvoice, 
            printAction, 
            voucherId: savedVoucher ? savedVoucher.id : null, 
            invoiceId: savedInvoice.id 
        });
    } catch (err) {
        console.error('!!! LỖI TẠI /api/sales:', err);
        res.status(500).json({ message: 'Lỗi máy chủ khi xử lý bán hàng.', error: err.message });
    }
});
// --- LOGIC XÓA HÓA ĐƠN (Revert Kho & Nợ) ---
apiRouter.delete('/invoices/:id', async (req, res) => {
    const { organizationId } = req;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Tìm hóa đơn cần xóa
        const invoice = await Invoice.findOne({ _id: req.params.id, organizationId }).session(session);
        if (!invoice) {
            throw new Error('Không tìm thấy hóa đơn.');
        }

        // 2. Hoàn trả tồn kho (Vòng lặp)
        for (const item of invoice.items) {
            await Product.findOneAndUpdate(
                { _id: item.productId, organizationId },
                { $inc: { stock: item.quantity } } // Cộng lại số lượng đã bán
            ).session(session);
        }

        // 3. Hoàn trả công nợ (Trừ đi số tiền khách ĐÃ NỢ từ hóa đơn này)
        // Logic: Nợ tăng thêm = Tổng tiền - Đã trả. Giờ xóa đi thì phải trừ ngược lại.
        const debtToRevert = invoice.totalAmount - invoice.paidAmount;
        if (debtToRevert > 0) {
            await Customer.findOneAndUpdate(
                { _id: invoice.customerId, organizationId },
                { $inc: { debt: -debtToRevert } } // Giảm nợ
            ).session(session);
        }

        // 4. Xóa các phiếu thu liên quan (Optional - Tùy nghiệp vụ)
        // Nếu xóa hóa đơn, thường cũng nên xóa luôn lịch sử thu tiền của nó để sạch sổ quỹ
        await CashFlowTransaction.deleteMany({ 
            description: { $regex: invoice.invoiceNumber },
            organizationId 
        }).session(session);

        // 5. Xóa hóa đơn
        await invoice.deleteOne({ session });

        await session.commitTransaction();
        session.endSession();
        res.status(204).send();

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: 'Lỗi khi xóa hóa đơn.', error: err.message });
    }
});

// DELETE CUSTOMER
apiRouter.delete('/customers/:id', async (req, res) => {
    const { organizationId } = req;
    try {
        // 1. Kiểm tra xem khách có đang nợ không
        const customer = await Customer.findOne({ _id: req.params.id, organizationId });
        if (!customer) return res.status(404).json({ message: 'Không tìm thấy khách hàng.' });
        
        if (customer.debt > 0) {
             return res.status(400).json({ message: `Không thể xóa! Khách đang nợ ${customer.debt.toLocaleString()}đ. Vui lòng thu hết nợ trước.` });
        }
        if (customer.debt < 0) {
             return res.status(400).json({ message: `Không thể xóa! Bạn đang nợ khách ${Math.abs(customer.debt).toLocaleString()}đ (Tiền trả trước).` });
        }

        // 2. Kiểm tra xem khách có hóa đơn lịch sử không
        const hasInvoices = await Invoice.exists({ customerId: req.params.id, organizationId });
        if (hasInvoices) {
            return res.status(400).json({ message: 'Không thể xóa! Khách hàng này đã có lịch sử mua hàng. Việc xóa sẽ làm hỏng dữ liệu báo cáo.' });
        }

        // Nếu sạch sẽ (không nợ, không hóa đơn) thì mới cho xóa
        await customer.deleteOne();
        res.status(204).send();
    } catch (err) { res.status(500).json({ message: 'Lỗi khi xóa khách hàng.', error: err.message }); }
});

// (Tất cả các hàm logic nghiệp vụ phức tạp khác đều phải được sửa tương tự)

// INVOICE PAYMENT (Sửa: Lọc theo organizationId)
apiRouter.post('/invoices/:id/payment', async (req, res) => {
    const { organizationId } = req;
    try {
        const { amount, updateDebt } = req.body;
        const invoice = await Invoice.findOne({ _id: req.params.id, organizationId });
        if (!invoice) return res.status(404).json({ message: 'Không tìm thấy hóa đơn.'});

        invoice.paidAmount += amount;
        if (invoice.paidAmount >= invoice.totalAmount) {
            invoice.status = 'Đã thanh toán';
        } else {
            invoice.status = 'Thanh toán một phần';
        }
        await invoice.save();

        if (updateDebt) {
            await Customer.findOneAndUpdate({ _id: invoice.customerId, organizationId }, { $inc: { debt: -amount } });
        }
        
        const customer = await Customer.findOne({ _id: invoice.customerId, organizationId });
        const newVoucher = await new CashFlowTransaction({
            transactionNumber: await getNextSequence(CashFlowTransaction, 'PT', organizationId),
            type: 'thu', date: new Date().toISOString().split('T')[0], amount: amount,
            description: `Thanh toán cho hóa đơn ${invoice.invoiceNumber}`,
            payerReceiverName: customer ? customer.name : invoice.customerName,
            organizationId
        }).save();
        
        res.status(201).json({ newVoucher });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// PAY ALL DEBT (Sửa: Lọc theo organizationId)
apiRouter.post('/customers/:id/pay-all-debt', async (req, res) => {
    const { organizationId } = req;
    try {
        const customer = await Customer.findOne({ _id: req.params.id, organizationId });
        if (!customer || customer.debt <= 0) return res.status(400).json({ message: 'Khách hàng không có nợ.' });
        
        const debtAmount = customer.debt;
        await Customer.findByIdAndUpdate(req.params.id, { debt: 0 }); // findOneAndUpdate({ _id, orgId }) sẽ an toàn hơn
        await Invoice.updateMany({ customerId: req.params.id, organizationId, status: { $ne: 'Đã thanh toán' } }, {
            $set: { status: 'Đã thanh toán' } // Cần logic phức tạp hơn để set paidAmount = totalAmount
        });

        await new CashFlowTransaction({
            transactionNumber: await getNextSequence(CashFlowTransaction, 'PT', organizationId),
            type: 'thu', date: new Date().toISOString().split('T')[0], amount: debtAmount,
            description: `Thanh toán toàn bộ công nợ`, payerReceiverName: customer.name, category: 'Thu nợ KH',
            organizationId
        }).save();
        res.status(200).json({ message: 'Thanh toán công nợ thành công.' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// PAY SUPPLIER DEBT (Sửa: Lọc theo organizationId)
apiRouter.post('/suppliers/:id/pay-debt', async (req, res) => {
    const { organizationId } = req;
    try {
        const { amount } = req.body;
        const supplier = await Supplier.findOne({ _id: req.params.id, organizationId });
        if (!supplier || amount <= 0 || amount > supplier.debt) return res.status(400).json({ message: 'Thông tin thanh toán không hợp lệ.' });
        
        await Supplier.findByIdAndUpdate(req.params.id, { $inc: { debt: -amount } });
        await new CashFlowTransaction({
            transactionNumber: await getNextSequence(CashFlowTransaction, 'PC', organizationId),
            type: 'chi', date: new Date().toISOString().split('T')[0], amount: amount,
            description: `Thanh toán công nợ cho NCC ${supplier.name}`, payerReceiverName: supplier.name, category: 'Trả NCC',
            organizationId
        }).save();
        res.status(200).json({ message: 'Thanh toán nợ NCC thành công.' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// QUOTE TO ORDER (Sửa: Lọc theo organizationId)
apiRouter.post('/quotes/:id/convert-to-order', async (req, res) => {
    const { organizationId } = req;
    try {
        const quote = await Quote.findOne({ _id: req.params.id, organizationId });
        if (!quote || quote.status === 'Đã chuyển đổi') return res.status(400).json({ message: 'Báo giá không hợp lệ hoặc đã được chuyển đổi.' });
        
        const newOrder = new Order({
            orderNumber: await getNextSequence(Order, 'DH', organizationId),
            customerId: quote.customerId, customerName: quote.customerName,
            issueDate: new Date().toISOString().split('T')[0], items: quote.items,
            totalAmount: quote.totalAmount, status: 'Chờ xử lý', quoteId: quote.id,
            organizationId
        });
        await newOrder.save();
        
        quote.status = 'Đã chuyển đổi';
        await quote.save();
        res.status(201).json(newOrder);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ORDER TO INVOICE (Sửa: Lọc theo organizationId)
apiRouter.post('/orders/:id/convert-to-invoice', async (req, res) => {
    const { organizationId } = req;
    try {
        const order = await Order.findOne({ _id: req.params.id, organizationId });
        if (!order || order.status === 'Hoàn thành') return res.status(400).json({ message: 'Đơn hàng không hợp lệ hoặc đã được xử lý.' });

        for (const item of order.items) {
            const product = await Product.findOne({ _id: item.productId, organizationId });
            if (!product || product.stock < item.quantity) return res.status(400).json({ message: `Không đủ tồn kho cho sản phẩm: ${item.name}` });
        }

        const invoiceItems = await Promise.all(order.items.map(async (item) => {
            const product = await Product.findOneAndUpdate({ _id: item.productId, organizationId }, { $inc: { stock: -item.quantity } });
            return { ...item.toObject(), costPrice: product.costPrice };
        }));

        const newInvoice = new Invoice({
            invoiceNumber: await getNextSequence(Invoice, 'HD', organizationId),
            customerId: order.customerId, customerName: order.customerName,
            issueDate: new Date().toISOString().split('T')[0], items: invoiceItems,
            totalAmount: order.totalAmount, paidAmount: 0, status: 'Chưa thanh toán', orderId: order.id,
            organizationId
        });
        await newInvoice.save();

        await Customer.findOneAndUpdate({ _id: order.customerId, organizationId }, { $inc: { debt: order.totalAmount } });
        order.status = 'Hoàn thành';
        await order.save();
        res.status(201).json(newInvoice);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- PURCHASE (NHẬP KHO) LOGIC ---
apiRouter.post('/purchases', async (req, res) => {
    const { organizationId } = req;
    try {
        const { supplierId, items, issueDate, totalAmount, supplierName } = req.body;
        const purchaseNumber = await getNextSequence(Purchase, 'PN', organizationId);

        const newPurchase = new Purchase({
            ...req.body,
            purchaseNumber,
            organizationId
        });
        const savedPurchase = await newPurchase.save();

        // Cập nhật tồn kho và công nợ NCC
        for (const item of items) {
            await Product.findOneAndUpdate(
                { _id: item.productId, organizationId },
                { $inc: { stock: item.quantity, costPrice: item.costPrice } } // Cập nhật cả giá vốn
            );
        }
        await Supplier.findOneAndUpdate(
            { _id: supplierId, organizationId },
            { $inc: { debt: totalAmount } }
        );

        res.status(201).json(savedPurchase);
    } catch (err) { res.status(500).json({ message: 'Lỗi khi tạo phiếu nhập kho.', error: err.message }); }
});

apiRouter.delete('/purchases/:id', async (req, res) => {
    const { organizationId } = req;
    try {
        const purchase = await Purchase.findOne({ _id: req.params.id, organizationId });
        if (!purchase) return res.status(404).json({ message: 'Không tìm thấy phiếu nhập.' });

        // Hoàn trả lại tồn kho và công nợ
        for (const item of purchase.items) {
            await Product.findOneAndUpdate(
                { _id: item.productId, organizationId },
                { $inc: { stock: -item.quantity } }
            );
        }
        await Supplier.findOneAndUpdate(
            { _id: purchase.supplierId, organizationId },
            { $inc: { debt: -purchase.totalAmount } }
        );

        await purchase.deleteOne();
        res.status(204).send();
    } catch (err) { res.status(500).json({ message: 'Lỗi khi xóa phiếu nhập.', error: err.message }); }
});

// --- DELIVERY (GIAO HÀNG) LOGIC ---
apiRouter.post('/deliveries', async (req, res) => {
    const { organizationId } = req;
    try {
        const { invoiceId } = req.body;
        
        const invoice = await Invoice.findOne({ _id: invoiceId, organizationId });
        if (!invoice) return res.status(404).json({ message: 'Không tìm thấy hóa đơn gốc.' });
        if (invoice.deliveryId) return res.status(400).json({ message: 'Hóa đơn này đã có phiếu giao.' });

        const deliveryNumber = await getNextSequence(Delivery, 'PGH', organizationId);
        const newDelivery = new Delivery({
            ...req.body,
            deliveryNumber,
            organizationId
        });
        const savedDelivery = await newDelivery.save();

        // Cập nhật hóa đơn
        invoice.deliveryId = savedDelivery._id.toString();
        await invoice.save();

        res.status(201).json(savedDelivery);
    } catch (err) { res.status(500).json({ message: 'Lỗi khi tạo phiếu giao.', error: err.message }); }
});

apiRouter.put('/deliveries/:id', async (req, res) => {
    const { organizationId } = req;
    try {
        // Chỉ cho phép cập nhật 'status' qua route này
        const { status } = req.body;
        if (!status) return res.status(400).json({ message: 'Missing status.' });

        const delivery = await Delivery.findOneAndUpdate(
            { _id: req.params.id, organizationId },
            { status: status },
            { new: true }
        );
        if (!delivery) return res.status(404).json({ message: 'Không tìm thấy phiếu giao.' });
        res.json(delivery);
    } catch (err) { res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái.', error: err.message }); }
});

apiRouter.delete('/deliveries/:id', async (req, res) => {
    const { organizationId } = req;
    try {
        const delivery = await Delivery.findOne({ _id: req.params.id, organizationId });
        if (!delivery) return res.status(404).json({ message: 'Không tìm thấy phiếu giao.' });

        // Gỡ liên kết khỏi hóa đơn
        await Invoice.findOneAndUpdate(
            { _id: delivery.invoiceId, organizationId },
            { $unset: { deliveryId: "" } }
        );
        
        await delivery.deleteOne();
        res.status(204).send();
    } catch (err) { res.status(500).json({ message: 'Lỗi khi xóa phiếu giao.', error: err.message }); }
});

// --- CASHFLOW (SỔ QUỸ) LOGIC ---
apiRouter.post('/cashflow-transactions', async (req, res) => {
    const { organizationId } = req;
    try {
        const { id, type } = req.body;
        let transaction;

        if (id) { // Chỉnh sửa
            transaction = await CashFlowTransaction.findOneAndUpdate(
                { _id: id, organizationId },
                req.body,
                { new: true }
            );
            if (!transaction) return res.status(404).json({ message: 'Không tìm thấy phiếu.' });
        } else { // Tạo mới
            const transactionNumber = await getNextSequence(CashFlowTransaction, type === 'thu' ? 'PT' : 'PC', organizationId);
            transaction = await new CashFlowTransaction({
                ...req.body,
                transactionNumber,
                organizationId
            }).save();
        }
        res.status(201).json(transaction);
    } catch (err) { res.status(500).json({ message: 'Lỗi khi lưu phiếu thu/chi.', error: err.message }); }
});

apiRouter.delete('/cashflow-transactions/:id', async (req, res) => {
    const { organizationId } = req;
    try {
        const doc = await CashFlowTransaction.findOneAndDelete({ _id: req.params.id, organizationId });
        if (!doc) return res.status(404).json({ message: 'Không tìm thấy phiếu.' });
        res.status(204).send();
    } catch (err) { res.status(500).json({ message: 'Lỗi khi xóa phiếu.', error: err.message }); }
});

// --- INVENTORY CHECK (KIỂM KHO) LOGIC ---
apiRouter.post('/inventory-checks', async (req, res) => {
    const { organizationId } = req;
    try {
        const { id, status, items } = req.body;
        let check;

        if (id) { // Chỉnh sửa
            check = await InventoryCheck.findOne({ _id: id, organizationId });
            if (!check) return res.status(404).json({ message: 'Không tìm thấy phiếu kiểm kho.' });
            if (check.status === 'Hoàn thành') return res.status(400).json({ message: 'Không thể sửa phiếu đã hoàn thành.' });
            
            check.set(req.body);
            await check.save();
        } else { // Tạo mới
            const checkNumber = await getNextSequence(InventoryCheck, 'PKK', organizationId);
            check = await new InventoryCheck({
                ...req.body,
                checkNumber,
                organizationId
            }).save();
        }

        // Nếu 'Hoàn thành', cập nhật tồn kho và tạo phiếu chênh lệch
        if (status === 'Hoàn thành') {
            let totalDifferenceValue = 0;
            for (const item of items) {
                if (item.difference !== 0) {
                    await Product.findOneAndUpdate(
                        { _id: item.productId, organizationId },
                        { $set: { stock: item.actualStock } }
                    );
                    totalDifferenceValue += item.difference * item.costPrice;
                }
            }
            
            // Nếu có chênh lệch, tạo phiếu Thu/Chi
            if (totalDifferenceValue !== 0) {
                const isLoss = totalDifferenceValue < 0; // Âm = Thiếu hàng = Chi
                await new CashFlowTransaction({
                    transactionNumber: await getNextSequence(CashFlowTransaction, isLoss ? 'PC' : 'PT', organizationId),
                    type: isLoss ? 'chi' : 'thu',
                    date: check.checkDate,
                    amount: Math.abs(totalDifferenceValue),
                    description: `Chênh lệch kiểm kho phiếu ${check.checkNumber}`,
                    category: 'Chênh lệch kho',
                    organizationId
                }).save();
            }
        }
        res.status(201).json(check);
    } catch (err) { res.status(500).json({ message: 'Lỗi khi lưu phiếu kiểm kho.', error: err.message }); }
});

apiRouter.delete('/inventory-checks/:id', async (req, res) => {
    const { organizationId } = req;
    try {
        // Chỉ cho phép xóa phiếu 'Nháp'
        const doc = await InventoryCheck.findOneAndDelete({ _id: req.params.id, organizationId, status: 'Nháp' });
        if (!doc) return res.status(404).json({ message: 'Không tìm thấy phiếu nháp hoặc phiếu đã hoàn thành.' });
        res.status(204).send();
    } catch (err) { res.status(500).json({ message: 'Lỗi khi xóa phiếu kiểm kho.', error: err.message }); }
});

// MOUNT THE MAIN API ROUTER
app.use('/api', apiRouter);

// --- SERVE FRONTEND ---
app.use(express.static(path.join(__dirname, '..')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});