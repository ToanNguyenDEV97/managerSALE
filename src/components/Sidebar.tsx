import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/DataContext';
import { 
    FiHome, FiBox, FiShoppingCart, FiFileText, FiClipboard, 
    FiUsers, FiTruck, FiPieChart, FiSettings, FiLogOut,
    FiChevronLeft, FiChevronRight, FiGrid, FiLayers, FiDatabase, FiActivity,
    FiChevronDown, FiDollarSign
} from 'react-icons/fi';
import { ROLES } from '../utils/constants';

const Sidebar = () => {
    const { isSidebarOpen, setIsOpen, logout, currentUser } = useAppContext();
    const location = useLocation();

    // State quản lý menu nào đang mở (Chỉ lưu 1 chuỗi string thay vì mảng)
    const [openMenu, setOpenMenu] = useState<string | null>('sales'); 

    // Tự động mở nhóm chứa trang hiện tại
    useEffect(() => {
        const path = location.pathname;
        if (['/sales', '/orders', '/invoices', '/quotes'].some(p => path.startsWith(p))) {
            setOpenMenu('sales');
        }
        else if (['/products', '/purchases', '/inventory-checks'].some(p => path.startsWith(p))) {
            setOpenMenu('stock');
        }
        else if (['/customers', '/suppliers'].some(p => path.startsWith(p))) {
            setOpenMenu('partners');
        }
        else if (['/cash-flow', '/reports'].some(p => path.startsWith(p))) {
            setOpenMenu('finance');
        }
        else if (['/users', '/settings'].some(p => path.startsWith(p))) {
            setOpenMenu('admin');
        }
    }, [location.pathname]);

    // Hàm toggle: Nếu bấm vào cái đang mở -> đóng lại. Nếu bấm cái khác -> mở cái đó (cái cũ tự mất)
    const toggleMenu = (key: string) => {
        setOpenMenu(prev => (prev === key ? null : key));
    };

    // Component Mục con (Đã bỏ dấu chấm)
    const SubItem = ({ to, label, icon: Icon }: { to: string, label: string, icon: any }) => (
        <NavLink
            to={to}
            className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 pl-10 rounded-lg transition-all duration-200 text-sm
                ${isActive 
                    ? 'text-primary-600 font-bold bg-primary-50 dark:bg-primary-900/10' 
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }
            `}
        >
            {/* Đã bỏ div dấu chấm ở đây */}
            <span className="truncate">{label}</span>
        </NavLink>
    );

    // Component Mục cha
    const MenuItem = ({ id, label, icon: Icon, children }: { id: string, label: string, icon: any, children: React.ReactNode }) => {
        const isOpen = openMenu === id; // Kiểm tra xem menu này có phải là menu đang mở không
        const isActiveGroup = React.Children.toArray(children).some((child: any) => 
            child.props.to && location.pathname.startsWith(child.props.to)
        );

        return (
            <div className="mb-1">
                <button
                    onClick={() => {
                        if (!isSidebarOpen) setIsOpen(true);
                        toggleMenu(id);
                    }}
                    className={`
                        w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-200 group
                        ${isActiveGroup 
                            ? 'bg-white text-primary-700 shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-primary-400' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }
                    `}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <Icon size={22} className={`flex-shrink-0 transition-colors ${isActiveGroup ? 'text-primary-600' : 'group-hover:text-slate-800'}`} />
                        <span className={`font-medium whitespace-nowrap transition-all duration-300 ${!isSidebarOpen && 'opacity-0 w-0'}`}>
                            {label}
                        </span>
                    </div>
                    {isSidebarOpen && (
                        <div className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                            <FiChevronDown size={16} />
                        </div>
                    )}
                </button>

                <div className={`
                    overflow-hidden transition-all duration-300 ease-in-out
                    ${isOpen && isSidebarOpen ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}
                `}>
                    <div className="flex flex-col gap-0.5 mb-2">
                        {children}
                    </div>
                </div>
            </div>
        );
    };

    const SingleLink = ({ to, label, icon: Icon }: { to: string, label: string, icon: any }) => (
        <NavLink
            to={to}
            className={({ isActive }) => `
                flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 mb-1
                ${isActive 
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-200' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }
            `}
        >
            <Icon size={22} className="flex-shrink-0" />
            <span className={`font-medium whitespace-nowrap transition-all duration-300 ${!isSidebarOpen && 'opacity-0 w-0'}`}>
                {label}
            </span>
        </NavLink>
    );

    // Xử lý hiển thị tên (Lấy phần trước @gmail.com)
    const displayName = currentUser?.email ? currentUser.email.split('@')[0] : 'User';

    return (
        <div className={`fixed inset-y-0 left-0 z-40 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
            
            {/* Header */}
            <div className="h-16 flex items-center justify-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    M
                </div>
                {isSidebarOpen && <span className="ml-3 font-bold text-lg text-slate-800 dark:text-white">ManagerSALE</span>}
            </div>

            <button 
                onClick={() => setIsOpen(!isSidebarOpen)}
                className="absolute -right-3 top-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary-600 rounded-full p-1 shadow-md z-50 transition-colors"
            >
                {isSidebarOpen ? <FiChevronLeft size={14} /> : <FiChevronRight size={14} />}
            </button>

            {/* Menu List */}
            <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
                
                <SingleLink to="/" icon={FiHome} label="Tổng quan" />

                <div className="my-2 border-t border-slate-200 dark:border-slate-800 mx-2"></div>

                <MenuItem id="sales" label="Kinh doanh" icon={FiShoppingCart}>
                    <SubItem to="/sales" label="Bán hàng (POS)" icon={FiShoppingCart} />
                    <SubItem to="/orders" label="Đơn hàng" icon={FiClipboard} />
                    <SubItem to="/invoices" label="Hóa đơn" icon={FiFileText} />
                    <SubItem to="/quotes" label="Báo giá" icon={FiActivity} />
                </MenuItem>

                <MenuItem id="stock" label="Kho vận" icon={FiBox}>
                    <SubItem to="/products" label="Sản phẩm" icon={FiBox} />
                    <SubItem to="/purchases" label="Nhập hàng" icon={FiTruck} />
                    <SubItem to="/inventory-checks" label="Kiểm kho" icon={FiGrid} />
                </MenuItem>

                <MenuItem id="partners" label="Đối tác" icon={FiUsers}>
                    <SubItem to="/customers" label="Khách hàng" icon={FiUsers} />
                    <SubItem to="/suppliers" label="Nhà cung cấp" icon={FiLayers} />
                </MenuItem>

                <MenuItem id="finance" label="Tài chính" icon={FiPieChart}>
                    <SubItem to="/cash-flow" label="Sổ quỹ" icon={FiDollarSign} />
                    <SubItem to="/reports" label="Báo cáo" icon={FiDatabase} />
                </MenuItem>

                {currentUser?.role === ROLES.OWNER && (
                    <MenuItem id="admin" label="Hệ thống" icon={FiSettings}>
                        <SubItem to="/users" label="Nhân viên" icon={FiUsers} />
                        <SubItem to="/settings" label="Cấu hình" icon={FiSettings} />
                    </MenuItem>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className={`flex items-center gap-3 transition-all duration-300 ${!isSidebarOpen && 'justify-center'}`}>
                    <div className="w-9 h-9 rounded-full bg-primary-50 dark:bg-slate-700 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm">
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                    {isSidebarOpen && (
                        <div className="flex-1 min-w-0">
                            {/* Hiển thị Tên người dùng (Lấy từ email) */}
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate capitalize">
                                {displayName}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                                {currentUser?.role === ROLES.OWNER ? 'Administrator' : 'Nhân viên'}
                            </p>
                        </div>
                    )}
                    {isSidebarOpen && (
                        <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors" title="Đăng xuất">
                            <FiLogOut size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;