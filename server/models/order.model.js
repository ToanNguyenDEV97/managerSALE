const mongoose = require('mongoose');
const { Schema } = mongoose;
const { ORDER_STATUS } = require('../utils/constants');

const OrderSchema = new mongoose.Schema({
    organizationId: { type: String, required: true },
    orderNumber: { type: String, required: true },
    
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String },
    customerPhone: { type: String },
    customerAddress: { type: String },
    
    items: [{
        productId: { type: String },
        name: { type: String },
        quantity: { type: Number },
        price: { type: Number },
        unit: { type: String },
        costPrice: { type: Number }
    }],
    
    totalAmount: { type: Number, required: true },
    depositAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    
    // --- THÊM TRƯỜNG NÀY ---
    paymentMethod: { type: String, default: 'Tiền mặt' }, 
    
    issueDate: { type: Date, default: Date.now },
    deliveryDate: { type: Date },
    
    status: { 
        type: String, 
        enum: Object.values(ORDER_STATUS),
        default: ORDER_STATUS.NEW
    },
    
    note: { type: String },
    isDelivery: { type: Boolean, default: false, index: true },
    delivery: {
        address: { type: String },
        shipFee: { type: Number, default: 0 },
        phone: { type: String },
        shipperName: { type: String },
        status: { type: String, default: 'PENDING' } // Sửa lại string cứng nếu cần
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);