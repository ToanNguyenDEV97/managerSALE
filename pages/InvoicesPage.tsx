
import React, { useState, useMemo } from 'react';
import { FiPlus, FiEdit, FiEye, FiCreditCard, FiPrinter, FiInbox, FiTruck } from 'react-icons/fi';
import type { Invoice, PageKey } from '../types';
import { useAppContext } from '../context/DataContext';
import InvoiceDetailsModal from '../components/InvoiceDetailsModal';
import Pagination from '../components/Pagination';
import ColumnToggler from '../components/ColumnToggler';

const invoiceColumns: Record<string, string> = {
    invoiceNumber: 'Số HĐ',
    customerName: 'Khách hàng',
    issueDate: 'Ngày xuất',
    totalAmount: 'Tổng tiền',
    status: 'Trạng thái',
};

const InvoicesPage: React.FC = () => {
    const { invoices, setEditingInvoice, setPayingCustomerId, setViewingInvoiceId, setPrintingInvoiceId, setEditingDelivery, setInvoiceIdForNewDelivery, columnVisibility, handleColumnVisibilityChange } = useAppContext();
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const pageKey: PageKey = 'invoices';


    const filteredInvoices = useMemo(() => invoices.filter(invoice => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'unpaid') return invoice.status === 'Chưa thanh toán' || invoice.status === 'Thanh toán một phần' || invoice.status === 'Quá hạn';
        return invoice.status === statusFilter;
    }).sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()), [invoices, statusFilter]);

    const paginatedInvoices = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredInvoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredInvoices, currentPage]);

    const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
    
    const handleCreateDeliveryClick = (invoiceId: string) => {
        setInvoiceIdForNewDelivery(invoiceId);
        setEditingDelivery('new');
    };

    const getStatusClass = (status: Invoice['status']) => {
        switch (status) {
            case 'Đã thanh toán': return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300';
            case 'Chưa thanh toán': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300';
            case 'Thanh toán một phần': return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300';
            case 'Quá hạn': return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-600 dark:text-slate-200';
        }
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="hidden lg:block">
                        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-200">Quản lý Hóa đơn</h1>
                        <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400 mt-1">Tạo và theo dõi các hóa đơn bán hàng.</p>
                    </div>
                    <button
                        onClick={() => setEditingInvoice('new')}
                        className="flex items-center justify-center w-full md:w-auto px-4 py-2 text-white rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-px"
                    >
                        <FiPlus />
                        <span className="ml-2 font-medium">Tạo Hóa đơn (tại quầy)</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row justify-end items-center gap-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full sm:w-auto border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 sm:text-sm"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="unpaid">Tất cả khoản chưa trả</option>
                        <option value="Chưa thanh toán">Chưa thanh toán</option>
                        <option value="Thanh toán một phần">Thanh toán một phần</option>
                        <option value="Đã thanh toán">Đã thanh toán</option>
                        <option value="Quá hạn">Quá hạn</option>
                    </select>
                    <ColumnToggler
                        pageKey={pageKey}
                        columns={invoiceColumns}
                        visibility={columnVisibility[pageKey]}
                        onToggle={handleColumnVisibilityChange}
                    />
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {/* Table View */}
                    <div className="overflow-x-auto hidden lg:block">
                        <table className="min-w-full">
                            <thead className="bg-primary-50 dark:bg-slate-700">
                                <tr>
                                    {columnVisibility.invoices.invoiceNumber && <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Số HĐ</th>}
                                    {columnVisibility.invoices.customerName && <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Khách hàng</th>}
                                    {columnVisibility.invoices.issueDate && <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Ngày xuất</th>}
                                    {columnVisibility.invoices.totalAmount && <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Tổng tiền</th>}
                                    {columnVisibility.invoices.status && <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Trạng thái</th>}
                                    <th className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800">
                                {paginatedInvoices.map(invoice => (
                                    <tr key={invoice.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200">
                                        {columnVisibility.invoices.invoiceNumber && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">
                                            <div>{invoice.invoiceNumber}</div>
                                            {invoice.orderId && <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-1"><FiInbox className="w-3 h-3"/> Từ ĐH</div>}
                                        </td>}
                                        {columnVisibility.invoices.customerName && <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 dark:text-slate-300">{invoice.customerName}</td>}
                                        {columnVisibility.invoices.issueDate && <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{invoice.issueDate}</td>}
                                        {columnVisibility.invoices.totalAmount && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">
                                            <div>{invoice.totalAmount.toLocaleString('vi-VN')} đ</div>
                                            {invoice.paidAmount > 0 && (
                                                 <div className="text-xs text-green-600 dark:text-green-400">Đã trả: {invoice.paidAmount.toLocaleString('vi-VN')} đ</div>
                                            )}
                                        </td>}
                                        {columnVisibility.invoices.status && <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(invoice.status)}`}>
                                                {invoice.status}
                                            </span>
                                        </td>}
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            {invoice.deliveryId ? (
                                                <span className="text-slate-400 dark:text-slate-500 inline-flex items-center gap-1 p-1" title="Đã tạo phiếu giao">
                                                    <FiTruck className="h-5 w-5" />
                                                </span>
                                            ) : (
                                                <button onClick={() => handleCreateDeliveryClick(invoice.id)} className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 transition-transform hover:scale-110 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-500/20" title="Tạo Phiếu Giao">
                                                    <FiTruck className="h-5 w-5" />
                                                </button>
                                            )}
                                            {invoice.status !== 'Đã thanh toán' && (
                                                <button onClick={() => setPayingCustomerId(invoice.customerId)} className="text-green-600 hover:text-green-800 inline-flex items-center gap-1 transition-transform hover:scale-110 p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-500/20" title="Thanh toán">
                                                    <FiCreditCard className="h-5 w-5" />
                                                </button>
                                            )}
                                            <button onClick={() => setEditingInvoice(invoice)} className="text-primary-600 hover:text-primary-800 inline-flex items-center gap-1 transition-transform hover:scale-110 p-1 rounded-full hover:bg-primary-100 dark:hover:bg-primary-500/20" title="Sửa">
                                                <FiEdit className="h-5 w-5" />
                                            </button>
                                             <button onClick={() => setViewingInvoiceId(invoice.id)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 inline-flex items-center gap-1 transition-transform hover:scale-110 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600" title="Xem chi tiết">
                                                <FiEye className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => setPrintingInvoiceId(invoice.id)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 inline-flex items-center gap-1 transition-transform hover:scale-110 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600" title="In hóa đơn">
                                                <FiPrinter className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Card View */}
                    <div className="lg:hidden p-4 space-y-4">
                        {paginatedInvoices.length > 0 ? paginatedInvoices.map(invoice => (
                            <div key={invoice.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                <div className="p-4">
                                    {/* Card Header */}
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-primary-600">{invoice.invoiceNumber}</p>
                                                {invoice.orderId && (
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md">
                                                        <FiInbox className="w-3 h-3"/> Từ ĐH
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{invoice.issueDate}</p>
                                        </div>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(invoice.status)}`}>
                                            {invoice.status}
                                        </span>
                                    </div>
                                    
                                    {/* Card Body */}
                                    <div className="mt-3">
                                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{invoice.customerName}</p>
                                        <div className="mt-2 flex justify-between items-baseline">
                                            <span className="text-sm text-slate-500 dark:text-slate-400">Tổng tiền</span>
                                            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{invoice.totalAmount.toLocaleString('vi-VN')} đ</span>
                                        </div>
                                        
                                        {/* Payment Progress */}
                                        {invoice.totalAmount > 0 && (
                                            <div className="mt-2">
                                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                                    <div 
                                                        className="bg-green-500 h-1.5 rounded-full" 
                                                        style={{ width: `${(invoice.paidAmount / invoice.totalAmount) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between text-xs font-medium mt-1">
                                                    <span className="text-green-600 dark:text-green-400">Đã trả: {invoice.paidAmount.toLocaleString('vi-VN')} đ</span>
                                                    <span className="text-red-600 dark:text-red-400">Còn lại: {(invoice.totalAmount - invoice.paidAmount).toLocaleString('vi-VN')} đ</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Card Footer Actions */}
                                <div className="flex justify-end items-center gap-1 p-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                                    {invoice.deliveryId ? (
                                        <span className="p-2 rounded-md text-slate-400 dark:text-slate-500" title="Đã tạo phiếu giao">
                                            <FiTruck className="h-5 w-5" />
                                        </span>
                                    ) : (
                                        <button onClick={() => handleCreateDeliveryClick(invoice.id)} className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Tạo Phiếu Giao">
                                            <FiTruck className="h-5 w-5" />
                                        </button>
                                    )}
                                    {invoice.status !== 'Đã thanh toán' && (
                                        <button onClick={() => setPayingCustomerId(invoice.customerId)} className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Thanh toán">
                                            <FiCreditCard className="h-5 w-5" />
                                        </button>
                                    )}
                                    <button onClick={() => setEditingInvoice(invoice)} className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Sửa">
                                        <FiEdit className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => setViewingInvoiceId(invoice.id)} className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Xem chi tiết">
                                        <FiEye className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => setPrintingInvoiceId(invoice.id)} className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="In hóa đơn">
                                        <FiPrinter className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10 text-slate-500 dark:text-slate-400">Không có hóa đơn nào.</div>
                        )}
                    </div>
                     <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filteredInvoices.length} itemsPerPage={ITEMS_PER_PAGE} />
                </div>
            </div>

            <InvoiceDetailsModal />
        </>
    );
};

export default InvoicesPage;
