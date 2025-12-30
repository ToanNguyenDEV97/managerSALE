import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiUser, FiLoader } from 'react-icons/fi';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import { InputGroup, TextAreaGroup, SelectGroup } from './common/FormElements'; // Import bộ UI chuẩn

interface CustomerModalProps {
    customer?: any;
    onClose: () => void;
    onSuccess: () => void;
}

const CustomerModal: React.FC<CustomerModalProps> = ({ customer, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        taxCode: '', // Thêm Mã số thuế
        group: 'Lẻ', // Phân loại khách
        note: ''
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
            if (customer) {
                await api(`/api/customers/${customer._id}`, { method: 'PUT', body: JSON.stringify(formData) });
                toast.success('Cập nhật khách hàng thành công');
            } else {
                await api('/api/customers', { method: 'POST', body: JSON.stringify(formData) });
                toast.success('Thêm khách hàng mới thành công');
            }
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || 'Lỗi lưu dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <FiUser className="text-primary-600"/> 
                        {customer ? 'Cập Nhật Khách Hàng' : 'Thêm Khách Hàng Mới'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><FiX size={20}/></button>
                </div>

                {/* Body - Sử dụng Grid để chia cột đẹp mắt */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <InputGroup 
                        label="Tên khách hàng (*)" 
                        placeholder="VD: Nguyễn Văn A" 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        required autoFocus
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup 
                            label="Số điện thoại (*)" 
                            placeholder="09xx..." 
                            value={formData.phone} 
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            required
                        />
                        <SelectGroup 
                            label="Nhóm khách"
                            value={formData.group}
                            onChange={e => setFormData({...formData, group: e.target.value})}
                            options={[
                                { value: 'Lẻ', label: 'Khách lẻ' },
                                { value: 'Sỉ', label: 'Khách sỉ / Đại lý' },
                                { value: 'VIP', label: 'Khách VIP' }
                            ]}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup 
                            label="Email" 
                            type="email"
                            placeholder="customer@example.com" 
                            value={formData.email} 
                            onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                        <InputGroup 
                            label="Mã số thuế" 
                            placeholder="Nếu là doanh nghiệp" 
                            value={formData.taxCode} 
                            onChange={e => setFormData({...formData, taxCode: e.target.value})}
                        />
                    </div>

                    <TextAreaGroup 
                        label="Địa chỉ chi tiết" 
                        placeholder="Số nhà, đường, phường/xã..."
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                    />

                    <TextAreaGroup 
                        label="Ghi chú nội bộ" 
                        rows={2}
                        placeholder="Lưu ý về khách hàng này..."
                        value={formData.note}
                        onChange={e => setFormData({...formData, note: e.target.value})}
                    />

                    {/* Footer Actions */}
                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Hủy bỏ</button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 disabled:bg-slate-400 flex items-center gap-2 transition-all"
                        >
                            {loading ? <FiLoader className="animate-spin"/> : <FiSave/>}
                            {customer ? 'Lưu Thay Đổi' : 'Tạo Mới'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomerModal;