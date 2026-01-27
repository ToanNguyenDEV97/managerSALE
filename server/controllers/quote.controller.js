const Quote = require('../models/quote.model');
const Sequence = require('../utils/sequence'); // Đảm bảo đã có file này

// 1. Lấy danh sách (Phân trang + Tìm kiếm)
exports.getQuotes = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { search, status } = req.query;
        const organizationId = req.organizationId;

        let query = { organizationId };

        if (search) {
            query.$or = [
                { quoteNumber: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } },
                { customerPhone: { $regex: search, $options: 'i' } }
            ];
        }

        if (status && status !== 'Tất cả') {
            query.status = status;
        }

        const total = await Quote.countDocuments(query);
        const quotes = await Quote.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            data: quotes,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 2. Tạo báo giá mới
exports.createQuote = async (req, res) => {
    try {
        const { items, discountAmount } = req.body;
        const organizationId = req.organizationId;

        // Tính toán tổng tiền
        const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const finalAmount = totalAmount - (discountAmount || 0);

        // [FIX LỖI] Đổi tên hàm từ getNextSequenceValue -> getNextSequence
        // Tham số: (Model, Prefix, OrganizationId)
        const quoteNumber = await Sequence.getNextSequence(Quote, 'BG', organizationId);

        const newQuote = new Quote({
            ...req.body,
            organizationId,
            quoteNumber,
            totalAmount,
            finalAmount,
            createdBy: req.user.userId
        });

        await newQuote.save();
        res.status(201).json(newQuote);
    } catch (err) {
        console.error("Create Quote Error:", err); // Log lỗi ra terminal server
        res.status(500).json({ message: err.message });
    }
};

// 3. Cập nhật báo giá
exports.updateQuote = async (req, res) => {
    try {
        const { items, discountAmount } = req.body;
        
        if (items) {
            const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
            req.body.totalAmount = totalAmount;
            req.body.finalAmount = totalAmount - (discountAmount || 0);
        }

        const quote = await Quote.findOneAndUpdate(
            { _id: req.params.id, organizationId: req.organizationId },
            req.body,
            { new: true }
        );

        if (!quote) return res.status(404).json({ message: 'Không tìm thấy báo giá' });
        res.json(quote);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 4. Xóa báo giá
exports.deleteQuote = async (req, res) => {
    try {
        await Quote.findOneAndDelete({ _id: req.params.id, organizationId: req.organizationId });
        res.json({ message: 'Đã xóa báo giá' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};