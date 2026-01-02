// server/routes/delivery.routes.js
const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/delivery.controller');

// Các route đã được bảo vệ bởi middleware 'protect' ở server.js
router.get('/', deliveryController.getDeliveries);
router.get('/:id', deliveryController.getDeliveryById);
router.post('/', deliveryController.createDelivery);
router.put('/:id', deliveryController.updateDelivery);
router.delete('/:id', deliveryController.deleteDelivery);

module.exports = router;