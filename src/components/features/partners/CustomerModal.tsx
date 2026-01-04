import React, { useState, useEffect } from 'react';
import BaseModal from '../../common/BaseModal';
import { FormInput } from '../../common/FormInput';
import { Button } from '../../common/Button';
import { useCreateCustomer, useUpdateCustomer } from '../../../hooks/useCustomers';
import { toast } from 'react-hot-toast';
import { FiUser, FiPhone, FiMapPin, FiMail, FiTag, FiFileText, FiSave, FiCreditCard } from 'react-icons/fi';

interface CustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingCustomer?: any; // Nếu có dữ liệu là Sửa, null là Thêm mới
}

const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, editingCustomer }) => {
    // Hooks gọi API
    const createMutation = useCreateCustomer();
    const updateMutation = useUpdateCustomer();
    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    // State form
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        email: '',
        taxCode: '',
        group: 'Khách lẻ',
        notes: ''
    });

    // Load dữ liệu khi mở form Sửa
    useEffect(() => {
        if (isOpen) {
            if (editingCustomer) {
                setFormData({
                    name: editingCustomer.name || '',
                    phone: editingCustomer.phone || '',
                    address: editingCustomer.address || '',
                    email: editingCustomer.email || '',
                    taxCode: editingCustomer.taxCode || '',
                    group: editingCustomer.group || 'Khách lẻ',
                    notes: editingCustomer.notes || ''
                });
            } else {
                // Reset khi thêm mới
                setFormData({
                    name: '',
                    phone: '',
                    address: '',
                    email: '',
                    taxCode: '',
                    group: 'Khách lẻ',
                    notes: ''
                });
            }
        }
    }, [isOpen, editingCustomer]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCustomer) {
                // Logic Sửa
                await updateMutation.mutateAsync({ 
                    id: editingCustomer.id || editingCustomer._id, 
                    ...formData 
                });
                toast.success('Cập nhật khách hàng thành công!');
            } else {
                // Logic Thêm mới
                await createMutation.mutateAsync(formData);
                toast.success('Thêm khách hàng thành công!');
            }
            onClose();
        } catch (error: any) {
            toast.error('Lỗi: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <BaseModal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={editingCustomer ? "Sửa thông tin khách hàng" : "Thêm khách hàng mới"} 
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                        label="Tên khách hàng (*)"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                        icon={<FiUser />}
                        placeholder="VD: Nguyễn Văn A"
                        autoFocus
                    />
                    
                    <FormInput
                        label="Số điện thoại (*)"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        required
                        icon={<FiPhone />}
                        placeholder="VD: 0987..."
                    />
                </div>

                <FormInput
                    label="Địa chỉ"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    icon={<FiMapPin />}
                    placeholder="Địa chỉ liên hệ"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        icon={<FiMail />}
                        placeholder="email@example.com"
                    />
                    
                    <FormInput
                        label="Mã số thuế"
                        value={formData.taxCode}
                        onChange={e => setFormData({ ...formData, taxCode: e.target.value })}
                        icon={<FiCreditCard />}
                        placeholder="Nếu là khách doanh nghiệp"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {/* Có thể thay bằng Select nếu muốn cố định nhóm */}
                    <FormInput
                        label="Nhóm khách hàng"
                        value={formData.group}
                        onChange={e => setFormData({ ...formData, group: e.target.value })}
                        icon={<FiTag />}
                        placeholder="VD: Khách lẻ, VIP, Đại lý"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 block">Ghi chú</label>
                    <div className="relative">
                        <FiFileText className="absolute left-3 top-3 text-slate-400" />
                        <textarea
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm min-h-[80px]"
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Ghi chú thêm về khách hàng..."
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                    <Button variant="secondary" type="button" onClick={onClose}>
                        Hủy bỏ
                    </Button>
                    <Button 
                        variant="primary" 
                        type="submit" 
                        isLoading={isSubmitting}
                        icon={<FiSave />}
                    >
                        {editingCustomer ? 'Lưu thay đổi' : 'Thêm khách hàng'}
                    </Button>
                </div>
            </form>
        </BaseModal>
    );
};

export default CustomerModal;