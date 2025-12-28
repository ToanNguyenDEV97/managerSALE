const express = require('express');
const router = express.Router();
const { getPurchases, createPurchase, returnPurchase } = require('../controllers/purchase.controller');

router.get('/', getPurchases);
router.post('/', createPurchase);
router.post('/:id/return', returnPurchase);

module.exports = router;