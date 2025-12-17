import React, { useMemo } from 'react';
import { useAppContext } from '../context/DataContext';
import { FiPrinter, FiX } from 'react-icons/fi';
import { useInvoices } from '../hooks/useInvoices'; // Import Hook

const InvoiceDetailsModal: React.FC = () => {
    const { viewingInvoiceId, setViewingInvoiceId, setPrintingInvoiceId } = useAppContext();
    
    // Lấy data từ Hook thay vì Context
    const { data: invoicesData } = useInvoices(1);
    const invoices = Array.isArray(invoicesData) ? invoicesData : (invoicesData?.data || []);
    
    const invoice = useMemo(() => invoices.find((inv: any) => inv.id === viewingInvoiceId), [invoices, viewingInvoiceId]);

    if (!viewingInvoiceId || !invoice) return null;

    const totals = {
        total: invoice.totalAmount,
        remaining: invoice.totalAmount - invoice.paidAmount
    };

    return (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Chi tiết Hóa đơn {invoice.invoiceNumber}</h3>
                    <button onClick={() => setViewingInvoiceId(null)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                        <FiX className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex justify-between mb-6">
                        <div>
                            <p className="text-sm text-slate-500">Khách hàng</p>
                            <p className="font-bold text-lg dark:text-white">{invoice.customerName}</p>
                            <p className="text-sm text-slate-500 mt-1">Ngày: {invoice.issueDate}</p>
                        </div>
                        <div className="text-right">
                             <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                invoice.status === 'Đã thanh toán' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                             }`}>
                                {invoice.status}
                             </span>
                        </div>
                    </div>

                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead>
                            <tr>
                                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3">Sản phẩm</th>
                                <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider py-3">SL</th>
                                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider py-3">Đơn giá</th>
                                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider py-3">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {invoice.items.map((item: any, idx: number) => (
                                <tr key={idx}>
                                    <td className="py-4 text-sm font-medium text-slate-900 dark:text-white">{item.name}</td>
                                    <td className="py-4 text-sm text-center text-slate-500 dark:text-slate-400">{item.quantity}</td>
                                    <td className="py-4 text-sm text-right text-slate-500 dark:text-slate-400">{item.price.toLocaleString()}</td>
                                    <td className="py-4 text-sm text-right font-bold text-slate-900 dark:text-white">{(item.price * item.quantity).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                             <tr>
                                <td colSpan={3} className="pt-4 text-right font-bold text-slate-900 dark:text-white">Tổng cộng:</td>
                                <td className="pt-4 text-right font-bold text-primary-600">{totals.total.toLocaleString()} đ</td>
                            </tr>
                            <tr>
                                <td colSpan={3} className="pt-2 text-right text-slate-500">Đã thanh toán:</td>
                                <td className="pt-2 text-right text-green-600">{invoice.paidAmount.toLocaleString()} đ</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                    <button onClick={() => { setPrintingInvoiceId(invoice.id); setViewingInvoiceId(null); }} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                        <FiPrinter /> In Hóa đơn
                    </button>
                    <button onClick={() => setViewingInvoiceId(null)} className="px-4 py-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-white">
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetailsModal;