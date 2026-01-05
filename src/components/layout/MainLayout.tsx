import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import UserDropdown from './UserDropdown';
import ErrorBoundary from '../common/ErrorBoundary';
import { useAppContext } from '../../context/DataContext';
import { FiMenu } from 'react-icons/fi'; // Dùng cho nút Mobile Header nếu cần

const MainLayout: React.FC = () => {
    const { isSidebarOpen, setIsSidebarOpen } = useAppContext();
    const location = useLocation();
    const queryClient = useQueryClient();

    // Auto reload data when navigation changes
    useEffect(() => {
        queryClient.invalidateQueries();
    }, [location.key]);

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar (Fixed position) */}
            <Sidebar />

            {/* Main Content Wrapper */}
            <div 
                className={`
                    flex-1 flex flex-col transition-all duration-300 ease-in-out
                    ${isSidebarOpen ? 'lg:pl-64' : 'lg:pl-20'} 
                    w-full
                `}
            >
                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shadow-sm sticky top-0 z-20">
                    
                    {/* Nút Menu Mobile (Chỉ hiện khi < lg) */}
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
                        >
                            <FiMenu size={24} />
                        </button>
                        
                        {/* Breadcrumb hoặc Title (Tùy chọn) */}
                        <div className="hidden sm:block text-slate-500 text-sm font-medium">
                            Hệ thống quản lý bán hàng
                        </div>
                    </div>

                    {/* User Profile */}
                    <div className="flex items-center gap-4">
                        <UserDropdown />
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-6 overflow-x-hidden overflow-y-auto">
                    <ErrorBoundary resetKey={location.key}>
                        <Outlet />
                    </ErrorBoundary>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;