// server/routes/product.routes.js
const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct, getProductHistory } = require('../controllers/product.controller');

// Lưu ý: Chúng ta không cần gọi 'protect' ở đây, 
// vì chúng ta sẽ gọi nó ở server.js trước khi vào file này.

router.get('/', getProducts);         // GET /api/products
router.post('/', createProduct);      // POST /api/products
router.put('/:id', updateProduct);    // PUT /api/products/:id
router.delete('/:id', deleteProduct); // DELETE /api/products/:id

router.get('/history/:productId', getProductHistory); // GET /api/products/history/:id (Đổi đường dẫn 1 chút cho gọn)

module.exports = router;