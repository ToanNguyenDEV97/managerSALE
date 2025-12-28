const express = require('express');
const router = express.Router();
const { getInvoices, getInvoiceById, createInvoice, updateInvoice, deleteInvoice, returnInvoice, payInvoice, getInvoiceHistory } = require('../controllers/invoice.controller');

router.get('/', getInvoices);
router.post('/', createInvoice);
router.get('/:id', getInvoiceById);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

// Custom Actions
router.post('/:id/return', returnInvoice);
router.post('/:id/payment', payInvoice);
router.get('/:invoiceNumber/history', getInvoiceHistory);

module.exports = router;