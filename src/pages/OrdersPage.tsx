import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiEye, FiTrash2, FiTruck, FiLoader, FiFilter } from 'react-icons/fi';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import Pagination from '../components/common/Pagination';
import OrderFormModal from '../components/features/sales/OrderFormModal';
import OrderDetailsModal from '../components/OrderDetailsModal';
import { useAppContext } from '../context/DataContext';

// Định nghĩa kiểu dữ liệu đơn giản cho Order
interface Order {
    _id: string;
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    depositAmount: number;
    status: string;
    createdAt: string;
    isDelivery: boolean;
}

const OrdersPage: React.FC = () => {
    const { userPermissions } = useAppContext();
    
    // State quản lý dữ liệu và giao diện
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // State mở Modal tạo mới
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    // Hàm tải danh sách đơn hàng
    const fetchOrders = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(), limit: '10', search: searchTerm, status: statusFilter
            });
            const res = await api(`/api/orders?${query.toString()}`);
            setOrders(res.data || []);
            setTotalPages(res.totalPages || 1);
        } catch (err: any) { toast.error(err.message); } 
        finally { setLoading(false); }
    };

    // Tự động tải lại khi filter thay đổi
    useEffect(() => {
        const timer = setTimeout(fetchOrders, 300);
        return () => clearTimeout(timer);
    }, [page, searchTerm, statusFilter]);

    // Hàm lấy màu sắc cho trạng thái
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Mới': return 'bg-blue-100 text-blue-700';
            case 'Đang xử lý': return 'bg-yellow-100 text-yellow-700';
            case 'Hoàn thành': return 'bg-green-100 text-green-700';
            case 'Hủy': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    // Hàm hủy đơn (Soft delete)
    const handleCancelOrder = async (id: string) => {
        if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
        try {
            await api(`/api/orders/${id}`, { 
                method: 'PUT', 
                body: JSON.stringify({ status: 'Hủy' }) 
            });
            toast.success('Đã hủy đơn hàng');
            fetchOrders(); // Tải lại danh sách
        } catch (err: any) {
            toast.error(err.message || 'Lỗi khi hủy đơn');
        }
    };

    return (
        <div className="p-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Quản Lý Đơn Đặt Hàng</h1>
                <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all">
                    <FiPlus size={20}/> Tạo Đơn Mới
                </button>
            </div>

            {/* Filters ... (Giữ nguyên phần filter) */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-4 mb-6">
                <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-3 text-slate-400"/>
                    <input type="text" placeholder="Tìm kiếm..." className="w-full pl-10 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <select className="border rounded-lg px-4" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">Tất cả</option>
                    <option value="Mới">Mới</option>
                    <option value="Đang xử lý">Đang xử lý</option>
                    <option value="Hoàn thành">Hoàn thành</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs">
                        <tr>
                            <th className="px-6 py-4">Mã Đơn</th>
                            <th className="px-6 py-4">Khách Hàng</th>
                            <th className="px-6 py-4">Ngày Tạo</th>
                            <th className="px-6 py-4 text-right">Tổng Tiền</th>
                            <th className="px-6 py-4 text-center">Trạng Thái</th>
                            <th className="px-6 py-4 text-right">Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={6} className="text-center py-8"><FiLoader className="animate-spin inline"/></td></tr> :
                        orders.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-slate-500">Chưa có đơn hàng</td></tr> :
                        orders.map(order => (
                            <tr key={order._id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-bold text-primary-600">#{order.orderNumber}</td>
                                <td className="px-6 py-4">{order.customerName}</td>
                                <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                                <td className="px-6 py-4 text-right font-bold">{order.totalAmount.toLocaleString()}</td>
                                <td className="px-6 py-4 text-center"><span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>{order.status}</span></td>
                                <td className="px-6 py-4 text-right">
                                    {/* NÚT XEM CHI TIẾT */}
                                    <button 
                                        onClick={() => setSelectedOrder(order)}
                                        className="p-2 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                                        title="Xem chi tiết & Xử lý"
                                    >
                                        <FiEye size={18}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>

            {/* Modal Tạo Mới */}
            {isCreateModalOpen && (
                <OrderFormModal onClose={() => setIsCreateModalOpen(false)} onSuccess={() => { fetchOrders(); setIsCreateModalOpen(false); }} />
            )}

            {/* Modal Chi Tiết & Xử Lý (HIỂN THỊ KHI SELECTED ORDER CÓ DỮ LIỆU) */}
            {selectedOrder && (
                <OrderDetailsModal 
                    order={selectedOrder} 
                    onClose={() => setSelectedOrder(null)} 
                    onUpdate={() => { fetchOrders(); setSelectedOrder(null); }} 
                />
            )}
        </div>
    );
};

export default OrdersPage;