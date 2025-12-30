import React from 'react';
import { FiX } from 'react-icons/fi';

interface BaseModalProps {
    isOpen?: boolean;
    onClose: () => void;
    title: string;
    icon?: React.ReactNode;
    width?: string; // 'max-w-lg', 'max-w-2xl', 'max-w-4xl'...
    children: React.ReactNode;
}

export const BaseModal: React.FC<BaseModalProps> = ({ onClose, title, icon, width = 'max-w-lg', children }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className={`bg-white rounded-xl w-full ${width} shadow-2xl flex flex-col max-h-[95vh] overflow-hidden`}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        {icon && <span className="text-primary-600">{icon}</span>}
                        {title}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"><FiX size={20}/></button>
                </div>
                
                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
};