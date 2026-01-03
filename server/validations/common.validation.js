const Joi = require('joi');

const checkId = {
    params: Joi.object().keys({
        id: Joi.string().required().length(24).hex().messages({
            'string.length': 'ID không hợp lệ',
            'string.hex': 'ID phải là chuỗi hex 24 ký tự',
            'any.required': 'Thiếu ID trên URL'
        })
    })
};

module.exports = { checkId };