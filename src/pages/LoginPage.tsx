import React, { useState } from 'react';
import { useAppContext } from '../context/DataContext';
import { FiMail, FiLock, FiLogIn, FiLoader, FiAlertCircle } from 'react-icons/fi'; // Import thêm icon
import toast from 'react-hot-toast';

interface LoginPageProps {
    onGoToRegister?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onGoToRegister }) => {
    const { login } = useAppContext();
    
    // State quản lý dữ liệu và trạng thái loading
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false); // <--- QUAN TRỌNG: State loading
    const [error, setError] = useState<string | null>(null); // State lỗi inline (nếu muốn hiện lỗi ngay dưới ô input)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        // 1. Validate sơ bộ
        if (!email.trim() || !password.trim()) {
            toast.error('Vui lòng nhập đầy đủ thông tin!');
            return;
        }

        // 2. Bắt đầu Loading
        setLoading(true);

        try {
            // Giả lập độ trễ nhẹ (500ms) để người dùng kịp nhìn thấy hiệu ứng loading (UX trick)
            // Nếu mạng quá nhanh, loading nháy cái tắt luôn trông sẽ bị giật.
            await new Promise(resolve => setTimeout(resolve, 500));

            await login(email, password);
            toast.success('Đăng nhập thành công!');
            // Không cần setLoading(false) ở đây vì login thành công sẽ redirect hoặc reload App
        } catch (err: any) {
            console.error(err);
            const msg = err.message || 'Đăng nhập thất bại';
            setError(msg); // Hiển thị lỗi màu đỏ dưới nút
            toast.error(msg);
            setLoading(false); // <--- Tắt loading nếu lỗi để nhập lại
        }
    };

    return (
        // UI: Thêm Background Gradient đẹp mắt
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
            
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all hover:shadow-2xl animate-fade-in">
                
                {/* Header: Logo & Chào mừng */}
                <div className="bg-primary-600 px-8 py-10 text-center relative overflow-hidden">
                    {/* Họa tiết trang trí nền (Circles) */}
                    <div className="absolute top-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -translate-x-10 -translate-y-10"></div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full translate-x-10 translate-y-10"></div>

                    <div className="relative z-10">
                        <div className="h-16 w-16 bg-white rounded-xl mx-auto flex items-center justify-center shadow-lg mb-4">
                            <span className="text-3xl font-bold text-primary-600">Q</span>
                        </div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Manager SALE</h2>
                        <p className="text-primary-100 mt-2 text-sm font-medium">Đăng nhập để quản lý cửa hàng</p>
                    </div>
                </div>

                {/* Form Body */}
                <div className="p-8 pt-10">
                    <form onSubmit={handleLogin} className="space-y-6">
                        
                        {/* Input Email */}
                        <div className="group">
                            <label className="block text-sm font-medium text-slate-700 mb-1 group-focus-within:text-primary-600 transition-colors">
                                Email đăng nhập
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiMail className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    disabled={loading} // UX: Khóa input khi đang loading
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                    placeholder="admin@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Input Password */}
                        <div className="group">
                            <label className="block text-sm font-medium text-slate-700 mb-1 group-focus-within:text-primary-600 transition-colors">
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiLock className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    disabled={loading}
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Thông báo lỗi (nếu có) */}
                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 animate-pulse">
                                <FiAlertCircle className="flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Nút Đăng nhập (Có Loading Spinner) */}
                        <button
                            type="submit"
                            disabled={loading} // UX: Khóa nút để tránh double-click
                            className={`
                                w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white 
                                transition-all duration-200
                                ${loading 
                                    ? 'bg-primary-400 cursor-wait' 
                                    : 'bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                                }
                            `}
                        >
                            {loading ? (
                                <>
                                    <FiLoader className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    Đăng nhập
                                    <FiLogIn className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer: Chuyển sang Đăng ký */}
                    <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                        <p className="text-sm text-slate-600 mb-2">Chưa có tài khoản?</p>
                        <button
                            type="button"
                            onClick={onGoToRegister}
                            disabled={loading}
                            className="text-primary-600 font-bold hover:text-primary-700 hover:underline transition-colors disabled:opacity-50"
                        >
                            Đăng ký Chủ Cửa Hàng mới
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Footer bản quyền nhỏ ở dưới cùng */}
            <div className="absolute bottom-4 text-slate-400 text-xs">
                © 2024 ManagerSALE System
            </div>
        </div>
    );
};

export default LoginPage;