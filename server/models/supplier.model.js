const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    taxCode: {
        type: String,
        default: ''
    },
    debt: {
        type: Number,
        default: 0 // Công nợ mặc định là 0
    }
}, { timestamps: true });

// Index để tìm kiếm nhanh
supplierSchema.index({ organizationId: 1, name: 1 });

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;