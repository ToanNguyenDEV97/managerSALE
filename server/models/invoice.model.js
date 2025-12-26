// models/invoice.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const invoiceSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, required: true },
    invoiceNumber: { type: String, required: true },
    
    // Thông tin cơ bản
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, required: true },
    
    items: [{ /* ... giữ nguyên ... */ }],
    
    totalAmount: { type: Number, required: true }, // Tổng tiền hàng
    paidAmount: { type: Number, default: 0 },      // Khách đã trả
    
    // --- [MỚI] THÔNG TIN GIAO HÀNG ---
    isDelivery: { type: Boolean, default: false }, // Có giao hàng không?
    delivery: {
        address: { type: String, default: '' },    // Địa chỉ giao
        receiverName: { type: String, default: '' }, // Tên người nhận
        phone: { type: String, default: '' },      // SĐT người nhận
        shipFee: { type: Number, default: 0 },     // Phí ship
        status: { 
            type: String, 
            enum: ['Chờ giao', 'Đang giao', 'Đã giao', 'Hủy'], 
            default: 'Chờ giao' 
        },
        shipperName: { type: String, default: '' } // Tên shipper (nếu có)
    },

    status: { type: String, default: 'Chưa thanh toán' },
    note: { type: String },
    issueDate: { type: Date, default: Date.now }
}, { timestamps: true });

// ... (phần virtuals giữ nguyên)

module.exports = mongoose.model('Invoice', invoiceSchema);