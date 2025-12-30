import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import { FiSave, FiSettings, FiImage } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';

const SettingsPage = () => {
    const { refreshCompanyInfo } = useAppContext();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '', address: '', phone: '', email: '',
        website: '', taxCode: '', logoUrl: '',
        bankAccount: '', bankName: '', bankOwner: ''
    });

    // 1. Tải thông tin hiện tại
    useEffect(() => {
        const fetchOrg = async () => {
            try {
                const data = await api('/api/organization');
                if (data) setFormData({
                    name: data.name || '',
                    address: data.address || '',
                    phone: data.phone || '',
                    email: data.email || '',
                    website: data.website || '',
                    taxCode: data.taxCode || '',
                    logoUrl: data.logoUrl || '',
                    bankAccount: data.bankAccount || '',
                    bankName: data.bankName || '',
                    bankOwner: data.bankOwner || ''
                });
            } catch (error) { console.error(error); }
        };
        fetchOrg();
    }, []);

    // 2. Lưu thông tin
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api('/api/organization', {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
            
            // [3] CẬP NHẬT CONTEXT NGAY LẬP TỨC
            await refreshCompanyInfo(); 

            toast.success('Đã lưu thông tin công ty thành công!');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-20 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200">
                    <FiSettings size={24} className="text-primary-600"/>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Cài đặt Cửa hàng</h2>
                    <p className="text-slate-500 text-sm">Thông tin này sẽ hiển thị trên Hóa đơn và Phiếu in.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* THÔNG TIN CHUNG */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 text-lg border-b pb-2">Thông tin chung</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Tên Cửa hàng / Công ty</label>
                            <input type="text" required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="VD: Cửa hàng VLXD An Phát"/>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Địa chỉ (In lên phiếu)</label>
                            <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="VD: 123 Nguyễn Văn Linh, Q.7, TP.HCM"/>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Số điện thoại / Hotline</label>
                            <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}/>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Email liên hệ</label>
                            <input type="email" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}/>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Mã số thuế (MST)</label>
                            <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                value={formData.taxCode} onChange={e => setFormData({...formData, taxCode: e.target.value})}/>
                        </div>
                         <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Website</label>
                            <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})}/>
                        </div>
                    </div>
                </div>

                {/* TÀI KHOẢN NGÂN HÀNG */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 text-lg border-b pb-2">Thông tin chuyển khoản (Footer phiếu in)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Tên Ngân hàng</label>
                            <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} placeholder="VD: Vietcombank"/>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Số tài khoản</label>
                            <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                value={formData.bankAccount} onChange={e => setFormData({...formData, bankAccount: e.target.value})}/>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Chủ tài khoản</label>
                            <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                value={formData.bankOwner} onChange={e => setFormData({...formData, bankOwner: e.target.value})}/>
                        </div>
                    </div>
                </div>

                {/* LOGO URL */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 text-lg border-b pb-2">Logo (URL Hình ảnh)</h3>
                    <div className="flex gap-4 items-start">
                        <div className="flex-1">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Đường dẫn ảnh Logo</label>
                            <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                value={formData.logoUrl} onChange={e => setFormData({...formData, logoUrl: e.target.value})} placeholder="https://example.com/logo.png"/>
                             <p className="text-xs text-slate-400 mt-1">Copy link ảnh logo của bạn dán vào đây.</p>
                        </div>
                        <div className="w-24 h-24 border border-slate-200 rounded-lg flex items-center justify-center bg-slate-50 overflow-hidden">
                            {formData.logoUrl ? <img src={formData.logoUrl} alt="Logo Preview" className="w-full h-full object-contain"/> : <FiImage className="text-slate-300" size={32}/>}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button type="submit" disabled={loading} className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary-500/30 flex items-center gap-2 transition-all active:scale-95">
                        <FiSave size={20}/> {loading ? 'Đang lưu...' : 'Lưu Cài Đặt'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SettingsPage;