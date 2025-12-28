const mongoose = require('mongoose');
const Purchase = require('../models/purchase.model');
const Supplier = require('../models/supplier.model');
const Product = require('../models/product.model');
const CashFlowTransaction = require('../models/cashFlowTransaction.model');
const { getNextSequence } = require('../utils/sequence');
const { changeStock } = require('../utils/stockUtils');

// 1. Lấy danh sách phiếu nhập
exports.getPurchases = async (req, res) => {
    try { const data = await Purchase.find({ organizationId: req.organizationId }).sort({ createdAt: -1 }); res.json({ data }); } 
    catch (err) { res.status(500).json({ message: err.message }); }
};

// 2. Tạo phiếu nhập mới
exports.createPurchase = async (req, res) => {
    const { organizationId } = req;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { supplierId, items, totalAmount, issueDate, paidAmount } = req.body; 
        const supplier = await Supplier.findOne({ _id: supplierId, organizationId }).session(session);
        if (!supplier) throw new Error("Nhà cung cấp không tồn tại.");

        const purchaseNumber = await getNextSequence(Purchase, 'PN', organizationId);
        const validDate = issueDate || new Date();

        // Cộng kho
        for (const item of items) {
             await changeStock({
                 session, organizationId, productId: item.productId,
                 quantityChange: item.quantity,
                 type: 'Nhập hàng', referenceNumber: purchaseNumber, note: `Nhập từ ${supplier.name}`
             });
        }

        // Cộng nợ NCC
        const debtAmount = totalAmount - (paidAmount || 0);
        if (debtAmount > 0) {
            await Supplier.findOneAndUpdate({ _id: supplierId, organizationId }, { $inc: { debt: debtAmount } }).session(session);
        }

        // Tạo phiếu chi
        if ((paidAmount || 0) > 0) {
            const transactionNumber = await getNextSequence(CashFlowTransaction, 'PC', organizationId);
            await new CashFlowTransaction({
                transactionNumber, type: 'chi', date: validDate, amount: paidAmount,
                payerReceiverName: supplier.name, description: `Thanh toán nhập hàng ${purchaseNumber}`,
                category: 'Trả NCC', organizationId
            }).save({ session });
        }

        const newPurchase = new Purchase({ 
            supplierId, supplierName: supplier.name, items, totalAmount, 
            issueDate: validDate, purchaseNumber, paidAmount: paidAmount || 0, 
            status: (paidAmount || 0) >= totalAmount ? 'Đã thanh toán' : 'Còn nợ', organizationId 
        });
        
        await newPurchase.save({ session });
        await session.commitTransaction();
        res.status(201).json(newPurchase);

    } catch (err) { await session.abortTransaction(); res.status(500).json({ message: err.message }); } 
    finally { session.endSession(); }
};

// 3. Trả hàng nhập (Return)
exports.returnPurchase = async (req, res) => {
    const { organizationId } = req;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const purchase = await Purchase.findOne({ _id: req.params.id, organizationId }).session(session);
        if (!purchase) throw new Error('Không tìm thấy phiếu nhập');

        // Trừ kho
        for (const item of purchase.items) {
             await changeStock({
                 session, organizationId, productId: item.productId,
                 quantityChange: -item.quantity, 
                 type: 'Xuất trả NCC', referenceNumber: purchase.purchaseNumber, note: 'Trả hàng nhập lỗi'
             });
        }

        // Giảm nợ
        if (purchase.supplierId) {
            await Supplier.findOneAndUpdate({ _id: purchase.supplierId, organizationId }, { $inc: { debt: -purchase.totalAmount } }).session(session);
        }
        
        purchase.status = 'Đã trả hàng';
        await purchase.save({ session });
        
        await session.commitTransaction();
        res.json({ message: 'Đã trả hàng thành công' });
    } catch (err) { await session.abortTransaction(); res.status(500).json({ message: err.message }); }
    finally { session.endSession(); }
};