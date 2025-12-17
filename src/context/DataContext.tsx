import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User, Settings, Theme, AllColumnVisibility, PageKey } from '../types';
import type { Product, Customer, Supplier, Invoice, Order, Quote, Purchase, Delivery, InventoryCheck, CashFlowTransaction } from '../types';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

// --- Interface ---
interface AppContextState {
    // 1. Auth & System
    currentUser: User | null;
    isAuthenticated: boolean;
    token: string | null;
    login: (email: string, password: string, remember: boolean) => Promise<void>;
    logout: () => void;
    
    // 2. UI Global
    theme: Theme;
    setTheme: (t: Theme) => void;
    isSidebarOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    settings: Settings;
    handleSaveSettings: (s: Settings) => Promise<void>;
    handleUpdateProfile: (curr: string, newP: string) => Promise<void>;
    
    // 3. Navigation (QUAN TRỌNG: Đã sửa type thành PageKey)
    currentPage: PageKey; 
    setCurrentPage: React.Dispatch<React.SetStateAction<PageKey>>;

    // 4. Column Visibility
    columnVisibility: AllColumnVisibility;
    handleColumnVisibilityChange: (page: PageKey, col: string, vis: boolean) => void;

    // 5. Modal States
    editingProduct: Product | 'new' | null;
    setEditingProduct: React.Dispatch<React.SetStateAction<Product | 'new' | null>>;
    
    editingCustomer: Customer | 'new' | null;
    setEditingCustomer: React.Dispatch<React.SetStateAction<Customer | 'new' | null>>;
    
    editingSupplier: Supplier | 'new' | null;
    setEditingSupplier: React.Dispatch<React.SetStateAction<Supplier | 'new' | null>>;

    editingInvoice: Invoice | 'new' | null;
    setEditingInvoice: React.Dispatch<React.SetStateAction<Invoice | 'new' | null>>;

    editingOrder: Order | 'new' | null;
    setEditingOrder: React.Dispatch<React.SetStateAction<Order | 'new' | null>>;

    editingQuote: Quote | 'new' | null;
    setEditingQuote: React.Dispatch<React.SetStateAction<Quote | 'new' | null>>;

    editingPurchase: Purchase | 'new' | null;
    setEditingPurchase: React.Dispatch<React.SetStateAction<Purchase | 'new' | null>>;

    editingDelivery: Delivery | 'new' | null;
    setEditingDelivery: React.Dispatch<React.SetStateAction<Delivery | 'new' | null>>;

    editingInventoryCheck: InventoryCheck | 'new' | null;
    setEditingInventoryCheck: React.Dispatch<React.SetStateAction<InventoryCheck | 'new' | null>>;

    editingTransaction: CashFlowTransaction | 'new-thu' | 'new-chi' | null;
    setEditingTransaction: React.Dispatch<React.SetStateAction<CashFlowTransaction | 'new-thu' | 'new-chi' | null>>;

    editingUser: User | 'new' | null;
    setEditingUser: React.Dispatch<React.SetStateAction<User | 'new' | null>>;

    // IDs for Viewing/Printing
    payingInvoiceId: string | null;
    setPayingInvoiceId: React.Dispatch<React.SetStateAction<string | null>>;
    
    payingCustomerId: string | null;
    setPayingCustomerId: React.Dispatch<React.SetStateAction<string | null>>;
    
    payingSupplierId: string | null;
    setPayingSupplierId: React.Dispatch<React.SetStateAction<string | null>>;
    
    viewingInvoiceId: string | null;
    setViewingInvoiceId: React.Dispatch<React.SetStateAction<string | null>>;
    
    printingInvoiceId: string | null;
    setPrintingInvoiceId: React.Dispatch<React.SetStateAction<string | null>>;
    
    printingVoucherId: string | null;
    setPrintingVoucherId: React.Dispatch<React.SetStateAction<string | null>>;
    
    printingDeliveryId: string | null;
    setPrintingDeliveryId: React.Dispatch<React.SetStateAction<string | null>>;
    
    printingQuoteId: string | null;
    setPrintingQuoteId: React.Dispatch<React.SetStateAction<string | null>>;
    
    postSaleInvoiceId: string | null;
    setPostSaleInvoiceId: React.Dispatch<React.SetStateAction<string | null>>;
    
    invoiceIdForNewDelivery: string | null;
    setInvoiceIdForNewDelivery: React.Dispatch<React.SetStateAction<string | null>>;
    
    isProfileModalOpen: boolean;
    setIsProfileModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextState | undefined>(undefined);

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppContext must be used within a DataProvider');
    return context;
};

