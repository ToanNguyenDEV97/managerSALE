import React, { useState, useEffect } from 'react';
import { FiSave, FiUser } from 'react-icons/fi';
import { api } from '../../../utils/api';
import toast from 'react-hot-toast';

// Import UI System chuẩn
import { BaseModal } from '../../common/BaseModal';
import { FormInput } from '../../common/FormInput';
import { Button } from '../../common/Button';

interface Props {
    customer?: any;
    onClose: () => void;
    onSuccess: () => void;
}

const CustomerModal: React.FC<Props> = ({ customer, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '', phone: '', email: '', address: '', taxCode: '', group: 'Lẻ', note: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name || '',
                phone: customer.phone || '',
                email: customer.email || '',
                address: customer.address || '',
                taxCode: customer.taxCode || '',
                group: customer.group || 'Lẻ',
                note: customer.note || ''
            });
        }
    }, [customer]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const url = customer ? `/api/customers/${customer._id}` : '/api/customers';
            const method = customer ? 'PUT' : 'POST';
            await api(url, { method, body: JSON.stringify(formData) });
            
            toast.success(customer ? 'Cập nhật thành công!' : 'Tạo mới thành công!');
            onSuccess();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseModal 
            isOpen={true} 
            onClose={onClose} 
            title={customer ? 'Cập Nhật Khách Hàng' : 'Thêm Khách Hàng Mới'}
            icon={<FiUser size={24}/>}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Hàng 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput 
                        label="Tên khách hàng" required 
                        placeholder="VD: Anh Tuấn"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        autoFocus
                    />
                    <FormInput 
                        label="Số điện thoại" required 
                        placeholder="09xx..."
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                </div>

                {/* Hàng 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput 
                        label="Email" type="email"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                    <FormInput 
                        label="Mã số thuế" 
                        value={formData.taxCode}
                        onChange={e => setFormData({...formData, taxCode: e.target.value})}
                    />
                </div>

                <FormInput 
                    label="Địa chỉ chi tiết" 
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                />

                {/* Nhóm khách (Select chưa có component chung thì dùng HTML thường nhưng style theo FormInput) */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Nhóm khách hàng</label>
                    <select 
                        className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                        value={formData.group}
                        onChange={e => setFormData({...formData, group: e.target.value})}
                    >
                        <option value="Lẻ">Khách lẻ</option>
                        <option value="Sỉ">Khách sỉ / Đại lý</option>
                        <option value="VIP">Khách VIP</option>
                    </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <Button type="button" variant="secondary" onClick={onClose}>Hủy bỏ</Button>
                    <Button type="submit" isLoading={loading} icon={<FiSave/>}>
                        {customer ? 'Lưu Thay Đổi' : 'Tạo Mới'}
                    </Button>
                </div>
            </form>
        </BaseModal>
    );
};

export default CustomerModal;