const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate'); // Import middleware
const customerValidation = require('../validations/customer.validation'); // Import schema
const { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer } = require('../controllers/customer.controller');

router.get('/', getCustomers);
router.get('/:id', getCustomerById); // Nên thêm validate param ID nếu muốn kỹ

// Áp dụng validation middleware
router.post('/', validate(customerValidation.createCustomer), createCustomer);
router.put('/:id', validate(customerValidation.updateCustomer), updateCustomer);

router.delete('/:id', deleteCustomer);

module.exports = router;