import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginResponse } from '../types';
import { api } from '../utils/api';

// 1. Định nghĩa kiểu dữ liệu cho Công ty
export interface CompanyInfo {
    name: string;
    address: string;
    phone: string;
    email?: string;
    website?: string;
    taxCode?: string;
    bankAccount?: string;
    bankName?: string;
    bankOwner?: string;
    logoUrl?: string;
}

interface DataContextType {
    // Auth
    currentUser: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (email: string, pass: string, remember: boolean) => Promise<void>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => Promise<void>;

    // UI
    isSidebarOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;

    // Organization (MỚI THÊM)
    companyInfo: CompanyInfo | null;
    refreshCompanyInfo: () => Promise<void>;
}

const DataContext = createContext<DataContextType>({} as DataContextType);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Auth State
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token') || sessionStorage.getItem('token');
        }
        return null;
    });

    // UI State
    const [isSidebarOpen, setIsOpen] = useState(true);

    // Company State (MỚI THÊM)
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

    // --- Hàm lấy thông tin công ty ---
    const refreshCompanyInfo = async () => {
        try {
            // Gọi API lấy thông tin tổ chức (Backend đã có route này qua SettingsPage)
            const data = await api('/api/organization');
            setCompanyInfo(data);
        } catch (error) {
            console.error("Lỗi tải thông tin cửa hàng:", error);
            // Có thể set giá trị mặc định nếu muốn
        }
    };

    // --- useEffect: Load User & Company khi có Token ---
    useEffect(() => {
        if (token) {
            // 1. Lấy User
            api('/api/auth/me')
                .then((user) => setCurrentUser(user))
                .catch(() => logout());

            // 2. Lấy thông tin Cửa hàng (MỚI THÊM)
            refreshCompanyInfo();
        }
    }, [token]);

    const login = async (email: string, pass: string, remember: boolean) => {
        const data: LoginResponse = await api('/api/auth/login', { 
            method: 'POST', 
            body: JSON.stringify({ email, password: pass }) 
        });
        setToken(data.token);
        setCurrentUser(data.user);
        
        if (remember) {
            localStorage.setItem('token', data.token);
            sessionStorage.removeItem('token');
        } else {
            sessionStorage.setItem('token', data.token);
            localStorage.removeItem('token');
        }
    };

    const logout = () => {
        setToken(null);
        setCurrentUser(null);
        setCompanyInfo(null); // Clear thông tin shop khi logout
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        window.location.href = '/login'; 
    };

    const updateProfile = async (data: Partial<User>) => {
        await api('/api/auth/profile', { method: 'PUT', body: JSON.stringify(data) });
        setCurrentUser((prev) => prev ? { ...prev, ...data } : null);
    };

    return (
        <DataContext.Provider value={{
            currentUser,
            token,
            isAuthenticated: !!token,
            login,
            logout,
            updateProfile,
            isSidebarOpen,
            setIsOpen,
            companyInfo,       // Export state
            refreshCompanyInfo // Export hàm refresh
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useAppContext = () => useContext(DataContext);