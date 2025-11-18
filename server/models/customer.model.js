const mongoose = require('mongoose');
const { Schema } = mongoose;

const customerSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    debt: { type: Number, required: true, default: 0 },
}, {
    timestamps: true
});

customerSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

customerSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) { delete ret._id; delete ret.__v; }
});

const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;