const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: { 
        type: String 
    },
    role: {
        type: String,
        enum: ['owner', 'nhanvien'], 
        default: 'nhanvien'
    },
    organizationId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Organization',
        // [QUAN TRỌNG] Bỏ 'required: true' để bước 1 tạo user tạm không bị lỗi
        index: true
    },
    // [THÊM LẠI] Các trường phục vụ OTP
    otp: { type: String },
    otpExpires: { type: Date }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    // Nếu không sửa password hoặc password rỗng (lúc tạo OTP) thì bỏ qua
    if (!this.isModified('password') || !this.password) { 
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare password for login
userSchema.methods.comparePassword = async function (enteredPassword) {
    if (!this.password) return false; 
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

userSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) { delete ret._id; delete ret.__v; delete ret.password; delete ret.otp; }
});

const User = mongoose.model('User', userSchema);
module.exports = User;