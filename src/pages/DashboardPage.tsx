import React, { useEffect, useState } from 'react';
import { 
    FiDollarSign, FiShoppingCart, FiTrendingUp, FiArchive, 
    FiLoader, FiPieChart, FiBarChart2, FiActivity 
} from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
import { api } from '../utils/api';
import UserDropdown from '../components/UserDropdown';
import { useNavigate } from 'react-router-dom';

// Import Chart.js (Thư viện biểu đồ)
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Đăng ký các thành phần biểu đồ
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const DashboardPage: React.FC = () => {
    const { isSidebarOpen, setIsOpen, currentUser } = useAppContext();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    
    // State lưu dữ liệu
    const [stats, setStats] = useState<any>({});
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [orderStatus, setOrderStatus] = useState<any[]>([]);

    // Gọi API khi vào trang
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Gọi song song 4 API để tiết kiệm thời gian
                const [resStats, resRevenue, resProducts, resStatus] = await Promise.all([
                    api('/api/dashboard/stats'),
                    api('/api/dashboard/chart-revenue'),
                    api('/api/dashboard/chart-products'),
                    api('/api/dashboard/chart-status')
                ]);
                
                setStats(resStats || {});
                setRevenueData(resRevenue || []);
                setTopProducts(resProducts || []);
                setOrderStatus(resStatus || []);
            } catch (error) {
                console.error("Lỗi tải dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // --- CẤU HÌNH DỮ LIỆU BIỂU ĐỒ ---
    
    // 1. Biểu đồ Đường: Doanh thu 7 ngày
    const lineChartData = {
        labels: revenueData.map(d => d._id),
        datasets: [{
            label: 'Doanh thu (VNĐ)',
            data: revenueData.map(d => d.total),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
        }]
    };

    // 2. Biểu đồ Cột Ngang: Top 5 Sản phẩm
    const barChartData = {
        labels: topProducts.map(p => p._id),
        datasets: [{
            label: 'Số lượng bán',
            data: topProducts.map(p => p.qty),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderRadius: 4,
            barThickness: 20
        }]
    };

    // 3. Biểu đồ Tròn: Trạng thái đơn hàng
    const doughnutData = {
        labels: orderStatus.map(s => s._id),
        datasets: [{
            data: orderStatus.map(s => s.count),
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6'],
            borderWidth: 0
        }]
    };

    const formatVND = (num: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

    if (loading) return <div className="h-screen flex justify-center items-center"><FiLoader className="animate-spin text-3xl text-primary-600"/></div>;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="lg:hidden"><button onClick={() => setIsOpen(!isSidebarOpen)}><FiActivity/></button></div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Tổng quan kinh doanh 🚀</h2>
                    <p className="text-slate-500 text-sm">Chào {currentUser?.name || 'bạn'}, chúc ngày mới tốt lành!</p>
                </div>
                <UserDropdown />
            </div>

            {/* 4 THẺ SỐ LIỆU TỔNG QUAN */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Doanh thu hôm nay" value={formatVND(stats.revenueToday)} 
                    icon={<FiDollarSign className="w-6 h-6"/>} color="bg-green-500" 
                    onClick={() => navigate('/invoices')} 
                />
                <StatCard 
                    title="Đơn hàng hôm nay" value={stats.ordersToday} 
                    icon={<FiShoppingCart className="w-6 h-6"/>} color="bg-blue-500" 
                    onClick={() => navigate('/invoices')} 
                />
                <StatCard 
                    title="Dòng tiền (Tháng)" value={formatVND(stats.incomeMonth)} 
                    sub={`Chi: ${formatVND(stats.expenseMonth)}`}
                    icon={<FiTrendingUp className="w-6 h-6"/>} color="bg-purple-500" 
                    onClick={() => navigate('/cash-flow')} 
                />
                <StatCard 
                    title="Cảnh báo tồn kho" value={stats.lowStockCount} 
                    icon={<FiArchive className="w-6 h-6"/>} 
                    color={stats.lowStockCount > 0 ? "bg-red-500" : "bg-emerald-500"} 
                    onClick={() => navigate('/products')} 
                />
            </div>

            {/* KHU VỰC BIỂU ĐỒ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Biểu đồ doanh thu (Chiếm 2 cột) */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-lg mb-4 text-slate-700 dark:text-white flex items-center gap-2">
                        <FiTrendingUp/> Xu hướng doanh thu (7 ngày)
                    </h3>
                    <div className="h-72">
                        {revenueData.length > 0 ? (
                            <Line data={lineChartData} options={{ maintainAspectRatio: false, responsive: true }} />
                        ) : (
                            <EmptyChart msg="Chưa có doanh thu tuần này" />
                        )}
                    </div>
                </div>

                {/* 2. Biểu đồ trạng thái đơn (Chiếm 1 cột) */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-lg mb-4 text-slate-700 dark:text-white flex items-center gap-2">
                        <FiPieChart/> Trạng thái đơn hàng
                    </h3>
                    <div className="h-64 flex justify-center relative">
                        {orderStatus.length > 0 ? (
                            <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
                        ) : (
                            <EmptyChart msg="Chưa có đơn hàng" />
                        )}
                    </div>
                </div>

                {/* 3. Biểu đồ Top sản phẩm (Chiếm full chiều rộng ở dưới) */}
                <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-lg mb-4 text-slate-700 dark:text-white flex items-center gap-2">
                        <FiBarChart2/> Top 5 Sản phẩm bán chạy nhất
                    </h3>
                    <div className="h-64">
                        {topProducts.length > 0 ? (
                            <Bar 
                                data={barChartData} 
                                options={{ 
                                    maintainAspectRatio: false, 
                                    indexAxis: 'y', // Biểu đồ ngang
                                    plugins: { legend: { display: false } } 
                                }} 
                            />
                        ) : (
                            <EmptyChart msg="Chưa bán được sản phẩm nào" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Component con hỗ trợ hiển thị
const StatCard: React.FC<any> = ({ title, value, sub, icon, color, onClick }) => (
    <div onClick={onClick} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-all flex justify-between items-center group">
        <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1 group-hover:text-primary-600 transition-colors">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-4 rounded-full ${color} text-white shadow-lg shadow-${color}/30 transform group-hover:scale-110 transition-transform`}>{icon}</div>
    </div>
);

const EmptyChart = ({ msg }: { msg: string }) => (
    <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-lg">
        <FiActivity className="w-10 h-10 mb-2 opacity-20"/>
        <p className="text-sm">{msg}</p>
    </div>
);

export default DashboardPage;