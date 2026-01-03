const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { createCheck, updateCheck } = require('../validations/inventoryCheck.validation');
const { checkId } = require('../validations/common.validation');
const controller = require('../controllers/inventoryCheck.controller');

router.get('/', controller.getAll);
router.get('/:id', validate(checkId), controller.getById);
router.post('/', validate(createCheck), controller.create);
router.put('/:id', validate(updateCheck), controller.update);
router.delete('/:id', validate(checkId), controller.delete);

module.exports = router;