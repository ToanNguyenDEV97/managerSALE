import React, { useState, useRef, useEffect } from 'react';
import { FiUser, FiLogOut, FiChevronDown } from 'react-icons/fi';
import { useAppContext } from '../../context/DataContext';

const UserDropdown: React.FC = () => {
    const { currentUser, logout, setIsProfileModalOpen } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    if (!currentUser) return null;

    return (
        <div className="relative" ref={wrapperRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 p-1 rounded-full">
                <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold text-sm">
                    {currentUser.email.charAt(0).toUpperCase()}
                </div>
                <span className="hidden lg:inline text-sm font-medium text-slate-700 dark:text-slate-300">{currentUser.email}</span>
                <FiChevronDown className="hidden lg:inline w-4 h-4 text-slate-500" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-700 rounded-md shadow-lg border border-slate-200 dark:border-slate-600 z-20">
                    <div className="py-1">
                        <div className="px-4 py-2 text-xs text-slate-400 border-b dark:border-slate-600">
                            Vai trò: <span className="font-semibold text-slate-600 dark:text-slate-300">{currentUser.role}</span>
                        </div>
                        <button 
                            onClick={() => { setIsProfileModalOpen(true); setIsOpen(false); }} 
                            className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"
                        >
                            <FiUser className="mr-2"/> Tài khoản
                        </button>
                        <button 
                            onClick={() => { logout(); setIsOpen(false); }} 
                            className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-600"
                        >
                            <FiLogOut className="mr-2"/> Đăng xuất
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDropdown;
