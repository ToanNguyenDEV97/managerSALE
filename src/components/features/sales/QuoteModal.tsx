import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import QuoteForm from './QuoteForm';

interface QuoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    quote?: any; // [QUAN TRỌNG] Thêm prop này để nhận dữ liệu sửa
}

const QuoteModal: React.FC<QuoteModalProps> = ({ isOpen, onClose, quote }) => {
    // Chặn cuộn trang web khi Modal đang mở
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-5xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                        {quote ? 'Cập Nhật Báo Giá' : 'Tạo Báo Giá Mới'}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-500 hover:text-red-500 bg-slate-100 dark:bg-slate-700 rounded-full transition-colors"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {/* Truyền dữ liệu xuống form */}
                    <QuoteForm 
                        initialData={quote} 
                        onSuccess={onClose} 
                        onCancel={onClose} 
                    />
                </div>
            </div>
        </div>
    );
};

export default QuoteModal;