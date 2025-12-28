const Supplier = require('../models/supplier.model');

exports.getSuppliers = async (req, res) => {
    try { const data = await Supplier.find({ organizationId: req.organizationId }).sort({ createdAt: -1 }); res.json({ data }); } 
    catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getSupplierById = async (req, res) => {
    try { 
        const item = await Supplier.findOne({ _id: req.params.id, organizationId: req.organizationId });
        if (!item) return res.status(404).json({ message: 'Không tìm thấy' });
        res.json(item); 
    } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createSupplier = async (req, res) => {
    try { res.status(201).json(await new Supplier({ ...req.body, organizationId: req.organizationId }).save()); } 
    catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateSupplier = async (req, res) => {
    try { res.json(await Supplier.findOneAndUpdate({ _id: req.params.id, organizationId: req.organizationId }, req.body, { new: true })); }
    catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteSupplier = async (req, res) => {
    try { await Supplier.findOneAndDelete({ _id: req.params.id, organizationId: req.organizationId }); res.status(204).send(); }
    catch (e) { res.status(500).json({ message: e.message }); }
};