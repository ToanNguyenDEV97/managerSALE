const Joi = require('joi');

// Schema con cho từng sản phẩm trong đơn hàng
const orderItemSchema = Joi.object().keys({
    productId: Joi.string().required().length(24).hex().messages({
        'any.required': 'Sản phẩm là bắt buộc',
        'string.length': 'ID sản phẩm không hợp lệ'
    }),
    quantity: Joi.number().integer().min(1).required().messages({
        'number.min': 'Số lượng phải lớn hơn 0',
        'any.required': 'Số lượng là bắt buộc'
    }),
    // Cho phép override giá bán hoặc không
    price: Joi.number().min(0).required()
});

const createOrder = {
    body: Joi.object().keys({
        customerId: Joi.string().allow(null, '').length(24).hex(), // Khách lẻ thì null
        // Validate mảng items
        items: Joi.array().items(orderItemSchema).min(1).required().messages({
            'array.min': 'Đơn hàng phải có ít nhất 1 sản phẩm',
            'any.required': 'Danh sách sản phẩm là bắt buộc'
        }),
        paymentAmount: Joi.number().min(0).default(0), // Tiền khách trả/cọc
        note: Joi.string().allow('', null),
        
        // Validate thông tin giao hàng (nếu có)
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

module.exports = {
    createOrder,
    updateOrder
};