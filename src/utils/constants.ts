// src/utils/constants.ts

export const ORDER_STATUS = {
    NEW: 'Mới',
    PENDING: 'Chờ xử lý',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy'
} as const;

export const INVOICE_STATUS = {
    UNPAID: 'Chưa thanh toán',
    PAID: 'Đã thanh toán',
    OVERDUE: 'Quá hạn',
    PARTIAL: 'Thanh toán một phần'
} as const;

export const DELIVERY_STATUS = {
    PENDING: 'Chờ giao',
    SHIPPING: 'Đang giao',
    SUCCESS: 'Đã giao thành công',
    FAILED: 'Giao thất bại'
} as const;

export const QUOTE_STATUS = {
    NEW: 'Mới',
    SENT: 'Đã gửi',
    CONVERTED: 'Đã chuyển đổi'
} as const;

export const CASHFLOW = {
    TYPE: {
        IN: 'thu',
        OUT: 'chi'
    },
    CATEGORY: {
        OPERATING: 'Chi phí hoạt động',
        VENDOR_PAYMENT: 'Trả NCC',
        SALARY: 'Lương',
        CUSTOMER_DEBT: 'Thu nợ khách hàng',
        OTHER: 'Khác',
        DIFF: 'Chênh lệch kho',
        SALES: 'Doanh thu bán hàng'
    }
} as const;

export const USER_ROLES = {
    OWNER: 'owner',
    STAFF: 'nhanvien'
} as const;