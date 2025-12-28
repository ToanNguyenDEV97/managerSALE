const getNextSequence = async (model, prefix, organizationId) => {
    const sequenceField = {
        'HD': 'invoiceNumber', 'PT': 'transactionNumber', 'PC': 'transactionNumber',
        'PN': 'purchaseNumber', 'BG': 'quoteNumber', 'DH': 'orderNumber',
        'PGH': 'deliveryNumber', 'PKK': 'checkNumber', 'SP': 'sku',
        'TH': 'returnNumber'
    }[prefix];
    
    const lastDoc = await model.findOne({ organizationId, [sequenceField]: new RegExp('^' + prefix) }).sort({ [sequenceField]: -1 });
    if (!lastDoc || !lastDoc[sequenceField]) return `${prefix}-00001`;

    const lastNumStr = lastDoc[sequenceField].split('-')[1];
    const lastNum = parseInt(lastNumStr, 10);
    return `${prefix}-${(lastNum + 1).toString().padStart(5, '0')}`;
};

module.exports = { getNextSequence };