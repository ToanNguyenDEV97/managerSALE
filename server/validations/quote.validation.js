const Joi = require('joi');

const itemSchema = Joi.object().keys({
    productId: Joi.string().required().length(24).hex(),
    name: Joi.string().required(),
    quantity: Joi.number().integer().min(1).required(),
    price: Joi.number().min(0).required(),
    vat: Joi.number().min(0).max(100).default(0)
});

const createQuote = {
    body: Joi.object().keys({
        customerId: Joi.string().required().length(24).hex(),
        customerName: Joi.string().allow('', null),
        issueDate: Joi.string().required(),
        items: Joi.array().items(itemSchema).min(1).required(),
        totalAmount: Joi.number().min(0).required(),
        status: Joi.string().valid('Mới', 'Đã gửi', 'Đã chuyển đổi').default('Mới')
    })
};

const updateQuote = {
    params: Joi.object().keys({ id: Joi.string().required().length(24).hex() }),
    body: Joi.object().keys({
        customerId: Joi.string().length(24).hex(),
        customerName: Joi.string(),
        issueDate: Joi.string(),
        items: Joi.array().items(itemSchema).min(1),
        totalAmount: Joi.number().min(0),
        status: Joi.string().valid('Mới', 'Đã gửi', 'Đã chuyển đổi')
    }).min(1)
};

module.exports = { createQuote, updateQuote };