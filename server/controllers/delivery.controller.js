// server/controllers/delivery.controller.js
const Delivery = require('../models/delivery.model');

// Lấy danh sách phiếu giao hàng
exports.getDeliveries = async (req, res) => {
    try {
        const deliveries = await Delivery.find({ organizationId: req.organizationId })
                                         .sort({ createdAt: -1 });
        res.json({ data: deliveries });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy chi tiết 1 phiếu
exports.getDeliveryById = async (req, res) => {
    try {
        const delivery = await Delivery.findOne({ 
            _id: req.params.id, 
            organizationId: req.organizationId 
        });
        if (!delivery) return res.status(404).json({ message: 'Không tìm thấy phiếu giao hàng' });
        res.json(delivery);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Tạo phiếu giao hàng mới
exports.createDelivery = async (req, res) => {
    try {
        const newDelivery = new Delivery({
            ...req.body,
            organizationId: req.organizationId // Luôn gắn với Organization
        });
        const savedDelivery = await newDelivery.save();
        res.status(201).json(savedDelivery);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cập nhật phiếu giao hàng
exports.updateDelivery = async (req, res) => {
    try {
        const updatedDelivery = await Delivery.findOneAndUpdate(
            { _id: req.params.id, organizationId: req.organizationId },
            req.body,
            { new: true }
        );
        if (!updatedDelivery) return res.status(404).json({ message: 'Không tìm thấy để cập nhật' });
        res.json(updatedDelivery);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Xóa phiếu giao hàng
exports.deleteDelivery = async (req, res) => {
    try {
        // TODO: Kiểm tra xem phiếu đã hoàn thành chưa trước khi xóa (Business Logic sau này)
        const result = await Delivery.findOneAndDelete({ 
            _id: req.params.id, 
            organizationId: req.organizationId 
        });
        if (!result) return res.status(404).json({ message: 'Không tìm thấy để xóa' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};