const Joi = require('joi');

const createCustomer = {
    body: Joi.object().keys({
        name: Joi.string().required().trim().messages({
            'any.required': 'Tên khách hàng là bắt buộc',
            'string.empty': 'Tên khách hàng không được để trống'
        }),
        
        // [QUAN TRỌNG] Validate chính xác SĐT Việt Nam
        phone: Joi.string()
            .required()
            .pattern(/^0[3|5|7|8|9][0-9]{8}$/) 
            .messages({
                'any.required': 'Số điện thoại là bắt buộc',
                'string.empty': 'Số điện thoại không được để trống',
                'string.pattern.base': 'Số điện thoại không hợp lệ'
            }),
            
        address: Joi.string().allow('', null),
        taxCode: Joi.string().allow('', null),
        
        // Các trường bổ sung
        group: Joi.string().allow('', null).default('Khách lẻ'),
        email: Joi.string().email().allow('', null).messages({
            'string.email': 'Email không hợp lệ'
        }),
        notes: Joi.string().allow('', null),
        
        debt: Joi.forbidden() 
    })
};

const updateCustomer = {
    params: Joi.object().keys({
        id: Joi.string().required().length(24).hex().messages({
            'string.length': 'ID khách hàng không hợp lệ'
        })
    }),
    body: Joi.object().keys({
        name: Joi.string().trim(),
        
        // Validate cả khi update
        phone: Joi.string().pattern(/^0[3|5|7|8|9][0-9]{8}$/).messages({
            'string.pattern.base': 'Số điện thoại không hợp lệ (Phải là 10 số, đầu 03, 05, 07, 08, 09)'
        }),
        
        address: Joi.string().allow('', null),
        taxCode: Joi.string().allow('', null),
        group: Joi.string().allow('', null),
        email: Joi.string().email().allow('', null),
        notes: Joi.string().allow('', null),
        
        debt: Joi.number().optional() 
    }).min(1)
};

module.exports = {
    createCustomer,
    updateCustomer
};