import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/DataContext';
import { 
    FiHome, FiShoppingCart, FiBox, FiUsers, FiSettings, 
    FiLogOut, FiChevronDown, FiChevronRight, FiFileText, 
    FiDollarSign, FiPieChart, FiMenu, FiX, FiActivity
} from 'react-icons/fi';

// MENU CONFIG
const MENU_ITEMS = [
    { type: 'link', path: '/', label: 'Tổng quan', icon: <FiHome /> },
    { type: 'link', path: '/sales', label: 'Bán hàng (POS)', icon: <FiShoppingCart /> },
    {
        type: 'group', label: 'Giao dịch', icon: <FiFileText />, key: 'transactions',
        children: [
            { path: '/orders', label: 'Đơn hàng' },
            { path: '/invoices', label: 'Hóa đơn' },
            { path: '/deliveries', label: 'Vận chuyển' },
            { path: '/quotes', label: 'Báo giá' },
        ]
    },
    {
        type: 'group', label: 'Kho hàng', icon: <FiBox />, key: 'inventory',
        children: [
            { path: '/products', label: 'Sản phẩm' },
            { path: '/categories', label: 'Danh mục' },
            { path: '/purchases', label: 'Nhập hàng' },
            { path: '/inventory-checks', label: 'Kiểm kho' },
        ]
    },
    {
        type: 'group', label: 'Tài chính', icon: <FiDollarSign />, key: 'finance',
        children: [
            { path: '/cash-flow', label: 'Sổ quỹ' },
            { path: '/taxes', label: 'Thuế & VAT' },
        ]
    },
    {
        type: 'group', label: 'Đối tác', icon: <FiUsers />, key: 'partners',
        children: [
            { path: '/customers', label: 'Khách hàng' },
            { path: '/suppliers', label: 'Nhà cung cấp' },
        ]
    },
    {
        type: 'group', label: 'Hệ thống', icon: <FiSettings />, key: 'system',
        children: [
            { path: '/reports', label: 'Báo cáo', icon: <FiPieChart /> },
            { path: '/users', label: 'Nhân viên' },
            { path: '/settings', label: 'Cấu hình' },
        ]
    }
];

