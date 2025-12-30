import React, { useState } from 'react';
import { 
    FiPlus, 
    FiEdit, 
    FiTrash2, 
    FiPrinter, 
    FiLoader, 
    FiFileText, 
    FiArrowRightCircle,
    FiCheckCircle 
} from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
import Pagination from '../components/common/Pagination';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { useQuotes, useDeleteQuote, useConvertToOrder } from '../hooks/useQuotes';

// Import Modal Tạo/Sửa báo giá
import QuoteModal from '../components/features/sales/QuoteModal'; 

const QuotesPage: React.FC = () => {
    // Lấy state toàn cục
    const { setEditingQuote, setPrintingQuoteId, editingQuote } = useAppContext(); 
    
    // State nội bộ
    const [page, setPage] = useState(1);
    const [quoteToDelete, setQuoteToDelete] = useState<any>(null);
    
    // Hooks dữ liệu
    const { data: quotesData, isLoading } = useQuotes(page);
    const deleteMutation = useDeleteQuote();
    const convertMutation = useConvertToOrder(); // Hook chuyển đổi

    // Xử lý dữ liệu trả về (tránh lỗi null/undefined)
    const quotes = Array.isArray(quotesData) ? quotesData : (quotesData?.data || []);
    const totalPages = Array.isArray(quotesData) ? 1 : (quotesData?.totalPages || 1);
    const totalItems = Array.isArray(quotesData) ? quotes.length : (quotesData?.total || 0);

    // Xử lý xóa
    const handleConfirmDelete = async () => {
        if (quoteToDelete) {
            await deleteMutation.mutateAsync(quoteToDelete.id || quoteToDelete._id);
            setQuoteToDelete(null);
        }
    };

    // Xử lý chuyển đổi sang Đơn hàng
    const handleConvert = async (quote: any) => {
        if (window.confirm(`Bạn có chắc muốn chuyển Báo giá "${quote.quoteNumber}" thành Đơn hàng bán không?`)) {
            await convertMutation.mutateAsync(quote.id || quote._id);
        }
    };

    if (isLoading) return (
        <div className="flex justify-center items-center h-[50vh]">
            <FiLoader className="animate-spin text-3xl text-primary-600" />
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            
            {/* 1. HEADER (Đồng bộ giao diện với OrdersPage) */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FiFileText className="text-primary-600"/> Quản lý Báo giá
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Tạo và theo dõi báo giá gửi khách hàng
                    </p>
                </div>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => setEditingQuote('new')} 
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm transition-all active:scale-95"
                    >
                        <FiPlus size={20} />
                        <span>Tạo Báo giá</span>
                    </button>
                </div>
            </div>

            {/* 2. BẢNG DANH SÁCH */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Mã BG</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Khách hàng</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày tạo</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng tiền</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {quotes.length > 0 ? quotes.map((quote: any) => {
                                const isConverted = quote.status === 'Đã chuyển đổi';
                                return (
                                    <tr key={quote.id || quote._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-primary-600">
                                            {quote.quoteNumber}
                                        </td>
                                        <td className="px-6 py-4 text-slate-800 dark:text-slate-200 font-medium">
                                            {quote.customerName}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {new Date(quote.issueDate).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {isConverted ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                                    <FiCheckCircle /> Đã chốt đơn
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
                                                    Mới
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-slate-200">
                                            {quote.totalAmount.toLocaleString()} đ
                                        </td>
                                        
                                        {/* CỘT THAO TÁC */}
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            
                                            {/* Nút chuyển đổi (Chỉ hiện khi CHƯA chuyển đổi) */}
                                            {!isConverted && (
                                                <button 
                                                    onClick={() => handleConvert(quote)}
                                                    className="p-2 text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
                                                    title="Chuyển thành Đơn hàng"
                                                >
                                                    <FiArrowRightCircle size={18} />
                                                </button>
                                            )}

                                            <button 
                                                onClick={() => setPrintingQuoteId(quote.id || quote._id)} 
                                                className="p-2 text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                                                title="In báo giá"
                                            >
                                                <FiPrinter size={18} />
                                            </button>
                                            
                                            {/* Ẩn sửa/xóa nếu đã chuyển đổi để bảo vệ dữ liệu */}
                                            {!isConverted && (
                                                <>
                                                    <button 
                                                        onClick={() => setEditingQuote(quote)} 
                                                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <FiEdit size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => setQuoteToDelete(quote)} 
                                                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <FiTrash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-slate-500 italic flex flex-col items-center justify-center">
                                        <FiFileText size={40} className="mb-2 opacity-20" />
                                        Chưa có báo giá nào được tạo.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Phân trang */}
                <div className="border-t border-slate-200 dark:border-slate-700 p-4">
                    <Pagination 
                        currentPage={page} 
                        totalPages={totalPages} 
                        onPageChange={setPage} 
                        totalItems={totalItems} 
                        itemsPerPage={10} 
                    />
                </div>
            </div>
            
            {/* Modal Xác nhận xóa */}
            {quoteToDelete && (
                <ConfirmationModal 
                    isOpen={!!quoteToDelete} 
                    onClose={() => setQuoteToDelete(null)} 
                    onConfirm={handleConfirmDelete} 
                    title="Xóa báo giá"
                >
                    Bạn có chắc chắn muốn xóa báo giá số <strong>{quoteToDelete.quoteNumber}</strong>?<br/>
                    <span className="text-sm text-red-500">Hành động này không thể hoàn tác.</span>
                </ConfirmationModal>
            )}

            {/* Modal Tạo/Sửa Báo giá (Chỉ hiện khi state editingQuote có dữ liệu) */}
            {(editingQuote === 'new' || (editingQuote && typeof editingQuote === 'object')) && (
                <QuoteModal 
                    isOpen={true}
                    onClose={() => setEditingQuote(null)}
                />
            )}
        </div>
    );
};

export default QuotesPage;