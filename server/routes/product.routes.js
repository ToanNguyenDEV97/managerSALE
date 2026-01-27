const express = require('express');
const router = express.Router();

// [THÊM DÒNG NÀY] Import Controller
const productController = require('../controllers/product.controller'); 

// Import Middleware và Validation (bạn đã có)
const validate = require('../middleware/validate'); 
const productValidation = require('../validations/product.validation'); 

// ... Các đoạn code router bên dưới giữ nguyên
router.get('/', productController.getProducts);
router.get('/:id/stock-history', productController.getProductStockHistory);
router.post('/', validate(productValidation.createProduct), productController.createProduct);
router.put('/:id', validate(productValidation.updateProduct), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;