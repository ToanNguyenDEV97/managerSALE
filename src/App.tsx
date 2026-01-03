// src/App.tsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppContext } from './context/DataContext';
import MainLayout from './components/layout/MainLayout';

// Component Loading
const LoadingFallback = () => (
    <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
);

// Lazy Load Pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const SalesPage = lazy(() => import('./pages/SalesPage'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const QuotesPage = lazy(() => import('./pages/QuotesPage'));
const DeliveriesPage = lazy(() => import('./pages/DeliveriesPage'));
const PurchasesPage = lazy(() => import('./pages/PurchasesPage'));
const InventoryChecksPage = lazy(() => import('./pages/InventoryChecksPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const SuppliersPage = lazy(() => import('./pages/SuppliersPage'));

// --- NHÓM TÀI CHÍNH ---
const CashFlowPage = lazy(() => import('./pages/CashFlowPage'));
const TaxPage = lazy(() => import('./pages/TaxPage')); // <--- MỚI THÊM

const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
    const { isAuthenticated, token } = useAppContext();
    if (!isAuthenticated && !token) return <Navigate to="/login" replace />;
    return <MainLayout />;
};

const App: React.FC = () => {
    const { isAuthenticated } = useAppContext();

    return (
        <Suspense fallback={<LoadingFallback />}>
            <Routes>
                <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
                <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" />} />

                <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/sales" element={<SalesPage />} />
                    <Route path="/invoices" element={<InvoicesPage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/quotes" element={<QuotesPage />} />
                    <Route path="/deliveries" element={<DeliveriesPage />} />
                    <Route path="/purchases" element={<PurchasesPage />} />
                    <Route path="/inventory-checks" element={<InventoryChecksPage />} />
                    <Route path="/customers" element={<CustomersPage />} />
                    <Route path="/suppliers" element={<SuppliersPage />} />
                    
                    {/* --- ROUTE TÀI CHÍNH --- */}
                    <Route path="/cash-flow" element={<CashFlowPage />} />
                    <Route path="/taxes" element={<TaxPage />} /> {/* <--- ROUTE MỚI */}
                    
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Route>

                <Route path="/404" element={<NotFoundPage />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
        </Suspense>
    );
};

export default App;