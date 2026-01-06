const express = require('express');
const router = express.Router();

// [1] Import đầy đủ các hàm từ controller (bao gồm updateProfile vừa thêm)
const { 
    login, 
    registerRequest, 
    checkOtp, 
    registerVerify, 
    getMe, 
    createEmployee, 
    updateProfile 
} = require('../controllers/auth.controller');

// Import Middleware và Schema
const validate = require('../middleware/validate'); 
const authValidation = require('../validations/auth.validation');
const { protect } = require('../middleware/authMiddleware');

// Các routes Auth cơ bản
router.post('/register-request', validate(authValidation.registerRequest), registerRequest);
router.post('/check-otp', validate(authValidation.checkOtp), checkOtp);
router.post('/register-verify', validate(authValidation.registerVerify), registerVerify);
router.post('/login', validate(authValidation.login), login);

// [2] Route cập nhật profile (đã gọn hơn rất nhiều)
router.put('/profile', protect, validate(authValidation.updateProfile), updateProfile);

// Route lấy thông tin User
router.get('/me', protect, getMe);

// Route tạo nhân viên
router.post('/create-employee', protect, createEmployee);

module.exports = router;