import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api'; 
import { useAppContext } from '../context/DataContext'; // Lấy thông tin công ty
import { FiX, FiPrinter, FiLoader, FiCheckCircle } from 'react-icons/fi';

interface Props {
    invoiceId: string;
    onClose: () => void;
}

// Hàm đọc số thành chữ đơn giản
const docSoThanhChu = (so: number): string => {
    if (!so) return 'không đồng';
    return so.toLocaleString('vi-VN') + ' đồng'; 
};

const PrintInvoiceModal: React.FC<Props> = ({ invoiceId, onClose }) => {
    const { settings } = useAppContext(); // Lấy logo, tên công ty từ cấu hình
    
    const { data: invoice, isLoading, error } = useQuery({
        queryKey: ['invoice', invoiceId],
        queryFn: () => api(`/api/invoices/${invoiceId}`),
        enabled: !!invoiceId,
        retry: 1
    }) as any;

    if (isLoading) return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 text-white font-bold gap-2">
            <FiLoader className="animate-spin"/> Đang tạo hóa đơn...
        </div>
    );
    
    if (error || !invoice) return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 text-white p-4">
            <p className="text-xl mb-2">⚠️ Không tìm thấy hóa đơn!</p>
            <button onClick={onClose} className="bg-red-600 px-4 py-2 rounded">Đóng</button>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm print:bg-white print:p-0 print:block overflow-hidden">
            
            {/* --- GIAO DIỆN XEM TRƯỚC (PREVIEW) --- */}
            <div className="absolute inset-0 flex flex-col items-center justify-center print:hidden p-4">
                
                {/* Thông báo thành công */}
                {(() => {
                    const debt = invoice.totalAmount - (invoice.paidAmount || 0);
                    const isDebt = debt > 0;
                    
                    return (
                        <div className={`px-6 py-2 rounded-full font-bold mb-4 flex items-center gap-2 shadow-lg animate-bounce-short ${
                            isDebt ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                        }`}>
                            {isDebt ? <FiCheckCircle size={20} /> : <FiCheckCircle size={20} />} 
                            {isDebt ? 'Đã lưu đơn nợ thành công!' : 'Thanh toán thành công!'}
                        </div>
                    );
                })()}

                {/* Container chứa tờ hóa đơn A4 + Nút bấm */}
                <div className="flex flex-col md:flex-row gap-6 h-[85vh] w-full max-w-6xl">
                    
                    {/* KHUNG HIỂN THỊ HÓA ĐƠN (Cuộn được) */}
                    <div className="flex-1 bg-slate-200 rounded-xl shadow-2xl overflow-y-auto custom-scrollbar p-4 flex justify-center">
                        <div className="bg-white shadow-lg min-h-[297mm] w-[210mm] origin-top scale-75 md:scale-90 lg:scale-100 transition-transform">
                            {/* Nội dung hóa đơn A4 */}
                            <InvoiceA4Content invoice={invoice} settings={settings} />
                        </div>
                    </div>

                    {/* CỘT NÚT BẤM BÊN PHẢI */}
                    <div className="flex flex-col gap-4 justify-center min-w-[200px]">
                        <button 
                            onClick={() => window.print()} 
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-5 rounded-xl font-bold flex flex-col items-center gap-2 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
                        >
                            <FiPrinter size={40} />
                            <span className="text-lg">IN HÓA ĐƠN</span>
                        </button>
                        
                        <button 
                            onClick={onClose} 
                            className="bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-300 px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
                        >
                            <FiX size={24} />
                            <span>Đóng lại</span>
                        </button>

                        <div className="bg-white/90 p-4 rounded-lg text-sm text-slate-500 shadow-sm mt-4">
                            <p className="font-bold mb-1">Thông tin:</p>
                            <p>Tổng tiền: <span className="text-blue-600 font-bold">{invoice.totalAmount?.toLocaleString()}</span></p>
                            <p>Khách hàng: {invoice.customerName}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- PHẦN IN THỰC TẾ (Chỉ hiện khi máy in chạy) --- */}
            <div className="hidden print:block w-full h-full bg-white text-black p-0 m-0">
                <InvoiceA4Content invoice={invoice} settings={settings} />
            </div>
        </div>
    );
};

