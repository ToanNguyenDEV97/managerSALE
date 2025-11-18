
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FiTrendingUp, FiPackage, FiUsers, FiPrinter, FiDollarSign, FiFileText } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
import type { Invoice, Product, Customer, InvoiceItem } from '../types';
import DrillDownModal from '../components/DrillDownModal';

// Chart.js is loaded from a script tag, so we can declare it
declare const Chart: any;

type ReportTab = 'revenue' | 'profit' | 'inventory' | 'debt';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
        <div className="bg-primary-100 dark:bg-primary-500/20 p-3 rounded-full text-primary-600">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-200 mt-1">{typeof value === 'number' ? value.toLocaleString('vi-VN') : value}</p>
        </div>
    </div>
);

interface RevenueReportProps {
    startDate: string;
    endDate: string;
    setDrillDownData: React.Dispatch<React.SetStateAction<{ title: string; invoices: Invoice[] } | null>>;
}

const RevenueReport: React.FC<RevenueReportProps> = ({ startDate, endDate, setDrillDownData }) => {
    const { invoices, products, customers, theme } = useAppContext();
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    const filteredInvoices = useMemo(() => {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        return invoices.filter(inv => {
            const invDate = new Date(inv.issueDate).getTime();
            return invDate >= start && invDate <= end + 86400000; // Include end day
        });
    }, [invoices, startDate, endDate]);

    const revenueData = useMemo(() => {
        const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const totalInvoices = filteredInvoices.length;
        const avgOrderValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

        const topProductsMap: Map<string, { product: Product | undefined, revenue: number }> = new Map();
        for (const inv of filteredInvoices) {
            for (const item of inv.items) {
                if (!topProductsMap.has(item.productId)) {
                    topProductsMap.set(item.productId, {
                        product: products.find(p => p.id === item.productId),
                        revenue: 0,
                    });
                }
                const entry = topProductsMap.get(item.productId)!;
                entry.revenue += item.price * item.quantity;
            }
        }

        const topCustomersMap: Map<string, { customer: Customer | undefined, revenue: number }> = new Map();
        for (const inv of filteredInvoices) {
            if (!topCustomersMap.has(inv.customerId)) {
                topCustomersMap.set(inv.customerId, {
                    customer: customers.find(c => c.id === inv.customerId),
                    revenue: 0,
                });
            }
            const entry = topCustomersMap.get(inv.customerId)!;
            entry.revenue += inv.totalAmount;
        }

        return {
            totalRevenue,
            totalInvoices,
            avgOrderValue,
            topProducts: Array.from(topProductsMap.values())
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5),
            topCustomers: Array.from(topCustomersMap.values())
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5),
        };
    }, [filteredInvoices, products, customers]);

     useEffect(() => {
        if (chartRef.current) {
            const revenueByDate: Record<string, { revenue: number, invoices: Invoice[] }> = {};
            for (const inv of filteredInvoices) {
                const date = inv.issueDate;
                if (!revenueByDate[date]) {
                    revenueByDate[date] = { revenue: 0, invoices: [] };
                }
                revenueByDate[date].revenue += inv.totalAmount;
                revenueByDate[date].invoices.push(inv);
            }

            const sortedDates = Object.keys(revenueByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
            
            const labels = sortedDates;
            const data = sortedDates.map(date => revenueByDate[date].revenue);
            const invoicesByLabel = sortedDates.map(date => revenueByDate[date].invoices);

            
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
            const ctx = chartRef.current.getContext('2d');
            if (!ctx) return;
            
            const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            const ticksColor = theme === 'dark' ? '#cbd5e1' : '#64748b';
            
            chartInstance.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Doanh thu',
                        data,
                        backgroundColor: 'rgba(16, 185, 129, 0.6)',
                        borderColor: 'rgba(5, 150, 105, 1)',
                        borderWidth: 1,
                        borderRadius: 5,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { 
                        y: { 
                            beginAtZero: true, 
                            ticks: { color: ticksColor, callback: (v: any) => `${(v/1000000).toLocaleString('vi-VN')} Tr` },
                            grid: { color: gridColor },
                        },
                        x: {
                            ticks: { color: ticksColor },
                            grid: { display: false },
                        } 
                    },
                    plugins: { legend: { display: false } },
                    onClick: (_, elements) => {
                        if (elements.length > 0) {
                            const elementIndex = elements[0].index;
                            const label = labels[elementIndex];
                            const invoicesForBar = invoicesByLabel[elementIndex];
                            setDrillDownData({
                                title: `Hóa đơn ngày ${new Date(label).toLocaleDateString('vi-VN')}`,
                                invoices: invoicesForBar,
                            });
                        }
                    },
                     onHover: (event: any, chartElement: any) => {
                       if (event.native) {
                           event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
                       }
                    }
                }
            });
             return () => { if (chartInstance.current) chartInstance.current.destroy(); };
        }
    }, [filteredInvoices, setDrillDownData, theme]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Tổng doanh thu" value={`${revenueData.totalRevenue.toLocaleString('vi-VN')}đ`} icon={<FiDollarSign className="w-6 h-6"/>} />
                <StatCard title="Tổng số hóa đơn" value={revenueData.totalInvoices} icon={<FiFileText className="w-6 h-6"/>} />
                <StatCard title="Giá trị trung bình/HĐ" value={`${revenueData.avgOrderValue.toLocaleString('vi-VN', {maximumFractionDigits: 0})}đ`} icon={<FiTrendingUp className="w-6 h-6"/>} />
            </div>
             <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Doanh thu theo ngày</h4>
                <div className="mt-4 h-80"><canvas ref={chartRef}></canvas></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                     <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Top 5 sản phẩm bán chạy</h4>
                     <ul className="mt-4 space-y-2">
                        {revenueData.topProducts.map(item => (
                            <li key={item.product?.id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700">
                               <span className="text-slate-700 dark:text-slate-300">{item.product?.name || 'Sản phẩm đã xóa'}</span>
                               <span className="font-semibold text-slate-800 dark:text-slate-100">{item.revenue.toLocaleString('vi-VN')}đ</span>
                            </li>
                        ))}
                     </ul>
                 </div>
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                     <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Top 5 khách hàng</h4>
                     <ul className="mt-4 space-y-2">
                         {revenueData.topCustomers.map(item => (
                            <li key={item.customer?.id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700">
                               <span className="text-slate-700 dark:text-slate-300">{item.customer?.name || 'Khách hàng đã xóa'}</span>
                               <span className="font-semibold text-slate-800 dark:text-slate-100">{item.revenue.toLocaleString('vi-VN')}đ</span>
                            </li>
                        ))}
                     </ul>
                 </div>
            </div>
        </div>
    );
};

