// server/utils/constants.js
module.exports = {
    // Tiền tố cho các loại mã phiếu
    PREFIXES: {
        INVOICE: 'HD',        // Hóa đơn
        PRODUCT: 'SP',        // Sản phẩm
        ORDER: 'DH',          // Đơn hàng
        PURCHASE: 'PN',       // Phiếu nhập
        QUOTE: 'BG',          // Báo giá
        PAYMENT: 'PT',        // Phiếu thu
        PAYMENT_SLIP: 'PC',   // Phiếu chi
        DELIVERY: 'PGH',      // Phiếu giao hàng
        CHECK: 'PKK',         // Phiếu kiểm kho
        RETURN: 'TH'          // Trả hàng
    },

    // Vai trò người dùng
    ROLES: {
        OWNER: 'owner',
        STAFF: 'nhanvien'
    },

    // Trạng thái đơn hàng / hóa đơn
    STATUS: {
        NEW: 'Mới',
        DONE: 'Hoàn thành',
        CANCEL: 'Hủy',
        PAID: 'Đã thanh toán',
        PARTIAL: 'Thanh toán một phần',
        UNPAID: 'Chưa thanh toán',
        DEBT: 'Còn nợ'
    }
};