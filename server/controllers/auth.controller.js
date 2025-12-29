const User = require('../models/user.model');
const Organization = require('../models/organization.model');
const transporter = require('../config/mail');
const { generateToken, generateOTP } = require('../utils/helpers');

// Đăng nhập
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !user.password || !(await user.comparePassword(password))) 
            return res.status(400).json({ message: 'Email hoặc mật khẩu sai' });
        
        const token = generateToken(user.id);
        res.json({ token, user: { id: user._id, email: user.email, role: user.role, organizationId: user.organizationId } });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// Gửi yêu cầu đăng ký
exports.registerRequest = async (req, res) => {
    try {
        const { email } = req.body;
        let user = await User.findOne({ email });
        if (user && user.role === 'owner') return res.status(400).json({ message: 'Email này đã được đăng ký.' });

        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

        if (!user) {
            user = new User({ email, otp, otpExpires, role: 'owner' });
        } else {
            user.otp = otp;
            user.otpExpires = otpExpires;
        }
        await user.save();

        await transporter.sendMail({
            from: '"ManagerSALE System" <no-reply@managersale.com>',
            to: email,
            subject: 'Mã xác thực đăng ký Owner - ManagerSALE',
            html: `<h3>Mã OTP của bạn là: <b style="color:blue; font-size:20px;">${otp}</b></h3><p>Hết hạn sau 5 phút.</p>`
        });
        res.json({ message: 'Mã OTP đã được gửi về email của bạn.' });
    } catch (err) { console.error(err); res.status(500).json({ message: 'Lỗi server: ' + err.message }); }
};

// Kiểm tra OTP
exports.checkOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Email chưa gửi yêu cầu.' });
        if (user.otp !== otp) return res.status(400).json({ message: 'Mã OTP không đúng.' });
        if (user.otpExpires < new Date()) return res.status(400).json({ message: 'Mã OTP đã hết hạn.' });
        res.json({ message: 'OTP hợp lệ.' });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// Hoàn tất đăng ký
exports.registerVerify = async (req, res) => {
    try {
        // 1. Nhận biến 'name' từ Frontend
        const { email, otp, password, name } = req.body;
        
        const user = await User.findOne({ email });
        // Kiểm tra OTP...
        if (!user || user.otp !== otp || user.otpExpires < new Date()) 
            return res.status(400).json({ message: 'OTP lỗi hoặc hết hạn.' });

        // 2. Tạo Organization với tên cửa hàng
        const newOrg = new Organization({ name: `Cửa hàng của ${name}`, email });
        await newOrg.save();

        // 3. Cập nhật User
        user.organizationId = newOrg._id;
        user.password = password; 
        
        // [QUAN TRỌNG] Lưu tên người dùng vào DB
        user.name = name; 

        user.otp = undefined; 
        user.otpExpires = undefined;
        
        await user.save();

        newOrg.ownerId = user._id;
        await newOrg.save();

        const token = generateToken(user.id);
        
        // Trả về kết quả
        res.json({ 
            message: 'Đăng ký thành công!', 
            token, 
            user: { 
                id: user._id, 
                email: user.email, 
                name: user.name, 
                role: 'owner', 
                organizationId: user.organizationId 
            } 
        });
    } catch (err) { 
        console.error("Lỗi đăng ký:", err); // Log lỗi ra terminal để dễ debug
        res.status(500).json({ message: err.message }); 
    }
};

// Lấy thông tin người dùng hiện tại
exports.getMe = async (req, res) => {
    try {
        // req.user đã được middleware 'protect' gán vào
        res.json(req.user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};