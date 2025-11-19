import React, { useState } from 'react';
import type { Customer } from '../types';

interface QuickCustomerModalProps {
  onClose: () => void;
  onSave: (customerData: Omit<Customer, 'id' | 'debt'>) => Promise<void>;
}

const QuickCustomerModal: React.FC<QuickCustomerModalProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState<Omit<Customer, 'id' | 'debt'>>({
    name: '',
    phone: '',
    address: '',
  });
  // Thêm state để quản lý lỗi hiển thị
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Xóa lỗi khi người dùng bắt đầu sửa
    if (error) setError('');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Kiểm tra rỗng
    if (!formData.name.trim() || !formData.phone.trim()) {
        setError("Vui lòng nhập tên và số điện thoại.");
        return;
    }

    // 2. Kiểm tra định dạng SĐT Việt Nam
    // Bắt đầu bằng 0, tiếp theo là 3,5,7,8,9 và 8 chữ số bất kỳ
    const phoneRegex = /^(0)(3|5|7|8|9)([0-9]{8})$/;
    if (!phoneRegex.test(formData.phone)) {
        setError("SĐT không hợp lệ");
        return;
    }

    await onSave(formData);
  };
  
  const inputStyles = "mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400";
  const labelStyles = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Thêm Nhanh Khách hàng</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            {/* Hiển thị thông báo lỗi nếu có */}
            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm font-medium">
                    {error}
                </div>
            )}

            <div>
              <label className={labelStyles}>Tên khách hàng <span className="text-red-500">*</span></label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputStyles} autoFocus/>
            </div>
            <div>
              <label className={labelStyles}>Số điện thoại <span className="text-red-500">*</span></label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputStyles} placeholder="Ví dụ: 0912345678" />
            </div>
            <div>
              <label className={labelStyles}>Địa chỉ</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputStyles} />
            </div>
          </div>
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 hover:border-slate-400 transition-colors duration-200 font-medium text-sm">Hủy</button>
            <button type="submit" className="px-4 py-2 text-white rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-px font-medium text-sm">Lưu khách hàng</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickCustomerModal;