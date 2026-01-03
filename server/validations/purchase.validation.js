const Joi = require('joi');

const itemSchema = Joi.object().keys({
    productId: Joi.string().required().length(24).hex(),
    name: Joi.string().required(),
    quantity: Joi.number().integer().min(1).required(),
    costPrice: Joi.number().min(0).required()
});

const createPurchase = {
    body: Joi.object().keys({
        supplierId: Joi.string().required().length(24).hex().messages({ 'any.required': 'Phải chọn nhà cung cấp' }),
        supplierName: Joi.string().allow('', null), // Có thể lấy từ BE hoặc FE gửi lên
        issueDate: Joi.string().required(), // Dạng chuỗi hoặc ISO date
        items: Joi.array().items(itemSchema).min(1).required().messages({ 'array.min': 'Phiếu nhập phải có ít nhất 1 sản phẩm' }),
        totalAmount: Joi.number().min(0).required()
    })
};

module.exports = { createPurchase };