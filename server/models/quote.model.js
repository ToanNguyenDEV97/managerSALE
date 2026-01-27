const mongoose = require('mongoose');
const { Schema } = mongoose;

const quoteSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    quoteNumber: { type: String, required: true }, // Mã báo giá (BG001)
    
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, required: true },
    customerPhone: { type: String },
    customerAddress: { type: String },

    items: [{
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        sku: String,
        name: String,
        unit: String,
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }, // Giá báo
        total: Number
    }],

    totalAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    finalAmount: { type: Number, default: 0 },

    issueDate: { type: Date, default: Date.now }, // Ngày báo giá
    expiryDate: { type: Date }, // Ngày hết hạn

    status: { 
        type: String, 
        enum: ['Mới', 'Đã gửi', 'Đã chốt', 'Hủy'], 
        default: 'Mới' 
    },
    
    note: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

// Ảo hóa id
quoteSchema.virtual('id').get(function(){ return this._id.toHexString(); });
quoteSchema.set('toJSON', { virtuals: true, transform: (doc, ret) => { delete ret._id; delete ret.__v; } });

module.exports = mongoose.model('Quote', quoteSchema);