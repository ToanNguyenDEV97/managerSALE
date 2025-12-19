import React, { useState, useEffect } from 'react';
import { FiMenu } from 'react-icons/fi';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Context & Types
import { DataProvider, useAppContext } from './context/DataContext';
import type { PageKey } from './types';

// Components
import Sidebar from './components/Sidebar';
import UserDropdown from './components/UserDropdown';

// Modals Global (Nằm đè lên mọi trang)
import PaymentModal from './components/PaymentModal';
import CustomerPaymentModal from './components/CustomerPaymentModal';
import SupplierPaymentModal from './components/SupplierPaymentModal';
import CashFlowModal from './components/CashFlowModal';
import PostSaleModal from './components/PostSaleModal';
import UserModal from './components/UserModal';
import ProfileModal from './components/ProfileModal';
import DeliveryForm from './components/DeliveryForm';
import InventoryCheckForm from './components/InventoryCheckForm';
import InvoiceDetailsModal from './components/InvoiceDetailsModal';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SalesPage from './pages/SalesPage';
import ProductsPage from './pages/ProductsPage';
import CustomersPage from './pages/CustomersPage';
import SuppliersPage from './pages/SuppliersPage';
import InvoicesPage from './pages/InvoicesPage';
import OrdersPage from './pages/OrdersPage';
import QuotesPage from './pages/QuotesPage';
import PurchasesPage from './pages/PurchasesPage';
import DeliveriesPage from './pages/DeliveriesPage';
import InventoryChecksPage from './pages/InventoryChecksPage';
import CashFlowPage from './pages/CashFlowPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import TaxPage from './pages/TaxPage';

// Pages In ấn
import PrintInvoicePage from './pages/PrintInvoicePage';
import PrintQuotePage from './pages/PrintQuotePage';
import PrintDeliveryPage from './pages/PrintDeliveryPage';
import PrintVoucherPage from './pages/PrintVoucherPage';

// Tạo Client cho React Query
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

const pageTitles: Record<PageKey, string> = {
    'Dashboard': 'Tổng quan',
    'Sales': 'Bán hàng (POS)',
    'Products': 'Sản phẩm & Kho',
    'Customers': 'Khách hàng',
    'Suppliers': 'Nhà cung cấp',
    'Invoices': 'Hóa đơn bán hàng',
    'Orders': 'Đơn đặt hàng',
    'Quotes': 'Báo giá',
    'Purchases': 'Nhập kho',
    'Deliveries': 'Giao hàng',
    'InventoryChecks': 'Kiểm kho',
    'CashFlow': 'Sổ quỹ (Thu/Chi)',
    'Reports': 'Báo cáo thống kê',
    'Users': 'Quản lý nhân viên',
    'Settings': 'Cài đặt hệ thống',
    'Tax': 'Báo cáo Thuế',
};

const MainApp: React.FC = () => {
    const { 
        isAuthenticated, 
        currentPage, 
        setCurrentPage, 
        isSidebarOpen, 
        setIsOpen, 
        logout,
        // Các state để hiển thị Modal Global
        payingCustomerId, payingSupplierId, payingInvoiceId, 
        editingTransaction, editingDelivery, editingInventoryCheck,
        editingUser, isProfileModalOpen,
        printingInvoiceId, printingQuoteId, printingDeliveryId, printingVoucherId,
        viewingInvoiceId
    } = useAppContext();

    // 1. Nếu chưa đăng nhập -> Hiện trang Login
    if (!isAuthenticated) {
        return <LoginPage />;
    }

    // 2. Nếu đang ở chế độ In ấn -> Hiện trang In
    if (printingInvoiceId) return <PrintInvoicePage />;
    if (printingQuoteId) return <PrintQuotePage />;
    if (printingDeliveryId) return <PrintDeliveryPage />;
    if (printingVoucherId) return <PrintVoucherPage />;

    // 3. Logic chuyển trang chính
    const renderPage = () => {
        switch (currentPage) {
            case 'Dashboard': return <DashboardPage />;
            case 'Sales': return <SalesPage />; // <--- ĐÂY LÀ DÒNG QUAN TRỌNG ĐỂ VÀO TRANG BÁN HÀNG
            case 'Products': return <ProductsPage />;
            case 'Customers': return <CustomersPage />;
            case 'Suppliers': return <SuppliersPage />;
            case 'Invoices': return <InvoicesPage />;
            case 'Orders': return <OrdersPage />;
            case 'Quotes': return <QuotesPage />;
            case 'Purchases': return <PurchasesPage />;
            case 'Deliveries': return <DeliveriesPage />;
            case 'InventoryChecks': return <InventoryChecksPage />;
            case 'CashFlow': return <CashFlowPage />;
            case 'Reports': return <ReportsPage />;
            case 'Users': return <UsersPage />;
            case 'Settings': return <SettingsPage />;
            case 'Tax': return <TaxPage />;
            default: return <DashboardPage />;
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans text-slate-900 dark:text-slate-100">
            <Sidebar 
                currentPage={currentPage} 
                setCurrentPage={setCurrentPage} 
                onLogout={logout} 
                isOpen={isSidebarOpen} 
                setIsOpen={setIsOpen} 
            />

            <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
                {/* Mobile Header */}
                <header className="lg:hidden flex justify-between items-center bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 h-16 flex-shrink-0">
                    <button onClick={() => setIsOpen(true)} className="text-slate-500 hover:text-slate-600 dark:text-slate-400">
                        <FiMenu className="h-6 w-6" />
                    </button>
                    <h1 className="text-lg font-bold">{pageTitles[currentPage]}</h1>
                    <UserDropdown />
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-900">
                    <div className="container mx-auto px-4 sm:px-6 py-6 h-full">
                        {renderPage()}
                    </div>
                </main>
            </div>

            {/* Global Modals (Đặt ở đây để không bị che khuất) */}
            {payingCustomerId && <CustomerPaymentModal />}
            {payingSupplierId && <SupplierPaymentModal />}
            {payingInvoiceId && <PaymentModal />}
            {editingTransaction && <CashFlowModal />}
            {editingDelivery && <DeliveryForm />}
            {editingInventoryCheck && <InventoryCheckForm />}
            {editingUser && <UserModal />}
            {isProfileModalOpen && <ProfileModal />}
            {viewingInvoiceId && <InvoiceDetailsModal />}
            
            <PostSaleModal /> {/* Modal sau khi bán hàng thành công */}
        </div>
    );
};

// Component Gốc
const App: React.FC = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <DataProvider>
                <MainApp />
                <Toaster 
                    position="top-right" 
                    toastOptions={{
                    className: 'dark:bg-slate-800 dark:text-white',
                    style: {
                        zIndex: 9999,
                    },
                    }} 
                />
            </DataProvider>
        </QueryClientProvider>
    );
};

export default App;