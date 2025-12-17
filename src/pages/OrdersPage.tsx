import React, { useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiCheckCircle, FiLoader } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
import Pagination from '../components/Pagination';
import ConfirmationModal from '../components/ConfirmationModal';
import { useOrders, useDeleteOrder } from '../hooks/useOrders'; // Import Hook

const OrdersPage: React.FC = () => {
    const { setEditingOrder } = useAppContext(); // Xóa orders khỏi đây
    const [page, setPage] = useState(1);
    const [orderToDelete, setOrderToDelete] = useState<any>(null);
    
    // Sử dụng Hook
    const { data: ordersData, isLoading } = useOrders(page);
    const deleteMutation = useDeleteOrder();

    const orders = Array.isArray(ordersData) ? ordersData : (ordersData?.data || []);
    const totalPages = Array.isArray(ordersData) ? 1 : (ordersData?.totalPages || 1);
    const totalItems = Array.isArray(ordersData) ? orders.length : (ordersData?.total || 0);

    const handleConfirmDelete = async () => {
        if (orderToDelete) {
            await deleteMutation.mutateAsync(orderToDelete.id);
            setOrderToDelete(null);
        }
    };

    if (isLoading) return <div className="flex justify-center p-10"><FiLoader className="animate-spin" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Đơn đặt hàng</h2>
                <button onClick={() => setEditingOrder('new')} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-md">
                    <FiPlus /> Tạo đơn hàng
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mã ĐH</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Khách hàng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ngày tạo</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Tổng tiền</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Trạng thái</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {orders.length > 0 ? orders.map((order: any) => (
                                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-6 py-4 font-medium text-primary-600">{order.orderNumber}</td>
                                    <td className="px-6 py-4 text-slate-800 dark:text-slate-200">{order.customerName}</td>
                                    <td className="px-6 py-4 text-slate-500">{order.issueDate}</td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-slate-200">{order.totalAmount.toLocaleString()} đ</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.status === 'Hoàn thành' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button onClick={() => setEditingOrder(order)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><FiEdit /></button>
                                        <button onClick={() => setOrderToDelete(order)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg"><FiTrash2 /></button>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan={6} className="text-center py-10 text-slate-500">Chưa có đơn hàng nào.</td></tr>}
                        </tbody>
                    </table>
                </div>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} itemsPerPage={10} />
            </div>
            
            {orderToDelete && (
                <ConfirmationModal 
                    isOpen={!!orderToDelete} 
                    onClose={() => setOrderToDelete(null)} 
                    onConfirm={handleConfirmDelete} 
                    title="Xóa đơn hàng"
                >
                    Bạn có chắc chắn muốn xóa đơn hàng <strong>{orderToDelete.orderNumber}</strong>?
                </ConfirmationModal>
            )}
        </div>
    );
};

export default OrdersPage;