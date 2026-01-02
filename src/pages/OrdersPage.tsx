import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiEye, FiTrash2, FiLoader, FiCheckCircle, FiXCircle, FiTruck } from 'react-icons/fi';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import Pagination from '../components/common/Pagination';
import OrderFormModal from '../components/features/sales/OrderFormModal';
import OrderDetailsModal from '../components/features/sales/OrderDetailsModal';
import PrintOrderModal from '../components/print/PrintOrderModal';

const OrdersPage: React.FC = () => {
    // State
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [printOrder, setPrintOrder] = useState<any>(null);

    // Fetch Data
    const fetchOrders = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(), 
                limit: '10', 
                search: searchTerm, 
                status: statusFilter
            });
            const res = await api(`/api/orders?${query.toString()}`);
            setOrders(res.data || []);
            setTotalPages(res.totalPages || 1);
        } catch (err: any) { toast.error(err.message); } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchOrders(); }, [page, searchTerm, statusFilter]);

    // --- LOGIC DUYỆT ĐƠN ---
    const handleApprove = async (order: any) => {
        try {
            // CASE 1: Đơn có giao hàng -> Chuyển sang "Đang xử lý" để bộ phận giao hàng thấy
            if (order.isDelivery) {
                if (!window.confirm(`Duyệt đơn giao hàng #${order.orderNumber}? \nĐơn sẽ được chuyển sang danh sách chờ giao.`)) return;
                
                await api(`/api/orders/${order._id}`, { 
                    method: 'PUT', 
                    body: JSON.stringify({ status: 'Đang xử lý' }) 
                });
                toast.success('Đã duyệt đơn! Vui lòng kiểm tra bên tab Vận chuyển.');
            } 
            // CASE 2: Đơn bán tại quầy -> Chuyển thẳng sang "Hoàn thành"
            else {
                if (!window.confirm(`Xác nhận hoàn tất đơn hàng #${order.orderNumber}? \n(Khách đã thanh toán và nhận hàng tại quầy)`)) return;
                
                await api(`/api/orders/${order._id}`, { 
                    method: 'PUT', 
                    body: JSON.stringify({ status: 'Hoàn thành' }) 
                });
                toast.success('Đã hoàn tất đơn hàng!');
            }
            
            fetchOrders(); // Tải lại danh sách
        } catch (err: any) {
            toast.error(err.message || 'Lỗi khi xử lý đơn');
        }
    };

    // Helper render màu
    const getStatusColor = (st: string) => {
        if(st === 'Mới') return 'bg-blue-100 text-blue-700';
        if(st === 'Đang xử lý') return 'bg-yellow-100 text-yellow-700';
        if(st === 'Đang giao') return 'bg-purple-100 text-purple-700';
        if(st === 'Hoàn thành') return 'bg-green-100 text-green-700';
        return 'bg-red-100 text-red-700';
    };

    return (
        <div className="p-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Quản Lý Đơn Đặt Hàng</h1>
                <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg">
                    <FiPlus/> Tạo Đơn Mới
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-4 mb-6">
                <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-3 text-slate-400"/>
                    <input className="w-full pl-10 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" 
                        placeholder="Tìm kiếm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <select className="border rounded-lg px-4 bg-slate-50 outline-none" 
                    value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">Tất cả trạng thái</option>
                    <option value="Mới">Mới (Chờ duyệt)</option>
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
                            <th className="px-6 py-4 text-right">Tổng Tiền</th>
                            <th className="px-6 py-4 text-center">Trạng Thái</th>
                            <th className="px-6 py-4 text-right">Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={5} className="py-8 text-center"><FiLoader className="animate-spin inline"/></td></tr> :
                        orders.map(order => (
                            <tr key={order._id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-bold">#{order.orderNumber}</td>
                                <td className="px-6 py-4">
                                    <div className="font-bold">{order.customerName}</div>
                                    {order.isDelivery && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 rounded font-bold border border-purple-200">GIAO HÀNG</span>}
                                </td>
                                <td className="px-6 py-4 text-right font-bold">{order.totalAmount.toLocaleString()} ₫</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>{order.status}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {order.status === 'Mới' && (
                                            <button 
                                                onClick={() => handleApprove(order)}
                                                className={`p-2 text-white rounded-lg transition-all shadow-sm flex items-center gap-1 ${
                                                    order.isDelivery 
                                                    ? 'bg-blue-600 hover:bg-blue-700' // Màu xanh dương cho Giao hàng
                                                    : 'bg-green-600 hover:bg-green-700' // Màu xanh lá cho Tại quầy
                                                }`}
                                                title={order.isDelivery ? "Duyệt chuyển giao hàng" : "Hoàn tất đơn hàng"}
                                            >
                                                {order.isDelivery ? <FiTruck size={18}/> : <FiCheckCircle size={18}/>}
                                            </button>
                                        )}
                                        <button onClick={() => setSelectedOrder(order)} className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"><FiEye size={18}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="p-4"><Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} /></div>
            </div>

            {/* Modals */}
            {isCreateModalOpen && <OrderFormModal onClose={() => setIsCreateModalOpen(false)} onSuccess={() => { fetchOrders(); setIsCreateModalOpen(false); }} />}
            {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdate={() => { fetchOrders(); setSelectedOrder(null); }} />}
            {printOrder && <PrintOrderModal order={printOrder} onClose={() => setPrintOrder(null)} />}
        </div>
    );
};

export default OrdersPage;