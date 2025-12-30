import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
    FiHome, FiShoppingCart, FiUsers, FiBox, FiSettings, 
    FiLogOut, FiFileText, FiTruck, FiClipboard, FiTrendingUp, 
    FiDollarSign, FiShoppingBag, FiList, FiCheckSquare, 
    FiBriefcase, FiShield, FiPercent, FiActivity,
    FiChevronLeft, FiChevronRight, FiChevronDown, FiX, FiPieChart
} from 'react-icons/fi';
import { useAppContext } from '../../context/DataContext';

// 1. CẤU HÌNH MENU
interface MenuItem {
    label: string;
    icon?: any;
    path?: string;
    children?: MenuItem[];
}

const MENU_CONFIG: MenuItem[] = [
    { 
        label: 'Dashboard', 
        path: '/', 
        icon: FiHome 
    },
    {
        label: 'Kinh Doanh',
        icon: FiShoppingCart,
        children: [
            { label: 'Bán tại quầy (POS)', path: '/sales', icon: FiShoppingCart },
            { label: 'Đơn đặt hàng', path: '/orders', icon: FiClipboard },
            { label: 'Giao hàng', path: '/deliveries', icon: FiTruck },
            { label: 'Lịch sử hóa đơn', path: '/invoices', icon: FiFileText },
            { label: 'Báo giá', path: '/quotes', icon: FiBriefcase },
        ]
    },
    {
        label: 'Kho Hàng',
        icon: FiBox,
        children: [
            { label: 'Sản phẩm', path: '/products', icon: FiBox },
            { label: 'Nhập hàng', path: '/purchases', icon: FiShoppingBag },
            { label: 'Kiểm kho', path: '/inventory-checks', icon: FiCheckSquare },
            { label: 'Danh mục', path: '/categories', icon: FiList },
        ]
    },
    {
        label: 'Đối Tác',
        icon: FiUsers,
        children: [
            { label: 'Khách hàng', path: '/customers', icon: FiUsers },
            { label: 'Nhà cung cấp', path: '/suppliers', icon: FiBriefcase },
        ]
    },
    {
        label: 'Tài Chính & Thuế', // Đổi tên nhóm cho hợp lý
        icon: FiDollarSign,
        children: [
            { label: 'Sổ quỹ', path: '/cash-flow', icon: FiDollarSign },
            { label: 'Công nợ', path: '/debt', icon: FiFileText },
            { label: 'Thiết lập Thuế', path: '/tax', icon: FiPercent }, // Chuyển từ hệ thống sang
            { label: 'Báo cáo Thuế', path: '/reports', icon: FiPieChart }, // Mục mới
            { label: 'Báo cáo Doanh thu', path: '/reports', icon: FiTrendingUp },
        ]
    }
];

