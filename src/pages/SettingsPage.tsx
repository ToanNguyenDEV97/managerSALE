
import React, { useState, useEffect } from 'react';
import { FiUpload, FiTrash2 } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
import type { Settings } from '../types';

const SettingsPage: React.FC = () => {
  const { settings, handleSaveSettings } = useAppContext();
  const [formData, setFormData] = useState<Settings>({ ...settings });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
          alert("Kích thước tệp quá lớn. Vui lòng chọn tệp nhỏ hơn 1MB.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logo: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSaveSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000); // Hide message after 3 seconds
  };

  return (
    <div className="space-y-6">
      <div className="hidden lg:block">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-200">Cài đặt</h1>
        <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400 mt-1">Tùy chỉnh thông tin công ty và mẫu in hóa đơn.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-3">Thông tin Công ty</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tên công ty / cửa hàng</label>
            <input type="text" id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} required className="mt-1 block w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Số điện thoại</label>
            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required className="mt-1 block w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 sm:text-sm" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Địa chỉ</label>
            <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} required className="mt-1 block w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 sm:text-sm" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 sm:text-sm" />
          </div>
        </div>

        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-3 pt-4">Logo Hóa đơn</h2>

        <div className="flex items-center gap-6">
          <div className="w-32 h-32 bg-slate-100 dark:bg-slate-700 rounded-md flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-600 overflow-hidden">
            {formData.logo ? (
              <img src={formData.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-sm text-slate-500 dark:text-slate-400 text-center px-2">Xem trước Logo</span>
            )}
          </div>
          <div>
            <label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg bg-primary-600 hover:bg-primary-700 transition-colors">
              <FiUpload className="w-5 h-5" />
              <span>Tải lên Logo</span>
            </label>
            <input id="logo-upload" type="file" accept="image/png, image/jpeg" onChange={handleLogoChange} className="hidden" />
            {formData.logo && (
              <button type="button" onClick={handleRemoveLogo} className="mt-2 flex items-center gap-2 text-sm text-red-600 hover:text-red-800">
                <FiTrash2 />
                Xóa Logo
              </button>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Đề xuất: file PNG/JPG dưới 1MB.</p>
          </div>
        </div>
        
        <div className="pt-6 flex justify-end items-center gap-4 border-t border-slate-200 dark:border-slate-700">
            {isSaved && <span className="text-sm text-green-600 transition-opacity duration-300">Đã lưu thay đổi!</span>}
            <button type="submit" className="px-6 py-2 text-white rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-px font-medium">Lưu thay đổi</button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
