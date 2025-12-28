// src/utils/constants.ts

export const ROLES = {
    OWNER: 'owner',
    STAFF: 'nhanvien'
};

export const ROUTES = {
    LOGIN: '/login',
    DASHBOARD: '/',
    SALES: '/sales',
    ORDERS: '/orders',
    INVOICES: '/invoices',
    PRODUCTS: '/products',
    // ...
};

// Map màu sắc cho trạng thái (Dùng chung cho cả app)
export const STATUS_COLOR: Record<string, string> = {
    'Mới': 'bg-blue-100 text-blue-800',
    'Hoàn thành': 'bg-green-100 text-green-800',
    'Hủy': 'bg-red-100 text-red-800',
    'Đã thanh toán': 'bg-green-100 text-green-800',
    'Chưa thanh toán': 'bg-red-100 text-red-800',
    'Thanh toán một phần': 'bg-yellow-100 text-yellow-800',
    'Còn nợ': 'bg-orange-100 text-orange-800',
    'Đã trả hàng': 'bg-slate-100 text-slate-800'
};

export const PREFIXES = {
    INVOICE: 'HD',
    ORDER: 'DH',
    PRODUCT: 'SP'
};