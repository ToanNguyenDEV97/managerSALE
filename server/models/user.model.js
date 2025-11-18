// File: models/user.model.js (Đã sửa hoàn chỉnh)

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true, // <-- Đã thêm lại từ file gốc
        trim: true       // <-- Đã thêm lại từ file gốc
    },
    googleId: { // Thêm: Dành cho Owner đăng nhập = Google
        type: String, 
        sparse: true, 
        unique: true 
    },
    password: { // Sửa: Không còn 'required'
        type: String 
    },
    role: {
        type: String,
        enum: ['owner', 'admin', 'nhanvien'], // Sửa: Thêm 'owner'
        required: true
    },
    organizationId: { // Thêm: Liên kết với Tổ chức
        type: Schema.Types.ObjectId, 
        ref: 'Organization', 
        required: true,
        index: true
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) { // Sửa: Kiểm tra nếu có password
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare password for login
userSchema.methods.comparePassword = async function (enteredPassword) {
    if (!this.password) return false; // Sửa: Nếu là Owner (không có pass) thì trả về false
    return await bcrypt.compare(enteredPassword, this.password);
};


userSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

userSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) { delete ret._id; delete ret.__v; delete ret.password; }
});

const User = mongoose.model('User', userSchema);
module.exports = User;