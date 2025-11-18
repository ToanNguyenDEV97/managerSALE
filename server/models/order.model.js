const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderItemSchema = new Schema({
    productId: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    vat: { type: Number, required: true },
}, { _id: false });

const orderSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    orderNumber: { type: String, required: true }, // Bỏ unique ở đây
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    issueDate: { type: String, required: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    status: { type: String, required: true, enum: ['Chờ xử lý', 'Hoàn thành'], default: 'Chờ xử lý' },
    quoteId: { type: String },
}, {
    timestamps: true
});

// Thêm Compound Index: orderNumber phải là duy nhất TRONG CÙNG MỘT TỔ CHỨC
orderSchema.index({ organizationId: 1, orderNumber: 1 }, { unique: true });

orderSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

orderSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) { delete ret._id; delete ret.__v; }
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;