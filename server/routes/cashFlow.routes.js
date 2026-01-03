const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { createTransaction, updateTransaction } = require('../validations/cashFlow.validation');
const { checkId } = require('../validations/common.validation');
const controller = require('../controllers/cashFlow.controller');

router.get('/', controller.getAll);
router.get('/:id', validate(checkId), controller.getById);
router.post('/', validate(createTransaction), controller.create);
router.put('/:id', validate(updateTransaction), controller.update);
router.delete('/:id', validate(checkId), controller.delete);

module.exports = router;