import React, { useState } from 'react';
import BaseModal from '../../common/BaseModal';
import { FormInput } from '../../common/FormInput';
import { Button } from '../../common/Button';
import { useCreateCustomer } from '../../../hooks/useCustomers'; // Hook này bạn đã update ở bước trước
import { toast } from 'react-hot-toast';
import { FiUser, FiPhone, FiMapPin, FiSave } from 'react-icons/fi';

interface QuickCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (customer: any) => void;
}

const QuickCustomerModal: React.FC<QuickCustomerModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const createMutation = useCreateCustomer();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Gọi API tạo khách hàng
            const result: any = await createMutation.mutateAsync({
                ...formData,
                group: 'Khách lẻ', // Mặc định nhóm
                email: '',
                notes: 'Tạo nhanh từ POS'
            });

            toast.success('Thêm khách hàng thành công!');
            
            // Trả kết quả về SalesPage để tự động chọn khách vừa tạo
            // Lưu ý: Tùy vào API trả về, result có thể là { data: customer } hoặc customer trực tiếp
            // Ở đây giả định result là object customer
            onSuccess(result.data || result); 
            
            // Reset form
            setFormData({ name: '', phone: '', address: '' });
        } catch (error: any) {
            toast.error('Lỗi: ' + (error.message || 'Không thể tạo khách hàng'));
        }
    };

    return (
        <BaseModal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Thêm nhanh khách hàng" 
            size="sm"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                    label="Tên khách hàng"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    icon={<FiUser />}
                    autoFocus
                    placeholder="VD: Anh Nam"
                />
                
                <FormInput
                    label="Số điện thoại"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    required
                    icon={<FiPhone />}
                    placeholder="VD: 098..."
                />

                <FormInput
                    label="Địa chỉ (Tùy chọn)"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    icon={<FiMapPin />}
                    placeholder="Để trống nếu không cần"
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                    <Button variant="secondary" type="button" onClick={onClose}>
                        Bỏ qua
                    </Button>
                    <Button 
                        variant="primary" 
                        type="submit" 
                        isLoading={createMutation.isPending}
                        icon={<FiSave />}
                    >
                        Lưu & Chọn
                    </Button>
                </div>
            </form>
        </BaseModal>
    );
};

export default QuickCustomerModal;