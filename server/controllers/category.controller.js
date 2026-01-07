const Category = require('../models/category.model');
const Product = require('../models/product.model');

exports.getCategories = async (req, res) => {
    try { const data = await Category.find({ organizationId: req.organizationId }).sort({ createdAt: -1 }); res.json({ data }); } 
    catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const organizationId = req.organizationId; 
        
        const category = new Category({ 
            name, 
            description,
            organizationId: organizationId // <--- Thêm dòng này
        });

        await category.save();
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateCategory = async (req, res) => {
    try { res.json(await Category.findOneAndUpdate({ _id: req.params.id, organizationId: req.organizationId }, req.body, { new: true })); }
    catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { organizationId } = req;
        const categoryDoc = await Category.findOne({ _id: id, organizationId });
        
        if (!categoryDoc) return res.status(404).json({ message: 'Không tìm thấy danh mục' });

        const productCount = await Product.countDocuments({ organizationId, category: categoryDoc.name });
        if (productCount > 0) {
            return res.status(400).json({ message: `Không thể xóa! Danh mục "${categoryDoc.name}" đang chứa ${productCount} sản phẩm.` });
        }

        await Category.deleteOne({ _id: id });
        res.json({ message: 'Đã xóa danh mục thành công' });
    } catch (err) { res.status(500).json({ message: err.message }); }
};