const express = require('express');
const router = express.Router();
const controller = require('../controllers/dashboard.controller'); 

// Kiểm tra controller
if (!controller.getStats) {
    console.error("LỖI: Dashboard Controller chưa export đúng!");
}

// Không cần 'protect' ở đây nữa vì server.js đã có app.use(..., protect, ...)
router.get('/stats', controller.getStats);
router.get('/chart-revenue', controller.getRevenueChart);
router.get('/chart-products', controller.getTopProducts);
router.get('/chart-status', controller.getOrderStatus);

module.exports = router;