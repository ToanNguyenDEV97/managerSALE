const Joi = require('joi');

const createProduct = {
    body: Joi.object().keys({
        // Các trường bắt buộc
        name: Joi.string().required().messages({ 'any.required': 'Tên sản phẩm là bắt buộc' }),
        price: Joi.number().min(0).required().messages({ 
            'number.min': 'Giá bán không được âm',
            'any.required': 'Giá bán là bắt buộc'
        }),
        
        // Các trường tùy chọn (nhưng nếu có thì phải đúng định dạng)
        sku: Joi.string().allow('', null),
        importPrice: Joi.number().min(0).default(0),
        stock: Joi.number().integer().min(0).default(0),
        category: Joi.string().allow('', null),
        unit: Joi.string().default('Cái'),
        image: Joi.string().allow('', null),
        description: Joi.string().allow('', null),
        
        // Cho phép thêm các trường khác nếu frontend gửi thừa (hoặc dùng .unknown(true))
        vat: Joi.number().min(0).max(100).default(0)
    })
};

const updateProduct = {
    params: Joi.object().keys({
        id: Joi.string().required().length(24).messages({ 'string.length': 'ID sản phẩm không hợp lệ' })
    }),
    body: Joi.object().keys({
        name: Joi.string(),
        price: Joi.number().min(0),
        importPrice: Joi.number().min(0),
        stock: Joi.number().integer().min(0),
        sku: Joi.string().allow('', null),
        category: Joi.string().allow('', null),
        unit: Joi.string(),
        image: Joi.string().allow('', null),
        description: Joi.string().allow('', null),
        vat: Joi.number().min(0).max(100)
    }).min(1) // Phải gửi ít nhất 1 trường để update
};

module.exports = {
    createProduct,
    updateProduct
};