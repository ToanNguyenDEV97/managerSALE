const Joi = require('joi');

const createDelivery = {
    body: Joi.object().keys({
        invoiceId: Joi.string().required().length(24).hex(),
        customerId: Joi.string().required().length(24).hex(),
        customerName: Joi.string().required(),
        customerAddress: Joi.string().required(),
        customerPhone: Joi.string().required(),
        issueDate: Joi.string().required(),
        deliveryDate: Joi.string().required(),
        driverName: Joi.string().allow('', null),
        vehicleNumber: Joi.string().allow('', null),
        status: Joi.string().valid('Chờ giao', 'Đang giao', 'Đã giao thành công', 'Giao thất bại').default('Chờ giao'),
        notes: Joi.string().allow('', null)
    })
};

const updateDelivery = {
    params: Joi.object().keys({ id: Joi.string().required().length(24).hex() }),
    body: Joi.object().keys({
        status: Joi.string().valid('Chờ giao', 'Đang giao', 'Đã giao thành công', 'Giao thất bại'),
        driverName: Joi.string().allow('', null),
        vehicleNumber: Joi.string().allow('', null),
        notes: Joi.string().allow('', null),
        deliveryDate: Joi.string()
    }).min(1)
};

module.exports = { createDelivery, updateDelivery };