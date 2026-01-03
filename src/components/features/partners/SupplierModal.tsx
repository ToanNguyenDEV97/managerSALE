import React, { useState, useEffect } from 'react';
import BaseModal from '../../common/BaseModal';
import { FormInput } from '../../common/FormInput';
import { Button } from '../../common/Button';
// Giả định bạn đã có hook này (tương tự useCustomers)
import { useCreateSupplier, useUpdateSupplier } from '../../../hooks/useSuppliers';
import { FiSave, FiTruck, FiPhone, FiMapPin, FiMail, FiGlobe } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface SupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingSupplier?: any;
}

const SupplierModal: React.FC<SupplierModalProps> = ({ isOpen, onClose, editingSupplier }) => {
    const createMutation = useCreateSupplier();
    const updateMutation = useUpdateSupplier();

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        email: '',
        taxCode: '', // NCC thường có mã số thuế
        website: '',
        group: 'Chính hãng',
        notes: ''
    });

    useEffect(() => {
        if (editingSupplier) {
            setFormData({
                name: editingSupplier.name || '',
                phone: editingSupplier.phone || '',
                address: editingSupplier.address || '',
                email: editingSupplier.email || '',
                taxCode: editingSupplier.taxCode || '',
                website: editingSupplier.website || '',
                group: editingSupplier.group || 'Chính hãng',
                notes: editingSupplier.notes || ''
            });
        } else {
            setFormData({ name: '', phone: '', address: '', email: '', taxCode: '', website: '', group: 'Chính hãng', notes: '' });
        }
    }, [editingSupplier, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingSupplier) {
                await updateMutation.mutateAsync({ id: editingSupplier.id, ...formData });
                toast.success('Cập nhật nhà cung cấp thành công!');
            } else {
                await createMutation.mutateAsync(formData);
                toast.success('Thêm nhà cung cấp mới thành công!');
            }
            onClose();
        } catch (error: any) {
            toast.error('Lỗi: ' + error.message);
        }
    };

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title={editingSupplier ? "Cập nhật Nhà Cung Cấp" : "Thêm Nhà Cung Cấp Mới"}
            size="lg" // Form NCC nhiều trường hơn chút nên dùng size lớn
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Header Avatar */}
                <div className="flex justify-center mb-2">
                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 border-2 border-orange-100">
                        <FiTruck size={28} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput 
                        label="Tên nhà cung cấp" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        required
                        placeholder="VD: Công ty TNHH ABC"
                        autoFocus
                    />
                    <FormInput 
                        label="Mã số thuế" 
                        value={formData.taxCode}
                        onChange={e => setFormData({...formData, taxCode: e.target.value})}
                        placeholder="VD: 0312345678"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput 
                        label="Điện thoại" 
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        required
                        icon={<FiPhone />}
                    />
                    <FormInput 
                        label="Email" 
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        icon={<FiMail />}
                    />
                </div>

                <FormInput 
                    label="Địa chỉ kho/Văn phòng" 
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    icon={<FiMapPin />}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput 
                        label="Website (nếu có)" 
                        value={formData.website}
                        onChange={e => setFormData({...formData, website: e.target.value})}
                        icon={<FiGlobe />}
                        placeholder="https://..."
                    />
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Phân loại</label>
                        <select 
                            className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-200"
                            value={formData.group}
                            onChange={e => setFormData({...formData, group: e.target.value})}
                        >
                            <option value="Chính hãng">Chính hãng</option>
                            <option value="Đại lý">Đại lý cấp 1</option>
                            <option value="Tiểu ngạch">Tiểu ngạch/Chợ</option>
                            <option value="Khác">Khác</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <Button type="button" variant="secondary" onClick={onClose}>Hủy</Button>
                    <Button type="submit" isLoading={isSubmitting} icon={<FiSave />}>Lưu thông tin</Button>
                </div>
            </form>
        </BaseModal>
    );
};

export default SupplierModal;