const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { createDelivery, updateDelivery } = require('../validations/delivery.validation');
const { checkId } = require('../validations/common.validation');
const deliveryController = require('../controllers/delivery.controller');

router.get('/', deliveryController.getDeliveries);
router.get('/:id', validate(checkId), deliveryController.getDeliveryById);
router.post('/', validate(createDelivery), deliveryController.createDelivery);
router.put('/:id', validate(updateDelivery), deliveryController.updateDelivery);
router.delete('/:id', validate(checkId), deliveryController.deleteDelivery);

module.exports = router;