const express = require('express');
const router = express.Router();
const { login, registerRequest, checkOtp, registerVerify } = require('../controllers/auth.controller');

router.post('/login', login);
router.post('/register-request', registerRequest);
router.post('/check-otp', checkOtp);
router.post('/register-verify', registerVerify);

module.exports = router;