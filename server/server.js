const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./db');

// --- IMPORTS MỚI (TỪ CÁC FILE ĐÃ TÁCH) ---
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const customerRoutes = require('./routes/customer.routes');
const supplierRoutes = require('./routes/supplier.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const orderRoutes = require('./routes/order.routes');
const purchaseRoutes = require('./routes/purchase.routes');
const quoteRoutes = require('./routes/quote.routes');
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
app.use('/api/categories', protect, categoryRoutes);
app.use('/api/customers', protect, customerRoutes);
app.use('/api/suppliers', protect, supplierRoutes);
app.use('/api/invoices', protect, invoiceRoutes);
app.use('/api/orders', protect, orderRoutes);
app.use('/api/purchases', protect, purchaseRoutes);
app.use('/api/quotes', protect, quoteRoutes);

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