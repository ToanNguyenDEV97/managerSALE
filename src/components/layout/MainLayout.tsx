import React from 'react';
import Sidebar from './Sidebar'; // Đảm bảo bạn đã move file Sidebar vào folder layout
import { useAppContext } from '../../context/DataContext';
import { Outlet } from 'react-router-dom';

const MainLayout: React.FC = () => {
    const { isSidebarOpen } = useAppContext();
    
    return (
        <div className="flex min-h-screen bg-slate-50 transition-colors duration-300">
            {/* Sidebar điều hướng */}
            <Sidebar />
            
            {/* Vùng nội dung chính */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
                <main className="flex-1 p-6 overflow-x-hidden min-h-screen">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;