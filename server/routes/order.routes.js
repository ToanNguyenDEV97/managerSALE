const express = require('express');
const router = express.Router();
const { getOrders, createOrder, updateOrder, convertOrderToInvoice, convertQuoteToOrder } = require('../controllers/order.controller');

router.get('/', getOrders);
router.post('/', createOrder);
router.put('/:id', updateOrder);

// Custom Actions
router.post('/:id/to-invoice', convertOrderToInvoice);

// Lưu ý: Route chuyển từ Quote nằm bên Quote logic, nhưng nếu muốn để đây cũng được. 
// Tuy nhiên, logic chuẩn là POST /quotes/:id/convert-to-order thì nên để bên route quotes (hoặc import vào đây). 
// Ở đây mình tạm để route đặc biệt này để gọi từ Frontend:
router.post('/convert-quote/:id', convertQuoteToOrder);

module.exports = router;