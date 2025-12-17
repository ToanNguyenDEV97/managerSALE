import React, { useState, useEffect } from 'react';
import { 
    FiGrid, FiShoppingCart, FiUsers, FiFileText, FiTrendingDown, 
    FiBarChart2, FiLogOut, FiBox, FiTruck, FiSettings, 
    FiClipboard, FiCheckSquare, FiMoon, FiSun, FiPieChart, FiUser,
    FiChevronDown, FiChevronRight, FiBriefcase, FiDatabase, FiActivity
} from 'react-icons/fi';
import type { PageKey } from '../types';
import { useAppContext } from '../context/DataContext';

interface SidebarProps {
  currentPage: PageKey;
  setCurrentPage: (page: PageKey) => void;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, onLogout, isOpen, setIsOpen }) => {
    const { theme, setTheme, currentUser } = useAppContext();

    // CẤU TRÚC MENU
    const mainItems = [
        { key: 'Dashboard', label: 'Tổng quan', icon: <FiGrid /> },
        { key: 'Sales', label: 'Bán hàng (POS)', icon: <FiShoppingCart /> },
    ];

    const menuGroups = [
        {
            title: 'Kinh doanh',
            items: [
                { key: 'Invoices', label: 'Hóa đơn', icon: <FiFileText /> },
                { key: 'Orders', label: 'Đơn hàng', icon: <FiClipboard /> },
                { key: 'Quotes', label: 'Báo giá', icon: <FiFileText /> },
                { key: 'Deliveries', label: 'Giao vận', icon: <FiTruck /> },
            ]
        },
        {
            title: 'Kho & Hàng',
            items: [
                { key: 'Products', label: 'Sản phẩm', icon: <FiBox /> },
                { key: 'Purchases', label: 'Nhập hàng', icon: <FiTrendingDown /> },
                { key: 'InventoryChecks', label: 'Kiểm kho', icon: <FiCheckSquare /> },
            ]
        },
        {
            title: 'Đối tác',
            items: [
                { key: 'Customers', label: 'Khách hàng', icon: <FiUsers /> },
                { key: 'Suppliers', label: 'Nhà cung cấp', icon: <FiUser /> },
            ]
        },
        {
            title: 'Tài chính',
            items: [
                { key: 'CashFlow', label: 'Sổ quỹ', icon: <FiPieChart /> },
                { key: 'Reports', label: 'Báo cáo', icon: <FiBarChart2 /> },
                { key: 'Tax', label: 'Thuế', icon: <FiActivity /> },
            ]
        },
        {
            title: 'Hệ thống',
            items: [
                { key: 'Users', label: 'Nhân viên', icon: <FiUsers /> },
                { key: 'Settings', label: 'Cài đặt', icon: <FiSettings /> },
            ]
        }
    ];

    const [activeGroup, setActiveGroup] = useState<string | null>(null);

    useEffect(() => {
        const foundGroup = menuGroups.find(group => 
            group.items.some(item => item.key === currentPage)
        );
        if (foundGroup) {
            setActiveGroup(foundGroup.title);
        } else {
            setActiveGroup(null);
        }
    }, [currentPage]);

    const handleGroupClick = (title: string) => {
        setActiveGroup(prev => prev === title ? null : title);
    };

    const canView = (key: string) => {
        if (currentUser?.role === 'nhanvien') {
            if (key === 'Settings' || key === 'Users' || key === 'Tax') return false;
        }
        return true;
    };

    return (
        <>
            {/* Overlay Mobile */}
            {isOpen && (
                <div 
                    className="fixed inset-0 z-20 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
                    onClick={() => setIsOpen(false)}
                ></div>
            )}

            {/* Sidebar Container */}
            <div className={`
                fixed lg:static inset-y-0 left-0 z-30
                w-68 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
                transform transition-transform duration-300 ease-in-out flex flex-col h-full shadow-xl lg:shadow-none
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* 1. Header Logo */}
                <div className="h-20 flex items-center px-6 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-primary-500/30">
                            Q
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">Quản Lý BH</h1>
                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Enterprise</p>
                        </div>
                    </div>
                </div>

                {/* 2. Menu Content */}
                <nav className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar space-y-6">
                    
                    {/* Main Section */}
                    <div className="space-y-1">
                        {mainItems.map(item => {
                            const isActive = currentPage === item.key;
                            return (
                                <button
                                    key={item.key}
                                    onClick={() => {
                                        setCurrentPage(item.key as PageKey);
                                        if (window.innerWidth < 1024) setIsOpen(false);
                                    }}
                                    className={`
                                        group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                                        ${isActive 
                                            ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' 
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                                        }
                                    `}
                                >
                                    <span className={`text-lg transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Groups Section */}
                    {menuGroups.map((group, idx) => {
                        const hasVisibleItems = group.items.some(item => canView(item.key));
                        if (!hasVisibleItems) return null;
                        const isOpen = activeGroup === group.title;

                        return (
                            <div key={idx}>
                                <div 
                                    onClick={() => handleGroupClick(group.title)}
                                    className="flex items-center justify-between px-2 mb-2 cursor-pointer group"
                                >
                                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                                        {group.title}
                                    </h3>
                                    <span className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                                        <FiChevronDown className="w-4 h-4" />
                                    </span>
                                </div>

                                <div className={`space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-50'}`}>
                                    {group.items.map((item) => {
                                        if (!canView(item.key)) return null;
                                        const isActive = currentPage === item.key;
                                        
                                        return (
                                            <button
                                                key={item.key}
                                                onClick={() => {
                                                    setCurrentPage(item.key as PageKey);
                                                    if (window.innerWidth < 1024) setIsOpen(false);
                                                }}
                                                className={`
                                                    w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ml-1 border-l-2
                                                    ${isActive 
                                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300' 
                                                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                    }
                                                `}
                                            >
                                                <span className={`text-lg ${isActive ? '' : 'opacity-70'}`}>{item.icon}</span>
                                                {item.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* 3. User Profile Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="flex items-center justify-between mb-4 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-200">
                                {currentUser?.email?.charAt(0).toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate w-24">
                                    {currentUser?.email?.split('@')[0]}
                                </p>
                                <p className="text-[10px] text-slate-500 uppercase">{currentUser?.role}</p>
                            </div>
                        </div>
                        <button 
                            onClick={onLogout}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors" 
                            title="Đăng xuất"
                        >
                            <FiLogOut className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        {theme === 'light' ? <FiMoon /> : <FiSun />}
                        {theme === 'light' ? 'Chế độ Tối' : 'Chế độ Sáng'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;