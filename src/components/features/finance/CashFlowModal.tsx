import React, { useState } from 'react';
import { FiX, FiSave } from 'react-icons/fi';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../utils/api'; // Đảm bảo đường dẫn đúng
import toast from 'react-hot-toast';

interface CashFlowModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CashFlowModal: React.FC<CashFlowModalProps> = ({ isOpen, onClose }) => {
    const queryClient = useQueryClient();
    
    // State form
    const [type, setType] = useState<'thu' | 'chi'>('thu');
    const [amount, setAmount] = useState<number>(0);
    const [description, setDescription] = useState('');
    const [payerReceiverName, setPayerReceiverName] = useState(''); // Người nộp/nhận
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Hook tạo phiếu (Gọi API có sẵn trong server.js)
    const createMutation = useMutation({
        mutationFn: (data: any) => api('/api/cashflow-transactions', { 
            method: 'POST', 
            body: JSON.stringify(data) 
        }),
        onSuccess: () => {
            queryClient.invalidateQueries(['cashflow'] as any);
            toast.success(`Đã lập phiếu ${type === 'thu' ? 'Thu' : 'Chi'} thành công!`);
            onClose();
            // Reset form
            setAmount(0); setDescription(''); setPayerReceiverName('');
        },
        onError: (err: any) => toast.error(err.message)
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (amount <= 0) return toast.error("Số tiền phải lớn hơn 0");
        if (!description) return toast.error("Vui lòng nhập lý do");

        // Gửi dữ liệu lên Server
        createMutation.mutate({
            type, // 'thu' hoặc 'chi'
            amount,
            date,
            description,
            payerReceiverName,
            category: 'Khác', // Mặc định là Khác
            transactionNumber: `${type === 'thu' ? 'PT' : 'PC'}-${Date.now().toString().slice(-6)}` // Tạm thời sinh mã random, Server sẽ tự sinh mã chuẩn sau nếu bạn cấu hình
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
                
                {/* Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Lập Phiếu Thu / Chi</h3>
                    <button onClick={onClose}><FiX size={24} className="text-slate-500" /></button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Loại phiếu (Tab) */}
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setType('thu')}
                            className={`flex-1 py-2 rounded-md font-bold transition-all ${type === 'thu' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500'}`}
                        >
                            Phiếu Thu (Tiền vào)
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('chi')}
                            className={`flex-1 py-2 rounded-md font-bold transition-all ${type === 'chi' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}
                        >
                            Phiếu Chi (Tiền ra)
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Ngày lập</label>
                            <input type="date" required className="w-full border p-2 rounded dark:bg-slate-700 dark:border-slate-600" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Số tiền (VNĐ)</label>
                            <input type="number" required className="w-full border p-2 rounded font-bold text-lg dark:bg-slate-700 dark:border-slate-600" value={amount} onChange={e => setAmount(Number(e.target.value))} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-slate-300">{type === 'thu' ? 'Người nộp tiền' : 'Người nhận tiền'}</label>
                        <input type="text" className="w-full border p-2 rounded dark:bg-slate-700 dark:border-slate-600" placeholder="VD: Nguyễn Văn A" value={payerReceiverName} onChange={e => setPayerReceiverName(e.target.value)} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-slate-300">Lý do / Diễn giải</label>
                        <textarea required className="w-full border p-2 rounded dark:bg-slate-700 dark:border-slate-600" rows={3} placeholder="VD: Trả tiền điện tháng 12..." value={description} onChange={e => setDescription(e.target.value)} />
                    </div>

                    <div className="pt-2">
                        <button type="submit" className={`w-full py-3 text-white font-bold rounded-lg flex justify-center items-center gap-2 ${type === 'thu' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                            <FiSave /> {type === 'thu' ? 'Lưu Phiếu Thu' : 'Lưu Phiếu Chi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CashFlowModal;