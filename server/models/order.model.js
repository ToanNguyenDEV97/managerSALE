const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    organizationId: { type: String, required: true },
    orderNumber: { type: String, required: true }, // Mã đơn: DH-00001
    
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String },
    
    items: [{
        productId: { type: String },
        name: { type: String },
        quantity: { type: Number },
        price: { type: Number },
        unit: { type: String },
        costPrice: { type: Number } // Lưu giá vốn để tính lãi sau này
    }],
    
    totalAmount: { type: Number, required: true },
    depositAmount: { type: Number, default: 0 }, // Tiền cọc (nếu có)
    
    issueDate: { type: Date, default: Date.now },
    deliveryDate: { type: Date }, // Ngày hẹn giao
    
    // TRẠNG THÁI QUAN TRỌNG CỦA QUY TRÌNH
    status: { 
        type: String, 
        enum: ['Mới', 'Đang xử lý', 'Đang giao', 'Hoàn thành', 'Hủy'], 
        default: 'Mới' 
    },
    
    note: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);