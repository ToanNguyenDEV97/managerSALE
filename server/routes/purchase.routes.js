const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { createPurchase } = require('../validations/purchase.validation');
const { checkId } = require('../validations/common.validation');
const controller = require('../controllers/purchase.controller');

router.get('/', controller.getPurchases);
router.post('/', validate(createPurchase), controller.createPurchase);
// Trả hàng cũng cần validate ID
router.post('/:id/return', validate(checkId), controller.returnPurchase);

module.exports = router;