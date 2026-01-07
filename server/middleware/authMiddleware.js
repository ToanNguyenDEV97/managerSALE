// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/user.model'); // [THÊM] Import User Model

const authMiddleware = async (req, res, next) => { // [SỬA] Thêm async
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return res.status(401).json({ message: 'Không tìm thấy Token xác thực' });
        }

        const token = authHeader.replace('Bearer ', '').trim();

        if (!token) {
            return res.status(401).json({ message: 'Token trống' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        
        // [FIX QUAN TRỌNG] Lấy thông tin User mới nhất từ DB
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ message: 'User không tồn tại' });
        }

        // Gán user và organizationId vào request
        req.user = user; 
        req.organizationId = user.organizationId; 
        
        next();

    } catch (err) {
        console.error("Auth Error:", err.message);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn' });
        }
        return res.status(401).json({ message: 'Xác thực thất bại' });
    }
};

module.exports = { protect: authMiddleware };