const Sidebar: React.FC = () => {
    const { isSidebarOpen, setIsSidebarOpen, logout, currentUser } = useAppContext();
    const location = useLocation();
    
    const [collapsed, setCollapsed] = useState(false);
    const [activeGroup, setActiveGroup] = useState<string | null>(null);

    // Tự động mở nhóm menu dựa trên URL hiện tại
    useEffect(() => {
        const currentGroup = MENU_CONFIG.find(group => 
            group.children?.some(child => child.path && location.pathname.startsWith(child.path))
        );
        if (currentGroup) {
            setActiveGroup(currentGroup.label);
        } else if (location.pathname === '/') {
            setActiveGroup(null);
        }
    }, [location.pathname]);

    // Đóng sidebar trên mobile khi chuyển trang
    useEffect(() => {
        if (window.innerWidth < 1024 && isSidebarOpen) {
            setIsSidebarOpen(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    const handleGroupClick = (label: string) => {
        if (collapsed) setCollapsed(false);
        setActiveGroup(prev => prev === label ? null : label);
    };

    // Class style cho Link
    const getLinkClass = (isActiveItem: boolean, isChild: boolean = false) => `
        flex items-center w-full px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg mb-1 whitespace-nowrap overflow-hidden
        ${isChild ? 'pl-8' : ''} 
        ${isActiveItem 
            ? 'bg-primary-50 text-primary-700 font-bold' 
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }
    `;

    return (
        <>
            {/* Overlay Mobile */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <aside 
                className={`
                    fixed top-0 left-0 z-50 h-screen bg-white border-r border-slate-200 shadow-2xl lg:shadow-none
                    transition-all duration-300 ease-in-out flex flex-col
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${collapsed ? 'lg:w-20' : 'lg:w-64'}
                    w-64
                `}
            >
                {/* 1. LOGO */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100 flex-shrink-0">
                    <div className={`flex items-center gap-2 transition-all duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                        <div className="bg-primary-600 text-white p-1.5 rounded-lg shadow-sm">
                            <FiShoppingCart className="w-6 h-6" />
                        </div>
                        <span className="text-xl font-bold text-slate-800 tracking-tight whitespace-nowrap">ManagerSALE</span>
                    </div>
                    {/* Logo Mini */}
                    <div className={`absolute left-1/2 -translate-x-1/2 transition-all duration-300 ${collapsed ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>
                        <div className="bg-primary-600 text-white p-2 rounded-lg font-bold">M</div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                {/* 2. MENU LIST */}
                <div className="flex-1 overflow-y-auto custom-scrollbar py-4 px-3 space-y-1">
                    {MENU_CONFIG.map((item, index) => {
                        // MENU CẤP 1 (KHÔNG CÓ CON)
                        if (!item.children) {
                            const isActiveItem = item.path === '/' 
                                ? location.pathname === '/' 
                                : location.pathname.startsWith(item.path || '');
                            
                            return (
                                <NavLink 
                                    key={index} 
                                    to={item.path || '#'} 
                                    className={getLinkClass(isActiveItem)}
                                    title={collapsed ? item.label : ''}
                                >
                                    {item.icon && <item.icon className={`flex-shrink-0 w-5 h-5 ${collapsed ? 'mx-auto' : 'mr-3'}`} />}
                                    <span className={collapsed ? 'hidden' : 'block'}>{item.label}</span>
                                </NavLink>
                            );
                        }

                        // MENU CẤP 1 (CÓ CON - ACCORDION)
                        const isOpen = activeGroup === item.label;
                        const isChildActive = item.children.some(child => location.pathname.startsWith(child.path || ''));

                        return (
                            <div key={index} className="group">
                                <button
                                    onClick={() => handleGroupClick(item.label)}
                                    className={`
                                        flex items-center justify-between w-full px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg mb-1
                                        ${isOpen || isChildActive ? 'text-primary-700 bg-slate-50' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                                    `}
                                    title={collapsed ? item.label : ''}
                                >
                                    <div className="flex items-center">
                                        {item.icon && <item.icon className={`flex-shrink-0 w-5 h-5 ${collapsed ? 'mx-auto' : 'mr-3'} ${isChildActive ? 'text-primary-600' : ''}`} />}
                                        <span className={collapsed ? 'hidden' : 'block'}>{item.label}</span>
                                    </div>
                                    {!collapsed && (
                                        <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                    )}
                                </button>

                                {/* DANH SÁCH MENU CON */}
                                <div 
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen && !collapsed ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    {item.children.map((child, cIndex) => (
                                        <NavLink
                                            key={cIndex}
                                            to={child.path || '#'}
                                            className={({ isActive }) => getLinkClass(isActive, true)}
                                        >
                                            {/* SỬ DỤNG ICON THAY VÌ DẤU CHẤM */}
                                            {child.icon ? (
                                                <child.icon className="w-4 h-4 mr-3 opacity-70" />
                                            ) : (
                                                <span className="w-4 h-4 mr-3" /> // Placeholder nếu không có icon
                                            )}
                                            {child.label}
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {/* MENU HỆ THỐNG RIÊNG (ADMIN ONLY) */}
                    {currentUser?.role === 'owner' && (
                        <>
                            <div className={`mt-6 mb-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider ${collapsed ? 'hidden' : 'block'}`}>
                                Hệ Thống
                            </div>
                            
                            <NavLink to="/users" className={getLinkClass(location.pathname.startsWith('/users'))} title="Nhân viên">
                                <FiShield className={`flex-shrink-0 w-5 h-5 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
                                <span className={collapsed ? 'hidden' : 'block'}>Nhân viên</span>
                            </NavLink>
                            <NavLink to="/settings" className={getLinkClass(location.pathname.startsWith('/settings'))} title="Cấu hình">
                                <FiSettings className={`flex-shrink-0 w-5 h-5 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
                                <span className={collapsed ? 'hidden' : 'block'}>Cấu hình</span>
                            </NavLink>
                        </>
                    )}
                </div>

                {/* 3. FOOTER */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
                    <button 
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden lg:flex items-center justify-center w-full px-4 py-2 text-sm text-slate-500 hover:bg-white hover:text-primary-600 hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-slate-200 mb-2"
                    >
                        {collapsed ? <FiChevronRight className="w-5 h-5" /> : (
                            <>
                                <FiChevronLeft className="w-5 h-5 mr-2" />
                                <span className="font-medium">Thu gọn</span>
                            </>
                        )}
                    </button>

                    <button 
                        onClick={logout}
                        className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-100 hover:bg-red-50 transition-colors rounded-lg group"
                        title="Đăng xuất"
                    >
                        <FiLogOut className={`w-5 h-5 ${collapsed ? '' : 'mr-2'} group-hover:-translate-x-1 transition-transform`} />
                        <span className={collapsed ? 'hidden' : 'block'}>Đăng xuất</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;