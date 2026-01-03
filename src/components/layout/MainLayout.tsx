import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAppContext } from '../../context/DataContext';
import { FiMenu } from 'react-icons/fi';

const MainLayout: React.FC = () => {
    const { isSidebarOpen, setIsSidebarOpen } = useAppContext();

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Wrapper */}
            <div 
                className={`
                    transition-all duration-300 ease-in-out min-h-screen flex flex-col
                    ${isSidebarOpen ? 'lg:pl-64' : 'lg:pl-20'}
                `}
            >
                {/* Header Mobile (Chỉ hiện trên màn hình nhỏ) */}
                <header className="bg-white shadow-sm h-16 flex items-center px-4 lg:hidden sticky top-0 z-20">
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
                    >
                        <FiMenu size={24} />
                    </button>
                    <span className="ml-4 font-semibold text-gray-800">ManagerSALE</span>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
                    {/* Nút Toggle Sidebar trên Desktop (Tùy chọn, có thể để ở Header nếu bạn làm Header riêng) */}
                    <div className="hidden lg:flex items-center justify-between mb-6">
                         <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 -ml-2 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
                            title={isSidebarOpen ? "Thu gọn menu" : "Mở rộng menu"}
                        >
                            <FiMenu size={20} />
                        </button>
                        
                        {/* Khu vực User Info hoặc Breadcrumb có thể để ở đây */}
                        <div className="text-sm text-gray-500">
                             Hệ thống quản lý bán hàng
                        </div>
                    </div>

                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;