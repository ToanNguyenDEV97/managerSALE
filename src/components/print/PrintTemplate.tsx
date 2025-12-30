import React from 'react';
import { useAppContext } from '../../context/DataContext';
// Đảm bảo bạn đã có hàm này trong utils/currency
import { readMoneyToText } from '../../utils/currency'; 

interface PrintTemplateProps {
    title: string;          // Ví dụ: ĐƠN ĐẶT HÀNG
    subTitle?: string;      // Ví dụ: (Liên 1: Lưu)
    code: string;           // Số phiếu: DH001
    date: string | Date;    // Ngày lập
    
    // Thông tin khách hàng (Truyền vào từ bên ngoài)
    customer: {
        name: string;
        companyName?: string;
        address?: string;
        phone?: string;
        taxCode?: string;
    };

    // Thông tin thanh toán (Để tính toán tổng tiền & đọc chữ)
    payment: {
        totalAmount: number;    // Tổng tiền hàng
        discount?: number;      // Chiết khấu
        paidAmount?: number;    // Đã trả/Cọc
        debt?: number;          // Còn nợ
    };

    note?: string;              // Ghi chú
    children: React.ReactNode;  // Bảng hàng hóa (Table)
}

export const PrintTemplate = React.forwardRef<HTMLDivElement, PrintTemplateProps>(
    ({ title, subTitle, code, date, customer, payment, note, children }, ref) => {
        
        // [QUAN TRỌNG] Lấy thông tin Shop từ DataContext mà bạn đã làm xong
        const { companyInfo } = useAppContext();
        
        // Fallback dữ liệu nếu chưa có (Tránh crash app)
        const company = companyInfo || {
            name: "CỬA HÀNG CỦA BẠN",
            address: "Chưa cập nhật địa chỉ trong Cấu hình",
            phone: "...",
            email: "",
            taxCode: "",
            bankAccount: "",
            bankName: "",
            logoUrl: ""
        };

        const dt = new Date(date);
        const finalAmount = payment.totalAmount - (payment.discount || 0);

        return (
            <div 
                ref={ref} 
                className="bg-white text-black p-10 mx-auto box-border leading-snug"
                style={{ 
                    width: '210mm', 
                    minHeight: '297mm', // Khổ A4 chuẩn
                    fontFamily: '"Times New Roman", Times, serif', 
                    fontSize: '11pt'
                }}
            >
                {/* --- 1. HEADER: THÔNG TIN CÔNG TY --- */}
                <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-black">
                    <div className="flex-1 pr-4">
                        <h1 className="text-lg font-bold uppercase text-blue-900 mb-1 tracking-wide">
                            {company.name}
                        </h1>
                        <div className="text-[13px] space-y-1">
                            <p><span className="font-bold">Địa chỉ:</span> {company.address}</p>
                            <p><span className="font-bold">Hotline:</span> {company.phone}</p>
                            {company.email && <p><span className="font-bold">Email:</span> {company.email}</p>}
                            {company.taxCode && <p><span className="font-bold">MST:</span> {company.taxCode}</p>}
                            {(company.bankAccount) && (
                                <p><span className="font-bold">TK:</span> {company.bankAccount} {company.bankName ? `- ${company.bankName}` : ''}</p>
                            )}
                        </div>
                    </div>
                    <div className="w-32 text-right">
                        {company.logoUrl ? (
                            <img src={company.logoUrl} alt="Logo" className="w-24 h-auto object-contain mb-1" />
                        ) : (
                            <div className="border border-slate-300 bg-slate-50 text-xs p-2 text-center text-slate-400">LOGO</div>
                        )}
                        <p className="text-sm mt-2">Số: <b>{code}</b></p>
                    </div>
                </div>

                {/* --- 2. TIÊU ĐỀ PHIẾU --- */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold uppercase tracking-wider">{title}</h2>
                    {subTitle && <p className="italic text-sm text-slate-600">{subTitle}</p>}
                    <p className="italic text-sm mt-1">Ngày {dt.getDate()} tháng {dt.getMonth() + 1} năm {dt.getFullYear()}</p>
                </div>

                {/* --- 3. THÔNG TIN KHÁCH HÀNG --- */}
                <div className="mb-6 space-y-1">
                    <div className="flex">
                        <span className="w-28 font-bold">Khách hàng:</span>
                        <span className="uppercase font-bold border-b border-dotted border-slate-400 flex-1">{customer.name}</span>
                    </div>
                    <div className="flex">
                        <span className="w-28 font-bold">Địa chỉ:</span>
                        <span className="border-b border-dotted border-slate-400 flex-1">{customer.address || '...'}</span>
                    </div>
                    <div className="flex">
                        <span className="w-28 font-bold">Điện thoại:</span>
                        <span className="border-b border-dotted border-slate-400 flex-1">{customer.phone || '...'}</span>
                    </div>
                    {note && (
                        <div className="flex">
                            <span className="w-28 font-bold">Ghi chú:</span>
                            <span className="italic border-b border-dotted border-slate-400 flex-1">{note}</span>
                        </div>
                    )}
                </div>

                {/* --- 4. BẢNG HÀNG HÓA --- */}
                <div className="mb-6 min-h-[150px]">
                    {children}
                </div>

                {/* --- 5. TỔNG KẾT TIỀN --- */}
                <div className="flex justify-end mb-8">
                    <div className="w-2/3">
                        <div className="flex justify-between border-b border-dotted border-slate-400 py-1">
                            <span className="font-bold">Tổng tiền hàng:</span>
                            <span>{payment.totalAmount.toLocaleString()} đ</span>
                        </div>
                        {payment.discount ? (
                            <div className="flex justify-between border-b border-dotted border-slate-400 py-1 italic">
                                <span>Chiết khấu:</span>
                                <span>- {payment.discount.toLocaleString()} đ</span>
                            </div>
                        ) : null}
                        
                        <div className="flex justify-between items-end py-2 mt-1 border-t border-black">
                            <span className="font-bold uppercase text-base">Tổng thanh toán:</span>
                            <span className="font-bold text-xl text-red-600">{finalAmount.toLocaleString()} đ</span>
                        </div>

                        <div className="text-right italic text-[13px] mt-1 mb-2 bg-slate-50 p-1">
                            (Bằng chữ: {readMoneyToText(finalAmount)})
                        </div>

                        {/* Nợ / Có */}
                        {(payment.paidAmount !== undefined && payment.paidAmount > 0) && (
                            <div className="pt-2 border-t border-dashed border-slate-300 text-sm">
                                <div className="flex justify-between">
                                    <span>Đã thanh toán / Cọc:</span>
                                    <span className="font-bold">{payment.paidAmount.toLocaleString()} đ</span>
                                </div>
                                {(payment.debt && payment.debt > 0) ? (
                                    <div className="flex justify-between text-red-600 font-bold mt-1">
                                        <span>Còn nợ:</span>
                                        <span>{payment.debt.toLocaleString()} đ</span>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- 6. CHỮ KÝ --- */}
                <div className="grid grid-cols-4 gap-4 text-center mt-4 mb-20 break-inside-avoid">
                    <div>
                        <p className="font-bold text-[11px] uppercase">Người lập phiếu</p>
                        <p className="italic text-[10px]">(Ký, họ tên)</p>
                    </div>
                    <div>
                        <p className="font-bold text-[11px] uppercase">Người giao hàng</p>
                        <p className="italic text-[10px]">(Ký, họ tên)</p>
                    </div>
                    <div>
                        <p className="font-bold text-[11px] uppercase">Thủ kho</p>
                        <p className="italic text-[10px]">(Ký, họ tên)</p>
                    </div>
                    <div>
                        <p className="font-bold text-[11px] uppercase">Khách hàng</p>
                        <p className="italic text-[10px]">(Ký, họ tên)</p>
                    </div>
                </div>

                <div className="text-center italic text-[10px] text-slate-500 border-t pt-2">
                    Cảm ơn Quý khách đã ủng hộ! - In từ hệ thống ManagerSALE
                </div>
            </div>
        );
    }
);