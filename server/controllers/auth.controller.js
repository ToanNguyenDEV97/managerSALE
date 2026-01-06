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
        
        // [FIX] Trả về đầy đủ thông tin (gồm name) và KHÔNG trả password
        res.json({ 
            token, 
            user: { 
                id: user._id, 
                email: user.email, 
                name: user.name, // Thêm trường này
                role: user.role, 
                organizationId: user.organizationId 
            } 
        });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// Gửi yêu cầu đăng ký
exports.registerRequest = async (req, res) => {
    try {
        const { email } = req.body;
        let user = await User.findOne({ email });
        if (user && user.role === 'owner' && user.organizationId) {
            return res.status(400).json({ message: 'Email này đã được đăng ký' });
        }

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
        const { email, otp, password, name } = req.body;
        
        const user = await User.findOne({ email });
        if (!user || user.otp !== otp || user.otpExpires < new Date()) 
            return res.status(400).json({ message: 'OTP lỗi hoặc hết hạn.' });

        const newOrg = new Organization({ name: `Cửa hàng của ${name}`, email });
        await newOrg.save();

        user.organizationId = newOrg._id;
        user.password = password; 
        user.name = name; 
        user.otp = undefined; 
        user.otpExpires = undefined;
        
        await user.save();

        newOrg.ownerId = user._id;
        await newOrg.save();

        const token = generateToken(user.id);
        
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
        console.error("Lỗi đăng ký:", err);
        res.status(500).json({ message: err.message }); 
    }
};

// Lấy thông tin người dùng hiện tại
exports.getMe = async (req, res) => {
    try {
        const user = req.user; // Đã có từ middleware protect
        // [FIX BẢO MẬT] Chỉ trả về các trường an toàn
        res.json({
            id: user._id || user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Cập nhật thông tin cá nhân (Chuyển từ routes vào đây)
exports.updateProfile = async (req, res) => {
    try {
        const { name } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id, 
            { name }, 
            { new: true }
        ).select('-password');

        if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });

        res.json({
            message: 'Cập nhật thành công',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                organizationId: user.organizationId
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Tạo tài khoản cho nhân viên
exports.createEmployee = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const owner = await User.findById(req.user.id);
        
        if (!owner || !owner.organizationId) {
            return res.status(400).json({ message: 'Chỉ chủ cửa hàng mới được tạo nhân viên' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email này đã tồn tại' });

        const newUser = new User({
            email,
            password,
            name,
            role: 'nhanvien',
            organizationId: owner.organizationId
        });

        await newUser.save();

        res.json({ message: 'Tạo nhân viên thành công', user: { email: newUser.email, name: newUser.name } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // 1. Tìm user
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User không tồn tại' });

        // 2. Kiểm tra mật khẩu cũ
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
        }

        // 3. Gán mật khẩu mới (Model sẽ tự hash)
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Đổi mật khẩu thành công!' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};