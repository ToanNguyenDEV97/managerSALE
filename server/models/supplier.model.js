const mongoose = require('mongoose');
const { Schema } = mongoose;

const supplierSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    taxCode: { type: String },
    debt: { type: Number, required: true, default: 0 },
}, {
    timestamps: true
});

supplierSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

supplierSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) { delete ret._id; delete ret.__v; }
});

const Supplier = mongoose.model('Supplier', supplierSchema);
module.exports = Supplier;