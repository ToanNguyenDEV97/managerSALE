import React, { useEffect, useRef, useState, useMemo } from 'react';
import { FiDollarSign, FiShoppingCart, FiUsers, FiArchive, FiSearch, FiBell, FiAlertCircle } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
import DrillDownModal from '../components/DrillDownModal';
import UserDropdown from '../components/UserDropdown';
import type { Invoice, PageKey } from '../types';

// Import Hooks "All" mới
import { useAllProducts } from '../hooks/useProducts'; // <-- Đổi dòng này
import { useAllInvoices } from '../hooks/useInvoices'; // <-- Đổi dòng này
import { useAllCustomers } from '../hooks/useCustomers';
import { useAllCashFlow } from '../hooks/useCashFlow'; // <-- Đổi dòng này

// Chart.js global
declare const Chart: any;

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string; onClick?: () => void; }> = ({ title, value, icon, color, onClick }) => {
    const Tag = onClick ? 'button' : 'div';
    return (
        <Tag 
          onClick={onClick}
          className={`bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-left w-full ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-300' : ''}`}
        >
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2">{value}</p>
            </div>
            <div className={`p-4 rounded-full ${color} text-white shadow-sm`}>
                {icon}
            </div>
        </Tag>
    );
};

const DashboardPage: React.FC = () => {
    const { setCurrentPage, isSidebarOpen, setIsOpen, currentUser } = useAppContext();
    
    // --- SỬ DỤNG HOOK LẤY TOÀN BỘ DỮ LIỆU ---
    // (Không truyền tham số page=1 nữa)
    const { data: productsData } = useAllProducts(); 
    const { data: invoicesData } = useAllInvoices();
    const { data: customersData } = useAllCustomers();
    // const { data: cashFlowData } = useAllCashFlow(); // Nếu cần dùng

    // Chuẩn hóa dữ liệu
    const products = Array.isArray(productsData) ? productsData : (productsData?.data || []);
    const invoices = Array.isArray(invoicesData) ? invoicesData : (invoicesData?.data || []);
    const customers = Array.isArray(customersData) ? customersData : (customersData?.data || []);

    const [drillDownData, setDrillDownData] = useState<{ title: string; invoices: Invoice[] } | null>(null);
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    // --- Tính toán thống kê ---
    const stats = useMemo(() => {
        // Tính tổng thực thu từ 1000 hóa đơn gần nhất
        const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + (inv.paidAmount || 0), 0);
        const totalOrders = invoices.length;
        const totalCustomers = customers.length;
        const totalProductsInStock = products.reduce((sum: number, p: any) => sum + (p.stock || 0), 0);

        return { totalRevenue, totalOrders, totalCustomers, totalProductsInStock };
    }, [invoices, customers, products]);

    // --- Biểu đồ ---
    useEffect(() => {
        if (!chartRef.current) return;

        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const revenueData = last7Days.map(date => {
            return invoices
                .filter((inv: any) => inv.issueDate === date)
                .reduce((sum: number, inv: any) => sum + (inv.paidAmount || 0), 0);
        });

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        if (ctx && typeof Chart !== 'undefined') {
            chartInstance.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: last7Days.map(d => d.split('-').slice(1).join('/')),
                    datasets: [{
                        label: 'Doanh thu (VNĐ)',
                        data: revenueData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#10b981',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            padding: 12,
                            titleFont: { size: 13 },
                            bodyFont: { size: 14, weight: 'bold' },
                            callbacks: {
                                label: (context: any) => {
                                    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.raw);
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(148, 163, 184, 0.1)' },
                            ticks: { font: { size: 11 } }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { font: { size: 11 } }
                        }
                    }
                }
            });
        }
        
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [invoices]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Mobile */}
            <div className="lg:hidden flex justify-between items-center mb-6">
                <button onClick={() => setIsOpen(!isSidebarOpen)} className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <div className="font-bold text-lg text-slate-800 dark:text-white">Dashboard</div>
                <UserDropdown />
            </div>

            {/* Header Desktop */}
            <div className="hidden lg:flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Xin chào, {currentUser?.email?.split('@')[0]}! 👋</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Đây là tổng quan tình hình kinh doanh hôm nay.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm nhanh..." 
                            className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all w-64"
                        />
                    </div>
                    <button className="relative p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                        <FiBell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
                    </button>
                </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Doanh thu thực thu" 
                    value={`${stats.totalRevenue.toLocaleString('vi-VN')} đ`}
                    icon={<FiDollarSign className="w-6 h-6" />}
                    color="bg-green-500"
                    onClick={() => {
                        const paidInvoices = invoices.filter((inv: any) => inv.paidAmount > 0);
                        setDrillDownData({ title: 'Hóa đơn có doanh thu', invoices: paidInvoices });
                    }}
                />
                <StatCard 
                    title="Đơn hàng" 
                    value={stats.totalOrders.toString()}
                    icon={<FiShoppingCart className="w-6 h-6" />}
                    color="bg-blue-500"
                    onClick={() => setCurrentPage('Invoices' as PageKey)}
                />
                <StatCard 
                    title="Khách hàng" 
                    value={stats.totalCustomers.toString()}
                    icon={<FiUsers className="w-6 h-6" />}
                    color="bg-purple-500"
                    onClick={() => setCurrentPage('Customers' as PageKey)}
                />
                <StatCard 
                    title="Sản phẩm tồn kho" 
                    value={stats.totalProductsInStock.toLocaleString('vi-VN')}
                    icon={<FiArchive className="w-6 h-6" />}
                    color="bg-amber-500"
                    onClick={() => setCurrentPage('Products' as PageKey)}
                />
            </div>
            
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <FiDollarSign className="text-primary-500" />
                            Biểu đồ doanh thu (7 ngày)
                        </h4>
                    </div>
                    <div className="h-80 relative">
                        <canvas ref={chartRef}></canvas>
                    </div>
                </div>

                {/* Recent Activities / Low Stock */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <FiAlertCircle className="text-red-500" />
                        Cảnh báo tồn kho
                    </h4>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {products.filter((p: any) => p.stock <= 10).length > 0 ? (
                            products
                                .filter((p: any) => p.stock <= 10)
                                .slice(0, 5)
                                .map((p: any) => (
                                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50">
                                        <div>
                                            <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{p.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">SKU: {p.sku}</p>
                                        </div>
                                        <span className="px-2 py-1 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 text-xs font-bold rounded shadow-sm border border-red-100 dark:border-red-900">
                                            {p.stock} {p.unit}
                                        </span>
                                    </div>
                                ))
                        ) : (
                            <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                                <FiArchive className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>Kho hàng ổn định</p>
                            </div>
                        )}
                        {products.filter((p: any) => p.stock <= 10).length > 5 && (
                             <button 
                                onClick={() => setCurrentPage('Products' as PageKey)}
                                className="w-full text-center text-xs text-primary-600 hover:text-primary-700 mt-2 font-medium"
                             >
                                Xem tất cả...
                             </button>
                        )}
                    </div>
                </div>
            </div>
            
            <DrillDownModal data={drillDownData} onClose={() => setDrillDownData(null)} />
        </div>
    );
};

export default DashboardPage;