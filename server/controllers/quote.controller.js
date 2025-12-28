const Quote = require('../models/quote.model');
const { getNextSequence } = require('../utils/sequence');

exports.getQuotes = async (req, res) => {
    try { const data = await Quote.find({ organizationId: req.organizationId }).sort({ createdAt: -1 }); res.json({ data }); } 
    catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getQuoteById = async (req, res) => {
    try { 
        const item = await Quote.findOne({ _id: req.params.id, organizationId: req.organizationId });
        if (!item) return res.status(404).json({ message: 'Không tìm thấy' });
        res.json(item); 
    } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createQuote = async (req, res) => {
    try {
        const quoteNumber = await getNextSequence(Quote, 'BG', req.organizationId);
        const newQuote = new Quote({ ...req.body, quoteNumber, organizationId: req.organizationId });
        await newQuote.save();
        res.status(201).json(newQuote);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateQuote = async (req, res) => {
    try { res.json(await Quote.findOneAndUpdate({ _id: req.params.id, organizationId: req.organizationId }, req.body, { new: true })); }
    catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteQuote = async (req, res) => {
    try { await Quote.findOneAndDelete({ _id: req.params.id, organizationId: req.organizationId }); res.status(204).send(); }
    catch (e) { res.status(500).json({ message: e.message }); }
};