// server/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./db');
const { protect } = require('./middleware/authMiddleware');
const Organization = require('./models/organization.model');

// --- IMPORTS ROUTES ---
// Core Modules
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

// Business Modules
const productRoutes = require('./routes/product.routes'); // Products
const categoryRoutes = require('./routes/category.routes'); // Categories
const customerRoutes = require('./routes/customer.routes'); // Customers
const supplierRoutes = require('./routes/supplier.routes'); // Suppliers
const invoiceRoutes = require('./routes/invoice.routes'); // Invoices
const orderRoutes = require('./routes/order.routes'); // Orders
const purchaseRoutes = require('./routes/purchase.routes'); // Purchases
const quoteRoutes = require('./routes/quote.routes'); // Quotes
const deliveryRoutes = require('./routes/delivery.routes'); // Deliveries
const inventoryCheckRoutes = require('./routes/inventoryCheck.routes'); // Inventory Checks
const cashFlowRoutes = require('./routes/cashFlow.routes'); // Cash Flow Transactions

const app = express();
const port = process.env.PORT || 5001;

// 1. Connect Database
connectDB();

// 2. Global Middleware
app.use(cors());
app.use(express.json());

// 3. API Routes Definition
// Public
app.use('/api/auth', authRoutes);

// Protected
app.use('/api/dashboard', protect, dashboardRoutes);
app.use('/api/products', protect, productRoutes);
app.use('/api/categories', protect, categoryRoutes);
app.use('/api/customers', protect, customerRoutes);
app.use('/api/suppliers', protect, supplierRoutes);
app.use('/api/invoices', protect, invoiceRoutes);
app.use('/api/orders', protect, orderRoutes);
app.use('/api/purchases', protect, purchaseRoutes);
app.use('/api/quotes', protect, quoteRoutes);
app.use('/api/deliveries', protect, deliveryRoutes);
app.use('/api/inventory-checks', protect, inventoryCheckRoutes);
app.use('/api/cashflow-transactions', protect, cashFlowRoutes);

// 4. Organization Settings (Giữ lại logic nhỏ này hoặc tách sau)
app.get('/api/organization', protect, async (req, res) => {
    try {
        const org = await Organization.findById(req.organizationId);
        res.json(org || { message: 'Chưa có thông tin công ty' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put('/api/organization', protect, async (req, res) => {
    try {
        const org = await Organization.findByIdAndUpdate(req.organizationId, req.body, { new: true });
        res.json(org);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// 5. Serve Static Files (Production)
// Chỉ phục vụ thư mục 'dist' (là thư mục chứa code Frontend sau khi đã build)
const buildPath = path.join(__dirname, '../dist');

// Kiểm tra xem đã build chưa để tránh lỗi crash server
if (require('fs').existsSync(buildPath)) {
    app.use(express.static(buildPath));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(buildPath, 'index.html'));
    });
} else {
    // Nếu chưa build thì báo lỗi nhẹ
    app.get('/', (req, res) => res.send('API Server is running. Frontend not built yet. Run "npm run build" in root folder.'));
}

// 6. Start Server
app.listen(port, () => console.log(`✅ Server running on port ${port}`));