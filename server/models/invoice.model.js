const mongoose = require('mongoose');
const { Schema } = mongoose;

const { INVOICE_STATUS } = require('../utils/constants');

const invoiceItemSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true }, // Chuẩn hóa ObjectId
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }, // Giá bán
    costPrice: { type: Number, required: true }, // Giá vốn (Snapshot lúc bán)
    discount: { type: Number, default: 0 }
}, { _id: false });

const invoiceSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    invoiceNumber: { type: String, required: true },
    customerId: { type: String, default: null }, // Có thể null nếu khách vãng lai không lưu
    customerName: { type: String, required: true },
    issueDate: { type: Date, default: Date.now }, // Dùng Date chuẩn để dễ sort/filter
    items: [invoiceItemSchema],
    
    totalAmount: { type: Number, required: true }, // Tổng tiền hàng
    discountAmount: { type: Number, default: 0 },  // Giảm giá tổng đơn
    finalAmount: { type: Number, required: true }, // Khách cần trả (Total - Discount)
    paidAmount: { type: Number, required: true, default: 0 }, // Khách đã trả
    
    paymentMethod: { type: String, enum: ['Tiền mặt', 'Chuyển khoản', 'Công nợ', 'Khác'], default: 'Tiền mặt' }, // [MỚI]
    status: { type: String, required: true, enum: Object.values(INVOICE_STATUS), default: INVOICE_STATUS.UNPAID },

    note: String,
    orderId: { type: String },
    isDelivery: { type: Boolean, default: false },
    delivery: {
        address: String,
        receiverName: String,
        phone: String,
        shipFee: Number,
        status: String
    }
}, {
    timestamps: true
});

// Compound Index
invoiceSchema.index({ organizationId: 1, invoiceNumber: 1 }, { unique: true });

// Virtual ID
invoiceSchema.virtual('id').get(function(){ return this._id.toHexString(); });
invoiceSchema.set('toJSON', { virtuals: true, transform: (doc, ret) => { delete ret._id; delete ret.__v; } });

const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = Invoice;