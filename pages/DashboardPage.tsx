

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { FiDollarSign, FiShoppingCart, FiUsers, FiArchive, FiSearch, FiBell, FiAlertCircle } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
import DrillDownModal from '../components/DrillDownModal';
import UserDropdown from '../components/UserDropdown';
import type { Invoice, Page, Customer } from '../types';

// Chart.js is loaded from a script tag, so we can declare it
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
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">{value}</p>
            </div>
            <div className={`rounded-full p-3 ${color}`}>
                {icon}
            </div>
        </Tag>
    );
};

const DebtDistributionChart: React.FC<{ onCustomerClick: (customerId: string) => void }> = ({ onCustomerClick }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);
    const { customers, theme } = useAppContext();

    useEffect(() => {
        if (chartRef.current && customers) {
            const debtors = customers.filter(c => c.debt > 0).sort((a, b) => b.debt - a.debt);
            const top = debtors.slice(0, 4);
            const otherDebt = debtors.slice(4).reduce((sum, c) => sum + c.debt, 0);

            const labels = top.map(c => c.name);
            const data = top.map(c => c.debt);

            if (otherDebt > 0) {
                labels.push('Khách hàng khác');
                data.push(otherDebt);
            }

            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
            
            if (labels.length === 0) return;

            const ctx = chartRef.current.getContext('2d');
            if (!ctx) return;
            
            const legendColor = theme === 'dark' ? '#cbd5e1' : '#475569';

            chartInstance.current = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels,
                    datasets: [{
                        label: 'Công nợ',
                        data,
                        backgroundColor: [
                            '#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#64748b'
                        ],
                        hoverOffset: 4,
                        borderColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: legendColor
                            }
                        },
                        tooltip: {
                             callbacks: {
                                label: function(context: any) {
                                    let label = context.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed !== null) {
                                        label += new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.parsed);
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                     onClick: (_, elements) => {
                        if (elements.length > 0) {
                            const elementIndex = elements[0].index;
                            const clickedLabel = chartInstance.current.data.labels[elementIndex];
                            
                            if (clickedLabel === 'Khách hàng khác') return;

                            const customer = top.find(c => c.name === clickedLabel);
                            if (customer) {
                                onCustomerClick(customer.id);
                            }
                        }
                    },
                    onHover: (event: any, chartElement: any) => {
                       if (event.native) {
                           event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
                       }
                    }
                }
            });

            return () => {
                if (chartInstance.current) {
                    chartInstance.current.destroy();
                }
            };
        }
    }, [customers, onCustomerClick, theme]);

     if (customers.filter(c => c.debt > 0).length === 0) {
         return (
             <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col h-full">
                <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Phân tích Công nợ</h4>
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-slate-400 dark:text-slate-500">Không có khách hàng nào đang nợ.</p>
                </div>
            </div>
         )
     }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 h-full">
            <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Phân tích Công nợ</h4>
            <div className="mt-4 h-60">
                <canvas ref={chartRef}></canvas>
            </div>
        </div>
    );
};

