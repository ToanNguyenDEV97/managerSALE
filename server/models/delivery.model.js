const mongoose = require('mongoose');
const { Schema } = mongoose;
const { DELIVERY_STATUS } = require('../utils/constants');

const deliverySchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    deliveryNumber: { type: String, required: true, unique: true }, // Mã vận đơn (VC0001)
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true }, // Liên kết hóa đơn

    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerAddress: { type: String, required: true },

    items: [{
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        quantity: Number,
        price: Number
    }],

    shipFee: { type: Number, default: 0 },   // Phí ship
    codAmount: { type: Number, default: 0 }, // Tiền thu hộ (COD)

    driverName: { type: String, default: '' }, // Tên shipper
    notes: { type: String, default: '' },

    issueDate: { type: Date, default: Date.now },
    deliveryDate: { type: Date }, // Ngày giao dự kiến/thực tế

    // [QUAN TRỌNG] Enum trạng thái tiếng Việt
    status: { 
        type: String, 
        enum: ['Chờ giao', 'Đang giao', 'Đã giao', 'Đã hủy', 'Trả hàng'], 
        default: 'Chờ giao' 
    }
}, {
    timestamps: true
});

deliverySchema.virtual('id').get(function(){ return this._id.toHexString(); });
deliverySchema.set('toJSON', { virtuals: true, transform: (doc, ret) => { delete ret._id; delete ret.__v; } });

const Delivery = mongoose.model('Delivery', deliverySchema);
module.exports = Delivery;