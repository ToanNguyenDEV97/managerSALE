const mongoose = require('mongoose');
const { Schema } = mongoose;

const purchaseItemSchema = new Schema({
    productId: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    costPrice: { type: Number, required: true },
}, { _id: false });

const purchaseSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    purchaseNumber: { type: String, required: true }, // Bỏ unique ở đây
    supplierId: { type: String, required: true },
    supplierName: { type: String, required: true },
    issueDate: { type: String, required: true },
    items: [purchaseItemSchema],
    totalAmount: { type: Number, required: true },
}, {
    timestamps: true
});

// Thêm Compound Index: purchaseNumber phải là duy nhất TRONG CÙNG MỘT TỔ CHỨC
purchaseSchema.index({ organizationId: 1, purchaseNumber: 1 }, { unique: true });

purchaseSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

purchaseSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) { delete ret._id; delete ret.__v; }
});

const Purchase = mongoose.model('Purchase', purchaseSchema);
module.exports = Purchase;