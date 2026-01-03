const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate'); // Import middleware
const orderValidation = require('../validations/order.validation'); // Import schema
const { getOrders, createOrder, updateOrder, convertOrderToInvoice, convertQuoteToOrder } = require('../controllers/order.controller');

router.get('/', getOrders);

// Áp dụng validation middleware
router.post('/', validate(orderValidation.createOrder), createOrder);
router.put('/:id', validate(orderValidation.updateOrder), updateOrder);

// Các route custom action cũng nên validate ID
// Ví dụ tạo 1 schema checkId đơn giản để dùng chung
router.post('/:id/to-invoice', convertOrderToInvoice); 
router.post('/convert-quote/:id', convertQuoteToOrder);

module.exports = router;