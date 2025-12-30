import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAppContext } from './context/DataContext';

// Components
import Sidebar from './components/Sidebar';

// Pages
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import SalesPage from './pages/SalesPage';
import InvoicesPage from './pages/InvoicesPage';
import OrdersPage from './pages/OrdersPage';
import QuotesPage from './pages/QuotesPage';
import DeliveriesPage from './pages/DeliveriesPage'; // [1] Import trang Giao hàng
import PurchasesPage from './pages/PurchasesPage';
import InventoryChecksPage from './pages/InventoryChecksPage';
import CustomersPage from './pages/CustomersPage';
import SuppliersPage from './pages/SuppliersPage';
import CashFlowPage from './pages/CashFlowPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

const MainLayout = () => {
    const { isSidebarOpen } = useAppContext();
    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            <Sidebar />
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
                <main className="flex-1 p-6 overflow-x-hidden">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
    const { isAuthenticated, token } = useAppContext();
    if (!isAuthenticated && !token) {
        return <Navigate to="/login" replace />;
    }
    return children ? <>{children}</> : <Outlet />;
};

const App: React.FC = () => {
    const { isAuthenticated } = useAppContext();

    return (
        <Routes>
            <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
            <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" />} />

            <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                    <Route path="/" element={<DashboardPage />} />
                    
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/sales" element={<SalesPage />} />
                    <Route path="/invoices" element={<InvoicesPage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/quotes" element={<QuotesPage />} />
                    
                    {/* [2] Thêm Route Giao hàng vào đây */}
                    <Route path="/deliveries" element={<DeliveriesPage />} />

                    <Route path="/purchases" element={<PurchasesPage />} />
                    <Route path="/inventory-checks" element={<InventoryChecksPage />} />
                    <Route path="/customers" element={<CustomersPage />} />
                    <Route path="/suppliers" element={<SuppliersPage />} />
                    <Route path="/cash-flow" element={<CashFlowPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default App;