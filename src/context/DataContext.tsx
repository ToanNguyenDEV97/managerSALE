import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

// 1. Định nghĩa kiểu dữ liệu cho Context
interface AppContextType {
    isAuthenticated: boolean;
    token: string | null;
    user: any | null;
    login: (token: string, userData: any) => void;
    logout: () => void;
    
    // Thêm State điều khiển Sidebar
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    
    // State chỉnh sửa sản phẩm (giữ nguyên logic cũ của bạn)
    editingProduct: any | null;
    setEditingProduct: (product: any | null) => void;
    
    // State thanh toán hóa đơn (giữ nguyên logic cũ của bạn)
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

    // --- STATE SIDEBAR (MẶC ĐỊNH LÀ TRUE - MỞ) ---
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // --- CÁC STATE KHÁC ---
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
    const [companyInfo, setCompanyInfo] = useState<any>(null);

    // Load thông tin công ty khi component mount
    const fetchCompanyInfo = async () => {
        try {
            // Giả sử bạn có API này (nếu chưa có thì xem Bước 4)
            const res: any = await api('/api/organization/me'); 
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
    // Gọi hàm này khi app khởi chạy (trong useEffect)
    useEffect(() => {
        if (isAuthenticated) { // Chỉ lấy khi đã login
             // ... các hàm fetch khác
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

    // Load Company Info (Giả lập hoặc gọi API thật)
    const refreshCompanyInfo = () => {
        // Gọi API lấy thông tin công ty nếu cần
        // setCompanyInfo(...)
    };

    return (
        <AppContext.Provider value={{
            isAuthenticated: !!token,
            token,
            user,
            login,
            logout,
            isSidebarOpen,      // Export state
            setIsSidebarOpen,   // Export hàm set
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