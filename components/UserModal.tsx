import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { useAppContext } from '../context/DataContext';

const UserModal: React.FC = () => {
  const { editingUser, handleSaveUser, setEditingUser } = useAppContext();
  const isNew = editingUser === 'new';
  const user = isNew ? null : editingUser;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'nhanvien' as 'admin' | 'nhanvien',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        password: '',
        confirmPassword: '',
        role: user.role,
      });
    } else {
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'nhanvien',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (isNew && !formData.password) {
      setError('Mật khẩu là bắt buộc cho người dùng mới.');
      return;
    }

    const userDataToSave: Partial<User> & { password?: string } = {
      id: user?.id,
      email: formData.email,
      role: formData.role,
    };
    if (formData.password) {
      userDataToSave.password = formData.password;
    }

    handleSaveUser(userDataToSave)
      .then(() => setEditingUser(null))
      .catch(err => setError(err.message || 'Có lỗi xảy ra.'));
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{isNew ? 'Thêm Người dùng mới' : 'Chỉnh sửa Người dùng'}</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && <p className="text-sm text-red-500 bg-red-100 dark:bg-red-500/20 p-3 rounded-md">{error}</p>}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Mật khẩu</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder={isNew ? '' : 'Để trống nếu không đổi'} className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Xác nhận mật khẩu</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Vai trò</label>
              <select name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3">
                <option value="nhanvien">Nhân viên</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
            <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 border rounded-md">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md">Lưu</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
