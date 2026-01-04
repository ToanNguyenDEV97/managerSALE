const mongoose = require('mongoose');
const { Schema } = mongoose;

const { QUOTE_STATUS } = require('../utils/constants'); // Import

const quoteItemSchema = new Schema({
    productId: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    vat: { type: Number, required: true },
}, { _id: false });

const quoteSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    quoteNumber: { type: String, required: true }, // Bỏ unique ở đây
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    issueDate: { type: String, required: true },
    items: [quoteItemSchema],
    totalAmount: { type: Number, required: true },
    status: { type: String, required: true, enum: Object.values(QUOTE_STATUS), default: QUOTE_STATUS.NEW },
}, {
    timestamps: true
});

// Thêm Compound Index: quoteNumber phải là duy nhất TRONG CÙNG MỘT TỔ CHỨC
quoteSchema.index({ organizationId: 1, quoteNumber: 1 }, { unique: true });

quoteSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

quoteSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) { delete ret._id; delete ret.__v; }
});

const Quote = mongoose.model('Quote', quoteSchema);
module.exports = Quote;