import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FiTrendingUp, FiPackage, FiUsers, FiDollarSign, FiLoader } from 'react-icons/fi';
import DrillDownModal from '../components/DrillDownModal';

// Import Hooks lấy dữ liệu toàn bộ
import { useAllInvoices } from '../hooks/useInvoices';
import { useAllProducts } from '../hooks/useProducts';
import { useAllCustomers } from '../hooks/useCustomers';

// Chart.js global
declare const Chart: any;

type ReportTab = 'revenue' | 'profit' | 'inventory' | 'debt';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 shadow-sm">
        <div className="bg-primary-50 dark:bg-primary-900/30 p-3 rounded-full text-primary-600 dark:text-primary-400">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-200 mt-1">
                {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
            </p>
        </div>
    </div>
);

const ReportsPage: React.FC = () => {
    // 1. Lấy dữ liệu từ Server
    const { data: invoicesData, isLoading: load1 } = useAllInvoices();
    const { data: productsData, isLoading: load2 } = useAllProducts();
    const { data: customersData, isLoading: load3 } = useAllCustomers();

    const invoices = Array.isArray(invoicesData) ? invoicesData : (invoicesData?.data || []);
    const products = Array.isArray(productsData) ? productsData : (productsData?.data || []);
    const customers = Array.isArray(customersData) ? customersData : (customersData?.data || []);

    const isLoading = load1 || load2 || load3;

    // 2. State UI
    const [activeTab, setActiveTab] = useState<ReportTab>('revenue');
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);
    const [drillDownData, setDrillDownData] = useState<any>(null);

    // 3. Tính toán số liệu
    const stats = useMemo(() => {
        // Doanh thu (Dựa trên tổng tiền hóa đơn)
        const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
        
        // Lợi nhuận (Tổng tiền bán - Tổng giá vốn)
        const totalProfit = invoices.reduce((sum: number, inv: any) => {
            const cost = inv.items.reduce((c: number, item: any) => c + ((item.costPrice || 0) * item.quantity), 0);
            return sum + (inv.totalAmount - cost);
        }, 0);

        // Giá trị tồn kho (Số lượng * Giá vốn)
        const inventoryValue = products.reduce((sum: number, p: any) => sum + (p.stock * p.costPrice), 0);

        // Tổng công nợ phải thu
        const totalDebt = customers.reduce((sum: number, c: any) => sum + c.debt, 0);

        return { totalRevenue, totalProfit, inventoryValue, totalDebt };
    }, [invoices, products, customers]);

    // 4. Vẽ biểu đồ (Effect)
    useEffect(() => {
        if (!chartRef.current || activeTab === 'inventory' || activeTab === 'debt') return;

        // Group data by Date (Last 7 days for demo)
        const labels = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const data = labels.map(date => {
            const dailyInvoices = invoices.filter((inv: any) => inv.issueDate === date);
            if (activeTab === 'revenue') {
                return dailyInvoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
            } else {
                // Profit
                return dailyInvoices.reduce((sum: number, inv: any) => {
                    const cost = inv.items.reduce((c: number, item: any) => c + ((item.costPrice || 0) * item.quantity), 0);
                    return sum + (inv.totalAmount - cost);
                }, 0);
            }
        });

        if (chartInstance.current) chartInstance.current.destroy();

        const ctx = chartRef.current.getContext('2d');
        if (ctx && typeof Chart !== 'undefined') {
            chartInstance.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels.map(d => d.split('-').slice(1).join('/')),
                    datasets: [{
                        label: activeTab === 'revenue' ? 'Doanh thu' : 'Lợi nhuận',
                        data: data,
                        backgroundColor: activeTab === 'revenue' ? '#3b82f6' : '#10b981',
                        borderRadius: 4,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                }
            });
        }
        return () => { if (chartInstance.current) chartInstance.current.destroy(); };
    }, [activeTab, invoices]);

    if (isLoading) return <div className="flex justify-center p-10"><FiLoader className="animate-spin" /></div>;

    // 5. Nội dung từng Tab
    const renderContent = () => {
        switch (activeTab) {
            case 'revenue':
            case 'profit':
                return (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">
                            Biểu đồ {activeTab === 'revenue' ? 'Doanh thu' : 'Lợi nhuận'} (7 ngày gần nhất)
                        </h3>
                        <div className="h-80">
                            <canvas ref={chartRef}></canvas>
                        </div>
                    </div>
                );
            case 'inventory':
                return (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Sản phẩm</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Tồn kho</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Giá vốn</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {products.map((p: any) => (
                                    <tr key={p.id}>
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{p.name}</td>
                                        <td className="px-6 py-4 text-center">{p.stock} {p.unit}</td>
                                        <td className="px-6 py-4 text-right text-slate-500">{p.costPrice.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-bold">{(p.stock * p.costPrice).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'debt':
                return (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Khách hàng</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">SĐT</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Nợ phải thu</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {customers.filter((c: any) => c.debt > 0).map((c: any) => (
                                    <tr key={c.id}>
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{c.name}</td>
                                        <td className="px-6 py-4 text-slate-500">{c.phone}</td>
                                        <td className="px-6 py-4 text-right font-bold text-red-600">{c.debt.toLocaleString()} đ</td>
                                    </tr>
                                ))}
                                {customers.filter((c: any) => c.debt > 0).length === 0 && (
                                    <tr><td colSpan={3} className="text-center py-8 text-slate-500">Không có công nợ.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Thẻ thống kê tổng quan */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Tổng Doanh Thu" value={`${stats.totalRevenue.toLocaleString()} đ`} icon={<FiTrendingUp />} />
                <StatCard title="Lợi Nhuận Ước Tính" value={`${stats.totalProfit.toLocaleString()} đ`} icon={<FiDollarSign />} />
                <StatCard title="Giá Trị Tồn Kho" value={`${stats.inventoryValue.toLocaleString()} đ`} icon={<FiPackage />} />
                <StatCard title="Nợ Phải Thu" value={`${stats.totalDebt.toLocaleString()} đ`} icon={<FiUsers />} />
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                    {[
                        { id: 'revenue', name: 'Doanh thu' },
                        { id: 'profit', name: 'Lợi nhuận' },
                        { id: 'inventory', name: 'Giá trị kho' },
                        { id: 'debt', name: 'Công nợ' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as ReportTab)}
                            className={`
                                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                                ${activeTab === tab.id
                                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }
                            `}
                        >
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Nội dung chi tiết */}
            <div className="min-h-[400px]">
                {renderContent()}
            </div>

            <DrillDownModal data={drillDownData} onClose={() => setDrillDownData(null)} />
        </div>
    );
};

export default ReportsPage;