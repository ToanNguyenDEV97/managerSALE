import React, { useState, useMemo } from 'react';
import { 
    FiPrinter, FiEye, FiTrash2, FiSearch, FiFilter, 
    FiDollarSign, FiDownload, FiRotateCcw 
} from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
import { useInvoices, useDeleteInvoice, useReturnInvoice } from '../hooks/useInvoices';
import Pagination from '../components/Pagination';
import ConfirmationModal from '../components/ConfirmationModal';
import ReturnInvoiceModal from '../components/ReturnInvoiceModal';
import toast from 'react-hot-toast';

const InvoicesPage: React.FC = () => {
    const { setViewingInvoiceId, setPrintingInvoiceId, setPayingInvoiceId } = useAppContext();
    const deleteMutation = useDeleteInvoice();
    const returnMutation = useReturnInvoice();

    // State quản lý
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
    // State cho Modal trả hàng
    const [invoiceToReturn, setInvoiceToReturn] = useState<{id: string, code: string} | null>(null);

    // Logic Lọc Ngày
    const [dateFilterType, setDateFilterType] = useState<'today' | 'week' | 'month' | 'custom' | 'all'>('all'); 
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

   // Hàm tính ngày (Đã sửa để dùng giờ địa phương Việt Nam)
    const getDateRange = (type: string) => {
        const today = new Date();
        const start = new Date(today);
        const end = new Date(today);

        // Hàm format ra chuỗi YYYY-MM-DD chuẩn
        const formatDate = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        if (type === 'today') {
            // Giữ nguyên start/end
        } else if (type === 'week') {
            const day = today.getDay(); // 0 là CN, 1 là Thứ 2
            // Tính lùi về Thứ 2 gần nhất
            const diff = today.getDate() - (day === 0 ? 6 : day - 1);
            start.setDate(diff);
            end.setDate(start.getDate() + 6); // Đến Chủ nhật
        } else if (type === 'month') {
            start.setDate(1); // Mùng 1
            end.setMonth(end.getMonth() + 1, 0); // Cuối tháng
        }
        
        return {
            start: formatDate(start),
            end: formatDate(end)
        };
    };

    // --- CÁC HÀM XỬ LÝ (Đã thêm setPage(1) để fix lỗi tìm kiếm) ---

    // 1. Xử lý tìm kiếm
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setPage(1); // <--- QUAN TRỌNG: Quay về trang 1 khi tìm kiếm
    };

    // 2. Xử lý lọc trạng thái
    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatusFilter(e.target.value);
        setPage(1); // <--- QUAN TRỌNG
    };

    // 3. Xử lý lọc ngày nhanh
    const handleQuickFilter = (type: 'today' | 'week' | 'month' | 'custom' | 'all') => {
        setDateFilterType(type);
        setPage(1); // <--- QUAN TRỌNG
        
        if (type === 'all') {
            setStartDate('');
            setEndDate('');
        } else if (type !== 'custom') {
            const range = getDateRange(type);
            setStartDate(range.start);
            setEndDate(range.end);
        }
    };

    // 4. Xử lý chọn ngày thủ công
    const handleDateChange = (isStart: boolean, value: string) => {
        if (isStart) setStartDate(value);
        else setEndDate(value);
        
        setDateFilterType('custom');
        setPage(1); // <--- QUAN TRỌNG
    };

    // Lấy dữ liệu
    const { data: invoiceData, isLoading } = useInvoices(page, statusFilter, searchTerm, startDate, endDate);
    const invoices = Array.isArray(invoiceData) ? invoiceData : (invoiceData?.data || []);
    const totalPages = invoiceData?.totalPages || 1;

    // Thống kê nhanh
    const stats = useMemo(() => {
        return invoices.reduce((acc: any, curr: any) => {
            acc.totalRevenue += curr.totalAmount || 0;
            const debt = (curr.totalAmount || 0) - (curr.paidAmount || 0);
            if (debt > 0) acc.totalDebt += debt;
            return acc;
        }, { totalRevenue: 0, totalDebt: 0 });
    }, [invoices]);

    // Các hàm hành động (Xóa, Trả hàng, Xuất Excel)
    const handleDeleteInvoice = async () => {
        if (!invoiceToDelete) return;
        await deleteMutation.mutateAsync(invoiceToDelete);
        setInvoiceToDelete(null);
    };

    // Khi bấm nút icon Trả hàng ở bảng
    const openReturnModal = (invoice: any) => {
        setInvoiceToReturn({ id: invoice.id || invoice._id, code: invoice.invoiceNumber });
    };

    // Hàm thực sự gọi API (được truyền vào Modal)
    const handleConfirmReturn = async (reason: string) => {
        if (!invoiceToReturn) return;
        await returnMutation.mutateAsync({ id: invoiceToReturn.id, reason });
        // Không cần setInvoiceToReturn(null) ở đây vì Modal sẽ gọi onClose
    };

    const handleExportExcel = () => {
        if (invoices.length === 0) return toast.error('Không có dữ liệu');
        const headers = ["Mã HĐ", "Ngày", "Khách hàng", "Tổng tiền", "Còn nợ", "Trạng thái"];
        const rows = invoices.map((inv: any) => [
            inv.invoiceNumber, new Date(inv.issueDate).toLocaleDateString('vi-VN'),
            inv.customerName, inv.totalAmount, (inv.totalAmount - inv.paidAmount),
            inv.status
        ]);
        const csvContent = [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Hoa_don_export.csv`;
        link.click();
    };

    const renderStatus = (invoice: any) => {
        if (invoice.status === 'Đã hoàn trả') return <span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">Đã trả hàng</span>;
        const debt = (invoice.totalAmount || 0) - (invoice.paidAmount || 0);
        if (debt <= 0) return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">Hoàn thành</span>;
        if (invoice.paidAmount === 0) return <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">Chưa thanh toán</span>;
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">Thiếu {debt.toLocaleString()}</span>;
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* THỐNG KÊ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">Doanh thu ({dateFilterType === 'all' ? 'Toàn bộ' : dateFilterType})</p>
                    <p className="text-2xl font-bold text-primary-600 mt-1">{stats.totalRevenue.toLocaleString()} đ</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">Công nợ phải thu</p>
                    <p className="text-2xl font-bold text-red-500 mt-1">{stats.totalDebt.toLocaleString()} đ</p>
                </div>
                <div className="flex items-center justify-end">
                    <button onClick={handleExportExcel} className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 shadow-sm transition-all text-slate-700 dark:text-slate-200 font-medium">
                        <FiDownload /> Xuất Excel
                    </button>
                </div>
            </div>

            {/* THANH CÔNG CỤ */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="relative flex-1 max-w-md">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" placeholder="Tìm mã HĐ, tên khách..." 
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 focus:ring-2 focus:ring-primary-500"
                            value={searchTerm} onChange={handleSearchChange} // Đã dùng hàm mới
                        />
                    </div>
                    <div className="relative">
                        <select 
                            className="pl-3 pr-8 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 appearance-none cursor-pointer"
                            value={statusFilter} onChange={handleStatusChange} // Đã dùng hàm mới
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="debt">Khách còn nợ</option>
                            <option value="paid">Đã thanh toán</option>
                        </select>
                        <FiFilter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* BỘ LỌC NGÀY */}
                <div className="flex flex-col md:flex-row items-center gap-3 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-600 overflow-hidden p-1 shadow-sm">
                        {[{ id: 'all', label: 'Tất cả' }, { id: 'today', label: 'Hôm nay' }, { id: 'week', label: 'Tuần này' }, { id: 'month', label: 'Tháng này' }, { id: 'custom', label: 'Tùy chọn' }]
                        .map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => handleQuickFilter(btn.id as any)}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                                    dateFilterType === btn.id ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 ml-auto">
                        <span className="text-xs uppercase font-bold text-slate-400">Từ:</span>
                        <input type="date" className="border dark:border-slate-600 rounded px-2 py-1.5 bg-white dark:bg-slate-800 disabled:opacity-50"
                            value={startDate} onChange={(e) => handleDateChange(true, e.target.value)} />
                        <span className="text-xs uppercase font-bold text-slate-400">Đến:</span>
                        <input type="date" className="border dark:border-slate-600 rounded px-2 py-1.5 bg-white dark:bg-slate-800 disabled:opacity-50"
                            value={endDate} onChange={(e) => handleDateChange(false, e.target.value)} />
                    </div>
                </div>
            </div>

            {/* BẢNG DỮ LIỆU */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Mã HĐ</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Ngày</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Khách</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Tổng tiền</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Nợ</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">Trạng thái</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase sticky right-0 bg-slate-50 dark:bg-slate-700">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {isLoading ? (
                                <tr><td colSpan={7} className="text-center py-10 text-slate-500">Đang tải dữ liệu...</td></tr>
                            ) : invoices.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-10 text-slate-500">Không tìm thấy hóa đơn nào phù hợp.</td></tr>
                            ) : invoices.map((inv: any) => {
                                 const debt = (inv.totalAmount || 0) - (inv.paidAmount || 0);
                                 return (
                                    <tr key={inv.id || inv._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-primary-600 whitespace-nowrap">{inv.invoiceNumber}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                            {new Date(inv.issueDate).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{inv.customerName}</td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-white">{inv.totalAmount.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-bold">
                                            {debt > 0 ? <span className="text-red-500">{debt.toLocaleString()}</span> : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">{renderStatus(inv)}</td>
                                        
                                        <td className="px-6 py-4 text-center sticky right-0 bg-white dark:bg-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-700/50">
                                            <div className="flex justify-center items-center gap-2">
                                                {debt > 0 && inv.status !== 'Đã hoàn trả' && (
                                                    <button onClick={() => setPayingInvoiceId(inv.id || inv._id)} className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded transition-colors" title="Thu nợ"><FiDollarSign size={18}/></button>
                                                )}
                                                <button onClick={() => setViewingInvoiceId(inv.id || inv._id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Xem chi tiết"><FiEye size={18}/></button>
                                                <button onClick={() => setPrintingInvoiceId(inv.id || inv._id)} className="p-2 text-slate-600 hover:bg-slate-100 rounded transition-colors" title="In hóa đơn"><FiPrinter size={18}/></button>
                                                {inv.status !== 'Đã hoàn trả' && (
                                                    <>
                                                        <button onClick={() => openReturnModal(inv)} className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors" title="Khách trả hàng"><FiRotateCcw size={18}/></button>
                                                        <button onClick={() => setInvoiceToDelete(inv.id || inv._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Hủy hóa đơn"><FiTrash2 size={18}/></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                
                {/* Phân trang */}
                <div className="border-t border-slate-200 dark:border-slate-700 p-4">
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={invoiceData?.total || 0} itemsPerPage={10} />
                </div>
            </div>

            {/* Modal Trả Hàng */}
            <ReturnInvoiceModal 
                isOpen={!!invoiceToReturn}
                onClose={() => setInvoiceToReturn(null)}
                onConfirm={handleConfirmReturn}
                invoiceNumber={invoiceToReturn?.code}
            />

            {/* Modal Xóa */}
            {invoiceToDelete && (
                <ConfirmationModal 
                    isOpen={!!invoiceToDelete} onClose={() => setInvoiceToDelete(null)}
                    onConfirm={handleDeleteInvoice} title="Hủy hóa đơn" confirmColor="bg-red-600" confirmText="Xác nhận hủy"
                >
                    <p>Bạn có chắc muốn hủy hóa đơn này không?</p>
                    <p className="text-sm text-red-500 mt-2">Lưu ý: Hàng hóa sẽ được trả về kho và công nợ khách hàng sẽ được hoàn tác.</p>
                </ConfirmationModal>
            )}
        </div>
    );
};

export default InvoicesPage;