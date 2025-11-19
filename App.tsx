import React, { useState, useEffect } from 'react';
import { FiMenu } from 'react-icons/fi';
import { Toaster } from 'react-hot-toast';

// Context & Types
import { useAppContext } from './context/DataContext';
import type { Page } from './types';

// Components & Modals
import Sidebar from './components/Sidebar';
import UserDropdown from './components/UserDropdown';
import InvoiceForm from './components/InvoiceForm';
import PurchaseForm from './components/PurchaseForm';
import QuoteForm from './components/QuoteForm';
import OrderForm from './components/OrderForm';
import DeliveryForm from './components/DeliveryForm';
import InventoryCheckForm from './components/InventoryCheckForm';
import PaymentModal from './components/PaymentModal';
import CustomerPaymentModal from './components/CustomerPaymentModal';
import SupplierPaymentModal from './components/SupplierPaymentModal';
import CashFlowModal from './components/CashFlowModal';
import PostSaleModal from './components/PostSaleModal';
import UserModal from './components/UserModal';
import ProfileModal from './components/ProfileModal';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SalesPage from './pages/SalesPage';
import ProductsPage from './pages/ProductsPage';
import CustomersPage from './pages/CustomersPage';
import SuppliersPage from './pages/SuppliersPage';
import PurchasesPage from './pages/PurchasesPage';
import QuotesPage from './pages/QuotesPage';
import OrdersPage from './pages/OrdersPage';
import InvoicesPage from './pages/InvoicesPage';
import DeliveriesPage from './pages/DeliveriesPage';
import InventoryChecksPage from './pages/InventoryChecksPage';
import CashFlowPage from './pages/CashFlowPage';
import DebtPage from './pages/DebtPage';
import TaxPage from './pages/TaxPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import PrintInvoicePage from './pages/PrintInvoicePage';
import PrintVoucherPage from './pages/PrintVoucherPage';
import PrintQuotePage from './pages/PrintQuotePage';
import PrintDeliveryPage from './pages/PrintDeliveryPage';

const App: React.FC = () => {
  const {
    isAuthenticated,
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
    printingInvoiceId,
    printingDeliveryId,
    printingVoucherId,
    printingQuoteId
  } = useAppContext();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
  }, [theme]);

  // Ưu tiên hiển thị trang in
  if (printingQuoteId) return <PrintQuotePage />;
  if (printingVoucherId) return <PrintVoucherPage />;
  if (printingInvoiceId) return <PrintInvoicePage />;
  if (printingDeliveryId) return <PrintDeliveryPage />;

  // Chưa đăng nhập -> Login
  if (!isAuthenticated) return <LoginPage />;

  const handleSetCurrentPage = (page: Page) => {
    setCurrentPage(page);
    setIsSidebarOpen(false);
  };

  const pageTitles: Record<Page, string> = {
    Dashboard: 'Tổng quan', Sales: 'Bán hàng', Products: 'Sản phẩm', Customers: 'Khách hàng',
    Suppliers: 'Nhà cung cấp', Purchases: 'Nhập kho', Quotes: 'Báo giá', Orders: 'Đơn hàng',
    Invoices: 'Hóa đơn', Delivery: 'Giao hàng', InventoryChecks: 'Kiểm kho', Debt: 'Công nợ',
    CashFlow: 'Sổ quỹ', Tax: 'Thuế', Reports: 'Báo cáo', Users: 'Người dùng', Settings: 'Cài đặt',
  };

  const renderPage = () => {
    if (currentPage === 'Quotes' && editingQuote) return <QuoteForm />;
    if (currentPage === 'Orders' && editingOrder) return <OrderForm />;
    if (currentPage === 'Invoices' && editingInvoice) return <InvoiceForm />;
    if (currentPage === 'Purchases' && editingPurchase) return <PurchaseForm />;
    if (currentPage === 'Delivery' && editingDelivery) return <DeliveryForm />;
    if (currentPage === 'InventoryChecks' && editingInventoryCheck) return <InventoryCheckForm />;
    
    switch (currentPage) {
      case 'Dashboard': return <DashboardPage setCurrentPage={setCurrentPage} />;
      case 'Sales': return <SalesPage />;
      case 'Products': return <ProductsPage />;
      case 'Customers': return <CustomersPage />;
      case 'Suppliers': return <SuppliersPage />;
      case 'Purchases': return <PurchasesPage />;
      case 'Quotes': return <QuotesPage />;
      case 'Orders': return <OrdersPage />;
      case 'Invoices': return <InvoicesPage />;
      case 'Delivery': return <DeliveriesPage />;
      case 'InventoryChecks': return <InventoryChecksPage />;
      case 'CashFlow': return <CashFlowPage />;
      case 'Debt': return <DebtPage />;
      case 'Tax': return <TaxPage />;
      case 'Reports': return <ReportsPage />;
      case 'Users': return <UsersPage />;
      case 'Settings': return <SettingsPage />;
      default: return <DashboardPage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <>
      <Toaster position="top-right" toastOptions={{ className: 'dark:bg-slate-800 dark:text-white', style: { background: '#334155', color: '#fff' }, success: { iconTheme: { primary: '#10b981', secondary: 'white' } }, error: { iconTheme: { primary: '#ef4444', secondary: 'white' } } }} />
      
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
        <Sidebar currentPage={currentPage} setCurrentPage={handleSetCurrentPage} onLogout={logout} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="lg:hidden flex justify-between items-center bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 h-14 flex-shrink-0">
            <button onClick={() => setIsSidebarOpen(true)} className="text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"><FiMenu className="h-6 w-6" /></button>
            <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200">{pageTitles[currentPage]}</h1>
            <UserDropdown />
          </header>
          <main className="flex-1 overflow-x-hidden overflow-y-auto">
            <div className="container mx-auto px-4 sm:px-6 py-6">{renderPage()}</div>
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
    </>
  );
};

export default App;