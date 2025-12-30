// src/components/modals/QuoteModal.tsx
import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import QuoteForm from './QuoteForm'; // Import form nhập liệu của bạn vào trong vỏ bọc này

interface QuoteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const QuoteModal: React.FC<QuoteModalProps> = ({ isOpen, onClose }) => {
    // Chặn cuộn trang web khi Modal đang mở
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        // 1. LỚP PHỦ MỜ (Overlay) - Che kín toàn màn hình
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
            
            {/* 2. HỘP MODAL - Nổi ở giữa */}
            <div className="relative w-full max-w-5xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Nút tắt (X) ở góc phải */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 text-slate-500 hover:text-red-500 bg-slate-100 dark:bg-slate-700 rounded-full transition-colors"
                >
                    <FiX size={20} />
                </button>

                {/* 3. NỘI DUNG (Form Báo Giá) - Cho phép cuộn dọc nếu dài */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <QuoteForm />
                </div>
            </div>
        </div>
    );
};

export default QuoteModal;