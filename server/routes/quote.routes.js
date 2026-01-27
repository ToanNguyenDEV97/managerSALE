const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quote.controller');
const validate = require('../middleware/validate');
const { checkId } = require('../validations/common.validation');

// Định nghĩa các endpoints
router.get('/', quoteController.getQuotes);
router.post('/', quoteController.createQuote);
router.put('/:id', validate(checkId), quoteController.updateQuote);
router.delete('/:id', validate(checkId), quoteController.deleteQuote);

module.exports = router;