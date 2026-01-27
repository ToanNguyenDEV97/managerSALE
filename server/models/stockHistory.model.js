const mongoose = require('mongoose');
const { Schema } = mongoose;

const stockHistorySchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    
    type: { 
        type: String, 
        enum: ['import', 'export', 'adjustment', 'return'], 
        required: true 
    }, // import: Nhập, export: Xuất (Bán), adjustment: Kiểm kho, return: Trả hàng

    quantity: { type: Number, required: true }, // Số lượng thay đổi (dương hoặc âm)
    oldStock: { type: Number, required: true }, // Tồn trước khi đổi
    newStock: { type: Number, required: true }, // Tồn sau khi đổi
    
    reference: { type: String }, // Mã phiếu liên quan (Mã đơn hàng, Mã phiếu nhập...)
    referenceId: { type: Schema.Types.ObjectId }, // ID của phiếu liên quan

    note: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

module.exports = mongoose.model('StockHistory', stockHistorySchema);