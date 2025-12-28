// server/controllers/product.controller.js
const mongoose = require('mongoose');
const Product = require('../models/product.model');
const StockHistory = require('../models/stockHistory.model');
const { getNextSequence } = require('../utils/sequence');
const { changeStock } = require('../utils/stockUtils');
const { PREFIXES } = require('../utils/constants');

// 1. Lấy danh sách sản phẩm
exports.getProducts = async (req, res) => {
    const { organizationId } = req;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;
    try {
        const query = { organizationId, $or: [{ name: { $regex: search, $options: 'i' } }, { sku: { $regex: search, $options: 'i' } }] };
        if (req.query.category && req.query.category !== 'all') query.category = req.query.category;
        
        const products = await Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
        const total = await Product.countDocuments(query);
        res.json({ data: products, total, page, totalPages: Math.ceil(total / limit) });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// 2. Tạo sản phẩm mới
exports.createProduct = async (req, res) => {
    try {
        let sku = req.body.sku;
        if (!sku) sku = await getNextSequence(Product, PREFIXES.PRODUCT, req.organizationId);
        
        const productData = { ...req.body, sku, organizationId: req.organizationId };
        if (productData.vat === undefined) productData.vat = 0;

        const newProduct = await new Product(productData).save();
        
        // Ghi thẻ kho tồn đầu
        if (req.body.stock > 0) {
             const session = await mongoose.startSession();
             session.startTransaction();
             try {
                await new StockHistory({
                    organizationId: req.organizationId, productId: newProduct._id, productName: newProduct.name, sku: newProduct.sku,
                    changeAmount: req.body.stock, balanceAfter: req.body.stock, type: 'Khởi tạo', note: 'Tồn đầu kỳ', date: new Date()
                }).save({ session });
                await session.commitTransaction();
             } catch(e) { await session.abortTransaction(); } finally { session.endSession(); }
        }
        res.status(201).json(newProduct);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// 3. Cập nhật sản phẩm (Sửa & Điều chỉnh kho)
exports.updateProduct = async (req, res) => {
    const { organizationId } = req;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const oldProduct = await Product.findOne({ _id: req.params.id, organizationId }).session(session);
        if (!oldProduct) throw new Error("SP không tồn tại");

        if (req.body.stock !== undefined && parseInt(req.body.stock) !== oldProduct.stock) {
            const diff = parseInt(req.body.stock) - oldProduct.stock;
            await changeStock({
                session, organizationId, productId: oldProduct._id, quantityChange: diff,
                type: 'Điều chỉnh kho', referenceNumber: 'Sửa tay', note: `Cập nhật trực tiếp`
            });
        }
        
        const updated = await Product.findOneAndUpdate({ _id: req.params.id, organizationId }, req.body, { new: true, session });
        await session.commitTransaction();
        res.json(updated);
    } catch (err) { await session.abortTransaction(); res.status(500).json({ message: err.message }); }
    finally { session.endSession(); }
};

// 4. Xóa sản phẩm
exports.deleteProduct = async (req, res) => {
    try { await Product.findOneAndDelete({ _id: req.params.id, organizationId: req.organizationId }); res.status(204).send(); }
    catch (err) { res.status(500).json({ message: err.message }); }
};

// 5. Lấy lịch sử kho của 1 SP
exports.getProductHistory = async (req, res) => {
    try {
        const history = await StockHistory.find({ organizationId: req.organizationId, productId: req.params.productId }).sort({ date: -1 }).limit(100);
        res.json(history);
    } catch (err) { res.status(500).json({ message: err.message }); }
};