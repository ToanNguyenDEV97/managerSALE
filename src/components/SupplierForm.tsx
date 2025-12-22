import React, { useState, useEffect } from 'react';
import { FiSave, FiX } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
// Import đúng 2 hook riêng biệt
import { useCreateSupplier, useUpdateSupplier } from '../hooks/useSuppliers';
import toast from 'react-hot-toast';

const SupplierForm: React.FC = () => {
    const { editingSupplier, setEditingSupplier } = useAppContext();
    const isNew = editingSupplier === 'new';
    const supplier = isNew ? null : editingSupplier;

    // --- STATE ---
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [taxCode, setTaxCode] = useState('');

    // --- HOOKS ---
    const createMutation = useCreateSupplier();
    const updateMutation = useUpdateSupplier();

    // Load dữ liệu khi sửa
    useEffect(() => {
        if (supplier && 'id' in supplier) {
            setName(supplier.name);
            setPhone(supplier.phone || '');
            setAddress(supplier.address || '');
            setTaxCode(supplier.taxCode || '');
        }
    }, [supplier]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const formData = {
            name, phone, address, taxCode,
            // Nếu là sửa thì cần thêm ID, giữ nguyên công nợ cũ
            ...(supplier && 'id' in supplier ? { id: supplier.id, debt: supplier.debt } : {})
        };

        try {
            if (isNew) {
                await createMutation.mutateAsync(formData);
                toast.success('Thêm Nhà cung cấp thành công!');
            } else {
                await updateMutation.mutateAsync(formData);
                toast.success('Cập nhật thành công!');
            }
            setEditingSupplier(null); // Đóng modal
        } catch (error: any) {
            toast.error('Lỗi: ' + (error.message || 'Không thể lưu'));
        }
    };

    const inputClass = "w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none";
    const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                    {isNew ? 'Thêm Nhà Cung Cấp' : 'Sửa Nhà Cung Cấp'}
                </h1>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto p-1">
                <div>
                    <label className={labelClass}>Tên Nhà cung cấp <span className="text-red-500">*</span></label>
                    <input 
                        required className={inputClass} 
                        value={name} onChange={e => setName(e.target.value)} 
                        placeholder="VD: Công ty Thép Hòa Phát"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Số điện thoại</label>
                        <input className={inputClass} value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                    <div>
                        <label className={labelClass}>Mã số thuế</label>
                        <input className={inputClass} value={taxCode} onChange={e => setTaxCode(e.target.value)} />
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Địa chỉ</label>
                    <textarea className={inputClass} rows={3} value={address} onChange={e => setAddress(e.target.value)} />
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingSupplier(null)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2">
                    <FiSave /> Lưu lại
                </button>
            </div>
        </form>
    );
};

export default SupplierForm;