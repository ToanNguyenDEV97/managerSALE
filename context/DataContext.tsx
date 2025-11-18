
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User, Product, Customer, Invoice, CashFlowTransaction, Supplier, Settings, Category, Purchase, Quote, Order, Delivery, Theme, AllColumnVisibility, PageKey, InventoryCheck, AppContextState, InvoiceItem } from '../types';

const API_SERVER_URL = `${window.location.protocol}//${window.location.hostname}:5001`;

interface AppContextStateWithAuth extends AppContextState {
    isAuthenticated: boolean;
    token: string | null;
    login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => void;
}


const AppContext = createContext<AppContextStateWithAuth | undefined>(undefined);

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within a DataProvider');
    }
    return context;
};

const initialSettings: Settings = {
    companyName: 'Công ty TNHH QLBH',
    address: '123 Đường ABC, Phường X, Quận Y, TP. Z',
    phone: '0123456789',
    email: 'contact@qlbh.com',
    logo: null,
};

const initialColumnVisibility: AllColumnVisibility = {
    products: { sku: true, name: true, category: true, unit: true, price: true, stock: true, vat: true },
    customers: { name: true, debt: true, phone: true, address: true },
    suppliers: { name: true, debt: true, phone: true, address: true, taxCode: true },
    invoices: { invoiceNumber: true, customerName: true, issueDate: true, totalAmount: true, status: true },
    purchases: { purchaseNumber: true, supplierName: true, issueDate: true, totalAmount: true },
    quotes: { quoteNumber: true, customerName: true, issueDate: true, totalAmount: true, status: true },
    orders: { orderNumber: true, customerName: true, issueDate: true, totalAmount: true, status: true },
    deliveries: { deliveryNumber: true, customerName: true, deliveryDate: true, driverName: true, status: true },
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Auth State
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    
    // Local, non-persistent state
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [inventoryChecks, setInventoryChecks] = useState<InventoryCheck[]>([]);
    const [cashFlowTransactions, setCashFlowTransactions] = useState<CashFlowTransaction[]>([]);
    
    const useStickyState = <T,>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] => {
        const [value, setValue] = useState<T>(() => {
            const stickyValue = window.localStorage.getItem(key);
            return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
        });
        useEffect(() => {
            window.localStorage.setItem(key, JSON.stringify(value));
        }, [key, value]);
        return [value, setValue];
    };
    
    const [settings, setSettings] = useStickyState<Settings>(initialSettings, 'settings');
    const [theme, setTheme] = useStickyState<Theme>('light', 'theme');
    const [columnVisibility, setColumnVisibility] = useStickyState<AllColumnVisibility>(initialColumnVisibility, 'columnVisibility');

    // API helper for PROTECTED routes
    const api = async (endpoint: string, options: RequestInit = {}) => {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
            headers['Authorization'] = `Bearer ${currentToken}`;
        }

        const response = await fetch(`${API_SERVER_URL}${endpoint}`, { ...options, headers: {...headers, ...options.headers} });

        if (response.status === 401) {
            logout();
            throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }

        if (response.status === 204) {
            return; // No Content, successful
        }
        
        const contentType = response.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");

        if (!response.ok) {
            let errorMessage;
            if (isJson) {
                const errorData = await response.json();
                errorMessage = errorData.message || 'Có lỗi xảy ra.';
            } else {
                const textError = await response.text();
                errorMessage = textError || `Lỗi máy chủ: ${response.status}`;
            }
            throw new Error(errorMessage);
        }

        if (isJson) {
            return response.json();
        } else {
            return;
        }
    };

    useEffect(() => {
    // Kiểm tra xem có token trên URL không (từ Google trả về)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');

    if (tokenFromUrl) {
        // Nếu có, lưu token này lại
        localStorage.setItem('token', tokenFromUrl);
        setToken(tokenFromUrl);
        setIsAuthenticated(true);

        // Xóa token khỏi URL để làm sạch
        window.history.replaceState({}, document.title, "/"); 
    }
}, []);

    const fetchAllData = async () => {
        if (!isAuthenticated) return;
        try {
            const [data, me] = await Promise.all([
                api('/api/all-data'),
                api('/api/me')
            ]);
            setProducts(data.products || []);
            setCategories(data.categories || []);
            setCustomers(data.customers || []);
            setSuppliers(data.suppliers || []);
            setQuotes(data.quotes || []);
            setOrders(data.orders || []);
            setInvoices(data.invoices || []);
            setPurchases(data.purchases || []);
            setDeliveries(data.deliveries || []);
            setInventoryChecks(data.inventoryChecks || []);
            setCashFlowTransactions(data.cashFlowTransactions || []);
            setCurrentUser(me);
            setUsers(data.users || []);
        } catch (error) {
            console.error("Failed to fetch data from server:", error);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchAllData();
        }
    }, [isAuthenticated]);

    // Auth Handlers
    const login = async (email: string, password: string, rememberMe: boolean) => {
        const response = await fetch(`${API_SERVER_URL}/api/auth/authenticate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Email hoặc mật khẩu không đúng.');
        }
        const data = await response.json();
        
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setIsAuthenticated(true);

        if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }
    };

    const register = async (email: string, password: string) => {
         const response = await fetch(`${API_SERVER_URL}/api/auth/create-account`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Đăng ký thất bại.');
        }
        const data = await response.json();

        localStorage.setItem('token', data.token);
        setToken(data.token);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setIsAuthenticated(false);
        // Clear all data on logout
        setProducts([]); setCategories([]); setCustomers([]); setSuppliers([]);
        setQuotes([]); setOrders([]); setInvoices([]); setPurchases([]);
        setDeliveries([]); setInventoryChecks([]); setCashFlowTransactions([]);
        setCurrentUser(null);
        setUsers([]);
    };


    // Modal States
    const [editingQuote, setEditingQuote] = useState<Quote | 'new' | null>(null);
    const [editingOrder, setEditingOrder] = useState<Order | 'new' | null>(null);
    const [editingInvoice, setEditingInvoice] = useState<Invoice | 'new' | null>(null);
    const [editingPurchase, setEditingPurchase] = useState<Purchase | 'new' | null>(null);
    const [editingDelivery, setEditingDelivery] = useState<Delivery | 'new' | null>(null);
    const [editingInventoryCheck, setEditingInventoryCheck] = useState<InventoryCheck | 'new' | null>(null);
    const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
    const [payingCustomerId, setPayingCustomerId] = useState<string | null>(null);
    const [payingSupplierId, setPayingSupplierId] = useState<string | null>(null);
    const [editingTransaction, setEditingTransaction] = useState<CashFlowTransaction | 'new-thu' | 'new-chi' | null>(null);
    const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);
    const [printingInvoiceId, setPrintingInvoiceId] = useState<string | null>(null);
    const [printingVoucherId, setPrintingVoucherId] = useState<string | null>(null);
    const [printingDeliveryId, setPrintingDeliveryId] = useState<string | null>(null);
    const [printingQuoteId, setPrintingQuoteId] = useState<string | null>(null);
    const [postSaleInvoiceId, setPostSaleInvoiceId] = useState<string | null>(null);
    const [invoiceIdForNewDelivery, setInvoiceIdForNewDelivery] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<User | 'new' | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
    
    // --- API Handlers ---
    const handleSaveProduct = async (product: Product) => {
        const method = product.id ? 'PUT' : 'POST';
        const url = product.id ? `/api/products/${product.id}` : `/api/products`;
        await api(url, { method, body: JSON.stringify(product) });
        await fetchAllData();
    };
    const handleDeleteProduct = async (id: string) => { await api(`/api/products/${id}`, { method: 'DELETE' }); await fetchAllData(); };
    const handleDeleteProducts = async (ids: string[]) => { await api(`/api/products/batch-delete`, { method: 'POST', body: JSON.stringify({ ids }) }); await fetchAllData(); };
    const handleSaveCategory = async (cat: Category) => {
        const method = cat.id ? 'PUT' : 'POST';
        const url = cat.id ? `/api/categories/${cat.id}` : `/api/categories`;
        await api(url, { method, body: JSON.stringify(cat) });
        await fetchAllData();
    };
    const handleDeleteCategory = async (id: string) => { await api(`/api/categories/${id}`, { method: 'DELETE' }); await fetchAllData(); };
    const handleSaveCustomer = async (cust: Customer): Promise<Customer> => {
        const method = cust.id ? 'PUT' : 'POST';
        const url = cust.id ? `/api/customers/${cust.id}` : `/api/customers`;
        const savedCustomer = await api(url, { method, body: JSON.stringify(cust) });
        await fetchAllData();
        return savedCustomer;
    };
    const handleDeleteCustomer = async (id: string) => { await api(`/api/customers/${id}`, { method: 'DELETE' }); await fetchAllData(); };
    const handleDeleteCustomers = async (ids: string[]) => { await api(`/api/customers/batch-delete`, { method: 'POST', body: JSON.stringify({ ids }) }); await fetchAllData(); };
    const handleSaveSupplier = async (sup: Supplier) => {
        const method = sup.id ? 'PUT' : 'POST';
        const url = sup.id ? `/api/suppliers/${sup.id}` : `/api/suppliers`;
        await api(url, { method, body: JSON.stringify(sup) });
        await fetchAllData();
    };
    const handleDeleteSupplier = async (id: string) => { await api(`/api/suppliers/${id}`, { method: 'DELETE' }); await fetchAllData(); };
    const handleDeleteSuppliers = async (ids: string[]) => { await api(`/api/suppliers/batch-delete`, { method: 'POST', body: JSON.stringify({ ids }) }); await fetchAllData(); };
    const handleSaveInvoice = async (invoiceData: Invoice) => {
        const savedInvoice = await api(`/api/invoices`, { method: 'POST', body: JSON.stringify(invoiceData) });
        await fetchAllData();
        setEditingInvoice(null);
        if (!invoiceData.id) setPostSaleInvoiceId(savedInvoice.id);
    };
    const handleRecordPayment = async (invoiceId: string, amount: number, updateDebt = true, printAction: 'voucher' | 'invoice' | 'none' = 'voucher') => {
        const { newVoucher } = await api(`/api/invoices/${invoiceId}/payment`, { method: 'POST', body: JSON.stringify({ amount, updateDebt }) });
        await fetchAllData();
        if (newVoucher && printAction === 'voucher') setPrintingVoucherId(newVoucher.id);
        if (printAction === 'invoice') setPrintingInvoiceId(invoiceId);
        setPayingInvoiceId(null); setPayingCustomerId(null); setPostSaleInvoiceId(null);
    };
    const handleCompleteSale = async (saleData: {
        customerId: string;
        items: InvoiceItem[];
        totalAmount: number;
        paymentAmount: number;
        saleType: 'debit' | 'full_payment';
    }): Promise<Invoice> => {
        const result = await api('/api/sales', {
            method: 'POST',
            body: JSON.stringify(saleData),
        });
        
        await fetchAllData();

        // if (result.printAction === 'invoice' && result.invoiceId) {
        //     setPrintingInvoiceId(result.invoiceId);
        // } else if (result.printAction === 'voucher' && result.voucherId) {
        //     setPrintingVoucherId(result.voucherId);
        // }
        setPostSaleInvoiceId(result.savedInvoice.id);
        
        return result.savedInvoice;
    };
    const handlePayAllDebt = async (customerId: string) => { await api(`/api/customers/${customerId}/pay-all-debt`, { method: 'POST' }); await fetchAllData(); setPayingCustomerId(null); };
    const handlePaySupplierDebt = async (supplierId: string, amount: number) => { await api(`/api/suppliers/${supplierId}/pay-debt`, { method: 'POST', body: JSON.stringify({ amount }) }); await fetchAllData(); setPayingSupplierId(null); };
    const handleSavePurchase = async (purchase: Purchase) => { await api(`/api/purchases`, { method: 'POST', body: JSON.stringify(purchase) }); await fetchAllData(); setEditingPurchase(null); };
    const handleDeletePurchase = async (id: string) => { await api(`/api/purchases/${id}`, { method: 'DELETE' }); await fetchAllData(); };
    const handleSaveQuote = async (quote: Quote) => { await api(`/api/quotes`, { method: 'POST', body: JSON.stringify(quote) }); await fetchAllData(); setEditingQuote(null); };
    const handleDeleteQuote = async (id: string) => { await api(`/api/quotes/${id}`, { method: 'DELETE' }); await fetchAllData(); };
    const handleConvertToOrder = async (quoteId: string) => { await api(`/api/quotes/${quoteId}/convert-to-order`, { method: 'POST' }); await fetchAllData(); };
    const handleSaveOrder = async (order: Order) => { await api(`/api/orders`, { method: 'POST', body: JSON.stringify(order) }); await fetchAllData(); setEditingOrder(null); };
    const handleDeleteOrder = async (id: string) => { await api(`/api/orders/${id}`, { method: 'DELETE' }); await fetchAllData(); };
    const handleConvertToInvoice = async (orderId: string) => { await api(`/api/orders/${orderId}/convert-to-invoice`, { method: 'POST' }); await fetchAllData(); };
    const handleSaveDelivery = async (delivery: Delivery) => { await api(`/api/deliveries`, { method: 'POST', body: JSON.stringify(delivery) }); await fetchAllData(); setEditingDelivery(null); };
    const handleDeleteDelivery = async (id: string) => { await api(`/api/deliveries/${id}`, { method: 'DELETE' }); await fetchAllData(); };
    const handleUpdateDeliveryStatus = async (id: string, status: Delivery['status']) => { await api(`/api/deliveries/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }); await fetchAllData(); };
    const handleSaveInventoryCheck = async (check: InventoryCheck) => { await api(`/api/inventory-checks`, { method: 'POST', body: JSON.stringify(check) }); await fetchAllData(); setEditingInventoryCheck(null); };
    const handleDeleteInventoryCheck = async (id: string) => { await api(`/api/inventory-checks/${id}`, { method: 'DELETE' }); await fetchAllData(); };
    const handleSaveCashFlowTransaction = async (transaction: CashFlowTransaction) => { await api(`/api/cashflow-transactions`, { method: 'POST', body: JSON.stringify(transaction) }); await fetchAllData(); setEditingTransaction(null); };
    const handleDeleteCashFlowTransaction = async (id: string) => { await api(`/api/cashflow-transactions/${id}`, { method: 'DELETE' }); await fetchAllData(); };
    const handleSaveSettings = async (newSettings: Settings) => setSettings(newSettings);
    const handleColumnVisibilityChange = (pageKey: PageKey, columnKey: string, isVisible: boolean) => setColumnVisibility(p => ({ ...p, [pageKey]: { ...p[pageKey], [columnKey]: isVisible } }));
    const handleSaveUser = async (userData: Partial<User> & { password?: string }) => {
        const method = userData.id ? 'PUT' : 'POST';
        const url = userData.id ? `/api/users/${userData.id}` : '/api/users';
        await api(url, { method, body: JSON.stringify(userData) });
        await fetchAllData();
    };
    const handleDeleteUser = async (userId: string) => {
        await api(`/api/users/${userId}`, { method: 'DELETE' });
        await fetchAllData();
    };
    const handleUpdateProfile = async (currentPassword: string, newPassword: string) => {
        await api('/api/profile', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) });
    };

    const value: AppContextStateWithAuth = {
        isAuthenticated, token, login, register, logout,
        currentUser, users,
        products, categories, customers, suppliers, quotes, orders, invoices, purchases, deliveries, inventoryChecks, cashFlowTransactions, settings, theme, columnVisibility,
        editingQuote, editingOrder, editingInvoice, editingPurchase, editingDelivery, editingInventoryCheck, payingInvoiceId, payingCustomerId, payingSupplierId, editingTransaction, viewingInvoiceId, printingInvoiceId, printingVoucherId, printingDeliveryId, printingQuoteId, postSaleInvoiceId, invoiceIdForNewDelivery,
        editingUser, isProfileModalOpen,
        handleSaveProduct, handleDeleteProduct, handleDeleteProducts, handleSaveCategory, handleDeleteCategory, handleSaveCustomer, handleDeleteCustomer, handleDeleteCustomers, handleSaveSupplier, handleDeleteSupplier, handleDeleteSuppliers, handleSavePurchase, handleDeletePurchase, handleSaveQuote, handleDeleteQuote, handleConvertToOrder, handleSaveOrder, handleDeleteOrder, handleConvertToInvoice, handleSaveInvoice, handleRecordPayment, handleCompleteSale, handlePayAllDebt, handlePaySupplierDebt, handleSaveDelivery, handleDeleteDelivery, handleUpdateDeliveryStatus, handleSaveInventoryCheck, handleDeleteInventoryCheck, handleSaveCashFlowTransaction, handleDeleteCashFlowTransaction, handleSaveSettings, setTheme, handleColumnVisibilityChange,
        handleSaveUser, handleDeleteUser, handleUpdateProfile,
        setEditingQuote, setEditingOrder, setEditingInvoice, setEditingPurchase, setEditingDelivery, setEditingInventoryCheck, setPayingInvoiceId, setPayingCustomerId, setPayingSupplierId, setEditingTransaction, setViewingInvoiceId, setPrintingInvoiceId, setPrintingVoucherId, setPrintingDeliveryId, setPrintingQuoteId, setPostSaleInvoiceId, setInvoiceIdForNewDelivery,
        setEditingUser, setIsProfileModalOpen,
        currentPage,
        setCurrentPage,
    };
    

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
