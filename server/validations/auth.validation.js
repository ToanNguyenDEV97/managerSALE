// server/validations/auth.validation.js
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
        displayName: Joi.string().required(),
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
        displayName: Joi.string(),
        currentPassword: Joi.string(),
        newPassword: Joi.string().min(6).when('currentPassword', {
            is: Joi.exist(),
            then: Joi.required(),
            otherwise: Joi.optional()
        })
    })
};

module.exports = {
    registerRequest,
    checkOtp,
    registerVerify,
    login,
    updateProfile
};