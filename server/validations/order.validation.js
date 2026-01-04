const Joi = require('joi');

const orderItemSchema = Joi.object().keys({
    productId: Joi.string().required().length(24).hex(),
    quantity: Joi.number().integer().min(1).required(),
    price: Joi.number().min(0).required()
});

const createOrder = {
    body: Joi.object().keys({
        customerId: Joi.string().allow(null, '').length(24).hex(),
        items: Joi.array().items(orderItemSchema).min(1).required(),
        
        // Đổi tên biến ở frontend hoặc backend cho khớp. 
        // Ở đây mình giữ backend là paymentAmount cho đúng logic cọc/trả
        paymentAmount: Joi.number().min(0).default(0), 
        
        // --- THÊM CHO PHÉP ---
        paymentMethod: Joi.string().valid('Tiền mặt', 'Chuyển khoản', 'Công nợ', 'Thẻ').default('Tiền mặt'),
        
        note: Joi.string().allow('', null),
        
        deliveryInfo: Joi.object().keys({
            isDelivery: Joi.boolean().default(false),
            address: Joi.string().when('isDelivery', { is: true, then: Joi.required() }),
            phone: Joi.string().when('isDelivery', { is: true, then: Joi.required() }),
            shipFee: Joi.number().min(0).default(0)
        }).optional()
    })
};

const updateOrder = {
    params: Joi.object().keys({
        id: Joi.string().required().length(24).hex()
    }),
    body: Joi.object().keys({
        status: Joi.string().valid('Mới', 'Hoàn thành', 'Hủy').required(),
        note: Joi.string().allow('', null)
    })
};

module.exports = { createOrder, updateOrder };