import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import ProductForm from './ProductForm'; // Import cái Form nhập liệu bạn đang có

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose }) => {
    // Chặn cuộn trang web khi Modal mở
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            {/* Hộp Modal */}
            <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* Nút tắt (X) */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 text-slate-500 hover:text-red-600 bg-slate-100 dark:bg-slate-700 rounded-full transition-colors"
                >
                    <FiX size={20} />
                </button>

                {/* Nội dung Form bên trong */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    <ProductForm />
                </div>
            </div>
        </div>
    );
};

export default ProductModal;