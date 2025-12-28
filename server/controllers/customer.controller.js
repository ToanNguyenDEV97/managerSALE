const Customer = require('../models/customer.model');

exports.getCustomers = async (req, res) => {
    try { const data = await Customer.find({ organizationId: req.organizationId }).sort({ createdAt: -1 }); res.json({ data }); } 
    catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getCustomerById = async (req, res) => {
    try { 
        const item = await Customer.findOne({ _id: req.params.id, organizationId: req.organizationId });
        if (!item) return res.status(404).json({ message: 'Không tìm thấy' });
        res.json(item); 
    } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createCustomer = async (req, res) => {
    try { res.status(201).json(await new Customer({ ...req.body, organizationId: req.organizationId }).save()); } 
    catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateCustomer = async (req, res) => {
    try { res.json(await Customer.findOneAndUpdate({ _id: req.params.id, organizationId: req.organizationId }, req.body, { new: true })); }
    catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteCustomer = async (req, res) => {
    try { await Customer.findOneAndDelete({ _id: req.params.id, organizationId: req.organizationId }); res.status(204).send(); }
    catch (e) { res.status(500).json({ message: e.message }); }
};