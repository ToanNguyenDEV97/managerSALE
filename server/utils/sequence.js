const { PREFIXES } = require('./constants');

const getNextSequence = async (model, prefix, organizationId) => {
    // Mapping Prefix sang tên trường trong DB
    // (Dùng biến từ constants để đảm bảo đồng bộ)
    const fieldMap = {
        [PREFIXES.INVOICE]: 'invoiceNumber',
        [PREFIXES.PRODUCT]: 'sku',
        [PREFIXES.ORDER]: 'orderNumber',
        [PREFIXES.PURCHASE]: 'purchaseNumber',
        [PREFIXES.QUOTE]: 'quoteNumber',
        [PREFIXES.PAYMENT]: 'transactionNumber',
        [PREFIXES.PAYMENT_SLIP]: 'transactionNumber',
        [PREFIXES.DELIVERY]: 'deliveryNumber',
        [PREFIXES.CHECK]: 'checkNumber',
        [PREFIXES.RETURN]: 'returnNumber',

        'VC': 'deliveryNumber'
    };

    const sequenceField = fieldMap[prefix];
    if (!sequenceField) {
        // Log warning để biết đường debug
        console.warn(`Warning: Chưa config fieldMap cho prefix '${prefix}'. Đang dùng fallback.`);
        return `${prefix}-00001`; 
    }
    
    // Logic tìm số tiếp theo (Giữ nguyên)
    const lastDoc = await model.findOne({ 
        organizationId, 
        [sequenceField]: new RegExp('^' + prefix) 
    }).sort({ [sequenceField]: -1 });

    if (!lastDoc || !lastDoc[sequenceField]) return `${prefix}-00001`;

    try {
        const parts = lastDoc[sequenceField].split('-');
        const lastNumStr = parts[parts.length - 1];
        const lastNum = parseInt(lastNumStr, 10);
        
        if (isNaN(lastNum)) return `${prefix}-00001`;
        
        return `${prefix}-${(lastNum + 1).toString().padStart(5, '0')}`;
    } catch (e) {
        return `${prefix}-00001`;
    }
};

module.exports = { getNextSequence };