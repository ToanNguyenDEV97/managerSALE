const express = require('express');
const router = express.Router();
// Chú ý đường dẫn '../controllers/dashboard.controller' phải chính xác
const controller = require('../controllers/dashboard.controller'); 
const { protect } = require('../middleware/authMiddleware');

// Kiểm tra kỹ xem controller có undefined không
if (!controller.getStats || !controller.getRevenueChart || !controller.getTopProducts || !controller.getOrderStatus) {
    console.error("LỖI: Một số hàm trong dashboard.controller.js chưa được export!");
}

router.get('/stats', protect, controller.getStats);
router.get('/chart-revenue', protect, controller.getRevenueChart);
router.get('/chart-products', protect, controller.getTopProducts);
router.get('/chart-status', protect, controller.getOrderStatus);

module.exports = router;