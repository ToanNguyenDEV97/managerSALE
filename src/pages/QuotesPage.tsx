import React, { useState, useEffect } from 'react';
import { 
    FiSearch, FiPlus, FiPrinter, FiEdit3, FiTrash2, FiFileText, 
    FiCheckCircle, FiXCircle, FiClock, FiSend 
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import moment from 'moment';

// Components & Hooks
import { useQuotes, useDeleteQuote, useUpdateQuote } from '../hooks/useQuotes';
import { useDebounce } from '../hooks/useDebounce';
import { formatCurrency } from '../utils/currency';
import { Button } from '../components/common/Button';
import Pagination from '../components/common/Pagination';
import ConfirmModal from '../components/common/ConfirmModal';
import QuoteModal from '../components/features/sales/QuoteModal'; // Cần tạo file này nếu chưa có
import PrintQuoteModal from '../components/print/PrintQuoteModal'; // Cần tạo file này nếu chưa có

const QUOTE_STATUSES = ['Tất cả', 'Mới', 'Đã gửi', 'Đã chốt', 'Hủy'];

const QuotesPage: React.FC = () => {
    // --- STATE ---
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tất cả');
    const debouncedSearch = useDebounce(search, 500);

    // Modal States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isPrintOpen, setIsPrintOpen] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState<any>(null);
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false, type: 'info' as 'info'|'danger', title: '', message: '', onConfirm: () => {}
    });

    // API Hooks
    const { data: quotesData, isLoading } = useQuotes(page, debouncedSearch, statusFilter);
    const deleteMutation = useDeleteQuote();
    const updateMutation = useUpdateQuote();

    useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

    // --- HANDLERS ---
    const handleEdit = (quote: any) => {
        setSelectedQuote(quote);
        setIsFormOpen(true);
    };

    const handleCreate = () => {
        setSelectedQuote(null);
        setIsFormOpen(true);
    };

    const handlePrint = (quote: any) => {
        setSelectedQuote(quote);
        setIsPrintOpen(true);
    };

    const handleDelete = (id: string) => {
        setConfirmConfig({
            isOpen: true,
            type: 'danger',
            title: 'Xóa Báo Giá?',
            message: 'Hành động này không thể hoàn tác.',
            onConfirm: () => {
                deleteMutation.mutate(id);
                setConfirmConfig(prev => ({...prev, isOpen: false}));
            }
        });
    };

    const handleStatusChange = (id: string, currentStatus: string, newStatus: string) => {
        setConfirmConfig({
            isOpen: true,
            type: 'info',
            title: 'Cập nhật trạng thái',
            message: `Chuyển trạng thái từ "${currentStatus}" sang "${newStatus}"?`,
            onConfirm: () => {
                updateMutation.mutate({ id, data: { status: newStatus } });
                setConfirmConfig(prev => ({...prev, isOpen: false}));
            }
        });
    };

    // Helper render badge
    const renderStatusBadge = (status: string) => {
        const styles: any = {
            'Mới': 'bg-blue-50 text-blue-600 border-blue-200',
            'Đã gửi': 'bg-yellow-50 text-yellow-600 border-yellow-200',
            'Đã chốt': 'bg-green-50 text-green-600 border-green-200',
            'Hủy': 'bg-red-50 text-red-600 border-red-200',
        };
        const icons: any = {
            'Mới': <FiFileText/>,
            'Đã gửi': <FiSend/>,
            'Đã chốt': <FiCheckCircle/>,
            'Hủy': <FiXCircle/>,
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 w-fit mx-auto ${styles[status] || 'bg-gray-100'}`}>
                {icons[status]} {status}
            </span>
        );
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen bg-slate-50/50">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FiFileText className="text-blue-600"/> Quản lý Báo Giá
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Tạo và theo dõi báo giá gửi khách hàng</p>
                </div>
                <Button onClick={handleCreate} icon={<FiPlus/>} variant="primary" className="shadow-lg shadow-blue-200">
                    Tạo báo giá mới
                </Button>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-2 z-10">
                <div className="relative w-full md:w-96 group">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Tìm mã báo giá, tên khách..." 
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                        value={search} onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
                    {QUOTE_STATUSES.map(st => (
                        <button key={st} onClick={() => setStatusFilter(st)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border
                                ${statusFilter === st ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-blue-600'}
                            `}
                        >
                            {st}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <span>Đang tải dữ liệu...</span>
                    </div>
                ) : !quotesData?.data || quotesData.data.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <div className="bg-slate-100 p-4 rounded-full mb-4"><FiFileText size={40}/></div>
                        <p>Không có báo giá nào.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">Mã BG</th>
                                        <th className="px-6 py-4">Khách Hàng</th>
                                        <th className="px-6 py-4 text-center">Tổng Tiền</th>
                                        <th className="px-6 py-4 text-center">Hiệu Lực</th>
                                        <th className="px-6 py-4 text-center">Trạng Thái</th>
                                        <th className="px-6 py-4 text-right">Thao Tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {quotesData.data.map((quote: any) => (
                                        <tr key={quote.id} className="hover:bg-blue-50/40 transition-colors group">
                                            <td className="px-6 py-4 font-bold text-blue-600 cursor-pointer hover:underline" onClick={() => handlePrint(quote)}>
                                                {quote.quoteNumber}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{quote.customerName}</div>
                                                <div className="text-xs text-slate-500">{quote.customerPhone}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-slate-700">
                                                {formatCurrency(quote.finalAmount)}
                                            </td>
                                            <td className="px-6 py-4 text-center text-xs text-slate-500">
                                                {quote.expiryDate ? moment(quote.expiryDate).format('DD/MM/YYYY') : '---'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {renderStatusBadge(quote.status)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handlePrint(quote)} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded" title="In"><FiPrinter/></button>
                                                    {quote.status === 'Mới' && (
                                                        <>
                                                            <button onClick={() => handleStatusChange(quote.id, quote.status, 'Đã gửi')} className="p-2 hover:bg-yellow-50 text-yellow-600 rounded" title="Đánh dấu đã gửi"><FiSend/></button>
                                                            <button onClick={() => handleEdit(quote)} className="p-2 hover:bg-blue-50 text-blue-600 rounded" title="Sửa"><FiEdit3/></button>
                                                        </>
                                                    )}
                                                    {quote.status === 'Đã gửi' && (
                                                        <button onClick={() => handleStatusChange(quote.id, quote.status, 'Đã chốt')} className="p-2 hover:bg-green-50 text-green-600 rounded" title="Chốt đơn"><FiCheckCircle/></button>
                                                    )}
                                                    <button onClick={() => handleDelete(quote.id)} className="p-2 hover:bg-red-50 text-red-600 rounded" title="Xóa"><FiTrash2/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {quotesData.totalPages > 1 && (
                            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
                                <Pagination currentPage={page} totalPages={quotesData.totalPages} onPageChange={setPage} />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            {isFormOpen && (
                <QuoteModal 
                    isOpen={isFormOpen} 
                    onClose={() => setIsFormOpen(false)} 
                    quote={selectedQuote} 
                />
            )}
            
            {isPrintOpen && selectedQuote && (
                <PrintQuoteModal 
                    quote={selectedQuote} 
                    onClose={() => setIsPrintOpen(false)} 
                />
            )}

            <ConfirmModal 
                isOpen={confirmConfig.isOpen} 
                type={confirmConfig.type} 
                title={confirmConfig.title} 
                message={confirmConfig.message} 
                onClose={() => setConfirmConfig(prev => ({...prev, isOpen: false}))} 
                onConfirm={confirmConfig.onConfirm} 
            />
        </div>
    );
};

export default QuotesPage;