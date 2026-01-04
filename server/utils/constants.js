// server/utils/constants.js

// 1. Trạng thái Đơn hàng
const ORDER_STATUS = {
    NEW: 'Mới',
    PENDING: 'Chờ xử lý',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy' // Thêm dự phòng
};

// 2. Trạng thái Hóa đơn
const INVOICE_STATUS = {
    UNPAID: 'Chưa thanh toán',      // Khách chưa trả đồng nào
    PARTIAL: 'Thanh toán một phần', // Khách cọc hoặc trả thiếu
    PAID: 'Đã thanh toán',          // Đã trả đủ
    CANCELLED: 'Đã hủy',            // Hóa đơn viết sai, hủy bỏ
    REFUNDED: 'Đã hoàn tiền'        // Khách trả hàng, mình trả lại tiền
};

// 3. Trạng thái Giao vận
const DELIVERY_STATUS = {
    PENDING: 'Chờ giao',
    SHIPPING: 'Đang giao',
    SUCCESS: 'Đã giao thành công',
    FAILED: 'Giao thất bại'
};

// 4. Trạng thái Báo giá
const QUOTE_STATUS = {
    NEW: 'Mới',
    SENT: 'Đã gửi',
    CONVERTED: 'Đã chuyển đổi'
};

// 5. Kiểm kho
const INVENTORY_CHECK_STATUS = {
    DRAFT: 'Nháp',
    COMPLETED: 'Hoàn thành'
};

// 6. Sổ quỹ (CashFlow)
const CASHFLOW = {
    TYPE: {
        IN: 'thu',
        OUT: 'chi'
    },
    CATEGORY: {
        OPERATING: 'Chi phí hoạt động',
        VENDOR_PAYMENT: 'Trả NCC',
        SALARY: 'Lương',
        CUSTOMER_DEBT: 'Thu nợ khách hàng', // Sửa cho khớp model cũ "Thu nợ KH" nếu cần
        OTHER: 'Khác',
        DIFF: 'Chênh lệch kho',
        SALES: 'Doanh thu bán hàng'
    }
};

// 7. Loại thay đổi kho (Dùng cho StockHistory)
const STOCK_TYPE = {
    INITIAL: 'Khởi tạo',
    ADJUSTMENT: 'Điều chỉnh kho',
    IMPORT: 'Nhập hàng',
    EXPORT: 'Xuất hàng', // Bán hàng
    RETURN: 'Trả hàng'
};

// 8. Tiền tố mã (Sequence)
const PREFIXES = {
    ORDER: 'DH',
    INVOICE: 'HD',
    PRODUCT: 'SP',
    CUSTOMER: 'KH',
    SUPPLIER: 'NCC',
    QUOTE: 'BG',
    DELIVERY: 'GH',
    CHECK: 'KK',
    PURCHASE: 'NH', // Nhập hàng
    RECEIPT: 'PT',  // Phiếu thu
    PAYMENT: 'PC'   // Phiếu chi
};

// 9. Vai trò User
const USER_ROLES = {
    OWNER: 'owner',
    STAFF: 'nhanvien'
};

module.exports = {
    ORDER_STATUS,
    INVOICE_STATUS,
    DELIVERY_STATUS,
    QUOTE_STATUS,
    INVENTORY_CHECK_STATUS,
    CASHFLOW,
    STOCK_TYPE,
    PREFIXES,
    USER_ROLES
};