// Component con: Nội dung Hóa đơn A4 (Tái sử dụng cho cả Preview và Print)
const InvoiceA4Content = ({ invoice, settings }: { invoice: any, settings: any }) => {
    const debt = invoice.totalAmount - (invoice.paidAmount || 0);

    return (
        <div className="p-[10mm] font-sans text-sm h-full relative">
            {/* 1. HEADER */}
            <div className="flex justify-between items-start mb-8 border-b-2 border-slate-800 pb-6">
                <div className="w-2/3 pr-4">
                    {settings?.logo && (
                        <img src={settings.logo} alt="Logo" className="h-16 object-contain mb-3" />
                    )}
                    <h1 className="text-xl font-bold text-blue-800 uppercase leading-tight">{settings?.companyName || 'CỬA HÀNG VẬT LIỆU XÂY DỰNG'}</h1>
                    <p className="text-sm text-slate-700 mt-2"><b>Địa chỉ:</b> {settings?.address || '...'}</p>
                    <p className="text-sm text-slate-700"><b>Điện thoại:</b> {settings?.phone || '...'}</p>
                </div>
                <div className="w-1/3 text-right">
                    <h2 className="text-2xl font-bold text-red-600 uppercase tracking-wide">HÓA ĐƠN</h2>
                    <h3 className="text-lg font-bold text-slate-800 uppercase">BÁN HÀNG</h3>
                    <div className="mt-2 text-sm text-slate-600">
                        <p>Số: <b className="text-black text-base">{invoice.invoiceNumber}</b></p>
                        <p>Ngày: {new Date(invoice.issueDate).toLocaleDateString('vi-VN')}</p>
                    </div>
                </div>
            </div>

            {/* 2. THÔNG TIN KHÁCH HÀNG */}
            <div className="mb-6">
                <div className="flex mb-1">
                    <span className="w-24 font-bold text-slate-700 flex-shrink-0">Khách hàng:</span>
                    <span className="uppercase font-semibold">{invoice.customerName}</span>
                </div>
                <div className="flex mb-1">
                    <span className="w-24 font-bold text-slate-700 flex-shrink-0">Địa chỉ:</span>
                    <span>{invoice.customerAddress || '...'}</span>
                </div>
                <div className="flex mb-1">
                    <span className="w-24 font-bold text-slate-700 flex-shrink-0">Điện thoại:</span>
                    <span>{invoice.customerPhone || '...'}</span>
                </div>
                <div className="flex">
                    <span className="w-24 font-bold text-slate-700 flex-shrink-0">Ghi chú:</span>
                    <span className="italic text-slate-500">{invoice.note || 'Không có'}</span>
                </div>
            </div>

            {/* 3. BẢNG HÀNG HÓA */}
            <table className="w-full border-collapse border border-slate-300 mb-6">
                <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold uppercase text-xs">
                        <th className="border border-slate-300 py-2 px-2 w-12 text-center">STT</th>
                        <th className="border border-slate-300 py-2 px-2 text-left">Tên hàng hóa / Dịch vụ</th>
                        <th className="border border-slate-300 py-2 px-2 w-16 text-center">ĐVT</th>
                        <th className="border border-slate-300 py-2 px-2 w-16 text-center">SL</th>
                        <th className="border border-slate-300 py-2 px-2 w-28 text-right">Đơn giá</th>
                        <th className="border border-slate-300 py-2 px-2 w-32 text-right">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.items?.map((item: any, index: number) => (
                        <tr key={index} className="text-sm">
                            <td className="border border-slate-300 py-2 px-2 text-center">{index + 1}</td>
                            <td className="border border-slate-300 py-2 px-2 font-medium">{item.name}</td>
                            <td className="border border-slate-300 py-2 px-2 text-center">{item.unit || 'Cái'}</td>
                            <td className="border border-slate-300 py-2 px-2 text-center font-bold">{item.quantity}</td>
                            <td className="border border-slate-300 py-2 px-2 text-right">{item.price?.toLocaleString()}</td>
                            <td className="border border-slate-300 py-2 px-2 text-right font-bold">{ (item.price * item.quantity).toLocaleString() }</td>
                        </tr>
                    ))}
                    
                    {/* Phần tổng cộng */}
                    <tr className="font-bold text-slate-800 bg-slate-50">
                        <td colSpan={5} className="border border-slate-300 py-2 px-4 text-right uppercase text-xs">Tổng tiền hàng:</td>
                        <td className="border border-slate-300 py-2 px-2 text-right text-base">{invoice.totalAmount?.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td colSpan={5} className="border border-slate-300 py-2 px-4 text-right font-bold text-slate-600 text-xs">Đã thanh toán:</td>
                        <td className="border border-slate-300 py-2 px-2 text-right font-bold text-green-600">{invoice.paidAmount?.toLocaleString()}</td>
                    </tr>
                    {debt > 0 && (
                        <tr>
                            <td colSpan={5} className="border border-slate-300 py-2 px-4 text-right font-bold text-slate-600 text-xs">Còn nợ:</td>
                            <td className="border border-slate-300 py-2 px-2 text-right font-bold text-red-600">{debt.toLocaleString()}</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* 4. TIỀN BẰNG CHỮ */}
            <div className="mb-10 text-sm">
                <p className="font-bold">Bằng chữ: <span className="italic font-normal text-slate-800">{docSoThanhChu(invoice.totalAmount)}</span>.</p>
            </div>

            {/* 5. CHỮ KÝ */}
            <div className="grid grid-cols-2 gap-10 mt-6 text-center break-inside-avoid">
                <div>
                    <p className="font-bold uppercase text-sm mb-1">Người mua hàng</p>
                    <p className="text-xs italic text-slate-500 mb-16">(Ký, ghi rõ họ tên)</p>
                </div>
                <div>
                    <p className="font-bold uppercase text-sm mb-1">Người bán hàng</p>
                    <p className="text-xs italic text-slate-500 mb-16">(Ký, đóng dấu, ghi rõ họ tên)</p>
                </div>
            </div>

            <div className="text-center text-xs text-slate-400 mt-12 italic border-t pt-2">
                (Cần kiểm tra đối chiếu khi lập, giao, nhận hóa đơn)
            </div>
        </div>
    );
};

export default PrintInvoiceModal;