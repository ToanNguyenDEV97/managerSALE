const mongoose = require('mongoose');
const { Schema } = mongoose;

const categorySchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true }, // Bỏ unique ở đây
}, {
    timestamps: true
});

// Thêm Compound Index: Tên Category phải là duy nhất TRONG CÙNG MỘT TỔ CHỨC
categorySchema.index({ organizationId: 1, name: 1 }, { unique: true });

categorySchema.virtual('id').get(function(){
    return this._id.toHexString();
});

categorySchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) { delete ret._id; delete ret.__v; }
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;