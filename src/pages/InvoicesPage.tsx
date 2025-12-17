import React, { useState } from 'react';
import { FiEdit, FiEye, FiPrinter, FiSearch, FiLoader } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
import InvoiceDetailsModal from '../components/InvoiceDetailsModal';
import Pagination from '../components/Pagination';
import { useInvoices } from '../hooks/useInvoices'; // Import Hook

const InvoicesPage: React.FC = () => {
    const { setViewingInvoiceId, setPrintingInvoiceId } = useAppContext();
    const [page, setPage] = useState(1);
    
    // Hiện tại API chưa hỗ trợ filter status server-side, ta lấy về client rồi filter tạm
    // Hoặc nâng cấp API sau. Ở đây mình dùng useInvoices mặc định.
    const { data: invoicesData, isLoading } = useInvoices(page);
    
    const invoices = Array.isArray(invoicesData) ? invoicesData : (invoicesData?.data || []);
    const totalPages = Array.isArray(invoicesData) ? 1 : (invoicesData?.totalPages || 1);
    const totalItems = Array.isArray(invoicesData) ? invoices.length : (invoicesData?.total || 0);

    if (isLoading) return <div className="flex justify-center p-10"><FiLoader className="animate-spin text-primary-600 w-8 h-8" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Lịch sử Bán hàng</h2>
                {/* Có thể thêm bộ lọc ngày tháng ở đây sau */}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mã HĐ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Khách hàng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ngày bán</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Tổng tiền</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Trạng thái</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {invoices.length > 0 ? invoices.map((inv: any) => (
                                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-6 py-4 font-medium text-primary-600">{inv.invoiceNumber}</td>
                                    <td className="px-6 py-4 text-slate-800 dark:text-slate-200">{inv.customerName}</td>
                                    <td className="px-6 py-4 text-slate-500">{inv.issueDate}</td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-slate-200">
                                        {inv.totalAmount.toLocaleString()} đ
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            inv.status === 'Đã thanh toán' ? 'bg-green-100 text-green-700' :
                                            inv.status === 'Thanh toán một phần' ? 'bg-blue-100 text-blue-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button onClick={() => setViewingInvoiceId(inv.id)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg" title="Xem"><FiEye /></button>
                                        <button onClick={() => setPrintingInvoiceId(inv.id)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg" title="In"><FiPrinter /></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6} className="text-center py-10 text-slate-500">Chưa có hóa đơn nào.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} itemsPerPage={10} />
            </div>

            <InvoiceDetailsModal />
        </div>
    );
};

export default InvoicesPage;