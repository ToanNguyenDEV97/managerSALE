import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    // Các props khác không cần thiết nữa vì text đã hiển thị ở cha
}

const Pagination: React.FC<PaginationProps> = ({ 
    currentPage, 
    totalPages, 
    onPageChange 
}) => {
    
    // Nếu chỉ có 1 trang thì không cần hiện phân trang
    if (totalPages <= 1) return null;

    // Logic tạo mảng số trang (đơn giản)
    const renderPageNumbers = () => {
        const pages = [];
        // Nếu ít trang thì hiện hết, nếu nhiều thì cần logic ..., ở đây làm đơn giản trước
        const maxVisible = 5; 
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => onPageChange(i)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === i
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                    {i}
                </button>
            );
        }
        return pages;
    };

    return (
        <div className="flex items-center gap-1">
            {/* Nút Previous */}
            <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <FiChevronLeft size={16} />
            </button>

            {/* Các nút số */}
            <div className="flex items-center gap-1">
                {renderPageNumbers()}
            </div>

            {/* Nút Next */}
            <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <FiChevronRight size={16} />
            </button>
        </div>
    );
};

export default Pagination;