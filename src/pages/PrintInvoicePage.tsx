import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppContext } from '../context/DataContext';
import { api } from '../utils/api';
import { FiPrinter, FiArrowLeft, FiLoader } from 'react-icons/fi';

const PrintInvoicePage: React.FC = () => {
    // Lấy ID hóa đơn cần in và thông tin Cài đặt (Tên shop, logo...) từ Context
    const { printingInvoiceId, setPrintingInvoiceId, settings } = useAppContext();

    // Gọi API lấy chi tiết hóa đơn
    const { data: invoice, isLoading } = useQuery({
        queryKey: ['invoice', printingInvoiceId],
        queryFn: () => api(`/api/invoices/${printingInvoiceId}`),
        enabled: !!printingInvoiceId,
    }) as any;

    // Tự động bật cửa sổ in khi dữ liệu tải xong
    useEffect(() => {
        if (invoice) {
            document.title = `Hoa_don_${invoice.invoiceNumber}`; // Đặt tên file khi lưu PDF
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [invoice]);

    if (isLoading) return <div className="h-screen flex items-center justify-center"><FiLoader className="animate-spin text-4xl text-slate-400"/></div>;
    if (!invoice) return null;

    return (
        <div className="min-h-screen bg-slate-500 p-4 md:p-8 flex justify-center overflow-auto print:bg-white print:p-0 print:overflow-visible">
            
            {/* THANH ĐIỀU KHIỂN (Sẽ ẩn khi in) */}
            <div className="fixed top-4 left-4 flex gap-2 print:hidden z-50">
                <button 
                    onClick={() => setPrintingInvoiceId(null)} // Quay lại trang danh sách
                    className="bg-white text-slate-700 px-4 py-2 rounded shadow hover:bg-slate-100 flex items-center gap-2 font-medium"
                >
                    <FiArrowLeft /> Quay lại
                </button>
                <button 
                    onClick={() => window.print()} 
                    className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2 font-medium"
                >
                    <FiPrinter /> In ngay
                </button>
            </div>

            {/* TRANG GIẤY A4 */}
            <div className="bg-white w-[210mm] min-h-[297mm] p-[10mm] shadow-2xl print:shadow-none print:w-full print:min-h-0 mx-auto text-slate-900 text-sm leading-relaxed">
                
                {/* 1. HEADER: Thông tin cửa hàng */}
                <div className="flex justify-between items-start border-b border-slate-300 pb-4 mb-6">
                    <div>
                        {settings?.logo && (
                            <img src={settings.logo} alt="Logo" className="h-16 mb-2 object-contain" />
                        )}
                        <h1 className="text-2xl font-bold uppercase text-slate-800">{settings?.companyName || 'CỬA HÀNG CỦA BẠN'}</h1>
                        <p className="text-slate-600 whitespace-pre-line">{settings?.address}</p>
                        <p className="text-slate-600">Hotline: {settings?.phone}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-bold text-slate-800 uppercase tracking-widest">Hóa đơn</h2>
                        <p className="text-slate-500 mt-1">Số: <span className="font-bold text-slate-900">{invoice.invoiceNumber}</span></p>
                        <p className="text-slate-500">Ngày: <span className="font-bold text-slate-900">{new Date(invoice.issueDate).toLocaleDateString('vi-VN')}</span></p>
                    </div>
                </div>

                {/* 2. INFO: Thông tin khách hàng */}
                <div className="mb-8">
                    <div className="grid grid-cols-[100px_1fr] gap-y-1">
                        <span className="text-slate-500">Khách hàng:</span>
                        <span className="font-bold">{invoice.customerName}</span>
                        
                        <span className="text-slate-500">Điện thoại:</span>
                        <span>{invoice.customerPhone || '---'}</span>
                        
                        <span className="text-slate-500">Địa chỉ:</span>
                        <span>{invoice.customerAddress || '---'}</span>

                        {invoice.note && (
                            <>
                                <span className="text-slate-500">Ghi chú:</span>
                                <span className="italic">{invoice.note}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* 3. TABLE: Danh sách hàng hóa */}
                <table className="w-full border-collapse mb-6">
                    <thead>
                        <tr className="bg-slate-100 border-y border-slate-300 print:bg-slate-100 print:print-color-adjust">
                            <th className="py-2 px-3 text-center font-bold w-12 border-l border-slate-300">STT</th>
                            <th className="py-2 px-3 text-left font-bold border-l border-slate-300">Tên sản phẩm</th>
                            <th className="py-2 px-3 text-center font-bold w-20 border-l border-slate-300">ĐVT</th>
                            <th className="py-2 px-3 text-center font-bold w-16 border-l border-slate-300">SL</th>
                            <th className="py-2 px-3 text-right font-bold w-32 border-l border-slate-300">Đơn giá</th>
                            <th className="py-2 px-3 text-right font-bold w-32 border-x border-slate-300">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.items.map((item: any, index: number) => (
                            <tr key={index} className="border-b border-slate-200">
                                <td className="py-2 px-3 text-center border-l border-slate-200">{index + 1}</td>
                                <td className="py-2 px-3 text-left font-medium border-l border-slate-200">{item.name}</td>
                                <td className="py-2 px-3 text-center border-l border-slate-200">{item.unit || 'Cái'}</td>
                                <td className="py-2 px-3 text-center font-bold border-l border-slate-200">{item.quantity}</td>
                                <td className="py-2 px-3 text-right border-l border-slate-200">{item.price.toLocaleString()}</td>
                                <td className="py-2 px-3 text-right font-bold border-x border-slate-200">{(item.price * item.quantity).toLocaleString()}</td>
                            </tr>
                        ))}
                        {/* Dòng trống để bảng trông dài ra nếu ít hàng (Optional) */}
                        {[...Array(Math.max(0, 10 - invoice.items.length))].map((_, i) => (
                            <tr key={`empty-${i}`} className="h-9 border-b border-slate-100">
                                <td className="border-l border-slate-100"></td>
                                <td className="border-l border-slate-100"></td>
                                <td className="border-l border-slate-100"></td>
                                <td className="border-l border-slate-100"></td>
                                <td className="border-l border-slate-100"></td>
                                <td className="border-x border-slate-100"></td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* 4. TOTAL: Tổng tiền */}
                <div className="flex justify-end mb-12">
                    <div className="w-1/2 md:w-1/3 space-y-2">
                        <div className="flex justify-between">
                            <span className="font-medium text-slate-600">Tổng cộng:</span>
                            <span className="font-bold text-lg">{invoice.totalAmount.toLocaleString()} đ</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-slate-600">Đã thanh toán:</span>
                            <span className="font-bold">{invoice.paidAmount.toLocaleString()} đ</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-300 pt-2">
                            <span className="font-bold text-slate-800">Còn nợ:</span>
                            <span className="font-bold text-red-600">{(invoice.totalAmount - invoice.paidAmount).toLocaleString()} đ</span>
                        </div>
                    </div>
                </div>

                {/* 5. FOOTER: Chữ ký */}
                <div className="grid grid-cols-2 gap-8 text-center mt-12 break-inside-avoid">
                    <div>
                        <p className="font-bold mb-16">Người mua hàng</p>
                        <p className="italic text-slate-400">(Ký, ghi rõ họ tên)</p>
                    </div>
                    <div>
                        <p className="font-bold mb-2">Người bán hàng</p>
                        <p className="italic mb-12 text-slate-500">Ngày ..... tháng ..... năm 20...</p>
                        <p className="font-bold">{settings?.companyName || 'Cửa hàng trưởng'}</p>
                    </div>
                </div>
                
                <div className="text-center mt-12 text-xs text-slate-400 italic">
                    Cảm ơn quý khách đã mua hàng! Hẹn gặp lại.
                </div>
            </div>
        </div>
    );
};

export default PrintInvoicePage;