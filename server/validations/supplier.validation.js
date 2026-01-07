const Joi = require('joi');

const createSupplier = {
    body: Joi.object().keys({
        name: Joi.string().required().trim().messages({ 'any.required': 'Tên NCC là bắt buộc' }),
        phone: Joi.string().allow('', null).pattern(/^[0-9]{10,11}$/).messages({ 'string.pattern.base': 'SĐT không hợp lệ' }),
        address: Joi.string().allow('', null),
        taxCode: Joi.string().allow('', null),
        
        // [THÊM CÁC TRƯỜNG CÒN THIẾU]
        email: Joi.string().email().allow('', null),
        website: Joi.string().allow('', null),
        group: Joi.string().allow('', null),
        notes: Joi.string().allow('', null),

        // [QUAN TRỌNG] Cho phép gửi kèm organizationId
        organizationId: Joi.string().allow('', null),

        debt: Joi.forbidden() 
    })
};

const updateSupplier = {
    params: Joi.object().keys({ id: Joi.string().required().length(24).hex() }),
    body: Joi.object().keys({
        name: Joi.string().trim(),
        phone: Joi.string().allow('', null).pattern(/^[0-9]{10,11}$/),
        address: Joi.string().allow('', null),
        taxCode: Joi.string().allow('', null),
        
        email: Joi.string().email().allow('', null),
        website: Joi.string().allow('', null),
        group: Joi.string().allow('', null),
        notes: Joi.string().allow('', null),
        
        debt: Joi.number().optional()
    }).min(1)
};

module.exports = { createSupplier, updateSupplier };