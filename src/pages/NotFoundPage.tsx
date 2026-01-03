import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHome, FiArrowLeft } from 'react-icons/fi';
import { Button } from '../components/common/Button';

// Hình minh họa SVG 404 (Sử dụng màu primary của hệ thống)
const Illustration404 = () => (
    <svg className="w-full max-w-md mx-auto h-auto" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="200" cy="150" r="130" className="fill-primary-50 dark:fill-slate-800/50 animate-pulse" />
        <path d="M130.348 216.766L166.766 180.348M166.766 216.766L130.348 180.348" stroke="currentColor" className="text-primary-300" strokeWidth="8" strokeLinecap="round"/>
        <path d="M269.652 216.766L233.234 180.348M233.234 216.766L269.652 180.348" stroke="currentColor" className="text-primary-300" strokeWidth="8" strokeLinecap="round"/>
        <path d="M200 70V130" stroke="currentColor" className="text-primary-500" strokeWidth="8" strokeLinecap="round"/>
        <path d="M200 160.296C200 160.296 180.593 200.296 130 200.296M200 160.296C200 160.296 219.407 200.296 270 200.296" stroke="currentColor" className="text-primary-500" strokeWidth="8" strokeLinecap="round" strokeDasharray="16 16"/>
        <rect x="160" y="90" width="80" height="70" rx="10" className="fill-primary-600" />
        <path d="M175 115H225" stroke="white" strokeWidth="4" strokeLinecap="round"/>
        <path d="M175 135H205" stroke="white" strokeWidth="4" strokeLinecap="round"/>
        <circle cx="200" cy="125" r="5" className="fill-primary-200 animate-ping"/>
        
        {/* Số 404 */}
        <text x="50%" y="280" textAnchor="middle" className="text-6xl font-black fill-primary-900/20" style={{fontSize: '80px'}}>404</text>
    </svg>
);

const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 animate-fade-in overflow-hidden relative">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-10 -left-20 w-64 h-64 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-0 right-10 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-20 left-20 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            <div className="max-w-xl w-full text-center space-y-8 relative z-10">
                
                {/* Hình minh họa mới */}
                <div className="-mb-6">
                    <Illustration404 />
                </div>

                {/* Nội dung thông báo */}
                <div className="space-y-3">
                    <h2 className="text-3xl font-bold text-slate-800">Oops! Lạc đường rồi...</h2>
                    <p className="text-slate-600 text-lg max-w-md mx-auto leading-relaxed">
                        Trang bạn đang tìm kiếm dường như đã bị ngắt kết nối hoặc không tồn tại trong hệ thống.
                    </p>
                </div>

                {/* Các nút điều hướng (Sẽ tự động dùng màu primary mới) */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Button 
                        variant="outline" 
                        onClick={() => navigate(-1)}
                        icon={<FiArrowLeft />}
                        className="w-full sm:w-auto border-2"
                        size="lg"
                    >
                        Quay lại trang trước
                    </Button>

                    <Link to="/" className="w-full sm:w-auto">
                        <Button 
                            variant="primary" 
                            icon={<FiHome />}
                            className="w-full shadow-lg shadow-primary-600/30"
                            size="lg"
                        >
                            Về Dashboard
                        </Button>
                    </Link>
                </div>

                <div className="pt-8 border-t border-slate-200/60">
                    <p className="text-sm text-slate-500 font-medium">
                        Mã lỗi: 404_PAGE_NOT_FOUND
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;