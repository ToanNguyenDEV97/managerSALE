const Joi = require('joi');

const createCategory = {
    body: Joi.object().keys({
        name: Joi.string().required().trim().messages({
            'any.required': 'Tên danh mục là bắt buộc',
            'string.empty': 'Tên danh mục không được để trống'
        })
    })
};

const updateCategory = {
    params: Joi.object().keys({
        id: Joi.string().required().length(24).hex()
    }),
    body: Joi.object().keys({
        name: Joi.string().required().trim()
    })
};

module.exports = { createCategory, updateCategory };