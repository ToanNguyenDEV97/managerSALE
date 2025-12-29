const Invoice = require('../models/invoice.model');
const Product = require('../models/product.model');
const CashFlowTransaction = require('../models/cashFlowTransaction.model');

// 1. Số liệu tổng quan
exports.getStats = async (req, res) => {
    const { organizationId } = req;
    try {
        const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

        const todayStats = await Invoice.aggregate([
            { $match: { organizationId, createdAt: { $gte: startOfDay } } },
            { $group: { _id: null, revenue: { $sum: "$paidAmount" }, count: { $sum: 1 } } }
        ]);

        const monthStats = await Invoice.aggregate([
            { $match: { organizationId, createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, revenue: { $sum: "$paidAmount" } } }
        ]);

        const lowStockCount = await Product.countDocuments({ organizationId, stock: { $lte: 10 } });

        const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const chartData = await Invoice.aggregate([
            { $match: { organizationId, createdAt: { $gte: sevenDaysAgo } } },
            { $project: { date: { $dateToString: { format: "%d/%m", date: "$createdAt" } }, amount: "$paidAmount" } },
            { $group: { _id: "$date", total: { $sum: "$amount" } } },
            { $sort: { _id: 1 } }
        ]);

        const topProducts = await Invoice.aggregate([
            { $match: { organizationId } },
            { $unwind: "$items" },
            { $group: { _id: "$items.name", qty: { $sum: "$items.quantity" } } },
            { $sort: { qty: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            revenueToday: todayStats[0]?.revenue || 0,
            ordersToday: todayStats[0]?.count || 0,
            revenueMonth: monthStats[0]?.revenue || 0,
            lowStockCount,
            chartData: chartData || [],
            topProducts: topProducts || []
        });
    } catch (error) {
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