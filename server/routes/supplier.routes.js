const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { createSupplier, updateSupplier } = require('../validations/supplier.validation');
const { checkId } = require('../validations/common.validation');
const controller = require('../controllers/supplier.controller');

router.get('/', controller.getSuppliers);
router.get('/:id', validate(checkId), controller.getSupplierById);
router.post('/', validate(createSupplier), controller.createSupplier);
router.put('/:id', validate(updateSupplier), controller.updateSupplier);
router.delete('/:id', validate(checkId), controller.deleteSupplier);

module.exports = router;