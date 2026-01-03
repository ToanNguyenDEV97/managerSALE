const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { createQuote, updateQuote } = require('../validations/quote.validation');
const { checkId } = require('../validations/common.validation');
const controller = require('../controllers/quote.controller');

router.get('/', controller.getQuotes);
router.get('/:id', validate(checkId), controller.getQuoteById);
router.post('/', validate(createQuote), controller.createQuote);
router.put('/:id', validate(updateQuote), controller.updateQuote);
router.delete('/:id', validate(checkId), controller.deleteQuote);

module.exports = router;