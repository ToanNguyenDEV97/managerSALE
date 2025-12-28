import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/DataContext';
import { FiMail, FiLock, FiLogIn, FiLoader, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface LoginPageProps {
    onGoToRegister?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onGoToRegister }) => {
    const { login } = useAppContext();
    
    // State quản lý dữ liệu
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false); // <--- State cho checkbox Lưu tài khoản
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // [MỚI] Load email đã lưu (nếu có) khi mới vào trang
    useEffect(() => {
        const savedEmail = localStorage.getItem('rememberedEmail');
        if (savedEmail) {
            setEmail(savedEmail);
            setRemember(true); // Tự động tick vào nếu đã từng lưu
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!email.trim() || !password.trim()) {
            toast.error('Vui lòng nhập đầy đủ thông tin!');
            return;
        }

        setLoading(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 500)); // Delay nhẹ cho mượt

            // [QUAN TRỌNG] Truyền biến 'remember' vào hàm login
            await login(email, password, remember); 
            
            toast.success('Đăng nhập thành công!');
        } catch (err: any) {
            console.error(err);
            const msg = err.message || 'Đăng nhập thất bại';
            setError(msg);
            toast.error(msg);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
            
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all hover:shadow-2xl animate-fade-in">
                
                {/* Header */}
                <div className="bg-primary-600 px-8 py-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -translate-x-10 -translate-y-10"></div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full translate-x-10 translate-y-10"></div>
                    <div className="relative z-10">
                        <div className="h-16 w-16 bg-white rounded-xl mx-auto flex items-center justify-center shadow-lg mb-4">
                            <span className="text-3xl font-bold text-primary-600">Q</span>
                        </div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Manager SALE</h2>
                        <p className="text-primary-100 mt-2 text-sm font-medium">Đăng nhập hệ thống</p>
                    </div>
                </div>

                {/* Form Body */}
                <div className="p-8 pt-10">
                    <form onSubmit={handleLogin} className="space-y-6">
                        
                        {/* Input Email */}
                        <div className="group">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email đăng nhập</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiMail className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    disabled={loading}
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all sm:text-sm"
                                    placeholder="admin@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Input Password */}
                        <div className="group">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiLock className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    disabled={loading}
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all sm:text-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* [MỚI] Checkbox Lưu tài khoản & Quên mật khẩu */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900 cursor-pointer select-none">
                                    Lưu tài khoản
                                </label>
                            </div>

                            <div className="text-sm">
                                <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                                    Quên mật khẩu?
                                </a>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 animate-pulse">
                                <FiAlertCircle className="flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white transition-all duration-200 ${loading ? 'bg-primary-400 cursor-wait' : 'bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:-translate-y-0.5'}`}
                        >
                            {loading ? (
                                <><FiLoader className="animate-spin -ml-1 mr-2 h-5 w-5" /> Đang xử lý...</>
                            ) : (
                                <><span className="mr-2">Đăng nhập</span> <FiLogIn className="h-5 w-5" /></>
                            )}
                        </button>
                    </form>

                    {/* Footer Register */}
                    <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                        <p className="text-sm text-slate-600 mb-2">Chưa có tài khoản?</p>
                        <button
                            type="button"
                            onClick={onGoToRegister}
                            disabled={loading}
                            className="text-primary-600 font-bold hover:text-primary-700 hover:underline transition-colors"
                        >
                            Đăng ký Chủ Cửa Hàng mới
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="absolute bottom-4 text-slate-400 text-xs">© 2024 ManagerSALE System</div>
        </div>
    );
};

export default LoginPage;