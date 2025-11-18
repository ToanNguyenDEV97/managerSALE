const mongoose = require('mongoose');
const { Schema } = mongoose;

const cashFlowTransactionSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    transactionNumber: { type: String, required: true }, // Bỏ unique ở đây
    type: { type: String, required: true, enum: ['thu', 'chi'] },
    date: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    payerReceiverName: { type: String },
    payerReceiverAddress: { type: String },
    category: { type: String, enum: ['Chi phí hoạt động', 'Trả NCC', 'Lương', 'Thu nợ KH', 'Khác', 'Chênh lệch kho'] },
    inputVat: { type: Number, default: 0 },
}, {
    timestamps: true
});

// Thêm Compound Index: transactionNumber phải là duy nhất TRONG CÙNG MỘT TỔ CHỨC
cashFlowTransactionSchema.index({ organizationId: 1, transactionNumber: 1 }, { unique: true });

cashFlowTransactionSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

cashFlowTransactionSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) { delete ret._id; delete ret.__v; }
});

const CashFlowTransaction = mongoose.model('CashFlowTransaction', cashFlowTransactionSchema);
module.exports = CashFlowTransaction;