// models/organization.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const organizationSchema = new Schema({
    name: { type: String, required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
    
    // Thông tin hiển thị (Contact)
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    website: { type: String, default: '' },
    
    // Thông tin pháp lý & Tài chính
    taxCode: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    bankAccount: { type: String, default: '' },
    bankName: { type: String, default: '' },
    bankOwner: { type: String, default: '' }
}, { timestamps: true });

organizationSchema.virtual('id').get(function () { return this._id.toHexString(); });
organizationSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Organization', organizationSchema);