const initialSettings: Settings = { companyName: 'QLBH', address: '', phone: '', email: '', logo: null };
const initialColumnVisibility: AllColumnVisibility = { products: {}, customers: {}, invoices: {} };

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // --- Auth State ---
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    
    // --- UI State ---
    const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'light');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [settings, setSettings] = useState<Settings>(initialSettings);
    
    // SỬA LẠI: currentPage là tên trang (string), mặc định là 'Dashboard'
    const [currentPage, setCurrentPage] = useState<PageKey>('Dashboard');

    const [columnVisibility, setColumnVisibility] = useState<AllColumnVisibility>(() => {
         const saved = localStorage.getItem('columnVisibility');
         return saved ? JSON.parse(saved) : initialColumnVisibility;
    });

    // --- Modal States ---
    const [editingProduct, setEditingProduct] = useState<Product | 'new' | null>(null);
    const [editingCustomer, setEditingCustomer] = useState<Customer | 'new' | null>(null);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | 'new' | null>(null);
    const [editingInvoice, setEditingInvoice] = useState<Invoice | 'new' | null>(null);
    const [editingOrder, setEditingOrder] = useState<Order | 'new' | null>(null);
    const [editingQuote, setEditingQuote] = useState<Quote | 'new' | null>(null);
    const [editingPurchase, setEditingPurchase] = useState<Purchase | 'new' | null>(null);
    const [editingDelivery, setEditingDelivery] = useState<Delivery | 'new' | null>(null);
    const [editingInventoryCheck, setEditingInventoryCheck] = useState<InventoryCheck | 'new' | null>(null);
    const [editingTransaction, setEditingTransaction] = useState<CashFlowTransaction | 'new-thu' | 'new-chi' | null>(null);
    const [editingUser, setEditingUser] = useState<User | 'new' | null>(null);

    const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
    const [payingCustomerId, setPayingCustomerId] = useState<string | null>(null);
    const [payingSupplierId, setPayingSupplierId] = useState<string | null>(null);
    const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);
    const [printingInvoiceId, setPrintingInvoiceId] = useState<string | null>(null);
    const [printingVoucherId, setPrintingVoucherId] = useState<string | null>(null);
    const [printingDeliveryId, setPrintingDeliveryId] = useState<string | null>(null);
    const [printingQuoteId, setPrintingQuoteId] = useState<string | null>(null);
    const [postSaleInvoiceId, setPostSaleInvoiceId] = useState<string | null>(null);
    const [invoiceIdForNewDelivery, setInvoiceIdForNewDelivery] = useState<string | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // --- Effects & Logic ---
    useEffect(() => {
        if (theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const loadUser = async () => {
            if (token) {
                try {
                    const user = await api('/api/auth/me');
                    setCurrentUser(user);
                } catch { logout(); }
            }
        };
        loadUser();
    }, [token]);

    const login = async (email: string, pass: string, remember: boolean) => {
        const data = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password: pass }) });
        setToken(data.token);
        setCurrentUser(data.user);
        localStorage.setItem('token', data.token);
        if (remember) localStorage.setItem('rememberedEmail', email);
    };

    const logout = () => {
        setToken(null);
        setCurrentUser(null);
        localStorage.removeItem('token');
        window.location.reload();
    };

    const setTheme = (t: Theme) => setThemeState(t);
    const handleSaveSettings = async (s: Settings) => { setSettings(s); toast.success('Đã lưu cài đặt (Local)'); };
    const handleUpdateProfile = async (o: string, n: string) => { 
        await api('/api/auth/profile', { method: 'PUT', body: JSON.stringify({ currentPassword: o, newPassword: n }) });
        toast.success('Đổi mật khẩu thành công'); 
    };
    
    const handleColumnVisibilityChange = (page: PageKey, key: string, val: boolean) => {
        setColumnVisibility(p => {
            const newState = { ...p, [page]: { ...p[page], [key]: val } };
            localStorage.setItem('columnVisibility', JSON.stringify(newState));
            return newState;
        });
    };

    const value = {
        currentUser, isAuthenticated: !!currentUser, token, login, logout,
        theme, setTheme, isSidebarOpen, setIsOpen: setIsSidebarOpen,
        settings, handleSaveSettings, handleUpdateProfile,
        columnVisibility, handleColumnVisibilityChange,
        
        // Navigation (Đã fix)
        currentPage, setCurrentPage, 
        
        // Modals
        editingProduct, setEditingProduct,
        editingCustomer, setEditingCustomer,
        editingSupplier, setEditingSupplier,
        editingInvoice, setEditingInvoice,
        editingOrder, setEditingOrder,
        editingQuote, setEditingQuote,
        editingPurchase, setEditingPurchase,
        editingDelivery, setEditingDelivery,
        editingInventoryCheck, setEditingInventoryCheck,
        editingTransaction, setEditingTransaction,
        editingUser, setEditingUser,

        payingInvoiceId, setPayingInvoiceId,
        payingCustomerId, setPayingCustomerId,
        payingSupplierId, setPayingSupplierId,
        viewingInvoiceId, setViewingInvoiceId,
        printingInvoiceId, setPrintingInvoiceId,
        printingVoucherId, setPrintingVoucherId,
        printingDeliveryId, setPrintingDeliveryId,
        printingQuoteId, setPrintingQuoteId,
        postSaleInvoiceId, setPostSaleInvoiceId,
        invoiceIdForNewDelivery, setInvoiceIdForNewDelivery,
        isProfileModalOpen, setIsProfileModalOpen
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};