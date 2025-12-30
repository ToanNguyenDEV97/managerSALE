import React, { useState } from 'react';
import { useAppContext } from '../context/DataContext';

const ProfileModal: React.FC = () => {
    const { currentUser, handleUpdateProfile, setIsProfileModalOpen } = useAppContext();
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Mật khẩu mới không khớp.');
            return;
        }
        if (!formData.currentPassword || !formData.newPassword) {
            setError('Vui lòng nhập đầy đủ các trường.');
            return;
        }

        try {
            await handleUpdateProfile(formData.currentPassword, formData.newPassword);
            setSuccess('Đổi mật khẩu thành công!');
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            setError(err.message || 'Đổi mật khẩu thất bại.');
        }
    };

    if (!currentUser) return null;

    return (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Thông tin Tài khoản</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{currentUser.email}</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        {error && <p className="text-sm text-red-500 bg-red-100 dark:bg-red-500/20 p-3 rounded-md">{error}</p>}
                        {success && <p className="text-sm text-green-600 bg-green-100 dark:bg-green-500/20 p-3 rounded-md">{success}</p>}
                        
                        <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300 pt-2">Đổi mật khẩu</h3>
                        <div>
                            <label className="block text-sm font-medium">Mật khẩu hiện tại</label>
                            <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} required className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Mật khẩu mới</label>
                            <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} required className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Xác nhận mật khẩu mới</label>
                            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3" />
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsProfileModalOpen(false)} className="px-4 py-2 border rounded-md">Đóng</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md">Lưu thay đổi</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileModal;
