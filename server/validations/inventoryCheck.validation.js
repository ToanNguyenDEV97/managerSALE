const Joi = require('joi');

const itemSchema = Joi.object().keys({
    productId: Joi.string().required().length(24).hex(),
    productName: Joi.string().required(),
    productSku: Joi.string().allow('', null),
    unit: Joi.string().allow('', null),
    stockOnHand: Joi.number().integer().min(0).required(), // Tồn phần mềm
    actualStock: Joi.number().integer().min(0).required(), // Tồn thực tế
    difference: Joi.number().integer().required(), // Chênh lệch (có thể âm)
    costPrice: Joi.number().min(0).required()
});

const createCheck = {
    body: Joi.object().keys({
        checkDate: Joi.string().required(),
        status: Joi.string().valid('Nháp', 'Hoàn thành').default('Nháp'),
        items: Joi.array().items(itemSchema).min(1).required(),
        notes: Joi.string().allow('', null)
    })
};

const updateCheck = {
    params: Joi.object().keys({ id: Joi.string().required().length(24).hex() }),
    body: Joi.object().keys({
        status: Joi.string().valid('Nháp', 'Hoàn thành'),
        items: Joi.array().items(itemSchema).min(1),
        notes: Joi.string().allow('', null),
        checkDate: Joi.string()
    }).min(1)
};

module.exports = { createCheck, updateCheck };