import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { useAppContext } from '../context/DataContext';
import { FiX, FiPrinter, FiLoader, FiUser, FiCalendar, FiBox } from 'react-icons/fi';

const InvoiceDetailsModal: React.FC = () => {
    // Lấy ID hóa đơn đang xem từ Context
    const { viewingInvoiceId, setViewingInvoiceId, setPrintingInvoiceId } = useAppContext();

    // Gọi API lấy chi tiết hóa đơn
    const { data: invoice, isLoading } = useQuery({
        queryKey: ['invoice', viewingInvoiceId],
        queryFn: () => api(`/api/invoices/${viewingInvoiceId}`),
        enabled: !!viewingInvoiceId
    }) as any;

    if (!viewingInvoiceId) return null;

    const handleClose = () => setViewingInvoiceId(null);
    
    // Chuyển sang chế độ in
    const handlePrint = () => {
        handleClose();
        // Đợi modal đóng rồi mới mở modal in để tránh xung đột
        setTimeout(() => setPrintingInvoiceId(viewingInvoiceId), 300); 
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FiBox className="text-primary-600"/> 
                        Chi tiết hóa đơn {invoice?.invoiceNumber}
                    </h3>
                    <button onClick={handleClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full transition-colors">
                        <FiX size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {isLoading || !invoice ? (
                        <div className="flex justify-center py-20"><FiLoader className="animate-spin text-3xl text-primary-600"/></div>
                    ) : (
                        <div className="space-y-6">
                            {/* Thông tin chung */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                    <p className="text-xs font-bold text-blue-500 uppercase mb-2 flex items-center gap-1"><FiUser/> Khách hàng</p>
                                    <p className="font-bold text-slate-800 dark:text-white text-lg">{invoice.customerName}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{invoice.customerAddress || 'Chưa cập nhật địa chỉ'}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{invoice.customerPhone || 'Không có SĐT'}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><FiCalendar/> Thông tin đơn</p>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-slate-600 dark:text-slate-400">Mã hóa đơn:</span>
                                        <span className="font-bold">{invoice.invoiceNumber}</span>
                                    </div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-slate-600 dark:text-slate-400">Ngày tạo:</span>
                                        <span className="font-medium">{new Date(invoice.issueDate).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">Trạng thái:</span>
                                        <span className={`font-bold ${invoice.paidAmount >= invoice.totalAmount ? 'text-green-600' : 'text-orange-600'}`}>
                                            {invoice.paidAmount >= invoice.totalAmount ? 'Đã thanh toán' : 'Còn nợ'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Bảng sản phẩm */}
                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase text-xs">
                                        <tr>
                                            <th className="px-4 py-3">Sản phẩm</th>
                                            <th className="px-4 py-3 text-center">ĐVT</th>
                                            <th className="px-4 py-3 text-center">SL</th>
                                            <th className="px-4 py-3 text-right">Đơn giá</th>
                                            <th className="px-4 py-3 text-right">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {invoice.items.map((item: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                <td className="px-4 py-3 font-medium">{item.name}</td>
                                                <td className="px-4 py-3 text-center text-slate-500">{item.unit || 'Cái'}</td>
                                                <td className="px-4 py-3 text-center font-bold">{item.quantity}</td>
                                                <td className="px-4 py-3 text-right">{item.price.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right font-bold">{ (item.price * item.quantity).toLocaleString() }</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Tổng kết tiền */}
                            <div className="flex justify-end">
                                <div className="w-full md:w-1/2 bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl space-y-2">
                                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                        <span>Tổng tiền hàng:</span>
                                        <span className="font-bold text-slate-800 dark:text-white text-lg">{invoice.totalAmount.toLocaleString()} đ</span>
                                    </div>
                                    <div className="flex justify-between text-green-600">
                                        <span>Đã thanh toán:</span>
                                        <span className="font-bold">-{invoice.paidAmount.toLocaleString()} đ</span>
                                    </div>
                                    <div className="border-t border-slate-300 dark:border-slate-600 my-2 pt-2 flex justify-between text-red-600 text-lg font-bold">
                                        <span>Còn nợ:</span>
                                        <span>{ (invoice.totalAmount - invoice.paidAmount).toLocaleString() } đ</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 flex justify-end gap-3">
                    <button onClick={handleClose} className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 font-medium text-slate-700 transition-colors">
                        Đóng lại
                    </button>
                    <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md flex items-center gap-2 transition-colors">
                        <FiPrinter /> In hóa đơn này
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetailsModal;