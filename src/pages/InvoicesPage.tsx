import React, { useState, useMemo } from 'react';
import { 
    FiPrinter, FiEye, FiTrash2, FiSearch, FiFilter, 
    FiDollarSign, FiDownload, FiRotateCcw, FiCheckSquare, FiX 
} from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
import { useInvoices, useDeleteInvoice, useReturnInvoice } from '../hooks/useInvoices';
import Pagination from '../components/Pagination';
import ConfirmationModal from '../components/ConfirmationModal';
import ReturnInvoiceModal from '../components/ReturnInvoiceModal';
import toast from 'react-hot-toast';

import InvoiceDetailsModal from '../components/InvoiceDetailsModal'; 
import PrintInvoiceModal from '../components/business/PrintInvoiceModal';

const InvoicesPage: React.FC = () => {
    const { setPayingInvoiceId } = useAppContext();
    const deleteMutation = useDeleteInvoice();
    const returnMutation = useReturnInvoice();

    // --- STATE QUẢN LÝ ---
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null); // Modal Xem
    const [printingInvoiceId, setPrintingInvoiceId] = useState<string | null>(null); // Modal In
    const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);     // Modal Xóa lẻ
    const [invoiceToReturn, setInvoiceToReturn] = useState<{id: string, code: string} | null>(null); // Modal Trả

    // 1. [MỚI] STATE CHO BULK ACTIONS (Chọn nhiều)
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false); // Modal xác nhận xóa nhiều

    // State lọc dữ liệu
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilterType, setDateFilterType] = useState<'today' | 'week' | 'month' | 'custom' | 'all'>('all'); 
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // --- LOGIC TÍNH NGÀY ---
    const getDateRange = (type: string) => {
        const today = new Date();
        const start = new Date(today);
        const end = new Date(today);
        const formatDate = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        if (type === 'today') { /* giữ nguyên */ } 
        else if (type === 'week') {
            const day = today.getDay(); 
            const diff = today.getDate() - (day === 0 ? 6 : day - 1);
            start.setDate(diff);
            end.setDate(start.getDate() + 6); 
        } else if (type === 'month') {
            start.setDate(1); 
            end.setMonth(end.getMonth() + 1, 0); 
        }
        return { start: formatDate(start), end: formatDate(end) };
    };

    // --- HANDLERS LỌC ---
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setPage(1);
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatusFilter(e.target.value);
        setPage(1);
    };

    const handleQuickFilter = (type: 'today' | 'week' | 'month' | 'custom' | 'all') => {
        setDateFilterType(type);
        setPage(1);
        if (type === 'all') {
            setStartDate('');
            setEndDate('');
        } else if (type !== 'custom') {
            const range = getDateRange(type);
            setStartDate(range.start);
            setEndDate(range.end);
        }
    };

    const handleDateChange = (isStart: boolean, value: string) => {
        if (isStart) setStartDate(value);
        else setEndDate(value);
        setDateFilterType('custom');
        setPage(1);
    };

    const handlePrintClick = (id: string) => {
        setPrintingInvoiceId(id);
    };

    // --- LẤY DỮ LIỆU TỪ API ---
    const { data: invoiceData, isLoading } = useInvoices(page, statusFilter, searchTerm, startDate, endDate);
    const invoices = Array.isArray(invoiceData) ? invoiceData : (invoiceData?.data || []);
    const totalPages = invoiceData?.totalPages || 1;

    // --- 2. [MỚI] LOGIC CHECKBOX CHỌN NHIỀU ---
    
    // Chọn/Bỏ chọn một dòng
    const toggleSelectOne = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(item => item !== id));
        } else {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    // Chọn/Bỏ chọn tất cả (trong trang hiện tại)
    const toggleSelectAll = () => {
        if (selectedIds.length === invoices.length) {
            setSelectedIds([]); // Bỏ chọn hết
        } else {
            // Chọn hết các ID trong trang này
            const allIds = invoices.map((inv: any) => inv.id || inv._id);
            setSelectedIds(allIds);
        }
    };

    // Xử lý Xóa hàng loạt
    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        
        // Dùng Promise.all để xóa song song (hoặc bạn có thể viết API xóa bulk ở backend)
        const toastId = toast.loading('Đang xóa các hóa đơn...');
        try {
            await Promise.all(selectedIds.map(id => deleteMutation.mutateAsync(id)));
            toast.success(`Đã xóa ${selectedIds.length} hóa đơn thành công!`, { id: toastId });
            setSelectedIds([]);
            setIsBulkDeleting(false);
        } catch (error) {
            toast.error('Có lỗi xảy ra khi xóa hàng loạt', { id: toastId });
        }
    };

    // --- CÁC HÀM CŨ ---
    const stats = useMemo(() => {
        return invoices.reduce((acc: any, curr: any) => {
            acc.totalRevenue += curr.totalAmount || 0;
            const debt = (curr.totalAmount || 0) - (curr.paidAmount || 0);
            if (debt > 0) acc.totalDebt += debt;
            return acc;
        }, { totalRevenue: 0, totalDebt: 0 });
    }, [invoices]);

    const handleDeleteInvoice = async () => {
        if (!invoiceToDelete) return;
        await deleteMutation.mutateAsync(invoiceToDelete);
        setInvoiceToDelete(null);
    };

    const openReturnModal = (invoice: any) => {
        setInvoiceToReturn({ id: invoice.id || invoice._id, code: invoice.invoiceNumber });
    };

    const handleConfirmReturn = async (reason: string) => {
        if (!invoiceToReturn) return;
        await returnMutation.mutateAsync({ id: invoiceToReturn.id, reason });
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
        <div className="space-y-6 animate-fade-in pb-20 relative">
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
                            value={searchTerm} onChange={handleSearchChange} 
                        />
                    </div>
                    <div className="relative">
                        <select 
                            className="pl-3 pr-8 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 appearance-none cursor-pointer"
                            value={statusFilter} onChange={handleStatusChange} 
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="debt">Khách còn nợ</option>
                            <option value="paid">Đã thanh toán</option>
                        </select>
                        <FiFilter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>
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
                                {/* 3. [MỚI] CHECKBOX SELECT ALL */}
                                <th className="px-6 py-3 text-center w-10">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                        checked={invoices.length > 0 && selectedIds.length === invoices.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
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
                                <tr><td colSpan={8} className="text-center py-10 text-slate-500">Đang tải dữ liệu...</td></tr>
                            ) : invoices.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-10 text-slate-500">Không tìm thấy hóa đơn nào phù hợp.</td></tr>
                            ) : invoices.map((inv: any) => {
                                 const debt = (inv.totalAmount || 0) - (inv.paidAmount || 0);
                                 const isSelected = selectedIds.includes(inv.id || inv._id);
                                 
                                 return (
                                    <tr 
                                        key={inv.id || inv._id} 
                                        className={`transition-colors group ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                    >
                                        {/* 4. [MỚI] CHECKBOX TỪNG DÒNG */}
                                        <td className="px-6 py-4 text-center">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                                checked={isSelected}
                                                onChange={() => toggleSelectOne(inv.id || inv._id)}
                                            />
                                        </td>
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
                                                
                                                <button 
                                                    onClick={() => setSelectedInvoiceId(inv._id || inv.id)} 
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors" 
                                                    title="Xem chi tiết"
                                                >
                                                    <FiEye size={18}/>
                                                </button>

                                                <button 
                                                    onClick={() => handlePrintClick(inv.id || inv._id)} 
                                                    className="p-2 text-slate-600 hover:bg-slate-100 rounded transition-colors" 
                                                    title="In hóa đơn"
                                                >
                                                    <FiPrinter size={18}/>
                                                </button>

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
                
                <div className="border-t border-slate-200 dark:border-slate-700 p-4">
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={invoiceData?.total || 0} itemsPerPage={10} />
                </div>
            </div>

            {/* --- 5. [MỚI] FLOATING BULK ACTIONS BAR (Thanh công cụ hàng loạt) --- */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 animate-bounce-in">
                    <span className="font-bold flex items-center gap-2">
                        <FiCheckSquare className="text-green-400"/>
                        Đã chọn {selectedIds.length} hóa đơn
                    </span>
                    <div className="h-6 w-px bg-slate-700"></div>
                    <button 
                        onClick={() => setIsBulkDeleting(true)}
                        className="flex items-center gap-2 hover:text-red-400 font-medium transition-colors"
                    >
                        <FiTrash2 /> Xóa tất cả
                    </button>
                    <button 
                        onClick={() => setSelectedIds([])}
                        className="p-1 hover:bg-slate-700 rounded-full transition-colors ml-2"
                        title="Bỏ chọn"
                    >
                        <FiX />
                    </button>
                </div>
            )}

            {/* CÁC MODAL CŨ */}
            <ReturnInvoiceModal 
                isOpen={!!invoiceToReturn}
                onClose={() => setInvoiceToReturn(null)}
                onConfirm={handleConfirmReturn}
                invoiceNumber={invoiceToReturn?.code}
            />

            {/* Modal Xóa Lẻ */}
            {invoiceToDelete && (
                <ConfirmationModal 
                    isOpen={!!invoiceToDelete} onClose={() => setInvoiceToDelete(null)}
                    onConfirm={handleDeleteInvoice} title="Hủy hóa đơn" confirmColor="bg-red-600" confirmText="Xác nhận hủy"
                >
                    <p>Bạn có chắc muốn hủy hóa đơn này không?</p>
                    <p className="text-sm text-red-500 mt-2">Lưu ý: Hàng hóa sẽ được trả về kho và công nợ khách hàng sẽ được hoàn tác.</p>
                </ConfirmationModal>
            )}

            {/* [MỚI] Modal Xóa Hàng Loạt */}
            {isBulkDeleting && (
                <ConfirmationModal 
                    isOpen={isBulkDeleting} onClose={() => setIsBulkDeleting(false)}
                    onConfirm={handleBulkDelete} title={`Xóa ${selectedIds.length} hóa đơn?`} confirmColor="bg-red-600" confirmText="Xác nhận xóa hết"
                >
                    <p>Bạn đang chọn xóa <b>{selectedIds.length}</b> hóa đơn cùng lúc.</p>
                    <p className="text-sm text-red-500 mt-2 font-bold">Hành động này không thể hoàn tác!</p>
                </ConfirmationModal>
            )}

            {selectedInvoiceId && (
                <InvoiceDetailsModal
                    invoiceId={selectedInvoiceId}
                    onClose={() => setSelectedInvoiceId(null)}
                    onPrint={(id) => {
                        setSelectedInvoiceId(null); 
                        handlePrintClick(id);
                    }}
                />
            )}

            {printingInvoiceId && (
                <PrintInvoiceModal
                    invoiceId={printingInvoiceId}
                    onClose={() => setPrintingInvoiceId(null)}
                />
            )}

        </div>
    );
};

export default InvoicesPage;