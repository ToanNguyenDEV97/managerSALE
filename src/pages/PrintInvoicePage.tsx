import React, { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { useAppContext } from '../context/DataContext';
import { FiPrinter, FiArrowLeft } from 'react-icons/fi';

// Hàm đọc số thành chữ (đơn giản)
const docSoThanhChu = (so: number): string => {
    if (!so) return 'không đồng';
    return so.toLocaleString('vi-VN') + ' đồng'; 
    // Lưu ý: Để đọc chính xác hàng tỷ/triệu, bạn nên dùng thư viện 'n-2-vi'
};

const PrintInvoicePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { settings } = useAppContext(); // Lấy thông tin công ty từ cấu hình
    
    const { data: invoice, isLoading } = useQuery({
        queryKey: ['invoice', id],
        queryFn: () => api(`/api/invoices/${id}`),
        enabled: !!id
    });

    useEffect(() => {
        if (!isLoading && invoice) {
            document.title = `Hoa_don_${invoice.invoiceNumber}`;
            setTimeout(() => {
                window.print();
            }, 800);
        }
    }, [isLoading, invoice]);

    if (isLoading) return <div className="flex items-center justify-center h-screen text-slate-500">Đang tạo bản in...</div>;
    if (!invoice) return <div className="flex items-center justify-center h-screen text-red-500">Không tìm thấy hóa đơn!</div>;

    const debt = invoice.totalAmount - invoice.paidAmount;

    return (
        <div className="bg-slate-100 min-h-screen py-8 print:bg-white print:p-0">
            {/* Thanh công cụ (Ẩn khi in) */}
            <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden px-4">
                <button 
                    onClick={() => window.close()} 
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
                >
                    <FiArrowLeft /> Quay lại
                </button>
                <button 
                    onClick={() => window.print()} 
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-md font-bold transition-all"
                >
                    <FiPrinter /> In Hóa Đơn
                </button>
            </div>

            {/* --- TRANG GIẤY A4 --- */}
            <div className="bg-white max-w-[210mm] mx-auto p-[10mm] shadow-xl print:shadow-none print:w-full print:max-w-none print:p-0">
                
                {/* 1. HEADER */}
                <div className="flex justify-between items-start mb-8 border-b-2 border-slate-800 pb-6">
                    <div className="w-2/3">
                        {settings?.logo && (
                            <img src={settings.logo} alt="Logo" className="h-16 object-contain mb-3" />
                        )}
                        <h1 className="text-xl font-bold text-blue-800 uppercase">{settings?.companyName || 'TÊN CÔNG TY CỦA BẠN'}</h1>
                        <p className="text-sm text-slate-700 mt-1"><b>Địa chỉ:</b> {settings?.address || 'Chưa cập nhật địa chỉ'}</p>
                        <p className="text-sm text-slate-700"><b>Điện thoại:</b> {settings?.phone || '...'}</p>
                    </div>
                    <div className="w-1/3 text-right">
                        <h2 className="text-2xl font-bold text-red-600 uppercase tracking-wide">HÓA ĐƠN</h2>
                        <h3 className="text-lg font-bold text-slate-800 uppercase">BÁN HÀNG</h3>
                        <div className="mt-2 text-sm text-slate-600">
                            <p>Số: <b className="text-black">{invoice.invoiceNumber}</b></p>
                            <p>Ngày: {new Date(invoice.issueDate).toLocaleDateString('vi-VN')}</p>
                        </div>
                    </div>
                </div>

                {/* 2. THÔNG TIN KHÁCH HÀNG */}
                <div className="mb-6 text-sm">
                    <div className="flex mb-1">
                        <span className="w-32 font-bold text-slate-700">Khách hàng:</span>
                        <span className="uppercase font-semibold">{invoice.customerName}</span>
                    </div>
                    <div className="flex mb-1">
                        <span className="w-32 font-bold text-slate-700">Địa chỉ:</span>
                        <span>{invoice.customerAddress || '...'}</span>
                    </div>
                    <div className="flex mb-1">
                        <span className="w-32 font-bold text-slate-700">Điện thoại:</span>
                        <span>{invoice.customerPhone || '...'}</span>
                    </div>
                    <div className="flex">
                        <span className="w-32 font-bold text-slate-700">Ghi chú:</span>
                        <span className="italic text-slate-500">{invoice.note || 'Không có'}</span>
                    </div>
                </div>

                {/* 3. BẢNG HÀNG HÓA */}
                <table className="w-full text-sm border-collapse border border-slate-300 mb-6">
                    <thead>
                        <tr className="bg-slate-100 text-slate-800 font-bold uppercase text-xs">
                            <th className="border border-slate-300 py-2 px-2 w-12 text-center">STT</th>
                            <th className="border border-slate-300 py-2 px-2 text-left">Tên hàng hóa / Dịch vụ</th>
                            <th className="border border-slate-300 py-2 px-2 w-20 text-center">ĐVT</th>
                            <th className="border border-slate-300 py-2 px-2 w-20 text-center">SL</th>
                            <th className="border border-slate-300 py-2 px-2 w-32 text-right">Đơn giá</th>
                            <th className="border border-slate-300 py-2 px-2 w-32 text-right">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.items.map((item: any, index: number) => (
                            <tr key={index} className="odd:bg-white even:bg-slate-50/50">
                                <td className="border border-slate-300 py-2 px-2 text-center">{index + 1}</td>
                                <td className="border border-slate-300 py-2 px-2 font-medium">{item.name}</td>
                                <td className="border border-slate-300 py-2 px-2 text-center">{item.unit || 'Cái'}</td>
                                <td className="border border-slate-300 py-2 px-2 text-center font-bold">{item.quantity}</td>
                                <td className="border border-slate-300 py-2 px-2 text-right">{item.price.toLocaleString('vi-VN')}</td>
                                <td className="border border-slate-300 py-2 px-2 text-right font-bold">{ (item.price * item.quantity).toLocaleString('vi-VN') }</td>
                            </tr>
                        ))}
                        
                        {/* Dòng tổng cộng */}
                        <tr className="font-bold text-slate-800 bg-slate-50">
                            <td colSpan={5} className="border border-slate-300 py-2 px-4 text-right uppercase text-xs">Tổng tiền hàng:</td>
                            <td className="border border-slate-300 py-2 px-2 text-right text-base">{invoice.totalAmount.toLocaleString('vi-VN')}</td>
                        </tr>
                        <tr>
                            <td colSpan={5} className="border border-slate-300 py-2 px-4 text-right font-bold text-slate-600 text-xs">Thanh toán:</td>
                            <td className="border border-slate-300 py-2 px-2 text-right font-bold text-green-600">{invoice.paidAmount?.toLocaleString('vi-VN')}</td>
                        </tr>
                        {debt > 0 && (
                            <tr>
                                <td colSpan={5} className="border border-slate-300 py-2 px-4 text-right font-bold text-slate-600 text-xs">Còn nợ:</td>
                                <td className="border border-slate-300 py-2 px-2 text-right font-bold text-red-600">{debt.toLocaleString('vi-VN')}</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* 4. TIỀN BẰNG CHỮ */}
                <div className="mb-8 text-sm">
                    <p className="font-bold">Bằng chữ: <span className="italic font-normal text-slate-700">{docSoThanhChu(invoice.totalAmount)}</span>.</p>
                </div>

                {/* 5. CHỮ KÝ */}
                <div className="grid grid-cols-2 gap-10 mt-10 text-center break-inside-avoid">
                    <div>
                        <p className="font-bold uppercase text-sm mb-1">Người mua hàng</p>
                        <p className="text-xs italic text-slate-500 mb-16">(Ký, ghi rõ họ tên)</p>
                    </div>
                    <div>
                        <p className="font-bold uppercase text-sm mb-1">Người bán hàng</p>
                        <p className="text-xs italic text-slate-500 mb-16">(Ký, đóng dấu, ghi rõ họ tên)</p>
                    </div>
                </div>

                <div className="text-center text-xs text-slate-400 mt-10 italic">
                    (Cần kiểm tra đối chiếu khi lập, giao, nhận hóa đơn)
                </div>
            </div>
        </div>
    );
};

export default PrintInvoicePage;