// pages/LoginPage.tsx (Dán code này để ghi đè)

import React, { useState, useEffect } from 'react';
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2';
import { useAppContext } from '../context/DataContext';

// Thêm biểu tượng Google
import { FiGrid } from 'react-icons/fi'; // Hoặc import logo Google nếu bạn có

const LoginPage: React.FC = () => {
    const { login } = useAppContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            setEmail(rememberedEmail);
            setRememberMe(true);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password, rememberMe);
        } catch (err: any) {
            setError(err.message || 'Email hoặc mật khẩu không đúng.');
        }
    };
    
    // Hàm mới: Chuyển hướng đến API đăng nhập Google
    const handleGoogleLogin = () => {
        // Điều hướng thẳng đến API server (đã tạo ở server.js)
        window.location.href = 'http://localhost:5001/api/auth/google';
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-slate-900">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                <div className="text-center">
                    <HiOutlineBuildingOffice2 className="w-12 h-12 mx-auto text-primary-600" />
                    <h1 className="mt-4 text-3xl font-bold text-gray-800 dark:text-slate-200">Quản lý Bán hàng</h1>
                    <p className="mt-2 text-gray-600 dark:text-slate-400">
                        Đăng nhập vào hệ thống của bạn
                    </p>
                </div>

                {error && (
                    <div className="p-3 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* NÚT ĐĂNG NHẬP GOOGLE (CHO OWNER) */}
                <button 
                    type="button"
                    onClick={handleGoogleLogin}
                    className="group relative w-full flex justify-center py-3 px-4 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
                >
                    <FiGrid className="w-5 h-5 mr-2" /> {/* Thay bằng logo Google */}
                    Đăng nhập / Đăng ký bằng Google (Dành cho Chủ cửa hàng)
                </button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-300 dark:border-slate-600" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            Hoặc đăng nhập (Dành cho Nhân viên/Admin)
                        </span>
                    </div>
                </div>

                {/* FORM ĐĂNG NHẬP EMAIL/PASS (CHO ADMIN/NHANVIEN) */}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm space-y-3">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Địa chỉ email</label>
                            <input id="email-address" name="email" type="email" autoComplete="email" required
                                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-slate-600 placeholder-gray-500 dark:placeholder-slate-400 text-gray-900 dark:text-slate-200 bg-white dark:bg-slate-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                placeholder="Email nhân viên / admin"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Mật khẩu</label>
                            <input id="password" name="password" type="password" autoComplete="current-password" required
                                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-slate-600 placeholder-gray-500 dark:placeholder-slate-400 text-gray-900 dark:text-slate-200 bg-white dark:bg-slate-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                placeholder="Mật khẩu"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input id="remember-me" name="remember-me" type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-slate-500 rounded bg-slate-200 dark:bg-slate-600" />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-slate-300">
                                Ghi nhớ tôi
                            </label>
                        </div>
                    </div>

                    <div>
                        <button type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-px">
                            Đăng nhập
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;