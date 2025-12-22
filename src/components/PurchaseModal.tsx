import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import PurchaseForm from './PurchaseForm'; // Import Form nhập liệu

interface PurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({ isOpen, onClose }) => {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-5xl max-h-[90vh] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 text-slate-500 hover:text-red-600 bg-slate-100 dark:bg-slate-700 rounded-full transition-colors"
                >
                    <FiX size={20} />
                </button>
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <PurchaseForm />
                </div>
            </div>
        </div>
    );
};

export default PurchaseModal;