const Sidebar: React.FC = () => {
    const { isSidebarOpen, setIsSidebarOpen, logout } = useAppContext();
    const location = useLocation();
    const [expandedMenus, setExpandedMenus] = useState<string[]>(['transactions']);

    const isActive = (path: string) => location.pathname === path;
    
    const toggleSubMenu = (key: string) => {
        if (!isSidebarOpen) setIsSidebarOpen(true);
        setExpandedMenus(prev => prev.includes(key) ? [] : [key]);
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div 
                className={`fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-300 ${
                    isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Main Sidebar */}
            <aside 
                className={`
                    fixed top-0 left-0 z-40 h-screen bg-white border-r border-slate-200 
                    transition-all duration-300 ease-in-out flex flex-col shadow-lg
                    ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20'}
                `}
            >
                {/* 1. Header Sidebar - Đã chỉnh sửa CSS căn chỉnh */}
                <div className={`h-16 flex items-center px-4 border-b border-slate-100 shrink-0 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
                    
                    {/* Logo Text (Chỉ hiện khi mở) */}
                    {isSidebarOpen && (
                        <div className="font-bold text-xl text-blue-600 flex items-center gap-2 tracking-tight animate-fade-in">
                            <FiActivity size={24}/> Manager
                        </div>
                    )}

                    {/* Toggle Button */}
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`
                            p-2 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all
                            ${!isSidebarOpen && 'bg-slate-50 text-blue-600'} // Highlight khi thu nhỏ
                        `}
                        title={isSidebarOpen ? "Thu gọn" : "Mở rộng"}
                    >
                        {/* Mobile: X / Desktop: Menu */}
                        <span className="lg:hidden">{isSidebarOpen ? <FiX size={22}/> : <FiMenu size={22}/>}</span>
                        <span className="hidden lg:block">
                            {isSidebarOpen ? <FiMenu size={22}/> : <FiMenu size={24}/>}
                        </span>
                    </button>
                </div>

                {/* 2. Menu List */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                    {MENU_ITEMS.map((item: any, index) => {
                        // --- SINGLE LINK ---
                        if (item.type === 'link') {
                            return (
                                <Link
                                    key={index}
                                    to={item.path}
                                    onClick={() => setExpandedMenus([])}
                                    className={`
                                        flex items-center px-3 py-3 rounded-xl transition-all font-medium group relative
                                        ${isActive(item.path) ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                                        ${!isSidebarOpen && 'justify-center'} 
                                    `}
                                >
                                    <span className="text-xl shrink-0 transition-transform group-hover:scale-110">{item.icon}</span>
                                    
                                    {isSidebarOpen && (
                                        <span className="ml-3 truncate animate-fade-in">{item.label}</span>
                                    )}

                                    {/* Tooltip khi thu gọn */}
                                    {!isSidebarOpen && (
                                        <div className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-md">
                                            {item.label}
                                            {/* Mũi tên tooltip */}
                                            <div className="absolute top-1/2 -left-1 -mt-1 border-4 border-transparent border-r-slate-800"></div>
                                        </div>
                                    )}
                                </Link>
                            );
                        }

                        // --- GROUP MENU ---
                        const isExpanded = expandedMenus.includes(item.key);
                        const hasActiveChild = item.children.some((child: any) => isActive(child.path));

                        return (
                            <div key={index} className="space-y-1 group relative">
                                <button
                                    onClick={() => toggleSubMenu(item.key)}
                                    className={`
                                        w-full flex items-center px-3 py-3 rounded-xl transition-all font-medium
                                        ${hasActiveChild ? 'bg-slate-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}
                                        ${isSidebarOpen ? 'justify-between' : 'justify-center'}
                                    `}
                                >
                                    <div className="flex items-center overflow-hidden">
                                        <span className={`text-xl shrink-0 transition-transform group-hover:scale-110 ${hasActiveChild ? 'text-blue-600' : ''}`}>{item.icon}</span>
                                        {isSidebarOpen && <span className="ml-3 truncate animate-fade-in">{item.label}</span>}
                                    </div>
                                    {isSidebarOpen && (
                                        <span className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                            <FiChevronDown />
                                        </span>
                                    )}
                                </button>

                                {/* Tooltip Group */}
                                {!isSidebarOpen && (
                                    <div className="absolute left-full top-2 ml-3 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-md">
                                        {item.label}
                                        <div className="absolute top-1/2 -left-1 -mt-1 border-4 border-transparent border-r-slate-800"></div>
                                    </div>
                                )}

                                {/* Sub-menu Items */}
                                {isSidebarOpen && isExpanded && (
                                    <div className="pl-10 space-y-1 animate-slide-down overflow-hidden">
                                        {item.children.map((child: any, childIdx: number) => (
                                            <Link
                                                key={childIdx}
                                                to={child.path}
                                                className={`
                                                    block px-3 py-2 rounded-lg text-sm transition-colors border-l-2
                                                    ${isActive(child.path)
                                                    ? 'text-blue-600 font-semibold bg-blue-50/50 border-blue-600'
                                                    : 'text-slate-500 hover:text-slate-800 border-transparent hover:border-slate-300'}
                                                `}
                                            >
                                                {child.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* 3. Footer */}
                <div className="p-3 border-t border-slate-100 shrink-0">
                    <button
                        onClick={logout}
                        className={`
                            w-full flex items-center px-3 py-2 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors
                            ${!isSidebarOpen && 'justify-center'}
                        `}
                        title="Đăng xuất"
                    >
                        <FiLogOut className="text-xl shrink-0" />
                        {isSidebarOpen && <span className="ml-3 font-medium">Đăng xuất</span>}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;