const mongoose = require('mongoose');
const { Schema } = mongoose;

const { DELIVERY_STATUS } = require('../utils/constants'); // Import

const deliverySchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    deliveryNumber: { type: String, required: true }, // Bỏ unique ở đây
    invoiceId: { type: String, required: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    customerAddress: { type: String, required: true },
    customerPhone: { type: String, required: true },
    issueDate: { type: String, required: true },
    deliveryDate: { type: String, required: true },
    driverName: { type: String },
    vehicleNumber: { type: String },
    status: { type: String, required: true, enum: Object.values(DELIVERY_STATUS), default: DELIVERY_STATUS.PENDING },
    notes: { type: String },
}, {
    timestamps: true
});

// Thêm Compound Index: deliveryNumber phải là duy nhất TRONG CÙNG MỘT TỔ CHỨC
deliverySchema.index({ organizationId: 1, deliveryNumber: 1 }, { unique: true });

deliverySchema.virtual('id').get(function(){
    return this._id.toHexString();
});

deliverySchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) { delete ret._id; delete ret.__v; }
});

const Delivery = mongoose.model('Delivery', deliverySchema);
module.exports = Delivery;