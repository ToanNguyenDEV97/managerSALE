const Delivery = require('../models/delivery.model');
const Invoice = require('../models/invoice.model');

// 1. Lấy danh sách vận đơn (Có phân trang & Tìm kiếm theo Hóa đơn)
exports.getDeliveries = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { search, status } = req.query;
        const organizationId = req.organizationId;

        let query = { organizationId };

        if (search) {
            // Bước 1: Tìm các hóa đơn có mã khớp với từ khóa
            const matchingInvoices = await Invoice.find({
                invoiceNumber: { $regex: search, $options: 'i' },
                organizationId
            }).select('_id');

            const invoiceIds = matchingInvoices.map(inv => inv._id);

            // Bước 2: Tạo query tìm kiếm Delivery
            // Tìm theo: Mã vận đơn OR Tên khách OR SĐT OR Mã hóa đơn (thông qua ID)
            query.$or = [
                { deliveryNumber: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } },
                { customerPhone: { $regex: search, $options: 'i' } },
                { invoiceId: { $in: invoiceIds } } // Thêm điều kiện này
            ];
        }

        if (status && status !== 'Tất cả' && status !== 'all') {
            query.status = status;
        }

        // Đếm tổng số bản ghi để tính phân trang
        const total = await Delivery.countDocuments(query);

        // Lấy dữ liệu phân trang
        const deliveries = await Delivery.find(query)
            .sort({ createdAt: -1 }) // Mới nhất lên đầu
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('invoiceId', 'invoiceNumber finalAmount paidAmount');

        res.json({
            data: deliveries,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            limit
        });
    } catch (err) {
        console.error("Get Deliveries Error:", err);
        res.status(500).json({ message: err.message });
    }
};

// 2. Cập nhật trạng thái
exports.updateStatus = async (req, res) => {
    try {
        const { status, driverName } = req.body;
        const updateData = { status };
        
        if (driverName) updateData.driverName = driverName;
        if (status === 'Đã giao') updateData.deliveryDate = new Date();

        const delivery = await Delivery.findOneAndUpdate(
            { _id: req.params.id, organizationId: req.organizationId },
            updateData,
            { new: true }
        );

        if (!delivery) return res.status(404).json({ message: 'Không tìm thấy vận đơn' });
        res.json(delivery);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 3. Xóa vận đơn
exports.deleteDelivery = async (req, res) => {
    try {
        await Delivery.findOneAndDelete({ _id: req.params.id, organizationId: req.organizationId });
        res.json({ message: 'Đã xóa vận đơn' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};