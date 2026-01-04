const mongoose = require('mongoose');
const { Schema } = mongoose;

const customerSchema = new Schema({
    // Bạn nên dùng String cho organizationId nếu project đang dùng string ID, 
    // hoặc ObjectId nếu dùng chuẩn references. Dựa trên code cũ của bạn, mình giữ nguyên.
    organizationId: { type: String, required: true, index: true }, 
    
    name: { type: String, required: true },
    phone: { type: String, required: true },
    
    // Đổi address thành không bắt buộc (required: false) để phù hợp với "Thêm nhanh"
    address: { type: String, default: '' }, 
    
    // --- CÁC TRƯỜNG MỚI BỔ SUNG ---
    email: { type: String, default: '' },
    group: { type: String, default: 'Khách lẻ' }, // Mặc định là Khách lẻ
    notes: { type: String, default: '' },
    taxCode: { type: String, default: '' },
    
    debt: { type: Number, required: true, default: 0 },
}, {
    timestamps: true
});

// Giữ nguyên logic virtuals của bạn
customerSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

customerSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) { delete ret._id; delete ret.__v; }
});

const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;