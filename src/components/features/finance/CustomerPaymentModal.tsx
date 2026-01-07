
import React, { useState, useMemo } from 'react';
import type { Invoice } from '../../../types';
import { FiCreditCard, FiChevronRight } from 'react-icons/fi';
import { useAppContext } from '../../../context/DataContext';

const getStatusClass = (status: Invoice['status']) => {
    switch (status) {
        case 'Đã thanh toán': return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300';
        case 'Chưa thanh toán': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300';
        case 'Thanh toán một phần': return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300';
        case 'Quá hạn': return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300';
        default: return 'bg-slate-100 text-slate-800 dark:bg-slate-600 dark:text-slate-200';
    }
};

const CustomerPaymentModal: React.FC = () => {
    const { payingCustomerId, customers, invoices, setPayingCustomerId, setPayingInvoiceId, handlePayAllDebt } = useAppContext();
    const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

    const customer = useMemo(() => customers.find(c => c.id === payingCustomerId), [customers, payingCustomerId]);
    const customerInvoices = useMemo(() => invoices.filter(inv => inv.customerId === payingCustomerId), [invoices, payingCustomerId]);

    if (!customer) return null;

    const toggleExpand = (invoiceId: string) => {
        setExpandedInvoiceId(prevId => prevId === invoiceId ? null : invoiceId);
    }

    const handlePayAllClick = async () => {
        if (window.confirm(`Bạn có chắc chắn muốn thanh toán toàn bộ công nợ ${customer.debt.toLocaleString('vi-VN')} đ cho khách hàng ${customer.name} không?`)) {
            await handlePayAllDebt(customer.id);
        }
    }

    return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex justify-center items-center p-0 sm:p-4">
        <div className="bg-white dark:bg-slate-800 rounded-none sm:rounded-xl shadow-2xl w-full h-full sm:w-full sm:max-w-4xl sm:h-auto sm:max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Tổng quan Thanh toán</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Khách hàng: <span className="font-medium text-primary-600">{customer.name}</span></p>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="text-right flex-grow">
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Tổng công nợ</p>
                            <p className="text-lg sm:text-2xl font-bold text-red-600">{customer.debt.toLocaleString('vi-VN')} đ</p>
                        </div>
                        <button 
                            onClick={handlePayAllClick}
                            disabled={customer.debt <= 0}
                            className="px-3 py-2 text-white rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-px font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500"
                        >
                            Thanh toán Toàn bộ
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50 dark:bg-slate-900">
                {customerInvoices.length > 0 ? customerInvoices.map(invoice => {
                    const remainingAmount = invoice.totalAmount - invoice.paidAmount;
                    const isExpanded = expandedInvoiceId === invoice.id;

                    return (
                        <div key={invoice.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-shadow hover:shadow-md">
                           <div className="flex items-center p-3 sm:p-4">
                               <button onClick={() => toggleExpand(invoice.id)} className="mr-2 sm:mr-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                                   <FiChevronRight className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                               </button>
                               <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 items-center">
                                    <div className="font-medium text-primary-700 dark:text-primary-400 col-span-2 sm:col-span-1">{invoice.invoiceNumber}</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">{invoice.issueDate}</div>
                                    <div className="text-sm">
                                        <div className="font-medium text-slate-800 dark:text-slate-200">{invoice.totalAmount.toLocaleString('vi-VN')} đ</div>
                                        {invoice.paidAmount > 0 && <div className="text-xs text-green-600 dark:text-green-400">Đã trả: {invoice.paidAmount.toLocaleString('vi-VN')} đ</div>}
                                    </div>
                                    <div className="text-sm font-bold text-red-600 hidden sm:block">{remainingAmount > 0 ? `${remainingAmount.toLocaleString('vi-VN')} đ` : '-'}</div>
                                    <div className="justify-self-start sm:justify-self-auto">
                                         <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(invoice.status)}`}>
                                            {invoice.status}
                                        </span>
                                    </div>
                               </div>
                                <div className="ml-2 sm:ml-4">
                                    {invoice.status !== 'Đã thanh toán' && (
                                        <button onClick={() => setPayingInvoiceId(invoice.id)} className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-100 dark:hover:bg-green-500/20" title="Ghi nhận thanh toán">
                                            <FiCreditCard className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                           </div>
                           {isExpanded && (
                               <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
                                   <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">Chi tiết hóa đơn:</h4>
                                   <div className="overflow-x-auto">
                                       <table className="min-w-full text-sm">
                                           <thead className="text-left text-slate-500 dark:text-slate-400">
                                               <tr>
                                                   <th className="py-1 pr-2 font-medium">Sản phẩm</th>
                                                   <th className="py-1 px-2 font-medium text-center">SL</th>
                                                   <th className="py-1 px-2 font-medium text-right">Đơn giá</th>
                                                   <th className="py-1 pl-2 font-medium text-right">Thành tiền</th>
                                               </tr>
                                           </thead>
                                           <tbody className="dark:text-slate-300">
                                               {invoice.items.map(item => (
                                                   <tr key={item.productId} className="border-b border-slate-100 dark:border-slate-700 last:border-0">
                                                       <td className="py-1.5 pr-2">{item.name}</td>
                                                       <td className="py-1.5 px-2 text-center">{item.quantity}</td>
                                                       <td className="py-1.5 px-2 text-right whitespace-nowrap">{item.price.toLocaleString('vi-VN')} đ</td>
                                                       <td className="py-1.5 pl-2 text-right font-medium whitespace-nowrap">{(item.price * item.quantity).toLocaleString('vi-VN')} đ</td>
                                                   </tr>
                                               ))}
                                           </tbody>
                                       </table>
                                   </div>
                               </div>
                           )}
                        </div>
                    )
                }) : (
                    <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                        Không có hóa đơn nào cho khách hàng này.
                    </div>
                )}
            </div>

            <div className="p-6 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                <button type="button" onClick={() => setPayingCustomerId(null)} className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200 font-medium text-sm">Đóng</button>
            </div>
        </div>
    </div>
    );
};

export default CustomerPaymentModal;
