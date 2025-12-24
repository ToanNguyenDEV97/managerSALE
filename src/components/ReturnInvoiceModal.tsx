import React, { useState } from 'react';
import { FiX, FiAlertTriangle, FiRotateCcw, FiLoader } from 'react-icons/fi';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
    invoiceNumber?: string;
}

const ReturnInvoiceModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, invoiceNumber }) => {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!reason.trim()) {
            setError('Vui lòng nhập lý do trả hàng.');
            return;
        }
        try {
            setIsSubmitting(true);
            await onConfirm(reason);
            // Reset form sau khi thành công
            setReason('');
            setError('');
            onClose();
        } catch (err) {
            // Lỗi sẽ được xử lý ở component cha, nhưng ta tắt loading ở đây
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                
                {/* Header */}
                <div className="bg-orange-50 p-4 border-b border-orange-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-orange-700 flex items-center gap-2">
                        <FiRotateCcw /> Xác nhận Trả hàng
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <FiX size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 bg-orange-100 rounded-full shrink-0">
                            <FiAlertTriangle className="text-orange-600 text-xl" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800">Bạn có chắc muốn hoàn trả hóa đơn {invoiceNumber}?</p>
                            <p className="text-sm text-slate-500 mt-1">
                                Hành động này sẽ nhập lại hàng vào kho và hoàn tiền cho khách (nếu đã trả). <br/>
                                <span className="text-red-500 italic">Không thể hoàn tác.</span>
                            </p>
                        </div>
                    </div>

                    {/* Input Lý do */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Nguyên nhân trả hàng <span className="text-red-500">*</span></label>
                        <textarea
                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm min-h-[100px] ${error ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                            placeholder="Ví dụ: Khách không ưng ý, Hàng bị lỗi kỹ thuật..."
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                if (error) setError('');
                            }}
                            autoFocus
                        ></textarea>
                        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                    >
                        Hủy bỏ
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium shadow-sm flex items-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <FiLoader className="animate-spin" /> : <FiRotateCcw />}
                        Xác nhận Trả hàng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReturnInvoiceModal;