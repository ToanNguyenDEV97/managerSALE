// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const protect = async (req, res, next) => {
    let token;

    // 1. Kiểm tra header có dạng: "Bearer <token>"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Lấy token (bỏ chữ 'Bearer ')
            token = req.headers.authorization.split(' ')[1];

            // Giải mã token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Tìm user trong DB (trừ password)
            req.user = await User.findById(decoded.id).select('-password');
            
            // Lấy thêm organizationId để dùng cho các query khác
            if (req.user) {
                req.organizationId = req.user.organizationId;
            } else {
                return res.status(401).json({ message: 'Không tìm thấy User tương ứng với Token này' });
            }

            next();
        } catch (error) {
            console.error('Lỗi Auth Middleware:', error.message);
            return res.status(401).json({ message: 'Token không hợp lệ, vui lòng đăng nhập lại' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Không có Token, quyền truy cập bị từ chối' });
    }
};

module.exports = { protect };