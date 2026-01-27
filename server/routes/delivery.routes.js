const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { checkId } = require('../validations/common.validation');
const deliveryController = require('../controllers/delivery.controller');

// 1. Lấy danh sách vận đơn
router.get('/', deliveryController.getDeliveries);

// 2. Cập nhật trạng thái (QUAN TRỌNG: Đây là route đang bị thiếu)
router.put('/:id/status', validate(checkId), deliveryController.updateStatus);

// 3. Xóa vận đơn
router.delete('/:id', validate(checkId), deliveryController.deleteDelivery);

module.exports = router;