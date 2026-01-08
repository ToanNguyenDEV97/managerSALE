// server/controllers/organization.controller.js
const Organization = require('../models/organization.model');

// @desc    Lấy thông tin công ty/tổ chức
// @route   GET /api/organization
// @access  Protected
const getOrganization = async (req, res) => {
    try {
        // req.organizationId được lấy từ middleware (hoặc logic xác thực)
        const org = await Organization.findById(req.organizationId);
        res.json(org || { message: 'Chưa có thông tin công ty' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Cập nhật thông tin công ty
// @route   PUT /api/organization
// @access  Protected
const updateOrganization = async (req, res) => {
    try {
        const org = await Organization.findByIdAndUpdate(
            req.organizationId, 
            req.body, 
            { new: true }
        );
        res.json(org);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
// Lấy thông tin tổ chức hiện tại
exports.getMe = async (req, res) => {
    try {
        const org = await Organization.findById(req.organizationId);
        if (!org) return res.status(404).json({ message: 'Không tìm thấy thông tin' });
        res.json(org);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getOrganization,
    updateOrganization
};