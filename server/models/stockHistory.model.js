const mongoose = require('mongoose');
const { Schema } = mongoose;
// [1] Import
const { STOCK_TYPE } = require('../utils/constants');

const stockHistorySchema = new mongoose.Schema({
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    sku: { type: String },
    changeAmount: { type: Number, required: true }, // +10 hoặc -5
    balanceAfter: { type: Number, required: true }, // Tồn sau giao dịch
    type: { type: String, required: true, enum: Object.values(STOCK_TYPE) }, // Nhập hàng, Xuất hàng...
    referenceId: { type: mongoose.Schema.Types.ObjectId },
    referenceNumber: { type: String },
    note: { type: String },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

stockHistorySchema.index({ organizationId: 1, productId: 1, date: -1 });
module.exports = mongoose.model('StockHistory', stockHistorySchema);