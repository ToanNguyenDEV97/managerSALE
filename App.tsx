


import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CustomersPage from './pages/CustomersPage';
import SuppliersPage from './pages/SuppliersPage';
import InvoicesPage from './pages/InvoicesPage';
import InvoiceForm from './components/InvoiceForm';
import ReportsPage from './pages/ReportsPage';
import PaymentModal from './components/PaymentModal';
import CustomerPaymentModal from './components/CustomerPaymentModal';
import SupplierPaymentModal from './components/SupplierPaymentModal';
import CashFlowPage from './pages/CashFlowPage';
import CashFlowModal from './components/CashFlowModal';
import DebtPage from './pages/DebtPage';
import SalesPage from './pages/SalesPage';
import TaxPage from './pages/TaxPage';
import PrintInvoicePage from './pages/PrintInvoicePage';
import PrintVoucherPage from './pages/PrintVoucherPage';
import PostSaleModal from './components/PostSaleModal';
import SettingsPage from './pages/SettingsPage';
import PurchasesPage from './pages/PurchasesPage';
import PurchaseForm from './components/PurchaseForm';
import QuotesPage from './pages/QuotesPage';
import QuoteForm from './components/QuoteForm';
import OrdersPage from './pages/OrdersPage';
import OrderForm from './components/OrderForm';
import DeliveriesPage from './pages/DeliveriesPage';
import DeliveryForm from './components/DeliveryForm';
import PrintDeliveryPage from './pages/PrintDeliveryPage';
import InventoryChecksPage from './pages/InventoryChecksPage';
import InventoryCheckForm from './components/InventoryCheckForm';
import PrintQuotePage from './pages/PrintQuotePage';
import UsersPage from './pages/UsersPage';
import UserModal from './components/UserModal';
import ProfileModal from './components/ProfileModal';
import UserDropdown from './components/UserDropdown';
import type { Page } from './types';
import { useAppContext } from './context/DataContext';
import { FiMenu } from 'react-icons/fi';

const AppContent: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const {
    currentPage,
    setCurrentPage,
    editingInvoice,
    editingPurchase,
    editingQuote,
    editingOrder,
    editingDelivery,
    editingInventoryCheck,
    payingCustomerId,
    payingSupplierId,
    payingInvoiceId,
    editingTransaction,
    postSaleInvoiceId,
    editingUser,
    isProfileModalOpen,
    theme,
    logout,
  } = useAppContext();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
  }, [theme]);


  const handleSetCurrentPage = (page: Page) => {
    setCurrentPage(page);
    setIsSidebarOpen(false);
  };

  const pageTitles: Record<Page, string> = {
    Dashboard: 'Tổng quan',
    Sales: 'Bán hàng',
    Products: 'Sản phẩm',
    Customers: 'Khách hàng',
    Suppliers: 'Nhà cung cấp',
    Purchases: 'Nhập kho',
    Quotes: 'Báo giá',
    Orders: 'Đơn hàng',
    Invoices: 'Hóa đơn',
    Delivery: 'Giao hàng',
    InventoryChecks: 'Kiểm kho',
    Debt: 'Công nợ',
    CashFlow: 'Sổ quỹ',
    Tax: 'Thuế',
    Reports: 'Báo cáo',
    Users: 'Người dùng',
    Settings: 'Cài đặt',
  };

  const renderPage = () => {
    if (currentPage === 'Quotes' && editingQuote) {
      return <QuoteForm />;
    }
     if (currentPage === 'Orders' && editingOrder) {
      return <OrderForm />;
    }
    if (currentPage === 'Invoices' && editingInvoice) {
      return <InvoiceForm />;
    }
    if (currentPage === 'Purchases' && editingPurchase) {
      return <PurchaseForm />;
    }
    if (currentPage === 'Delivery' && editingDelivery) {
        return <DeliveryForm />;
    }
    if (currentPage === 'InventoryChecks' && editingInventoryCheck) {
        return <InventoryCheckForm />;
    }
    
    switch (currentPage) {
      case 'Dashboard':
        return <DashboardPage setCurrentPage={setCurrentPage} />;
      case 'Sales':
        return <SalesPage />;
      case 'Products':
        return <ProductsPage />;
      case 'Customers':
        return <CustomersPage />;
      case 'Suppliers':
        return <SuppliersPage />;
      case 'Purchases':
        return <PurchasesPage />;
      case 'Quotes':
        return <QuotesPage />;
      case 'Orders':
        return <OrdersPage />;
      case 'Invoices':
        return <InvoicesPage />;
      case 'Delivery':
        return <DeliveriesPage />;
      case 'InventoryChecks':
        return <InventoryChecksPage />;
      case 'CashFlow':
        return <CashFlowPage />;
      case 'Debt':
        return <DebtPage />;
      case 'Tax':
        return <TaxPage />;
      case 'Reports':
        return <ReportsPage />;
      case 'Users':
        return <UsersPage />;
      case 'Settings':
        return <SettingsPage />;
      default:
        return <DashboardPage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={handleSetCurrentPage} 
        onLogout={logout} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex justify-between items-center bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 h-14 flex-shrink-0">
          <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
              aria-label="Mở menu"
          >
              <FiMenu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200">{pageTitles[currentPage]}</h1>
          <UserDropdown />
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="container mx-auto px-4 sm:px-6 py-6">
            {renderPage()}
          </div>
        </main>
      </div>

      {payingCustomerId && <CustomerPaymentModal />}
      {payingSupplierId && <SupplierPaymentModal />}
      {payingInvoiceId && <PaymentModal />}
      {editingTransaction && <CashFlowModal />}
      {postSaleInvoiceId && <PostSaleModal />}
      {editingUser && <UserModal />}
      {isProfileModalOpen && <ProfileModal />}
    </div>
  );
};

const App: React.FC = () => {
  const { isAuthenticated, printingInvoiceId, printingDeliveryId, printingVoucherId, printingQuoteId } = useAppContext();

  if (printingQuoteId) {
    return <PrintQuotePage />;
  }

  if (printingVoucherId) {
    return <PrintVoucherPage />;
  }
  
  if (printingInvoiceId) {
    return <PrintInvoicePage />;
  }
  
  if (printingDeliveryId) {
    return <PrintDeliveryPage />;
  }
  
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AppContent />;
};

export default App;