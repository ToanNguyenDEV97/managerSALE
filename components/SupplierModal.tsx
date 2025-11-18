
import React, { useState, useEffect } from 'react';
import type { Supplier } from '../types';

interface SupplierModalProps {
  supplier: Supplier | null;
  onClose: () => void;
  onSave: (supplier: Supplier) => Promise<void>;
}

const SupplierModal: React.FC<SupplierModalProps> = ({ supplier, onClose, onSave }) => {
  const [formData, setFormData] = useState<Omit<Supplier, 'id' | 'debt'>>({
    name: '',
    phone: '',
    address: '',
    taxCode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (supplier) {
      const { id, debt, ...data } = supplier;
      setFormData({ 
        name: '', 
        phone: '', 
        address: '', 
        taxCode: '', 
        ...data 
      });
    } else {
      setFormData({ name: '', phone: '', address: '', taxCode: '' });
    }
  }, [supplier]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
     if (errors[name]) {
        setErrors(prev => ({...prev, [name]: ''}));
    }
  };
  
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Regex cho SĐT Việt Nam: Bắt đầu bằng 0, theo sau là 3,5,7,8,9 và 8 số bất kỳ
    const phoneRegex = /^(0)(3|5|7|8|9)([0-9]{8})$/;

    if (!formData.name.trim()) newErrors.name = "Tên khách hàng là bắt buộc.";
    
    if (!formData.phone.trim()) {
        newErrors.phone = "Số điện thoại là bắt buộc.";
    } else if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = "SĐT không hợp lệ (Phải là 10 số, đầu 03, 05, 07, 08, 09).";
    }
    
    if (!formData.address.trim()) newErrors.address = "Địa chỉ là bắt buộc.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
        const supplierToSave: Supplier = {
            ...formData,
            id: supplier?.id || '',
            debt: supplier?.debt || 0,
        };
        await onSave(supplierToSave);
    }
  };
  
  const labelStyles = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";
  const baseInputStyles = "mt-1 block w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 sm:text-sm dark:bg-slate-700 dark:text-slate-200 dark:placeholder-slate-400";
  const normalInputStyles = `${baseInputStyles} border-slate-300 dark:border-slate-600 focus:ring-primary-300 focus:border-primary-500`;
  const errorInputStyles = `${baseInputStyles} border-red-500 focus:ring-red-300`;


  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{supplier ? 'Chỉnh sửa Nhà cung cấp' : 'Thêm Nhà cung cấp mới'}</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            <div>
              <label className={labelStyles}>Tên nhà cung cấp</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className={errors.name ? errorInputStyles : normalInputStyles} />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelStyles}>Số điện thoại</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className={errors.phone ? errorInputStyles : normalInputStyles} />
                  {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
                </div>
                 <div>
                  <label className={labelStyles}>Mã số thuế</label>
                  <input type="text" name="taxCode" value={formData.taxCode} onChange={handleChange} className={normalInputStyles} />
                </div>
            </div>
            <div>
              <label className={labelStyles}>Địa chỉ</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} required className={errors.address ? errorInputStyles : normalInputStyles} />
              {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
            </div>
          </div>
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 hover:border-slate-400 transition-colors duration-200 font-medium text-sm">Hủy</button>
            <button type="submit" className="px-4 py-2 text-white rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-px font-medium text-sm">{supplier ? 'Cập nhật' : 'Lưu'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierModal;
