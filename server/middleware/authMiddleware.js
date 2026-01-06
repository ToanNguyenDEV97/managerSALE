const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        // 1. Lấy token từ header
        const authHeader = req.header('Authorization');
        
        // Kiểm tra xem header có tồn tại không
        if (!authHeader) {
            return res.status(401).json({ message: 'Không tìm thấy Token xác thực' });
        }

        // 2. Tách chuỗi "Bearer <token>"
        // Nếu client gửi lên mà không có chữ Bearer hoặc format sai, nó sẽ handle ở đây
        const token = authHeader.replace('Bearer ', '').trim();

        if (!token) {
            return res.status(401).json({ message: 'Token trống' });
        }

        // 3. Verify Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        
        // Gán thông tin user vào request để dùng ở controller tiếp theo
        req.user = decoded; 
        req.organizationId = decoded.organizationId; // Nếu có dùng organization
        
        next();

    } catch (err) {
        console.error("Auth Error:", err.message);

        // Phân loại lỗi trả về cho rõ ràng
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn' });
        }
        
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token không hợp lệ (Malformed)' });
        }

        return res.status(401).json({ message: 'Xác thực thất bại' });
    }
};

module.exports = authMiddleware;