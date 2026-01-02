import React from 'react';
import { FiAlertTriangle, FiInfo } from 'react-icons/fi';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    type?: 'danger' | 'info'; // 'danger' cho xóa, 'info' cho duyệt
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
    isOpen, onClose, onConfirm, title, message, type = 'info' 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                
                {/* Header & Icon */}
                <div className="p-6 text-center">
                    <div className={`mx-auto mb-4 w-14 h-14 rounded-full flex items-center justify-center ${
                        type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                        {type === 'danger' ? <FiAlertTriangle size={28}/> : <FiInfo size={28}/>}
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
                    <p className="text-slate-500 leading-relaxed text-sm">{message}</p>
                </div>

                {/* Footer Buttons */}
                <div className="bg-slate-50 px-6 py-4 flex gap-3 justify-center border-t border-slate-100">
                    <button 
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition-colors w-full"
                    >
                        Hủy bỏ
                    </button>
                    <button 
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`px-5 py-2.5 rounded-lg text-white font-bold shadow-md transition-all active:scale-95 w-full ${
                            type === 'danger' 
                            ? 'bg-red-600 hover:bg-red-700 shadow-red-200' 
                            : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                        }`}
                    >
                        {type === 'danger' ? 'Xóa ngay' : 'Xác nhận'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;