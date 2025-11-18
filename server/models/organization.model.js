// models/organization.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const organizationSchema = new Schema({
    name: { type: String, required: true }, // Tên công ty, ví dụ: "VLXD An Phát"
    ownerId: { type: Schema.Types.ObjectId, ref: 'User' } // ID của người chủ
}, { timestamps: true });

// ... (thêm virtuals 'id' và toJSON như các model khác) ...

const Organization = mongoose.model('Organization', organizationSchema);
module.exports = Organization;