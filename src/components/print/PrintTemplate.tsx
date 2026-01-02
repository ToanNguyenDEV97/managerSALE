import React from 'react';
import { useAppContext } from '../../context/DataContext';
import { readMoneyToText } from '../../utils/currency';

interface PrintTemplateProps {
    title: string;          // Ví dụ: ĐƠN ĐẶT HÀNG
    subTitle?: string;      // Ví dụ: (Liên 1: Lưu)
    code: string;           // Số phiếu
    date: string | Date;    // Ngày lập
    
    // Thông tin khách hàng
    customer: {
        name: string;
        companyName?: string;
        address?: string;
        phone?: string;
        taxCode?: string;
    };

    // Thông tin thanh toán
    payment: {
        totalAmount: number;    // Tổng tiền hàng
        discount?: number;      // Chiết khấu
        paidAmount?: number;    // Đã thanh toán / Cọc
        debt?: number;          // Còn nợ
    };

    note?: string;              // Ghi chú
    children: React.ReactNode;  // Bảng hàng hóa (Table)
}

export const PrintTemplate = React.forwardRef<HTMLDivElement, PrintTemplateProps>(
    ({ title, subTitle, code, date, customer, payment, note, children }, ref) => {
        
        // Lấy thông tin Shop từ DataContext
        const { companyInfo } = useAppContext();
        
        const company = companyInfo || {
            name: "TÊN CỬA HÀNG (Cần cài đặt)",
            address: "Chưa cập nhật địa chỉ",
            phone: "...",
            email: "",
            taxCode: "",
            bankAccount: "",
            bankName: "",
            bankOwner: ""
        };

        const dt = new Date(date);
        const finalAmount = payment.totalAmount - (payment.discount || 0);

        return (
            <div 
                ref={ref} 
                className="bg-white text-slate-900 p-[10mm] mx-auto box-border"
                style={{ 
                    width: '210mm', 
                    minHeight: '297mm', // Khổ A4 chuẩn
                    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    fontSize: '14px', // text-sm
                    lineHeight: '1.5'
                }}
            >
                {/* --- 1. HEADER (Giống PrintInvoiceModal) --- */}
                <div className="flex justify-between items-start mb-8 border-b-2 border-slate-800 pb-6">
                    {/* Bên trái: Thông tin công ty */}
                    <div className="w-[65%]">
                        <h2 className="font-bold text-lg text-slate-800 uppercase mb-1">
                            {company.name}
                        </h2>
                        <div className="text-xs text-slate-500 leading-relaxed">
                            <p><strong className="text-slate-700">Địa chỉ:</strong> {company.address}</p>
                            <p><strong className="text-slate-700">Hotline:</strong> {company.phone}</p>
                            {company.email && <p><strong className="text-slate-700">Email:</strong> {company.email}</p>}
                            {company.taxCode && <p><strong className="text-slate-700">MST:</strong> {company.taxCode}</p>}
                        </div>
                    </div>

                    {/* Bên phải: Tiêu đề phiếu */}
                    <div className="text-right">
                        <h2 className="text-2xl font-bold text-red-600 uppercase tracking-wide">{title}</h2>
                        {subTitle && <h3 className="text-sm font-bold text-slate-600 uppercase mt-1">{subTitle}</h3>}
                        <div className="mt-2 text-sm text-slate-600">
                            <p>Số: <b className="text-black text-base">{code}</b></p>
                            <p>Ngày: {dt.getDate()} tháng {dt.getMonth() + 1} năm {dt.getFullYear()}</p>
                        </div>
                    </div>
                </div>

                {/* --- 2. THÔNG TIN KHÁCH HÀNG (Dạng bảng) --- */}
                <div className="mb-6">
                    <table className="w-full">
                        <tbody>
                            <tr>
                                <td className="w-24 font-bold text-slate-700 align-top pb-1">Khách hàng:</td>
                                <td className="uppercase font-semibold pb-1">{customer.name}</td>
                            </tr>
                            {customer.companyName && (
                                <tr>
                                    <td className="w-24 font-bold text-slate-700 align-top pb-1">Đơn vị:</td>
                                    <td className="pb-1">{customer.companyName}</td>
                                </tr>
                            )}
                            <tr>
                                <td className="w-24 font-bold text-slate-700 align-top pb-1">Điện thoại:</td>
                                <td className="pb-1">{customer.phone || '...'}</td>
                            </tr>
                            <tr>
                                <td className="w-24 font-bold text-slate-700 align-top pb-1">Địa chỉ:</td>
                                <td className="pb-1">{customer.address || '...'}</td>
                            </tr>
                            <tr>
                                <td className="w-24 font-bold text-slate-700 align-top">Ghi chú:</td>
                                <td className="italic text-slate-500">{note || 'Không có'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* --- 3. BẢNG HÀNG HÓA --- */}
                <div className="mb-2">
                    {children}
                </div>

                {/* --- 4. TỔNG KẾT TIỀN (Style bảng bên phải) --- */}
                <div className="flex justify-end mb-4">
                    <table className="w-full md:w-1/2 border-collapse">
                        <tbody>
                            <tr>
                                <td className="py-1 px-2 text-right font-bold text-slate-600 border-b border-slate-200">Tổng tiền hàng:</td>
                                <td className="py-1 px-2 text-right font-bold border-b border-slate-200">{payment.totalAmount.toLocaleString()}</td>
                            </tr>
                            
                            {payment.discount ? (
                                <tr>
                                    <td className="py-1 px-2 text-right italic text-slate-500 border-b border-slate-200">Chiết khấu:</td>
                                    <td className="py-1 px-2 text-right italic border-b border-slate-200">- {payment.discount.toLocaleString()}</td>
                                </tr>
                            ) : null}

                            <tr>
                                <td className="py-2 px-2 text-right font-bold uppercase text-slate-800 border-b border-slate-300">Tổng thanh toán:</td>
                                <td className="py-2 px-2 text-right font-bold text-lg text-red-600 border-b border-slate-300">{finalAmount.toLocaleString()}</td>
                            </tr>

                            {(payment.paidAmount !== undefined && payment.paidAmount > 0) && (
                                <>
                                    <tr>
                                        <td className="py-1 px-2 text-right font-bold text-slate-600 border-b border-slate-200">Đã thanh toán/Cọc:</td>
                                        <td className="py-1 px-2 text-right font-bold text-green-600 border-b border-slate-200">{payment.paidAmount.toLocaleString()}</td>
                                    </tr>
                                    {(payment.debt && payment.debt > 0) ? (
                                        <tr>
                                            <td className="py-1 px-2 text-right font-bold text-slate-600 border-b border-slate-200">Còn nợ:</td>
                                            <td className="py-1 px-2 text-right font-bold text-red-600 border-b border-slate-200">{payment.debt.toLocaleString()}</td>
                                        </tr>
                                    ) : null}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- 5. TIỀN BẰNG CHỮ --- */}
                <div className="mb-8">
                    <p className="font-bold">Bằng chữ: <span className="italic font-normal text-slate-800">
                        {readMoneyToText(finalAmount)}
                    </span>.</p>
                </div>

                {/* --- 6. CHỮ KÝ (Giống Invoice: 2 cột hoặc 4 cột tùy nhu cầu, ở đây để 2 cột chính cho giống Invoice) --- */}
                <div className="grid grid-cols-2 gap-10 mt-6 text-center break-inside-avoid">
                    <div>
                        <p className="font-bold uppercase text-sm">Người mua hàng</p>
                        <p className="italic text-xs mb-16">(Ký, ghi rõ họ tên)</p>
                        {/* <p className="font-bold">{customer.name}</p> */}
                    </div>
                    <div>
                        <p className="font-bold uppercase text-sm">Người bán hàng</p>
                        <p className="italic text-xs mb-16">(Ký, đóng dấu, ghi rõ họ tên)</p>
                    </div>
                </div>

                {/* --- 7. FOOTER BANK INFO --- */}
                <div className="text-center text-xs text-slate-400 mt-12 italic border-t pt-2 w-full">
                    {company.bankAccount ? 
                        `TK: ${company.bankAccount} ${company.bankName ? `- ${company.bankName}` : ''} ${company.bankOwner ? `- Chủ TK: ${company.bankOwner}` : ''}` : 
                        "(Cần kiểm tra đối chiếu khi lập, giao, nhận phiếu)"
                    }
                </div>
            </div>
        );
    }
);