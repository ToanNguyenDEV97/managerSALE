const mongoose = require('mongoose');
const { Schema } = mongoose;

const invoiceItemSchema = new Schema({
    productId: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    costPrice: { type: Number, required: true },
    vat: { type: Number, required: true },
}, { _id: false });

const invoiceSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    invoiceNumber: { type: String, required: true }, // Bỏ unique ở đây
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    issueDate: { type: String, required: true },
    items: [invoiceItemSchema],
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, required: true, default: 0 },
    status: { type: String, required: true, enum: ['Chưa thanh toán', 'Đã thanh toán', 'Quá hạn', 'Thanh toán một phần'], default: 'Chưa thanh toán' },
    orderId: { type: String },
    deliveryId: { type: String },
}, {
    timestamps: true
});

// Thêm Compound Index: invoiceNumber phải là duy nhất TRONG CÙNG MỘT TỔ CHỨC
invoiceSchema.index({ organizationId: 1, invoiceNumber: 1 }, { unique: true });

invoiceSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

invoiceSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) { delete ret._id; delete ret.__v; }
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = Invoice;