const LowStockProducts: React.FC<{ setCurrentPage: (page: Page) => void }> = ({ setCurrentPage }) => {
    const { products } = useAppContext();
    const lowStockProducts = products.filter(p => p.stock < 50).sort((a,b) => a.stock - b.stock).slice(0, 5);

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col">
            <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Sản phẩm sắp hết hàng</h4>
            <div className="mt-4 space-y-1 flex-1">
                {lowStockProducts.length > 0 ? lowStockProducts.map(product => (
                    <button 
                      key={product.id} 
                      onClick={() => setCurrentPage('Products')}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex justify-between items-center text-sm"
                    >
                       <div>
                         <p className="font-medium text-slate-700 dark:text-slate-300">{product.name}</p>
                         <p className="text-xs text-slate-400 dark:text-slate-500">{product.sku}</p>
                       </div>
                        <span className="font-bold text-red-500 bg-red-100 dark:bg-red-500/20 dark:text-red-400 px-2 py-0.5 rounded-full text-xs">{product.stock} {product.unit}</span>
                    </button>
                )) : (
                     <div className="h-full flex items-center justify-center">
                        <p className="text-slate-400 dark:text-slate-500">Không có sản phẩm nào sắp hết hàng.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

type TimeRange = 'this_month' | 'last_month' | 'this_year';

const DashboardPage: React.FC<{ setCurrentPage: (page: Page) => void }> = ({ setCurrentPage }) => {
    const { invoices, customers, products, setPayingCustomerId, theme, currentUser } = useAppContext();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [timeRange, setTimeRange] = useState<TimeRange>('this_month');
    const [drillDownData, setDrillDownData] = useState<{ title: string; invoices: Invoice[] } | null>(null);

    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    const notifications = useMemo(() => {
        const alerts: { id: string, type: 'warning' | 'danger', message: string }[] = [];
        products.forEach(p => {
            if (p.stock > 0 && p.stock < 50) {
                alerts.push({ id: `prod-${p.id}`, type: 'warning', message: `Sản phẩm "${p.name}" sắp hết hàng (còn ${p.stock}).` });
            }
        });
        invoices.forEach(inv => {
            if (inv.status === 'Quá hạn') {
                alerts.push({ id: `inv-${inv.id}`, type: 'danger', message: `Hóa đơn "${inv.invoiceNumber}" cho ${inv.customerName} đã quá hạn.` });
            }
        });
        return alerts;
    }, [products, invoices]);

    const dateFilteredInvoices = useMemo(() => {
        const now = new Date();
        let startDate: Date;
        let endDate: Date = now;

        switch (timeRange) {
            case 'this_month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'last_month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'this_year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
        }

        return invoices.filter(inv => {
            const issueDate = new Date(inv.issueDate);
            return issueDate >= startDate && issueDate <= endDate;
        });
    }, [invoices, timeRange]);

    const { rangeRevenue, rangeNewOrders } = useMemo(() => {
        const revenue = dateFilteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const newOrders = dateFilteredInvoices.length;
        return { rangeRevenue: revenue, rangeNewOrders: newOrders };
    }, [dateFilteredInvoices]);

    const totalProductsInStock = products.reduce((sum, p) => sum + p.stock, 0);

    useEffect(() => {
        if (chartRef.current) {
            const processData = () => {
                const dataMap: Map<string, { revenue: number, invoices: Invoice[] }> = new Map();
                const locale = 'vi-VN';

                dateFilteredInvoices.forEach(invoice => {
                    const date = new Date(invoice.issueDate);
                    let key: string;
                    if (timeRange === 'this_year') {
                        key = date.toLocaleString(locale, { month: '2-digit', year: 'numeric' });
                    } else {
                        key = date.toLocaleDateString(locale);
                    }
                    if (!dataMap.has(key)) {
                        dataMap.set(key, { revenue: 0, invoices: [] });
                    }
                    const entry = dataMap.get(key)!;
                    entry.revenue += invoice.totalAmount;
                    entry.invoices.push(invoice);
                });

                const sortedEntries = Array.from(dataMap.entries()).sort(([keyA], [keyB]) => {
                     const dateA = timeRange === 'this_year' ? new Date(`01/${keyA}`) : new Date(keyA.split('/').reverse().join('-'));
                     const dateB = timeRange === 'this_year' ? new Date(`01/${keyB}`) : new Date(keyB.split('/').reverse().join('-'));
                     return dateA.getTime() - dateB.getTime();
                });
                
                return {
                    labels: sortedEntries.map(([key]) => key),
                    data: sortedEntries.map(([, value]) => value.revenue),
                    invoicesByLabel: sortedEntries.map(([, value]) => value.invoices),
                };
            };
            
            const { labels, data, invoicesByLabel } = processData();
            
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
                             ticks: {
                                color: ticksColor,
                                callback: function(value: any) {
                                    return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
                                }
                            },
                            grid: {
                                color: gridColor,
                            }
                        },
                        x: {
                             ticks: {
                                color: ticksColor
                             },
                             grid: {
                                 display: false
                             }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false,
                        },
                        tooltip: {
                             callbacks: {
                                label: function(context: any) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.parsed.y);
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    onClick: (_, elements) => {
                        if (elements.length > 0) {
                            const elementIndex = elements[0].index;
                            const label = labels[elementIndex];
                            const invoicesForBar = invoicesByLabel[elementIndex];
                            setDrillDownData({
                                title: `Hóa đơn cho ${timeRange === 'this_year' ? `tháng ${label}` : `ngày ${label}`}`,
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

            return () => {
                if (chartInstance.current) {
                    chartInstance.current.destroy();
                }
            };
        }
    }, [dateFilteredInvoices, timeRange, theme]);

    const timeRangeOptions: {key: TimeRange, label: string}[] = [
        { key: 'this_month', label: 'Tháng này' },
        { key: 'last_month', label: 'Tháng trước' },
        { key: 'this_year', label: 'Năm nay' },
    ];


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="hidden lg:flex justify-between items-center">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-200">Tổng quan</h1>
                    <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400 mt-1">Chào mừng trở lại, {currentUser?.email}!</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <input type="text" placeholder="Tìm kiếm..." className="pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg w-64 focus:ring-2 focus:ring-primary-300 focus:outline-none" />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiSearch className="h-5 w-5 text-slate-400" />
                        </div>
                    </div>
                     <div className="relative">
                        <button onClick={() => setIsNotificationsOpen(prev => !prev)} className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                            <FiBell className="h-6 w-6" />
                            {notifications.length > 0 && (
                                <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white"></span>
                            )}
                        </button>
                        {isNotificationsOpen && (
                             <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-10">
                                <div className="p-3 border-b dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200">Thông báo</div>
                                <ul className="py-2 max-h-80 overflow-y-auto">
                                {notifications.length > 0 ? notifications.map(n => (
                                    <li key={n.id} className="flex items-start px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700">
                                        <FiAlertCircle className={`h-5 w-5 mr-3 mt-0.5 ${n.type === 'danger' ? 'text-red-500' : 'text-amber-500'}`} />
                                        <p className="text-sm text-slate-600 dark:text-slate-300">{n.message}</p>
                                    </li>
                                )) : (
                                    <li className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-center">Không có thông báo mới.</li>
                                )}
                                </ul>
                            </div>
                        )}
                    </div>
                    <UserDropdown />
                </div>
            </div>

            {/* Time Range Filter */}
            <div className="flex items-center gap-2">
                {timeRangeOptions.map(opt => (
                     <button 
                        key={opt.key}
                        onClick={() => setTimeRange(opt.key)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${timeRange === opt.key ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'}`}
                    >
                         {opt.label}
                    </button>
                ))}
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Doanh thu" 
                    value={`${rangeRevenue.toLocaleString('vi-VN')}đ`} 
                    icon={<FiDollarSign className="h-6 w-6 text-primary-600" />}
                    color="bg-primary-100 dark:bg-primary-500/20"
                    onClick={() => setCurrentPage('Invoices')}
                />
                <StatCard 
                    title="Đơn hàng mới" 
                    value={rangeNewOrders.toString()} 
                    icon={<FiShoppingCart className="h-6 w-6 text-green-600" />}
                    color="bg-green-100 dark:bg-green-500/20"
                    onClick={() => setCurrentPage('Invoices')}
                />
                <StatCard 
                    title="Tổng khách hàng" 
                    value={customers.length.toString()} 
                    icon={<FiUsers className="w-6 h-6 text-sky-600" />}
                    color="bg-sky-100 dark:bg-sky-500/20"
                    onClick={() => setCurrentPage('Customers')}
                />
                <StatCard 
                    title="Sản phẩm trong kho" 
                    value={totalProductsInStock.toLocaleString('vi-VN')}
                    icon={<FiArchive className="w-6 w-6 text-amber-600" />}
                    color="bg-amber-100 dark:bg-amber-500/20"
                    onClick={() => setCurrentPage('Products')}
                />
            </div>
            
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 h-full">
                        <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Doanh thu theo thời gian</h4>
                        <div className="mt-6 h-80">
                            <canvas ref={chartRef}></canvas>
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    <DebtDistributionChart onCustomerClick={setPayingCustomerId} />
                </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
                <LowStockProducts setCurrentPage={setCurrentPage} />
            </div>
            
            <DrillDownModal data={drillDownData} onClose={() => setDrillDownData(null)} />
        </div>
    );
};

export default DashboardPage;