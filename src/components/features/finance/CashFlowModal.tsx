// src/components/features/finance/CashFlowModal.tsx
import React, { useState } from 'react';
import BaseModal from '../../common/BaseModal';
import { FormInput } from '../../common/FormInput';
import { Button } from '../../common/Button';
import { useCreateCashFlow } from '../../../hooks/useCashFlow'; // Custom hook tạo phiếu
import { FiSave } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface CashFlowModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'income' | 'expense';
}

const CashFlowModal: React.FC<CashFlowModalProps> = ({ isOpen, onClose, type }) => {
    const createMutation = useCreateCashFlow();
    
    const [formData, setFormData] = useState({
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: '',
        partnerName: '', // Có thể nâng cấp thành Select Customer/Supplier sau
        referenceDoc: '' // Mã đơn hàng/hóa đơn liên quan
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createMutation.mutateAsync({
                ...formData,
                type: type
            });
            toast.success(`Đã lập phiếu ${type === 'income' ? 'Thu' : 'Chi'} thành công!`);
            onClose();
            // Reset form
            setFormData({ amount: 0, date: new Date().toISOString().split('T')[0], description: '', partnerName: '', referenceDoc: '' });
        } catch (error: any) {
            toast.error('Lỗi: ' + error.message);
        }
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title={type === 'income' ? 'Lập Phiếu Thu Tiền' : 'Lập Phiếu Chi Tiền'}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Số tiền nổi bật */}
                <div className={`p-4 rounded-xl border ${type === 'income' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                    <label className={`block text-sm font-bold mb-1 ${type === 'income' ? 'text-green-700' : 'text-red-700'}`}>
                        Số tiền {type === 'income' ? 'thu vào' : 'chi ra'}
                    </label>
                    <input 
                        type="number" 
                        autoFocus
                        className={`w-full text-3xl font-bold bg-transparent outline-none ${type === 'income' ? 'text-green-600' : 'text-red-600'}`}
                        value={formData.amount}
                        onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                        placeholder="0"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormInput 
                        label="Ngày chứng từ" 
                        type="date" 
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                        required
                    />
                    <FormInput 
                        label="Người nộp/nhận" 
                        placeholder="VD: Khách hàng A, NCC B..."
                        value={formData.partnerName}
                        onChange={e => setFormData({...formData, partnerName: e.target.value})}
                    />
                </div>

                <FormInput 
                    label="Lý do / Diễn giải" 
                    placeholder="VD: Thu tiền bán hàng ngày 20/10..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    required
                />

                <FormInput 
                    label="Tham chiếu (Mã đơn/Hóa đơn)" 
                    placeholder="VD: DH001, HD002 (Không bắt buộc)"
                    value={formData.referenceDoc}
                    onChange={e => setFormData({...formData, referenceDoc: e.target.value})}
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button 
                        type="submit" 
                        variant={type === 'income' ? 'primary' : 'danger'}
                        icon={<FiSave />}
                        isLoading={createMutation.isPending}
                    >
                        Lưu phiếu
                    </Button>
                </div>
            </form>
        </BaseModal>
    );
};

export default CashFlowModal;