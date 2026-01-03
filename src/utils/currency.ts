// src/utils/currency.ts

export const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
};

// Hàm đọc số thành chữ (Optional - để dùng sau này cho in hóa đơn)
export const readMoneyToText = (amount: number): string => {
    // Logic đọc số sẽ thêm sau nếu cần
    return ''; 
};