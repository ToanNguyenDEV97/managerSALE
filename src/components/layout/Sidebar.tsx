import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/DataContext';
import { 
    FiHome, FiShoppingCart, FiBox, FiUsers, FiSettings, 
    FiLogOut, FiChevronDown, FiChevronRight, FiFileText, 
    FiTruck, FiPieChart, FiDollarSign, FiPercent
} from 'react-icons/fi';

// Định nghĩa cấu trúc Menu
const MENU_ITEMS = [
    { 
        type: 'link', 
        path: '/', 
        label: 'Tổng quan', 
        icon: <FiHome /> 
    },
    { 
        type: 'link', 
        path: '/sales', 
        label: 'Bán hàng (POS)', 
        icon: <FiShoppingCart /> 
    },
    {
        type: 'group',
        label: 'Giao dịch',
        icon: <FiFileText />,
        key: 'transactions',
        children: [
            { path: '/orders', label: 'Đơn đặt hàng' },
            { path: '/invoices', label: 'Hóa đơn' },
            { path: '/deliveries', label: 'Vận chuyển' },
            { path: '/quotes', label: 'Báo giá' },
        ]
    },
    {
        type: 'group',
        label: 'Kho hàng',
        icon: <FiBox />,
        key: 'inventory',
        children: [
            { path: '/products', label: 'Sản phẩm' },
            { path: '/categories', label: 'Danh mục' },
            { path: '/purchases', label: 'Nhập hàng' },
            { path: '/inventory-checks', label: 'Kiểm kho' },
        ]
    },
    {
        type: 'group',
        label: 'Tài chính & Kế toán', // [MỚI] Tách nhóm này ra riêng
        icon: <FiDollarSign />,
        key: 'finance',
        children: [
            { path: '/cash-flow', label: 'Sổ quỹ' },
            { path: '/taxes', label: 'Thuế & VAT' }, // Đảm bảo bạn đã có Route cho /taxes trong App.tsx
            // { path: '/debt', label: 'Công nợ' }, // Có thể thêm nếu cần
        ]
    },
    {
        type: 'group',
        label: 'Đối tác', // [SỬA] Chỉ còn Khách hàng & NCC
        icon: <FiUsers />,
        key: 'partners',
        children: [
            { path: '/customers', label: 'Khách hàng' },
            { path: '/suppliers', label: 'Nhà cung cấp' },
        ]
    },
    {
        type: 'group',
        label: 'Hệ thống',
        icon: <FiSettings />,
        key: 'system',
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
    
    // State lưu các nhóm đang mở
    const [expandedMenus, setExpandedMenus] = useState<string[]>(['transactions']); 

    // Hàm kiểm tra link active
    const isActive = (path: string) => location.pathname === path;
    
    // Hàm toggle nhóm menu (Đã sửa logic Accordion)
    const toggleSubMenu = (key: string) => {
        if (!isSidebarOpen) setIsSidebarOpen(true);
        
        // [LOGIC MỚI] Nếu bấm vào cái đang mở -> đóng lại ([]). 
        // Nếu bấm cái mới -> đóng hết cái cũ và mở cái mới ([key]).
        setExpandedMenus(prev => 
            prev.includes(key) ? [] : [key]
        );
    };

    return (
        <>
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
            )}

            <aside className={`fixed top-0 left-0 z-30 h-screen bg-white border-r border-slate-200 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
                
                {/* Logo */}
                <div className="h-16 flex items-center justify-center border-b border-slate-100 shrink-0">
                    <div className="font-bold text-2xl text-blue-600 tracking-tighter">
                        {isSidebarOpen ? 'ManagerSALE' : 'MS'}
                    </div>
                </div>

                {/* Menu List */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                    {MENU_ITEMS.map((item: any, index) => {
                        // ITEM ĐƠN LẺ
                        if (item.type === 'link') {
                            return (
                                <Link
                                    key={index}
                                    to={item.path}
                                    onClick={() => setExpandedMenus([])} // Bấm vào link đơn thì đóng các accordion
                                    className={`flex items-center px-3 py-3 rounded-xl transition-all font-medium ${
                                        isActive(item.path) 
                                        ? 'bg-blue-50 text-blue-600' 
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                                    title={!isSidebarOpen ? item.label : ''}
                                >
                                    <span className="text-xl shrink-0">{item.icon}</span>
                                    {isSidebarOpen && <span className="ml-3 truncate">{item.label}</span>}
                                </Link>
                            );
                        }

                        // NHÓM MENU (GROUP)
                        const isExpanded = expandedMenus.includes(item.key);
                        const hasActiveChild = item.children.some((child: any) => isActive(child.path));

                        return (
                            <div key={index} className="space-y-1">
                                <button
                                    onClick={() => toggleSubMenu(item.key)}
                                    className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all font-medium ${
                                        hasActiveChild ? 'bg-slate-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                    title={!isSidebarOpen ? item.label : ''}
                                >
                                    <div className="flex items-center overflow-hidden">
                                        <span className={`text-xl shrink-0 ${hasActiveChild ? 'text-blue-600' : ''}`}>{item.icon}</span>
                                        {isSidebarOpen && <span className="ml-3 truncate">{item.label}</span>}
                                    </div>
                                    {isSidebarOpen && (
                                        <span className="text-slate-400">
                                            {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                                        </span>
                                    )}
                                </button>

                                {/* Sub-menu Items */}
                                {isSidebarOpen && isExpanded && (
                                    <div className="pl-10 space-y-1 animate-slide-down">
                                        {item.children.map((child: any, childIdx: number) => (
                                            <Link
                                                key={childIdx}
                                                to={child.path}
                                                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                                                    isActive(child.path)
                                                    ? 'text-blue-600 font-semibold bg-blue-50/50'
                                                    : 'text-slate-500 hover:text-slate-800'
                                                }`}
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

                {/* Footer */}
                <div className="p-3 border-t border-slate-100 shrink-0">
                    <button
                        onClick={logout}
                        className={`w-full flex items-center px-3 py-2 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors ${!isSidebarOpen && 'justify-center'}`}
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