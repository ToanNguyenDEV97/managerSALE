const Joi = require('joi');

const createCustomer = {
    body: Joi.object().keys({
        name: Joi.string().required().trim().messages({
            'any.required': 'Tên khách hàng là bắt buộc',
            'string.empty': 'Tên khách hàng không được để trống'
        }),
        phone: Joi.string().allow('', null).pattern(/^[0-9]{10,11}$/).messages({
            'string.pattern.base': 'Số điện thoại không hợp lệ'
        }),
        address: Joi.string().allow('', null),
        taxCode: Joi.string().allow('', null),
        // Chặn không cho gửi debt (công nợ) khi tạo mới, công nợ phải = 0
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
        phone: Joi.string().allow('', null).pattern(/^[0-9]{10,11}$/),
        address: Joi.string().allow('', null),
        taxCode: Joi.string().allow('', null),
        // Có cho phép sửa nợ trực tiếp không? Thường là không, nợ thay đổi qua giao dịch.
        // Nếu muốn fix nợ thủ công thì để, còn không nên chặn.
        debt: Joi.number().optional() 
    }).min(1)
};

module.exports = {
    createCustomer,
    updateCustomer
};