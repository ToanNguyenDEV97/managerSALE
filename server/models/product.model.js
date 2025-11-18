const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    sku: { type: String, required: true }, // Bỏ unique ở đây
    name: { type: String, required: true },
    category: { type: String, required: true },
    unit: { type: String, required: true },
    price: { type: Number, required: true },
    costPrice: { type: Number, required: true },
    stock: { type: Number, required: true },
    vat: { type: Number, required: true },
}, {
    timestamps: true
});

// Thêm Compound Index: SKU phải là duy nhất TRONG CÙNG MỘT TỔ CHỨC
productSchema.index({ organizationId: 1, sku: 1 }, { unique: true });

productSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

productSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) { delete ret._id; delete ret.__v; }
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;