const mongoose = require('mongoose');
const { Schema } = mongoose;
const { DELIVERY_STATUS } = require('../utils/constants');

const deliverySchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    deliveryNumber: { type: String, required: true },
    invoiceId: { type: String, required: true },
    
    // [SỬA] Cho phép null nếu là khách lẻ
    customerId: { type: String, default: 'GUEST' }, 
    customerName: { type: String, required: true },
    customerAddress: { type: String, required: true },
    customerPhone: { type: String, required: true },
    
    // [SỬA] Đổi sang kiểu Date để dễ query/sort sau này (hoặc giữ String nếu hệ thống bạn thống nhất dùng String)
    issueDate: { type: Date, default: Date.now }, 
    deliveryDate: { type: Date, default: Date.now }, 
    
    // [THÊM MỚI] Các trường cần thiết cho Frontend
    items: [{
        productId: String,
        name: String,
        quantity: Number,
        price: Number
    }],
    shipFee: { type: Number, default: 0 },
    codAmount: { type: Number, default: 0 },

    driverName: { type: String },
    vehicleNumber: { type: String },
    
    // Enum validation: Chỉ chấp nhận các giá trị: "Chờ giao", "Đang giao"...
    status: { type: String, required: true, enum: Object.values(DELIVERY_STATUS), default: DELIVERY_STATUS.PENDING },
    notes: { type: String },
}, {
    timestamps: true
});

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