const ProfitReport: React.FC<{ startDate: string; endDate: string; }> = ({ startDate, endDate }) => {
    const { invoices, cashFlowTransactions } = useAppContext();

    const reportData = useMemo(() => {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime() + 86400000;

        const filteredInvoices = invoices.filter(inv => {
            const invDate = new Date(inv.issueDate).getTime();
            return invDate >= start && invDate <= end;
        });

        const filteredExpenses = cashFlowTransactions.filter(t => {
            const tDate = new Date(t.date).getTime();
            return t.type === 'chi' && tDate >= start && tDate <= end;
        });
        
        const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        
        const totalCogs = filteredInvoices.reduce((sum, inv) => {
            const invoiceCogs = inv.items.reduce((itemSum, item) => itemSum + (item.costPrice * item.quantity), 0);
            return sum + invoiceCogs;
        }, 0);

        const grossProfit = totalRevenue - totalCogs;
        
        const totalExpenses = filteredExpenses.reduce((sum, t) => sum + t.amount, 0);

        const netProfit = grossProfit - totalExpenses;

        return { totalRevenue, totalCogs, grossProfit, totalExpenses, netProfit };
    }, [invoices, cashFlowTransactions, startDate, endDate]);

    const renderValue = (value: number) => {
        const color = value >= 0 ? 'text-slate-800 dark:text-slate-200' : 'text-red-600';
        return <p className={`text-xl font-bold ${color} mt-1`}>{value.toLocaleString('vi-VN')}đ</p>;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                 <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tổng Doanh thu</p>
                    {renderValue(reportData.totalRevenue)}
                </div>
                 <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tổng Giá vốn</p>
                    {renderValue(reportData.totalCogs)}
                </div>
                 <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Lợi nhuận gộp</p>
                    {renderValue(reportData.grossProfit)}
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tổng Chi phí</p>
                    {renderValue(reportData.totalExpenses)}
                </div>
                 <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Lợi nhuận ròng</p>
                    {renderValue(reportData.netProfit)}
                </div>
            </div>
        </div>
    );
};

