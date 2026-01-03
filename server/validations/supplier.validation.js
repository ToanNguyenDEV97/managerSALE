const Joi = require('joi');

const createSupplier = {
    body: Joi.object().keys({
        name: Joi.string().required().trim().messages({ 'any.required': 'Tên NCC là bắt buộc' }),
        phone: Joi.string().allow('', null).pattern(/^[0-9]{10,11}$/).messages({ 'string.pattern.base': 'SĐT không hợp lệ' }),
        address: Joi.string().allow('', null),
        taxCode: Joi.string().allow('', null),
        debt: Joi.forbidden() // Chặn set nợ khi tạo mới
    })
};

const updateSupplier = {
    params: Joi.object().keys({ id: Joi.string().required().length(24).hex() }),
    body: Joi.object().keys({
        name: Joi.string().trim(),
        phone: Joi.string().allow('', null).pattern(/^[0-9]{10,11}$/),
        address: Joi.string().allow('', null),
        taxCode: Joi.string().allow('', null),
        debt: Joi.number().optional() // Cho phép sửa công nợ nếu cần thiết
    }).min(1)
};

module.exports = { createSupplier, updateSupplier };