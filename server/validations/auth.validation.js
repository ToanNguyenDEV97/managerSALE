const Joi = require('joi');

const registerRequest = {
    body: Joi.object().keys({
        email: Joi.string().required().email().messages({
            'string.email': 'Email không hợp lệ',
            'any.required': 'Vui lòng nhập email'
        }),
    }),
};

const checkOtp = {
    body: Joi.object().keys({
        email: Joi.string().required().email(),
        otp: Joi.string().required().length(6).messages({
            'string.length': 'Mã OTP phải có đúng 6 ký tự'
        })
    }),
};

const registerVerify = {
    body: Joi.object().keys({
        email: Joi.string().required().email(),
        otp: Joi.string().required(),
        password: Joi.string().required().min(6).messages({
            'string.min': 'Mật khẩu phải có ít nhất 6 ký tự'
        }),
        // [QUAN TRỌNG] Bắt buộc phải là 'name' để khớp với Frontend
        name: Joi.string().required().messages({
            'any.required': 'Tên cửa hàng là bắt buộc'
        }),
    }),
};

const login = {
    body: Joi.object().keys({
        email: Joi.string().required().email(),
        password: Joi.string().required(),
    }),
};

const updateProfile = {
    body: Joi.object().keys({
        name: Joi.string().required().messages({
            'string.empty': 'Tên không được để trống',
            'any.required': 'Vui lòng nhập tên hiển thị'
        }),
    }),
};

module.exports = {
    registerRequest,
    checkOtp,
    registerVerify,
    login,
    updateProfile
};