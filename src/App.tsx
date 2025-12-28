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

// --- 1. Layout chính cho các trang bên trong (Có Sidebar) ---
const MainLayout = () => {
    const { isSidebarOpen } = useAppContext();
    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            {/* Sidebar cố định bên trái */}
            <Sidebar />

            {/* Nội dung chính thay đổi theo Route */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
                <main className="flex-1 p-6 overflow-x-hidden">
                    <Outlet /> {/* Đây là nơi các trang con (Dashboard, Products...) sẽ hiển thị */}
                </main>
            </div>
        </div>
    );
};

// --- 2. Component bảo vệ Route (Yêu cầu đăng nhập) ---
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
    const { isAuthenticated, token } = useAppContext();
    // Nếu không có token -> Đá về trang login
    if (!isAuthenticated && !token) {
        return <Navigate to="/login" replace />;
    }
    // Nếu có children thì render, không thì render Outlet (cho nested route)
    return children ? <>{children}</> : <Outlet />;
};

const App: React.FC = () => {
    const { isAuthenticated, currentUser } = useAppContext();

    return (
        <Routes>
            {/* --- PUBLIC ROUTES (Không cần đăng nhập) --- */}
            <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
            <Route path="/register" element={!isAuthenticated ? <RegisterPage onBackToLogin={() => {}} /> : <Navigate to="/" />} />

            {/* --- PROTECTED ROUTES (Cần đăng nhập) --- */}
            <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                    {/* Đường dẫn gốc -> Dashboard */}
                    <Route path="/" element={<DashboardPage />} />
                    
                    {/* Các trang chức năng */}
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/sales" element={<SalesPage />} />
                    <Route path="/invoices" element={<InvoicesPage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/quotes" element={<QuotesPage />} />
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

            {/* Route không tồn tại -> Quay về Dashboard hoặc trang 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default App;