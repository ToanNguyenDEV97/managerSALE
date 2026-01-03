import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react'; // <-- Đã thêm useCallback, useMemo
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

    // Organization
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

    // Company State
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

    // Hàm refresh thông tin công ty
    const refreshCompanyInfo = async () => {
        try {
            const data = await api('/api/organization');
            setCompanyInfo(data);
        } catch (error) {
            console.error("Lỗi tải thông tin cửa hàng:", error);
        }
    };

    // --- TỐI ƯU HÓA: Dùng useCallback để tránh tạo lại hàm login liên tục ---
    const login = useCallback(async (email: string, pass: string, remember: boolean) => {
        const data: LoginResponse = await api('/api/auth/login', { 
            method: 'POST', 
            body: JSON.stringify({ email, password: pass }) 
        });

        // 1. Lưu token vào Storage TRƯỚC
        if (remember) {
            localStorage.setItem('token', data.token);
            sessionStorage.removeItem('token');
            localStorage.setItem('rememberedEmail', email);
        } else {
            sessionStorage.setItem('token', data.token);
            localStorage.removeItem('token');
            localStorage.removeItem('rememberedEmail');
        }

        // 2. Sau đó mới update State
        setToken(data.token);
        setCurrentUser(data.user);
    }, []); // Dependency array rỗng vì hàm này không phụ thuộc state nào bên ngoài

    // --- TỐI ƯU HÓA: Dùng useCallback cho logout ---
    const logout = useCallback(() => {
        setToken(null);
        setCurrentUser(null);
        setCompanyInfo(null);
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        window.location.href = '/login'; 
    }, []);

    const updateProfile = async (data: Partial<User>) => {
        await api('/api/auth/profile', { method: 'PUT', body: JSON.stringify(data) });
        setCurrentUser((prev) => prev ? { ...prev, ...data } : null);
    };

    // useEffect load data
    useEffect(() => {
        if (token) {
            api('/api/auth/me')
                .then((user) => setCurrentUser(user))
                .catch(() => {
                    // Xử lý lỗi token nếu cần
                });

            refreshCompanyInfo();
        }
    }, [token]);

    // --- TỐI ƯU HÓA: Dùng useMemo để cache object value ---
    // Chỉ tạo lại object này khi các biến phụ thuộc thay đổi
    const value = useMemo(() => ({
        currentUser,
        token,
        isAuthenticated: !!token,
        login,
        logout,
        updateProfile,
        isSidebarOpen,
        setIsOpen,
        companyInfo,
        refreshCompanyInfo
    }), [currentUser, token, isSidebarOpen, companyInfo, login, logout]);

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export const useAppContext = () => useContext(DataContext);