// server/controllers/dashboard.controller.js
const mongoose = require('mongoose');
const Invoice = require('../models/invoice.model');
const Product = require('../models/product.model');
const CashFlowTransaction = require('../models/cashFlowTransaction.model'); 
// Nếu chưa có model CashFlow, bạn có thể comment dòng trên và phần tính toán liên quan

// 1. Lấy số liệu thống kê cho 4 ô thẻ bài (Stats Cards)
const getStats = async (req, res) => {
    try {
        const organizationId = new mongoose.Types.ObjectId(req.organizationId);
        
        // Xác định thời gian
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // --- 1. Tính Doanh thu & Đơn hàng HÔM NAY ---
        const todayStats = await Invoice.aggregate([
            {
                $match: {
                    organizationId: organizationId,
                    createdAt: { $gte: startOfDay }, // Từ 00:00 hôm nay
                    // status: 'paid' // Mở comment nếu chỉ tính đơn đã thanh toán
                }
            },
            {
                $group: {
                    _id: null,
                    revenueToday: { $sum: "$finalAmount" }, // Tổng tiền
                    countToday: { $sum: 1 }                 // Số đơn
                }
            }
        ]);

        const revenueToday = todayStats.length > 0 ? todayStats[0].revenueToday : 0;
        const ordersToday = todayStats.length > 0 ? todayStats[0].countToday : 0;

        // --- 2. Tính Dòng tiền (Thu/Chi) THÁNG NÀY ---
        // (Nếu bạn chưa dùng module CashFlow, có thể gán cứng = 0)
        let incomeMonth = 0;
        let expenseMonth = 0;
        
        try {
            const cashFlowStats = await CashFlowTransaction.aggregate([
                {
                    $match: {
                        organizationId: organizationId,
                        createdAt: { $gte: startOfMonth }
                    }
                },
                {
                    $group: {
                        _id: "$type", // type là 'income' hoặc 'expense'
                        total: { $sum: "$amount" }
                    }
                }
            ]);

            cashFlowStats.forEach(item => {
                if (item._id === 'income') incomeMonth = item.total;
                if (item._id === 'expense') expenseMonth = item.total;
            });
        } catch (e) {
            console.log("Chưa có module CashFlow hoặc lỗi:", e.message);
        }

        // --- 3. Cảnh báo tồn kho (Sản phẩm có tồn kho <= mức tối thiểu) ---
        // Giả sử product có trường minStockLevel, nếu không so sánh với 5
        const lowStockCount = await Product.countDocuments({
            organizationId: req.organizationId,
            $expr: { 
                $lte: ["$quantity", { $ifNull: ["$minStockLevel", 5] }] 
            } 
        });

        // Trả về JSON đúng key mà Frontend đang chờ
        res.json({
            revenueToday,    // Frontend: stats.revenueToday
            ordersToday,     // Frontend: stats.ordersToday
            incomeMonth,     // Frontend: stats.incomeMonth
            expenseMonth,    // Frontend: stats.expenseMonth
            lowStockCount    // Frontend: stats.lowStockCount
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// 2. Biểu đồ doanh thu 7 ngày gần nhất
const getRevenueChart = async (req, res) => {
    try {
        const organizationId = new mongoose.Types.ObjectId(req.organizationId);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0,0,0,0);

        const data = await Invoice.aggregate([
            { 
                $match: { 
                    organizationId: organizationId, 
                    createdAt: { $gte: sevenDaysAgo }
                    // status: 'paid' 
                } 
            },
            { 
                $project: { 
                    date: { $dateToString: { format: "%d/%m", date: "$createdAt" } }, 
                    amount: "$finalAmount" 
                } 
            },
            { 
                $group: { 
                    _id: "$date", 
                    total: { $sum: "$amount" } 
                } 
            },
            { $sort: { _id: 1 } } // Sắp xếp ngày tăng dần
        ]);
        res.json(data);
    } catch (e) { 
        res.status(500).json({ message: e.message }); 
    }
};

// 3. Top 5 sản phẩm bán chạy
const getTopProducts = async (req, res) => {
    try {
        const organizationId = new mongoose.Types.ObjectId(req.organizationId);
        const data = await Invoice.aggregate([
            { $match: { organizationId: organizationId } },
            { $unwind: "$items" }, // Tách mảng items ra từng dòng
            { 
                $group: { 
                    _id: "$items.name", 
                    qty: { $sum: "$items.quantity" } 
                } 
            },
            { $sort: { qty: -1 } }, // Số lượng giảm dần
            { $limit: 5 }
        ]);
        res.json(data);
    } catch (e) { 
        res.status(500).json({ message: e.message }); 
    }
};

// 4. Trạng thái đơn hàng (Mới, Đã thanh toán, Huỷ...)
const getOrderStatus = async (req, res) => {
    try {
        const organizationId = new mongoose.Types.ObjectId(req.organizationId);
        const data = await Invoice.aggregate([
            { $match: { organizationId: organizationId } },
            { 
                $group: { 
                    _id: "$status", 
                    count: { $sum: 1 } 
                } 
            }
        ]);
        res.json(data);
    } catch (e) { 
        res.status(500).json({ message: e.message }); 
    }
};

module.exports = {
    getStats,
    getRevenueChart,
    getTopProducts,
    getOrderStatus
};