import React, { useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiPrinter, FiLoader } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
import Pagination from '../components/Pagination';
import ConfirmationModal from '../components/ConfirmationModal';
import { useQuotes, useDeleteQuote } from '../hooks/useQuotes';

// --- 1. NHỚ IMPORT MODAL VÀO ĐÂY ---
import QuoteModal from '../components/QuoteModal'; 
// -----------------------------------

const QuotesPage: React.FC = () => {
    // Lấy thêm editingQuote để kiểm tra trạng thái
    const { setEditingQuote, setPrintingQuoteId, editingQuote } = useAppContext(); 
    const [page, setPage] = useState(1);
    const [quoteToDelete, setQuoteToDelete] = useState<any>(null);
    
    const { data: quotesData, isLoading } = useQuotes(page);
    const deleteMutation = useDeleteQuote();

    const quotes = Array.isArray(quotesData) ? quotesData : (quotesData?.data || []);
    const totalPages = Array.isArray(quotesData) ? 1 : (quotesData?.totalPages || 1);
    const totalItems = Array.isArray(quotesData) ? quotes.length : (quotesData?.total || 0);

    const handleConfirmDelete = async () => {
        if (quoteToDelete) {
            await deleteMutation.mutateAsync(quoteToDelete.id);
            setQuoteToDelete(null);
        }
    };

    if (isLoading) return <div className="flex justify-center p-10"><FiLoader className="animate-spin" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* ... (Phần Header và Table giữ nguyên không đổi) ... */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Báo giá</h2>
                <button onClick={() => setEditingQuote('new')} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-md">
                    <FiPlus /> Tạo báo giá
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mã BG</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Khách hàng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ngày tạo</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Tổng tiền</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {quotes.length > 0 ? quotes.map((quote: any) => (
                                <tr key={quote.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-6 py-4 font-medium text-primary-600">{quote.quoteNumber}</td>
                                    <td className="px-6 py-4 text-slate-800 dark:text-slate-200">{quote.customerName}</td>
                                    <td className="px-6 py-4 text-slate-500">{quote.issueDate}</td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-slate-200">{quote.totalAmount.toLocaleString()} đ</td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button onClick={() => setPrintingQuoteId(quote.id)} className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg"><FiPrinter /></button>
                                        <button onClick={() => setEditingQuote(quote)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><FiEdit /></button>
                                        <button onClick={() => setQuoteToDelete(quote)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg"><FiTrash2 /></button>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan={5} className="text-center py-10 text-slate-500">Chưa có báo giá nào.</td></tr>}
                        </tbody>
                    </table>
                </div>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} itemsPerPage={10} />
            </div>
            
            {/* Modal Xác nhận xóa (Đã có) */}
            {quoteToDelete && (
                <ConfirmationModal 
                    isOpen={!!quoteToDelete} 
                    onClose={() => setQuoteToDelete(null)} 
                    onConfirm={handleConfirmDelete} 
                    title="Xóa báo giá"
                >
                    Bạn có chắc chắn muốn xóa báo giá <strong>{quoteToDelete.quoteNumber}</strong>?
                </ConfirmationModal>
            )}

            {/* --- 2. THÊM ĐOẠN NÀY ĐỂ HIỆN MODAL TẠO BÁO GIÁ --- */}
            {(editingQuote === 'new' || editingQuote?._id || (editingQuote && 'id' in editingQuote)) && (
                <QuoteModal 
                    isOpen={true}
                    onClose={() => setEditingQuote(null)}
                    // Nếu Modal cần truyền prop quoteData, hãy bỏ comment dòng dưới
                    // quoteData={editingQuote === 'new' ? null : editingQuote}
                />
            )}
            {/* -------------------------------------------------- */}
        </div>
    );
};

export default QuotesPage;