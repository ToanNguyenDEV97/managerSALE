// server/controllers/inventoryCheck.controller.js
const InventoryCheck = require('../models/inventoryCheck.model');

// Lấy danh sách phiếu kiểm kho
exports.getAll = async (req, res) => {
    try {
        const checks = await InventoryCheck.find({ organizationId: req.organizationId })
                                           .sort({ createdAt: -1 });
        res.json({ data: checks });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy chi tiết phiếu
exports.getById = async (req, res) => {
    try {
        const check = await InventoryCheck.findOne({ 
            _id: req.params.id, 
            organizationId: req.organizationId 
        });
        if (!check) return res.status(404).json({ message: 'Không tìm thấy phiếu kiểm kho' });
        res.json(check);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Tạo phiếu kiểm kho mới
exports.create = async (req, res) => {
    try {
        const newCheck = new InventoryCheck({
            ...req.body,
            organizationId: req.organizationId
        });
        const savedCheck = await newCheck.save();
        res.status(201).json(savedCheck);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cập nhật phiếu
exports.update = async (req, res) => {
    try {
        const updatedCheck = await InventoryCheck.findOneAndUpdate(
            { _id: req.params.id, organizationId: req.organizationId },
            req.body,
            { new: true }
        );
        if (!updatedCheck) return res.status(404).json({ message: 'Không tìm thấy để cập nhật' });
        res.json(updatedCheck);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Xóa phiếu
exports.delete = async (req, res) => {
    try {
        // Lưu ý: Cần thêm logic kiểm tra xem phiếu đã cân bằng kho chưa ở đây sau này
        const result = await InventoryCheck.findOneAndDelete({ 
            _id: req.params.id, 
            organizationId: req.organizationId 
        });
        if (!result) return res.status(404).json({ message: 'Không tìm thấy để xóa' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};