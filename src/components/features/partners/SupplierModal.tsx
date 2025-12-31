import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import SupplierForm from './SupplierForm';

interface SupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SupplierModal: React.FC<SupplierModalProps> = ({ isOpen, onClose }) => {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col">
                <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 text-slate-500 hover:text-red-600 rounded-full">
                    <FiX size={20} />
                </button>
                <div className="p-6">
                    <SupplierForm />
                </div>
            </div>
        </div>
    );
};

export default SupplierModal;