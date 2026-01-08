import React from 'react';
import { useAppContext } from '../../context/DataContext';
import { readMoneyToText } from '../../utils/currency';

interface PrintTemplateProps {
    title: string;          // Ví dụ: HÓA ĐƠN BÁN HÀNG
    subTitle?: string;      // Ví dụ: (Kiêm phiếu xuất kho)
    code: string;           // Mã phiếu (HD-001, VC-001...)
    date: string | Date;    // Ngày lập
    
    // Thông tin khách/đối tác
    customer: {
        name: string;
        companyName?: string;
        address?: string;
        phone?: string;
    };

    // Thông tin tiền (Quan trọng: Đã thêm shipFee)
    payment: {
        totalAmount: number;    // Tổng tiền hàng (Chưa cộng ship)
        discount?: number;      // Giảm giá
        shipFee?: number;       // [MỚI] Phí vận chuyển
        paidAmount?: number;    // Đã thanh toán
        debt?: number;          // Còn nợ
    };

    note?: string;              
    children: React.ReactNode;  // Bảng danh sách sản phẩm
}

export const PrintTemplate = React.forwardRef<HTMLDivElement, PrintTemplateProps>(
    ({ title, subTitle, code, date, customer, payment, note, children }, ref) => {
        
        const { companyInfo } = useAppContext();
        
        const company = companyInfo || {
            name: "CỬA HÀNG CỦA BẠN",
            address: "Địa chỉ cửa hàng...",
            phone: "0909.xxx.xxx",
            email: "contact@example.com",
            bankAccount: "",
            bankName: "",
            bankOwner: ""
        };

        // Tính toán tổng thanh toán cuối cùng
        const finalAmount = (payment.totalAmount || 0) 
                          - (payment.discount || 0) 
                          + (payment.shipFee || 0);

        return (
            <div ref={ref} className="bg-white p-8 max-w-[210mm] mx-auto text-sm leading-relaxed text-slate-900">
                {/* 1. HEADER CÔNG TY */}
                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
                    <div>
                        <h1 className="text-xl font-bold uppercase text-slate-800 mb-1">{company.name}</h1>
                        <p className="text-xs text-slate-600 mb-0.5">Đ/c: {company.address}</p>
                        <p className="text-xs text-slate-600">SĐT: {company.phone}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-wide">{title}</h2>
                        {subTitle && <p className="text-sm italic text-slate-500">{subTitle}</p>}
                        <p className="text-sm font-bold mt-2 text-slate-700">Số: {code}</p>
                        <p className="text-xs text-slate-500 italic">Ngày: {new Date(date).toLocaleDateString('vi-VN')}</p>
                    </div>
                </div>

                {/* 2. THÔNG TIN KHÁCH HÀNG */}
                <div className="mb-6 grid grid-cols-2 gap-4">
                    <div>
                        <p><span className="font-bold text-slate-700">Khách hàng:</span> {customer.name}</p>
                        {customer.companyName && <p><span className="font-bold text-slate-700">Đơn vị:</span> {customer.companyName}</p>}
                    </div>
                    <div className="text-right sm:text-left">
                         <p><span className="font-bold text-slate-700">SĐT:</span> {customer.phone || '---'}</p>
                        <p><span className="font-bold text-slate-700">Địa chỉ:</span> {customer.address || '---'}</p>
                    </div>
                </div>

                {/* 3. BẢNG HÀNG HÓA (Inject từ bên ngoài vào) */}
                <div className="mb-6">
                    {children}
                </div>

                {/* 4. TỔNG KẾT TIỀN */}
                <div className="flex justify-end mb-6">
                    <table className="w-2/3 md:w-1/2 border-collapse">
                        <tbody>
                            <tr>
                                <td className="py-1 px-2 text-right font-bold text-slate-600 border-b border-slate-200">Tiền hàng:</td>
                                <td className="py-1 px-2 text-right font-bold border-b border-slate-200">
                                    {payment.totalAmount.toLocaleString()}
                                </td>
                            </tr>
                            
                            {/* Hiển thị Phí Ship */}
                            {payment.shipFee ? (
                                <tr>
                                    <td className="py-1 px-2 text-right text-slate-600 border-b border-slate-200">Phí vận chuyển:</td>
                                    <td className="py-1 px-2 text-right font-bold text-blue-600 border-b border-slate-200">
                                        + {payment.shipFee.toLocaleString()}
                                    </td>
                                </tr>
                            ) : null}

                            {payment.discount ? (
                                <tr>
                                    <td className="py-1 px-2 text-right text-slate-600 border-b border-slate-200">Chiết khấu:</td>
                                    <td className="py-1 px-2 text-right italic border-b border-slate-200">- {payment.discount.toLocaleString()}</td>
                                </tr>
                            ) : null}

                            <tr>
                                <td className="py-2 px-2 text-right font-black uppercase text-slate-800 border-b-2 border-slate-800">Tổng cộng:</td>
                                <td className="py-2 px-2 text-right font-black text-xl text-red-600 border-b-2 border-slate-800">
                                    {finalAmount.toLocaleString()}
                                </td>
                            </tr>

                            {/* Dòng chữ đọc tiền */}
                            <tr>
                                <td colSpan={2} className="py-2 text-center text-sm italic text-slate-600 bg-slate-50">
                                    (Bằng chữ: {readMoneyToText(finalAmount)})
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 5. GHI CHÚ */}
                {note && (
                    <div className="mb-8 p-3 bg-slate-50 border border-slate-200 rounded text-sm text-slate-600 italic">
                        <span className="font-bold">Ghi chú:</span> {note}
                    </div>
                )}

                {/* 6. CHỮ KÝ */}
                <div className="grid grid-cols-2 gap-10 mt-10 text-center break-inside-avoid">
                    <div>
                        <p className="font-bold uppercase text-sm">Người mua hàng</p>
                        <p className="italic text-xs text-slate-400 mb-16">(Ký, ghi rõ họ tên)</p>
                    </div>
                    <div>
                        <p className="font-bold uppercase text-sm">Người lập phiếu</p>
                        <p className="italic text-xs text-slate-400 mb-16">(Ký, đóng dấu)</p>
                    </div>
                </div>
                
                {/* 7. BANK INFO */}
                <div className="text-center text-xs text-slate-500 mt-4 border-t border-dashed border-slate-300 pt-3">
                    {company.bankAccount ? (
                         <span>TK: <b>{company.bankAccount}</b> - {company.bankName} - Chủ TK: <b>{company.bankOwner}</b></span>
                    ) : (
                        <span>Cảm ơn quý khách đã tin tưởng và ủng hộ!</span>
                    )}
                </div>
            </div>
        );
    }
);