

import React, { useState, useEffect } from 'react';
import { 
    FiGrid, FiShoppingCart, FiUsers, FiFileText, FiTrendingDown, FiRepeat, 
    FiBarChart2, FiLogOut, FiBox, FiPercent, FiTruck, FiSettings, FiArchive, 
    FiClipboard, FiInbox, FiChevronDown, FiDollarSign, FiBriefcase, FiMoon, FiSun, FiCheckSquare
} from 'react-icons/fi';
import type { Page } from '../types';
import { useAppContext } from '../context/DataContext';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

interface NavItem {
    key: Page;
    name: string;
    icon: React.ReactElement;
}

interface NavGroup {
    key: string;
    name: string;
    icon: React.ReactElement;
    items: NavItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, onLogout, isOpen, setIsOpen }) => {
    const { theme, setTheme, currentUser } = useAppContext();

    const navStructure: (NavItem | NavGroup)[] = [
        { key: 'Dashboard', name: 'Tổng quan', icon: <FiGrid className="w-5 h-5" /> },
        { key: 'Sales', name: 'Bán hàng', icon: <FiShoppingCart className="w-5 h-5" /> },
        {
            key: 'sales-management',
            name: 'Quản lý Bán hàng',
            icon: <FiFileText className="w-5 h-5" />,
            items: [
                { key: 'Quotes', name: 'Báo giá', icon: <FiClipboard className="w-5 h-5" /> },
                { key: 'Orders', name: 'Đơn hàng', icon: <FiInbox className="w-5 h-5" /> },
                { key: 'Invoices', name: 'Hóa đơn', icon: <FiFileText className="w-5 h-5" /> },
                { key: 'Delivery', name: 'Giao hàng', icon: <FiTruck className="w-5 h-5" /> },
            ]
        },
        {
            key: 'inventory-management',
            name: 'Quản lý Kho',
            icon: <FiArchive className="w-5 h-5" />,
            items: [
                { key: 'Products', name: 'Sản phẩm', icon: <FiBox className="w-5 h-5" /> },
                { key: 'Purchases', name: 'Nhập kho', icon: <FiArchive className="w-5 h-5" /> },
                { key: 'InventoryChecks', name: 'Kiểm kho', icon: <FiCheckSquare className="w-5 h-5" /> },
            ]
        },
        {
            key: 'partners',
            name: 'Đối tác',
            icon: <FiUsers className="w-5 h-5" />,
            items: [
                { key: 'Customers', name: 'Khách hàng', icon: <FiUsers className="w-5 h-5" /> },
                { key: 'Suppliers', name: 'Nhà cung cấp', icon: <FiBriefcase className="w-5 h-5" /> },
            ]
        },
        {
            key: 'finance',
            name: 'Tài chính',
            icon: <FiDollarSign className="w-5 h-5" />,
            items: [
                { key: 'CashFlow', name: 'Sổ quỹ', icon: <FiRepeat className="w-5 h-5" /> },
                { key: 'Debt', name: 'Công nợ', icon: <FiTrendingDown className="w-5 h-5" /> },
                { key: 'Tax', name: 'Thuế', icon: <FiPercent className="w-5 h-5" /> },
            ]
        },
        { key: 'Reports', name: 'Báo cáo', icon: <FiBarChart2 className="w-5 h-5" /> },
    ];

    if (currentUser?.role === 'admin') {
        navStructure.push({
            key: 'system',
            name: 'Hệ thống',
            icon: <FiSettings className="w-5 h-5" />,
            items: [
                { key: 'Users', name: 'Người dùng', icon: <FiUsers className="w-5 h-5" /> },
                { key: 'Settings', name: 'Cài đặt', icon: <FiSettings className="w-5 h-5" /> },
            ]
        });
    } else {
        navStructure.push({ key: 'Settings', name: 'Cài đặt', icon: <FiSettings className="w-5 h-5" /> });
    }


    const getActiveGroup = () => {
        const activeGroup = navStructure.find(
            (group) => 'items' in group && group.items.some((item) => item.key === currentPage)
        );
        return activeGroup ? activeGroup.key : null;
    };

    const [openGroup, setOpenGroup] = useState<string | null>(getActiveGroup());

    useEffect(() => {
        setOpenGroup(getActiveGroup());
    }, [currentPage]);

    const handleGroupClick = (groupKey: string) => {
        setOpenGroup(prev => (prev === groupKey ? null : groupKey));
    };

  return (
    <>
      <div
          className={`fixed inset-0 bg-slate-900 bg-opacity-30 z-30 transition-opacity lg:hidden ${
              isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
      ></div>
      <aside
          className={`fixed inset-y-0 left-0 flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-40 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
              isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          aria-label="Sidebar"
      >
        <div className="flex items-center justify-start h-16 px-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <FiBox className="w-8 h-8 text-primary-600" />
          <span className="ml-3 text-2xl font-bold text-slate-800 dark:text-slate-200 tracking-wider">QLBH</span>
        </div>
        <nav className="flex-1 mt-4 px-3 space-y-1 overflow-y-auto">
          {navStructure.map((group) => {
            if ('items' in group) { // This is a group
                const isGroupActive = group.items.some(item => item.key === currentPage);
                return (
                    <div key={group.key}>
                        <button
                            onClick={() => handleGroupClick(group.key)}
                            className={`flex items-center justify-between w-full px-3 py-2.5 text-slate-600 dark:text-slate-300 transition-colors duration-200 transform rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-100 ${
                                isGroupActive ? 'text-primary-600' : ''
                            }`}
                        >
                            <div className="flex items-center">
                                {group.icon}
                                <span className="mx-3 font-medium">{group.name}</span>
                            </div>
                            <FiChevronDown className={`w-5 h-5 transition-transform ${openGroup === group.key ? 'rotate-180' : ''}`} />
                        </button>
                        {openGroup === group.key && (
                            <div className="mt-1 space-y-1">
                                {group.items.map(item => (
                                    <button
                                        key={item.key}
                                        onClick={() => setCurrentPage(item.key)}
                                        className={`flex items-center w-full pl-11 pr-3 py-2 text-sm text-slate-600 dark:text-slate-300 transition-colors duration-200 transform rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-100 ${
                                            currentPage === item.key ? 'bg-primary-50 dark:bg-slate-700 text-primary-600 dark:text-white font-semibold' : 'font-medium'
                                        }`}
                                    >
                                        {item.icon}
                                        <span className="ml-3">{item.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );
            } else { // This is a single item
                return (
                    <button
                      key={group.key}
                      onClick={() => setCurrentPage(group.key)}
                      className={`flex items-center w-full px-3 py-2.5 text-slate-600 dark:text-slate-300 transition-colors duration-200 transform rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-100 ${
                        currentPage === group.key ? 'bg-primary-50 dark:bg-slate-700 text-primary-600 dark:text-white' : ''
                      }`}
                    >
                      {group.icon}
                      <span className="mx-3 font-medium">{group.name}</span>
                    </button>
                );
            }
          })}
        </nav>
        <div className="px-3 pb-3 flex-shrink-0 space-y-2 mt-4 border-t border-slate-200 dark:border-slate-700 pt-2">
           <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="flex items-center w-full px-3 py-2.5 text-slate-600 dark:text-slate-300 transition-colors duration-200 transform rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {theme === 'light' ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
                <span className="mx-3 font-medium">Giao diện {theme === 'light' ? 'Tối' : 'Sáng'}</span>
            </button>
          <button
            onClick={onLogout}
            className="flex items-center w-full px-3 py-2.5 text-slate-600 dark:text-slate-300 transition-colors duration-200 transform rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <FiLogOut className="w-5 h-5" />
            <span className="mx-3 font-medium">Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;