import React, { useState } from 'react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom'; // [MỚI] Import hook điều hướng
import { FiUser, FiMail, FiLock, FiArrowRight, FiCheckCircle, FiCheck } from 'react-icons/fi';

const RegisterPage: React.FC = () => {
    const navigate = useNavigate(); // [MỚI] Khởi tạo hook

    // State quản lý các bước (1: Email, 2: OTP, 3: Info & Pass)
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [loading, setLoading] = useState(false);

    // Dữ liệu Form
    const [formData, setFormData] = useState({
        email: '',
        otp: '',
        name: '', 
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // BƯỚC 1: Nhập Email -> Gửi OTP
    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        // Kiểm tra đuôi gmail (tùy chọn)
        if (!formData.email.endsWith('@gmail.com')) {
            return toast.error('Vui lòng sử dụng Gmail (@gmail.com)!');
        }

        setLoading(true);
        try {
            await api('/api/auth/register-request', {
                method: 'POST',
                body: JSON.stringify({ email: formData.email })
            });
            toast.success('Đã gửi mã OTP đến email!');
            setStep(2);
        } catch (err: any) {
            toast.error(err.message || 'Lỗi gửi OTP');
        } finally {
            setLoading(false);
        }
    };

    // BƯỚC 2: Nhập OTP -> Kiểm tra OTP
    const handleCheckOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.otp.length !== 6) return toast.error('OTP phải có 6 số');

        setLoading(true);
        try {
            await api('/api/auth/check-otp', {
                method: 'POST',
                body: JSON.stringify({ email: formData.email, otp: formData.otp })
            });
            
            toast.success('Xác thực OTP thành công!');
            setStep(3);
        } catch (err: any) {
            toast.error(err.message || 'Mã OTP không đúng');
        } finally {
            setLoading(false);
        }
    };

    // BƯỚC 3: Nhập Thông tin & Mật khẩu -> Hoàn tất
    const handleFinalize = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.password.length < 6) return toast.error('Mật khẩu phải > 6 ký tự');
        if (formData.password !== formData.confirmPassword) return toast.error('Mật khẩu xác nhận không khớp');
        if (!formData.name.trim()) return toast.error('Vui lòng nhập tên cửa hàng');

        setLoading(true);
        try {
            // Gọi API tạo tài khoản
            const res = await api('/api/auth/register-verify', {
                method: 'POST',
                body: JSON.stringify({
                    email: formData.email,
                    otp: formData.otp,
                    password: formData.password,
                    name: formData.name, 
                }),
            });

            toast.success('Đăng ký thành công!');
            
            // Tự động đăng nhập luôn sau khi đăng ký
            if (res && res.token) {
                // Lưu token vào Session
                sessionStorage.setItem('token', res.token);
                // Reload trang để nạp lại App với user mới
                window.location.href = '/'; 
            } else {
                // [MỚI] Chuyển về trang login bằng navigate
                navigate('/login');
            }
        } catch (err: any) {
            toast.error(err.message || 'Lỗi đăng ký');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-primary-600 p-6 text-center">
                    <h2 className="text-2xl font-bold text-white">Đăng Ký Tài Khoản</h2>
                    <p className="text-primary-100 text-sm mt-2">Bước {step}/3: {
                        step === 1 ? 'Nhập Email' : step === 2 ? 'Xác thực OTP' : 'Thiết lập tài khoản'
                    }</p>
                </div>

                <div className="p-8">
                    {/* Thanh tiến trình */}
                    <div className="flex items-center justify-center mb-8 space-x-2">
                        <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-primary-500' : 'bg-slate-200'}`}></div>
                        <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-primary-500' : 'bg-slate-200'}`}></div>
                        <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-primary-500' : 'bg-slate-200'}`}></div>
                    </div>

                    {/* === STEP 1: EMAIL === */}
                    {step === 1 && (
                        <form onSubmit={handleRequestOTP} className="space-y-4 animate-fade-in">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Gmail của bạn</label>
                                <div className="relative">
                                    <FiMail className="absolute left-3 top-3 text-slate-400" />
                                    <input 
                                        type="email" 
                                        name="email" 
                                        required autoFocus
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="owner@gmail.com"
                                        value={formData.email} onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <button 
                                type="submit" disabled={loading}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                {loading ? 'Đang gửi...' : <>Gửi mã xác thực <FiArrowRight /></>}
                            </button>
                        </form>
                    )}

                    {/* === STEP 2: OTP === */}
                    {step === 2 && (
                        <form onSubmit={handleCheckOTP} className="space-y-6 animate-fade-in">
                            <div className="text-center">
                                <p className="text-slate-600 mb-2">Mã OTP đã gửi đến: <b>{formData.email}</b></p>
                                <input 
                                    type="text" 
                                    name="otp" 
                                    required maxLength={6} autoFocus
                                    className="w-full text-center text-3xl tracking-[0.5em] font-bold py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none uppercase"
                                    placeholder="000000"
                                    value={formData.otp} onChange={handleChange}
                                />
                            </div>
                            <button 
                                type="submit" disabled={loading}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                {loading ? 'Đang kiểm tra...' : <>Xác thực OTP <FiCheck /></>}
                            </button>
                            <button 
                                type="button" onClick={() => setStep(1)}
                                className="w-full text-sm text-slate-500 hover:text-slate-700 mt-2"
                            >
                                Nhập lại Email
                            </button>
                        </form>
                    )}

                    {/* === STEP 3: INFO & PASSWORD === */}
                    {step === 3 && (
                        <form onSubmit={handleFinalize} className="space-y-4 animate-fade-in">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tên cửa hàng / Tên bạn</label>
                                <div className="relative">
                                    <FiUser className="absolute left-3 top-3 text-slate-400" />
                                    <input 
                                        type="text" 
                                        name="name"
                                        required autoFocus
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="Ví dụ: Cửa hàng A"
                                        value={formData.name} onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
                                <div className="relative">
                                    <FiLock className="absolute left-3 top-3 text-slate-400" />
                                    <input 
                                        type="password" 
                                        name="password" 
                                        required minLength={6}
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="••••••••"
                                        value={formData.password} onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nhập lại mật khẩu</label>
                                <div className="relative">
                                    <FiCheckCircle className="absolute left-3 top-3 text-slate-400" />
                                    <input 
                                        type="password" 
                                        name="confirmPassword" 
                                        required minLength={6}
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword} onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <button 
                                type="submit" disabled={loading}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-green-200 transition-colors"
                            >
                                {loading ? 'Đang tạo...' : <>Hoàn tất đăng ký <FiCheckCircle /></>}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                        <p className="text-sm text-slate-600">
                            Đã có tài khoản?{' '}
                            <button 
                                onClick={() => navigate('/login')} // [MỚI] Sử dụng navigate
                                className="text-primary-600 font-bold hover:underline"
                            >
                                Đăng nhập
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;