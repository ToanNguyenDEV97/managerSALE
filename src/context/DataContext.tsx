import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginResponse } from '../types';
import { api } from '../utils/api';

interface DataContextType {
    // Auth State
    currentUser: User | null;
    token: string | null;
    isAuthenticated: boolean;
    
    // Auth Actions
    login: (email: string, pass: string, remember: boolean) => Promise<void>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => Promise<void>;

    // UI State
    isSidebarOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

// Khởi tạo context với giá trị mặc định
const DataContext = createContext<DataContextType>({
    currentUser: null,
    token: null,
    isAuthenticated: false,
    login: async () => {},
    logout: () => {},
    updateProfile: async () => {},
    isSidebarOpen: true,
    setIsOpen: () => {},
});

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // --- 1. Quản lý State Token & User ---
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    
    // Lấy token từ LocalStorage (nếu user tick "Lưu tài khoản") hoặc SessionStorage (nếu không tick)
    const [token, setToken] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token') || sessionStorage.getItem('token');
        }
        return null;
    });

    // --- 2. Quản lý UI ---
    const [isSidebarOpen, setIsOpen] = useState(true);

    // --- 3. useEffect: Load thông tin User khi có Token ---
    useEffect(() => {
        if (token) {
            api('/api/auth/me')
                .then((user) => setCurrentUser(user))
                .catch(() => {
                    // Nếu token hết hạn hoặc lỗi -> Tự động đăng xuất
                    logout(); 
                });
        }
    }, [token]);

    // --- 4. Các hành động (Actions) ---

    // Đăng nhập
    const login = async (email: string, pass: string, remember: boolean) => {
        const data: LoginResponse = await api('/api/auth/login', { 
            method: 'POST', 
            body: JSON.stringify({ email, password: pass }) 
        });
        
        setToken(data.token);
        setCurrentUser(data.user);

        if (remember) {
            // Nếu tick "Lưu tài khoản": Dùng localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('rememberedEmail', email);
            sessionStorage.removeItem('token');
        } else {
            // Nếu KHÔNG tick: Dùng sessionStorage (tắt tab là mất)
            sessionStorage.setItem('token', data.token);
            localStorage.removeItem('token');
            localStorage.removeItem('rememberedEmail');
        }
    };

    // Đăng xuất
    const logout = () => {
        setToken(null);
        setCurrentUser(null);
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        
        // Điều hướng về trang login (Dùng window.location để reset sạch state của App)
        window.location.href = '/login'; 
    };

    // Cập nhật thông tin cá nhân (Đổi pass, đổi tên...)
    const updateProfile = async (data: Partial<User>) => {
        await api('/api/auth/profile', { method: 'PUT', body: JSON.stringify(data) });
        // Cập nhật ngay state local để UI hiển thị thông tin mới
        setCurrentUser((prev) => prev ? { ...prev, ...data } : null);
    };

    return (
        <DataContext.Provider value={{
            currentUser,
            token,
            isAuthenticated: !!token, // Có token coi như đã login
            login,
            logout,
            updateProfile,
            isSidebarOpen,
            setIsOpen
        }}>
            {children}
        </DataContext.Provider>
    );
};

// Custom Hook để dùng context dễ dàng hơn
export const useAppContext = () => useContext(DataContext);