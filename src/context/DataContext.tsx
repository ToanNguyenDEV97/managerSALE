import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api'; // Import api từ utils

// 1. Định nghĩa kiểu dữ liệu cho Context
interface AppContextType {
    isAuthenticated: boolean;
    token: string | null;
    user: any | null;
    login: (token: string, userData: any) => void;
    logout: () => void;
    
    // State điều khiển Sidebar
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    
    // State chỉnh sửa sản phẩm
    editingProduct: any | null;
    setEditingProduct: (product: any | null) => void;
    
    // State thanh toán hóa đơn
    payingInvoiceId: string | null;
    setPayingInvoiceId: (id: string | null) => void;

    companyInfo: any;
    refreshCompanyInfo: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
    const navigate = useNavigate();
    
    // --- STATE AUTH ---
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [user, setUser] = useState<any | null>(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // --- BIẾN isAuthenticated ---
    // Khai báo ở đây để dùng được trong useEffect và return
    const isAuthenticated = !!token;

    // --- STATE SIDEBAR (MẶC ĐỊNH LÀ TRUE - MỞ) ---
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // --- CÁC STATE KHÁC ---
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
    const [companyInfo, setCompanyInfo] = useState<any>(null);

    // Load thông tin công ty
    const fetchCompanyInfo = async () => {
        try {
            // Gọi API lấy thông tin tổ chức
            const res: any = await api('/organization/me'); 
            setCompanyInfo(res);
        } catch (error) {
            console.error("Lỗi lấy thông tin cửa hàng:", error);
            // Fallback nếu lỗi
            setCompanyInfo({
                name: "CỬA HÀNG MỚI",
                address: "Chưa cập nhật địa chỉ",
                phone: "09xxxxxxxx",
            });
        }
    };

    // Gọi hàm này khi app khởi chạy hoặc khi trạng thái đăng nhập thay đổi
    useEffect(() => {
        if (isAuthenticated) { 
             fetchCompanyInfo();
        }
    }, [isAuthenticated]);

    // Auth Logic
    const login = (newToken: string, userData: any) => {
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        navigate('/');
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Hàm để các component con gọi khi cần cập nhật lại thông tin công ty (ví dụ sau khi lưu settings)
    const refreshCompanyInfo = () => {
        if (isAuthenticated) {
            fetchCompanyInfo();
        }
    };

    return (
        <AppContext.Provider value={{
            isAuthenticated, // Sử dụng biến đã khai báo
            token,
            user,
            login,
            logout,
            isSidebarOpen,
            setIsSidebarOpen,
            editingProduct,
            setEditingProduct,
            payingInvoiceId,
            setPayingInvoiceId,
            companyInfo,
            refreshCompanyInfo
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within a DataProvider');
    }
    return context;
};