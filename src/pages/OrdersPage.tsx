import React, { useState } from 'react';
import { FiPlus, FiPrinter, FiEye, FiTrash2, FiSearch, FiFilter, FiCalendar, FiEdit } from 'react-icons/fi';
import { useOrders } from '../hooks/useOrders';
import { api } from '../utils/api'; // Đảm bảo import api đúng
import toast from 'react-hot-toast';

// Components
import Pagination from '../components/common/Pagination';
import ConfirmationModal from '../components/common/ConfirmationModal';
import OrderFormModal from '../components/features/sales/OrderFormModal';
import OrderDetailsModal from '../components/features/sales/OrderDetailsModal';
import PrintOrderModal from '../components/print/PrintOrderModal';

const OrdersPage: React.FC = () => {
    // --- STATE ---
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' }); // [MỚI] Lọc ngày

    // Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isPrintOpen, setIsPrintOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // --- FETCH DATA ---
    const { data, isLoading, refetch } = useOrders(page, 10, search, status);
    
    // Logic lọc client-side tạm thời cho Date (Hoặc bạn update API backend để support date filter)
    const filteredOrders = data?.data?.filter((order: any) => {
        if (!dateRange.start && !dateRange.end) return true;
        const orderDate = new Date(order.createdAt).getTime();
        const start = dateRange.start ? new Date(dateRange.start).getTime() : 0;
        const end = dateRange.end ? new Date(dateRange.end).setHours(23,59,59) : Infinity;
        return orderDate >= start && orderDate <= end;
    }) || [];

    // --- HANDLERS ---
    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api(`/api/orders/${deleteId}`, { method: 'DELETE' });
            toast.success('Đã xóa đơn hàng');
            setDeleteId(null);
            refetch();
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi xóa');
        }
    };

    // Helper render trạng thái
    const renderStatus = (st: string) => {
        const colors: any = {
            'Mới': 'bg-blue-100 text-blue-700',
            'Đang xử lý': 'bg-yellow-100 text-yellow-700',
            'Hoàn thành': 'bg-green-100 text-green-700',
            'Hủy': 'bg-red-100 text-red-700'
        };
        return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${colors[st] || 'bg-gray-100'}`}>{st}</span>;
    };

    return (
        <div className="p-6 space-y-6 animate-fade-in">
            {/* 1. HEADER & TOOLBAR */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        📦 Quản Lý Đơn Đặt Hàng
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Theo dõi và xử lý các đơn đặt hàng từ khách</p>
                </div>
                
                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95"
                >
                    <FiPlus size={20}/> Tạo Đơn Mới
                </button>
            </div>

            {/* 2. BỘ LỌC (FILTER) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative col-span-1 md:col-span-2">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input 
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        placeholder="Tìm mã đơn, tên khách..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* Status Filter */}
                <div className="relative">
                    <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <select 
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none appearance-none bg-white"
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="Mới">Mới</option>
                        <option value="Đang xử lý">Đang xử lý</option>
                        <option value="Hoàn thành">Hoàn thành</option>
                        <option value="Hủy">Hủy</option>
                    </select>
                </div>

                {/* Date Filter [MỚI] */}
                <div className="relative">
                    <input 
                        type="date"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-600"
                        value={dateRange.start}
                        onChange={e => setDateRange({...dateRange, start: e.target.value})}
                        title="Từ ngày"
                    />
                </div>
            </div>

            {/* 3. BẢNG DỮ LIỆU */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs border-b">
                            <tr>
                                <th className="px-4 py-3 w-10 text-center">STT</th>
                                <th className="px-4 py-3">Mã đơn</th>
                                <th className="px-4 py-3">Khách hàng</th>
                                <th className="px-4 py-3 text-right">Tổng tiền</th>
                                <th className="px-4 py-3 text-right">Đã Cọc</th>
                                <th className="px-4 py-3 text-center">Trạng thái</th>
                                <th className="px-4 py-3 text-center w-36">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={7} className="py-8 text-center">Đang tải...</td></tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr><td colSpan={7} className="py-8 text-center text-slate-500">Không tìm thấy đơn hàng nào.</td></tr>
                            ) : (
                                filteredOrders.map((order: any, idx: number) => (
                                    <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 text-center text-slate-500">{(page - 1) * 10 + idx + 1}</td>
                                        <td className="px-4 py-3 font-medium text-blue-600">{order.orderNumber}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-slate-800">{order.customerName}</div>
                                            <div className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold">
                                            {order.totalAmount.toLocaleString()} ₫
                                        </td>
                                        <td className="px-4 py-3 text-right text-green-600 font-medium">
                                            {order.depositAmount?.toLocaleString()} ₫
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {renderStatus(order.status)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-center gap-2">
                                                <button 
                                                    onClick={() => { setSelectedOrder(order); setIsDetailsOpen(true); }}
                                                    className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100" 
                                                    title="Xem chi tiết"
                                                >
                                                    <FiEye/>
                                                </button>
                                                <button 
                                                    onClick={() => { setSelectedOrder(order); setIsPrintOpen(true); }}
                                                    className="p-2 bg-purple-50 text-purple-600 rounded hover:bg-purple-100" 
                                                    title="In phiếu"
                                                >
                                                    <FiPrinter/>
                                                </button>
                                                {/* Chỉ cho xóa nếu đơn chưa hoàn thành */}
                                                {order.status !== 'Hoàn thành' && (
                                                    <button 
                                                        onClick={() => setDeleteId(order._id)}
                                                        className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100" 
                                                        title="Xóa đơn"
                                                    >
                                                        <FiTrash2/>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {data && (
                    <div className="border-t px-4 py-3">
                        <Pagination 
                            currentPage={page} 
                            totalPages={data.totalPages} 
                            onPageChange={setPage} 
                            totalItems={data.total}
                        />
                    </div>
                )}
            </div>

            {/* --- MODALS --- */}
            {isCreateOpen && (
                <OrderFormModal 
                    onClose={() => setIsCreateOpen(false)} 
                    onSuccess={() => { refetch(); setIsCreateOpen(false); }} 
                />
            )}

            {isDetailsOpen && selectedOrder && (
                <OrderDetailsModal 
                    order={selectedOrder} 
                    onClose={() => setIsDetailsOpen(false)} 
                    onUpdate={() => { refetch(); setIsDetailsOpen(false); }}
                />
            )}

            {isPrintOpen && selectedOrder && (
                <PrintOrderModal 
                    order={selectedOrder} 
                    onClose={() => setIsPrintOpen(false)} 
                />
            )}

            {deleteId && (
                <ConfirmationModal 
                    isOpen={!!deleteId} 
                    onClose={() => setDeleteId(null)} 
                    onConfirm={handleDelete}
                    title="Xóa Đơn Hàng"
                    type="danger"
                >
                    Bạn có chắc muốn xóa đơn hàng này? Hành động này không thể hoàn tác.
                </ConfirmationModal>
            )}
        </div>
    );
};

export default OrdersPage;