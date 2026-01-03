import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';

interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    icon?: React.ReactNode;
}

const BaseModal: React.FC<BaseModalProps> = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    size = 'md', 
    icon 
}) => {
    // Xử lý đóng khi nhấn phím ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    // Nếu isOpen = false thì không render gì cả
    if (!isOpen) return null;

    // Định nghĩa kích thước chuẩn
    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
        full: 'max-w-full m-4'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            {/* Overlay click to close (Optional) */}
            <div className="absolute inset-0" onClick={onClose}></div>

            <div 
                className={`relative bg-white w-full ${sizes[size]} rounded-xl shadow-2xl flex flex-col max-h-[90vh] animate-slide-up overflow-hidden`}
                onClick={(e) => e.stopPropagation()} // Chặn click xuyên qua modal
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        {icon && <span className="text-primary-600">{icon}</span>}
                        {title}
                    </h3>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};

// Quan trọng: Phải có export default
export default BaseModal;