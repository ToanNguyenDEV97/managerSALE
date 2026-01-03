const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { createCategory, updateCategory } = require('../validations/category.validation');
const { checkId } = require('../validations/common.validation'); // Import checkId chung
const controller = require('../controllers/category.controller');

router.get('/', controller.getCategories);
router.post('/', validate(createCategory), controller.createCategory);
router.put('/:id', validate(updateCategory), controller.updateCategory);
router.delete('/:id', validate(checkId), controller.deleteCategory);

module.exports = router;