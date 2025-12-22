import React, { useState } from 'react';
import { FiPlus, FiEye, FiSearch, FiFileText, FiFilter } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useOrders } from '../hooks/useOrders';
import Pagination from '../components/Pagination';

// Thêm import hook context
import { useAppContext } from '../context/DataContext';

const OrdersPage: React.FC = () => {
    const { setCurrentPage } = useAppContext();
    const [page, setPage] = useState(1);
    const { data: ordersData, isLoading } = useOrders(page);
    
    const orders = ordersData?.data || [];
    const totalPages = ordersData?.totalPages || 1;

    // Hàm tô màu trạng thái cho đẹp
    const getStatusColor = (status: string) => {
        switch(status) {
            case 'Mới': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Đang xử lý': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Đang giao': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Hoàn thành': return 'bg-green-100 text-green-700 border-green-200';
            case 'Hủy': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 1. HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FiFileText className="text-primary-600"/> Quản lý Đơn đặt hàng
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Theo dõi đơn hàng bán buôn & đặt trước</p>
                </div>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => setCurrentPage('OrderCreate')} 
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm transition-all active:scale-95"
                    >
                        <FiPlus size={20} />
                        <span>Tạo Đơn Mới</span>
                    </button>
                </div>
            </div>

            {/* 2. BỘ LỌC (Giao diện mẫu) */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-4">
                <div className="relative flex-1 max-w-sm">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Tìm mã đơn, tên khách..." className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <button className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-slate-50">
                    <FiFilter /> Lọc trạng thái
                </button>
            </div>

            {/* 3. DANH SÁCH ĐƠN HÀNG */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Mã đơn</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Ngày tạo</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Khách hàng</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Tổng tiền</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">Trạng thái</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {isLoading ? (
                            <tr><td colSpan={6} className="text-center py-8 text-slate-500">Đang tải dữ liệu...</td></tr>
                        ) : orders.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-slate-500 italic">Chưa có đơn hàng nào.</td></tr>
                        ) : orders.map((order: any) => (
                            <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-primary-600">{order.orderNumber}</td>
                                <td className="px-6 py-4 text-sm">{new Date(order.issueDate).toLocaleDateString('vi-VN')}</td>
                                <td className="px-6 py-4 font-medium">{order.customerName || 'Khách lẻ'}</td>
                                <td className="px-6 py-4 text-right font-bold">{order.totalAmount.toLocaleString()}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Xem chi tiết">
                                        <FiEye size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="p-4 border-t">
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={100} itemsPerPage={10} />
                </div>
            </div>
        </div>
    );
};

export default OrdersPage;