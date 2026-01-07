const Joi = require('joi');

const createTransaction = {
    body: Joi.object().keys({
        type: Joi.string().valid('thu', 'chi').required().messages({ 'any.only': 'Loại phiếu phải là thu hoặc chi' }),
        date: Joi.string().required(),
        amount: Joi.number().min(1).required().messages({ 'number.min': 'Số tiền phải lớn hơn 0' }),
        description: Joi.string().required(),
        payerReceiverName: Joi.string().allow('', null),
        payerReceiverAddress: Joi.string().allow('', null),
        category: Joi.string().valid('Chi phí hoạt động', 'Trả NCC', 'Lương', 'Thu nợ khách hàng', 'Khác', 'Chênh lệch kho', 'Doanh thu bán hàng').required(),
        inputVat: Joi.number().min(0).default(0)
    }),
    organizationId: Joi.string().allow('', null)
};

const updateTransaction = {
    params: Joi.object().keys({ id: Joi.string().required().length(24).hex() }),
    body: Joi.object().keys({
        type: Joi.string().valid('thu', 'chi'),
        date: Joi.string(),
        amount: Joi.number().min(1),
        description: Joi.string(),
        payerReceiverName: Joi.string().allow('', null),
        payerReceiverAddress: Joi.string().allow('', null),
        category: Joi.string().valid('Chi phí hoạt động', 'Trả NCC', 'Lương', 'Thu nợ khách hàng', 'Khác', 'Chênh lệch kho', 'Doanh thu bán hàng'),
        inputVat: Joi.number().min(0)
    }).min(1)
};

module.exports = { createTransaction, updateTransaction };