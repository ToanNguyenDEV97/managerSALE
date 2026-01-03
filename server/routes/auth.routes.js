const express = require('express');
const router = express.Router();
const { login, registerRequest, checkOtp, registerVerify, getMe, createEmployee } = require('../controllers/auth.controller');

// Import Middleware và Schema
const validate = require('../middleware/validate'); 
const authValidation = require('../validations/auth.validation');
const { protect } = require('../middleware/authMiddleware'); // Import protect middleware

// Áp dụng validate() trước khi vào controller
router.post('/register-request', validate(authValidation.registerRequest), registerRequest);
router.post('/check-otp', validate(authValidation.checkOtp), checkOtp);
router.post('/register-verify', validate(authValidation.registerVerify), registerVerify);
router.post('/login', validate(authValidation.login), login);

// Riêng route này cần cả Login (protect) và Validate
router.put('/profile', protect, validate(authValidation.updateProfile), async (req, res) => {
    // (Logic update profile bạn có thể chuyển vào controller sau này cho gọn)
    // Tạm thời gọi controller hoặc xử lý tại chỗ như cũ
    const User = require('../models/user.model');
    try {
        const { currentPassword, newPassword, displayName } = req.body;
        const user = await User.findById(req.user.id);

        if (displayName) user.displayName = displayName;

        if (newPassword && currentPassword) {
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
            user.password = newPassword;
        }
        
        await user.save();
        res.json({ message: 'Cập nhật thành công', user });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Đường dẫn thực tế sẽ là: GET /api/auth/me
router.get('/me', protect, getMe);

router.post('/create-employee', protect, createEmployee); // Cần protect để biết ai đang gọi

module.exports = router;