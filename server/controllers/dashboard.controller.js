const Invoice = require('../models/invoice.model');
const Product = require('../models/product.model');
const CashFlowTransaction = require('../models/cashFlowTransaction.model');
const Customer = require('../models/customer.model');
const Order = require('../models/order.model');

// 1. Số liệu tổng quan
exports.getStats = async (req, res) => {
    try {
        // [QUAN TRỌNG] Chỉ lấy dữ liệu của cửa hàng hiện tại
        const query = { organizationId: req.organizationId };

        // 1. Thống kê cơ bản
        const [totalProducts, totalCustomers, totalOrders] = await Promise.all([
            Product.countDocuments(query),
            Customer.countDocuments(query),
            Order.countDocuments(query)
        ]);

        // 2. Tính doanh thu (Dựa trên hóa đơn đã thanh toán thuộc cửa hàng này)
        // Lưu ý: Nếu Invoice chưa có organizationId thì query này sẽ ra 0.
        // (Code sync ở auth.controller.js đã xử lý việc này rồi)
        const revenueAgg = await Invoice.aggregate([
            { $match: { ...query, status: 'Đã thanh toán' } }, // Lọc theo Org và trạng thái
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

        res.json({
            products: totalProducts,
            customers: totalCustomers,
            orders: totalOrders,
            revenue: totalRevenue
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// 2. Biểu đồ doanh thu (Hàm riêng nếu cần gọi lẻ)
exports.getRevenueChart = async (req, res) => {
    try {
        const { organizationId } = req;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const data = await Invoice.aggregate([
            { $match: { organizationId, createdAt: { $gte: sevenDaysAgo } } },
            { $project: { date: { $dateToString: { format: "%d/%m", date: "$createdAt" } }, amount: "$paidAmount" } },
            { $group: { _id: "$date", total: { $sum: "$amount" } } },
            { $sort: { _id: 1 } }
        ]);
        res.json(data);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// 3. Top sản phẩm (Hàm riêng nếu cần gọi lẻ)
exports.getTopProducts = async (req, res) => {
    try {
        const { organizationId } = req;
        const data = await Invoice.aggregate([
            { $match: { organizationId } },
            { $unwind: "$items" },
            { $group: { _id: "$items.name", qty: { $sum: "$items.quantity" } } },
            { $sort: { qty: -1 } },
            { $limit: 5 }
        ]);
        res.json(data);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// 4. Trạng thái đơn hàng (ĐÂY LÀ HÀM BẠN ĐANG THIẾU HOẶC LỖI)
exports.getOrderStatus = async (req, res) => {
    try {
        const { organizationId } = req;
        const data = await Invoice.aggregate([
            { $match: { organizationId } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        res.json(data);
    } catch (e) { res.status(500).json({ message: e.message }); }
};