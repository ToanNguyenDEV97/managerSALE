const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./db');
const { protect } = require('./middleware/authMiddleware');

// --- IMPORTS ROUTES ---
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const customerRoutes = require('./routes/customer.routes');
const supplierRoutes = require('./routes/supplier.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const orderRoutes = require('./routes/order.routes');
const purchaseRoutes = require('./routes/purchase.routes');
const quoteRoutes = require('./routes/quote.routes');
const deliveryRoutes = require('./routes/delivery.routes');
const inventoryCheckRoutes = require('./routes/inventoryCheck.routes');
const cashFlowRoutes = require('./routes/cashFlow.routes');
const organizationRoutes = require('./routes/organization.routes');

const app = express();
const port = process.env.PORT || 5001;

// 1. Connect Database
connectDB();

// 2. Global Middleware
app.use(cors());
app.use(express.json());

// 3. API Routes Definition
app.use('/api/auth', authRoutes);

// Protected Routes (Tất cả đều cần login)
// Lưu ý: Đã gọi 'protect' ở đây thì trong file routes con KHÔNG CẦN gọi lại nữa
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
app.use('/api/organization', protect, organizationRoutes);

// 5. Serve Static Files (Production)
const buildPath = path.join(__dirname, '../dist');
if (require('fs').existsSync(buildPath)) {
    app.use(express.static(buildPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(buildPath, 'index.html'));
    });
} else {
    app.get('/', (req, res) => res.send('API Server is running.'));
}

// 6. Start Server
app.listen(port, () => console.log(`✅ Server running on port ${port}`));