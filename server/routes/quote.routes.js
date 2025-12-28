const express = require('express');
const router = express.Router();
const { getQuotes, getQuoteById, createQuote, updateQuote, deleteQuote } = require('../controllers/quote.controller');

router.get('/', getQuotes);
router.get('/:id', getQuoteById);
router.post('/', createQuote);
router.put('/:id', updateQuote);
router.delete('/:id', deleteQuote);

module.exports = router;