const InventoryReport: React.FC = () => {
    const { products } = useAppContext();
    const [sortConfig, setSortConfig] = useState<{ key: keyof Product | 'value'; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

    const inventoryData = useMemo(() => {
        const totalStockValue = products.reduce((sum, p) => sum + p.stock * p.price, 0);
        const totalProducts = products.length;
        return { totalStockValue, totalProducts };
    }, [products]);
    
    const sortedProducts = useMemo(() => {
        return [...products].sort((a, b) => {
            const key = sortConfig.key;
            const directionMultiplier = sortConfig.direction === 'asc' ? 1 : -1;

            if (key === 'value') {
                const valA = a.stock * a.price;
                const valB = b.stock * b.price;
                return (valA - valB) * directionMultiplier;
            }

            const valA = a[key];
            const valB = b[key];

            if (typeof valA === 'string' && typeof valB === 'string') {
                return valA.localeCompare(valB) * directionMultiplier;
            }
            
            if (typeof valA === 'number' && typeof valB === 'number') {
                 return (valA - valB) * directionMultiplier;
            }
            
            return 0;
        });
    }, [products, sortConfig]);

    const requestSort = (key: keyof Product | 'value') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard title="Tổng số sản phẩm" value={inventoryData.totalProducts} icon={<FiPackage className="w-6 h-6"/>} />
                <StatCard title="Tổng giá trị tồn kho" value={`${inventoryData.totalStockValue.toLocaleString('vi-VN')}đ`} icon={<FiDollarSign className="w-6 h-6"/>} />
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-primary-50 dark:bg-slate-700">
                            <tr>
                                {['sku', 'name', 'stock', 'value'].map(key => (
                                    <th key={key} className="p-3 text-left font-semibold text-primary-800 dark:text-primary-300 uppercase">
                                        <button onClick={() => requestSort(key as any)} className="flex items-center gap-1">
                                            {key === 'sku' ? 'Mã SKU' : key === 'name' ? 'Tên sản phẩm' : key === 'stock' ? 'Tồn kho' : 'Giá trị tồn kho'}
                                        </button>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedProducts.map(p => (
                                <tr key={p.id} className="border-b dark:border-slate-600 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700">
                                    <td className="p-3 text-slate-700 dark:text-slate-300">{p.sku}</td>
                                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{p.name}</td>
                                    <td className="p-3 text-slate-700 dark:text-slate-300">{p.stock.toLocaleString('vi-VN')} {p.unit}</td>
                                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{(p.stock * p.price).toLocaleString('vi-VN')}đ</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const DebtReport: React.FC = () => {
    const { customers, invoices } = useAppContext();
    const today = new Date();

    const debtData = useMemo(() => {
        const customersWithDebt = customers.filter(c => c.debt > 0);
        const totalDebt = customersWithDebt.reduce((sum, c) => sum + c.debt, 0);

        const debtAnalysis = customersWithDebt.map(customer => {
            const customerInvoices = invoices.filter(inv => inv.customerId === customer.id && inv.status !== 'Đã thanh toán');
            let age_0_30 = 0, age_30_60 = 0, age_60_plus = 0;
            
            customerInvoices.forEach(inv => {
                const diffDays = (today.getTime() - new Date(inv.issueDate).getTime()) / (1000 * 3600 * 24);
                const remaining = inv.totalAmount - inv.paidAmount;
                if (diffDays <= 30) age_0_30 += remaining;
                else if (diffDays <= 60) age_30_60 += remaining;
                else age_60_plus += remaining;
            });

            return { customer, age_0_30, age_30_60, age_60_plus };
        });

        return { totalDebt, totalDebtors: customersWithDebt.length, debtAnalysis };
    }, [customers, invoices]);

    return (
         <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard title="Tổng công nợ" value={`${debtData.totalDebt.toLocaleString('vi-VN')}đ`} icon={<FiDollarSign className="w-6 h-6"/>} />
                <StatCard title="Số khách hàng nợ" value={debtData.totalDebtors} icon={<FiUsers className="w-6 h-6"/>} />
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-primary-50 dark:bg-slate-700">
                            <tr>
                                <th className="p-3 text-left font-semibold text-primary-800 dark:text-primary-300 uppercase">Khách hàng</th>
                                <th className="p-3 text-right font-semibold text-primary-800 dark:text-primary-300 uppercase">Tổng nợ</th>
                                <th className="p-3 text-right font-semibold text-primary-800 dark:text-primary-300 uppercase">Nợ &lt; 30 ngày</th>
                                <th className="p-3 text-right font-semibold text-primary-800 dark:text-primary-300 uppercase">Nợ 30-60 ngày</th>
                                <th className="p-3 text-right font-semibold text-primary-800 dark:text-primary-300 uppercase">Nợ &gt; 60 ngày</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-700 dark:text-slate-300">
                             {debtData.debtAnalysis.map(({ customer, ...ages }) => (
                                <tr key={customer.id} className="border-b dark:border-slate-600 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700">
                                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{customer.name}</td>
                                    <td className="p-3 text-right font-bold text-red-600">{customer.debt.toLocaleString('vi-VN')}đ</td>
                                    <td className="p-3 text-right">{ages.age_0_30 > 0 ? ages.age_0_30.toLocaleString('vi-VN') + 'đ' : '-'}</td>
                                    <td className="p-3 text-right">{ages.age_30_60 > 0 ? ages.age_30_60.toLocaleString('vi-VN') + 'đ' : '-'}</td>
                                    <td className="p-3 text-right">{ages.age_60_plus > 0 ? ages.age_60_plus.toLocaleString('vi-VN') + 'đ' : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const ReportsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ReportTab>('revenue');
    const [startDate, setStartDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [drillDownData, setDrillDownData] = useState<{ title: string; invoices: Invoice[] } | null>(null);


    const tabs: { id: ReportTab; name: string; icon: React.ReactNode }[] = [
        { id: 'revenue', name: 'Báo cáo Doanh thu', icon: <FiTrendingUp /> },
        { id: 'profit', name: 'Báo cáo Lợi nhuận', icon: <FiDollarSign /> },
        { id: 'inventory', name: 'Báo cáo Tồn kho', icon: <FiPackage /> },
        { id: 'debt', name: 'Báo cáo Công nợ', icon: <FiUsers /> },
    ];
    
    const renderContent = () => {
        switch (activeTab) {
            case 'revenue': return <RevenueReport startDate={startDate} endDate={endDate} setDrillDownData={setDrillDownData} />;
            case 'profit': return <ProfitReport startDate={startDate} endDate={endDate} />;
            case 'inventory': return <InventoryReport />;
            case 'debt': return <DebtReport />;
            default: return null;
        }
    };

    return (
        <>
        <style>
        {`
            @media print {
                body * {
                    visibility: hidden;
                }
                .printable-area, .printable-area * {
                    visibility: visible;
                }
                .printable-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                }
                .no-print {
                    display: none;
                }
            }
        `}
        </style>
        <div className="space-y-6">
            <div className="no-print flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="hidden lg:block">
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-200">Báo cáo & Thống kê</h1>
                    <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400 mt-1">Phân tích chi tiết tình hình kinh doanh của bạn.</p>
                </div>
                <button
                    onClick={() => window.print()}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg bg-primary-600 hover:bg-primary-700 shadow-md"
                >
                    <FiPrinter />
                    <span>In báo cáo</span>
                </button>
            </div>
            
             <div className="no-print bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-auto">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Từ ngày</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 sm:text-sm"/>
                </div>
                 <div className="w-full sm:w-auto">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Đến ngày</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 sm:text-sm"/>
                </div>
            </div>

            <div className="no-print border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === tab.id
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-500'
                            }`}
                        >
                            {tab.icon}
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="printable-area">
                <div className="md:hidden mb-4 no-print">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{tabs.find(t=>t.id === activeTab)?.name}</h3>
                </div>
                {renderContent()}
            </div>
        </div>
        <DrillDownModal data={drillDownData} onClose={() => setDrillDownData(null)} />
        </>
    );
};

export default ReportsPage;
