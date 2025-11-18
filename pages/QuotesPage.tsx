
import React, { useState, useMemo } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSend, FiPrinter } from 'react-icons/fi';
import type { Quote } from '../types';
import { useAppContext } from '../context/DataContext';
import Pagination from '../components/Pagination';
import ConfirmationModal from '../components/ConfirmationModal';

const QuotesPage: React.FC = () => {
    const { quotes, setEditingQuote, handleDeleteQuote, handleConvertToOrder, setPrintingQuoteId } = useAppContext();
    const [currentPage, setCurrentPage] = useState(1);
    const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
    const ITEMS_PER_PAGE = 10;
    
    const sortedQuotes = useMemo(() => {
        return [...quotes].sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
    }, [quotes]);
    
    const paginatedQuotes = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedQuotes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedQuotes, currentPage]);

    const totalPages = Math.ceil(sortedQuotes.length / ITEMS_PER_PAGE);
    
    const handleDeleteClick = (quote: Quote) => {
        setQuoteToDelete(quote);
    };
    
    const handleConfirmDelete = async () => {
        if (quoteToDelete) {
            await handleDeleteQuote(quoteToDelete.id);
            setQuoteToDelete(null);
        }
    };

    const getStatusClass = (status: Quote['status']) => {
        switch (status) {
            case 'Mới': return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300';
            case 'Đã gửi': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300';
            case 'Đã chuyển đổi': return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-600 dark:text-slate-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="hidden lg:block">
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-200">Quản lý Báo giá</h1>
                    <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400 mt-1">Tạo và quản lý các báo giá cho khách hàng.</p>
                </div>
                <button
                    onClick={() => setEditingQuote('new')}
                    className="flex items-center justify-center w-full md:w-auto px-4 py-2 text-white rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-px"
                >
                    <FiPlus />
                    <span className="ml-2 font-medium">Tạo Báo giá</span>
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-primary-50 dark:bg-slate-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Số Báo giá</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Khách hàng</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Ngày tạo</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Tổng tiền</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Trạng thái</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800">
                            {paginatedQuotes.map(quote => (
                                <tr key={quote.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600 dark:text-primary-400">{quote.quoteNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 dark:text-slate-200">{quote.customerName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{quote.issueDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">{quote.totalAmount.toLocaleString('vi-VN')} đ</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(quote.status)}`}>
                                            {quote.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        {quote.status !== 'Đã chuyển đổi' && (
                                            <button onClick={async () => await handleConvertToOrder(quote.id)} className="text-green-600 hover:text-green-800 inline-flex items-center gap-1 transition-transform hover:scale-110 p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-500/20" title="Chuyển thành Đơn hàng">
                                                <FiSend className="h-5 w-5" />
                                            </button>
                                        )}
                                        <button onClick={() => setPrintingQuoteId(quote.id)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 inline-flex items-center gap-1 transition-transform hover:scale-110 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600" title="In báo giá">
                                            <FiPrinter className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => setEditingQuote(quote)} className="text-primary-600 hover:text-primary-800 inline-flex items-center gap-1 transition-transform hover:scale-110 p-1 rounded-full hover:bg-primary-100 dark:hover:bg-primary-500/20" title="Sửa">
                                            <FiEdit className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => handleDeleteClick(quote)} className="text-red-500 hover:text-red-700 inline-flex items-center gap-1 transition-transform hover:scale-110 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20" title="Xóa">
                                            <FiTrash2 className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={sortedQuotes.length} itemsPerPage={ITEMS_PER_PAGE} />
            </div>
            
            {quoteToDelete && (
                <ConfirmationModal
                    isOpen={!!quoteToDelete}
                    onClose={() => setQuoteToDelete(null)}
                    onConfirm={handleConfirmDelete}
                    title="Xác nhận Xóa Báo giá"
                >
                    Bạn có chắc chắn muốn xóa báo giá "<strong>{quoteToDelete.quoteNumber}</strong>"?
                </ConfirmationModal>
            )}
        </div>
    );
};

export default QuotesPage;
