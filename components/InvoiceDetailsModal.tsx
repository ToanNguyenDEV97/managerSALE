
import React, { useMemo } from 'react';
import type { Invoice } from '../types';
import { useAppContext } from '../context/DataContext';
import { FiPrinter } from 'react-icons/fi';

const getStatusClass = (status: Invoice['status']) => {
    switch (status) {
        case 'Đã thanh toán': return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300';
        case 'Chưa thanh toán': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300';
        case 'Thanh toán một phần': return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300';
        case 'Quá hạn': return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300';
        default: return 'bg-slate-100 text-slate-800 dark:bg-slate-600 dark:text-slate-200';
    }
};

const InvoiceDetailsModal: React.FC = () => {
    const { viewingInvoiceId, invoices, setViewingInvoiceId, setPrintingInvoiceId } = useAppContext();
    const invoice = useMemo(() => invoices.find(inv => inv.id === viewingInvoiceId), [invoices, viewingInvoiceId]);

    const totals = useMemo(() => {
        if (!invoice) return { subtotal: 0, vatAmount: 0, total: 0, remaining: 0 };
        const total = invoice.totalAmount;
        const vatAmount = invoice.items.reduce((acc, item) => {
            const itemTotal = item.price * item.quantity;
            const basePrice = itemTotal / (1 + item.vat / 100);
            return acc + (itemTotal - basePrice);
        }, 0);
        const subtotal = total - vatAmount;
        const remaining = total - invoice.paidAmount;
        return { subtotal, vatAmount, total, remaining };
    }, [invoice]);

  if (!invoice) {
    return null;
  }

  const handlePrint = () => {
    setPrintingInvoiceId(invoice.id);
    setViewingInvoiceId(null);
  }

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Chi tiết Hóa đơn</h2>
              <p className="text-sm font-medium text-primary-600 mt-1">{invoice.invoiceNumber}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusClass(invoice.status)}`}>
              {invoice.status}
            </span>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            <p><strong>Khách hàng:</strong> {invoice.customerName}</p>
            <p><strong>Ngày xuất:</strong> {invoice.issueDate}</p>
          </div>
        </div>

        <div className="p-6 max-h-[50vh] overflow-y-auto">
            <table className="min-w-full">
                <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Sản phẩm</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Số lượng</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Đơn giá (gồm VAT)</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Thành tiền (gồm VAT)</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800">
                    {invoice.items.map(item => (
                        <tr key={item.productId} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                            <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-200">{item.name}</td>
                            <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-center">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-right">{item.price.toLocaleString('vi-VN')} đ</td>
                            <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100 font-medium text-right">{(item.quantity * item.price).toLocaleString('vi-VN')} đ</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div></div>
            <div className="space-y-2 text-slate-700 dark:text-slate-300 text-sm">
                <div className="flex justify-between">
                    <span>Tổng phụ:</span>
                    <span className="font-medium">{totals.subtotal.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} đ</span>
                </div>
                 <div className="flex justify-between">
                    <span>Thuế GTGT:</span>
                    <span className="font-medium">{totals.vatAmount.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} đ</span>
                </div>
                <div className="flex justify-between font-bold text-base text-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-slate-600 pt-2 mt-2">
                    <span>Tổng cộng:</span>
                    <span>{totals.total.toLocaleString('vi-VN')} đ</span>
                </div>
                 <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Đã thanh toán:</span>
                    <span className="font-medium">{invoice.paidAmount.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between font-bold text-base text-red-600">
                    <span>Còn lại:</span>
                    <span>{totals.remaining.toLocaleString('vi-VN')} đ</span>
                </div>
            </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
             <button type="button" onClick={() => setViewingInvoiceId(null)} className="px-6 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-200 font-medium text-sm">Đóng</button>
             <button type="button" onClick={handlePrint} className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium text-sm">
                <FiPrinter className="w-4 h-4" />
                In Hóa đơn
             </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailsModal;