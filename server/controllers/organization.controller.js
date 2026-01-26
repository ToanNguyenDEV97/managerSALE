// server/controllers/organization.controller.js
const Organization = require('../models/organization.model');

const getOrganization = async (req, res) => {
    try {
        const org = await Organization.findById(req.organizationId);
        res.json(org || { message: 'Chưa có thông tin công ty' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

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

// SỬA: Khai báo const thay vì exports.getMe
const getMe = async (req, res) => {
    try {
        const org = await Organization.findById(req.organizationId);
        if (!org) return res.status(404).json({ message: 'Không tìm thấy thông tin' });
        res.json(org);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// SỬA: Thêm getMe vào danh sách export
module.exports = {
    getOrganization,
    updateOrganization,
    getMe 
};