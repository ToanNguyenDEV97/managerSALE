// server/controllers/cashFlow.controller.js
const CashFlowTransaction = require('../models/cashFlowTransaction.model');

exports.getAll = async (req, res) => {
    try {
        const transactions = await CashFlowTransaction.find({ organizationId: req.organizationId })
                                                      .sort({ createdAt: -1 });
        res.json({ data: transactions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const transaction = await CashFlowTransaction.findOne({ 
            _id: req.params.id, 
            organizationId: req.organizationId 
        });
        if (!transaction) return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
        res.json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const newTrans = new CashFlowTransaction({
            ...req.body,
            organizationId: req.organizationId
        });
        const savedTrans = await newTrans.save();
        res.status(201).json(savedTrans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const updatedTrans = await CashFlowTransaction.findOneAndUpdate(
            { _id: req.params.id, organizationId: req.organizationId },
            req.body,
            { new: true }
        );
        if (!updatedTrans) return res.status(404).json({ message: 'Không tìm thấy để cập nhật' });
        res.json(updatedTrans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const result = await CashFlowTransaction.findOneAndDelete({ 
            _id: req.params.id, 
            organizationId: req.organizationId 
        });
        if (!result) return res.status(404).json({ message: 'Không tìm thấy để xóa' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};