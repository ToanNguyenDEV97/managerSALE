const mongoose = require('mongoose');
const { Schema } = mongoose;

const inventoryCheckItemSchema = new Schema({
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    productSku: { type: String, required: true },
    unit: { type: String, required: true },
    stockOnHand: { type: Number, required: true },
    actualStock: { type: Number, required: true },
    difference: { type: Number, required: true },
    costPrice: { type: Number, required: true },
}, { _id: false });

const inventoryCheckSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    checkNumber: { type: String, required: true }, // Bỏ unique ở đây
    checkDate: { type: String, required: true },
    status: { type: String, required: true, enum: ['Nháp', 'Hoàn thành'], default: 'Nháp' },
    items: [inventoryCheckItemSchema],
    notes: { type: String },
}, {
    timestamps: true
});

// Thêm Compound Index: checkNumber phải là duy nhất TRONG CÙNG MỘT TỔ CHỨC
inventoryCheckSchema.index({ organizationId: 1, checkNumber: 1 }, { unique: true });

inventoryCheckSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

inventoryCheckSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) { delete ret._id; delete ret.__v; }
});

const InventoryCheck = mongoose.model('InventoryCheck', inventoryCheckSchema);
module.exports = InventoryCheck;