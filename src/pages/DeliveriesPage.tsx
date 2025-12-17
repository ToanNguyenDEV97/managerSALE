import React, { useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiPrinter, FiLoader, FiTruck } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
import Pagination from '../components/Pagination';
import ConfirmationModal from '../components/ConfirmationModal';
import { useDeliveries, useDeleteDelivery, useSaveDelivery } from '../hooks/useDeliveries'; 

const DeliveriesPage: React.FC = () => {
    const { setEditingDelivery, setPrintingDeliveryId } = useAppContext();
    const [page, setPage] = useState(1);
    const [deliveryToDelete, setDeliveryToDelete] = useState<any>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    
    const { data: deliveriesData, isLoading } = useDeliveries(page);
    const deleteMutation = useDeleteDelivery();
    const saveMutation = useSaveDelivery();

    const deliveries = Array.isArray(deliveriesData) ? deliveriesData : (deliveriesData?.data || []);
    const totalPages = Array.isArray(deliveriesData) ? 1 : (deliveriesData?.totalPages || 1);

    const handleConfirmDelete = async () => {
        if (deliveryToDelete) {
            await deleteMutation.mutateAsync(deliveryToDelete.id);
            setDeliveryToDelete(null);
        }
    };

    const handleQuickStatusUpdate = async (delivery: any, newStatus: string) => {
        try {
            await saveMutation.mutateAsync({ ...delivery, status: newStatus });
        } catch (error) {
            console.error(error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Đã giao thành công': return 'bg-green-100 text-green-800 border-green-200';
            case 'Đang giao': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Giao thất bại': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
    };

    if (isLoading) return <div className="flex justify-center p-10"><FiLoader className="animate-spin text-primary-600 w-8 h-8" /></div>;

    const filteredDeliveries = statusFilter === 'all' 
        ? deliveries 
        : deliveries.filter((d: any) => d.status === statusFilter);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FiTruck className="text-primary-600"/> Quản lý Giao hàng
                    </h2>
                </div>
                <div className="flex gap-2">
                    <select 
                        className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="Chờ giao">Chờ giao</option>
                        <option value="Đang giao">Đang giao</option>
                        <option value="Đã giao thành công">Đã giao thành công</option>
                    </select>
                    <button onClick={() => setEditingDelivery('new')} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-md transition-all">
                        <FiPlus /> Tạo phiếu giao
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mã Phiếu</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Khách hàng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ngày giao</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tài xế</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Trạng thái</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredDeliveries.length > 0 ? filteredDeliveries.map((delivery: any) => (
                                <tr key={delivery.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-primary-600">{delivery.deliveryNumber}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-slate-900 dark:text-white font-medium">{delivery.customerName}</div>
                                        <div className="text-xs text-slate-500 truncate max-w-[150px]">{delivery.customerAddress}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">{delivery.deliveryDate}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">
                                        {delivery.driverName || '---'}
                                        {delivery.vehicleNumber && <div className="text-xs text-slate-400">({delivery.vehicleNumber})</div>}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <select 
                                            value={delivery.status}
                                            onChange={(e) => handleQuickStatusUpdate(delivery, e.target.value)}
                                            className={`text-xs font-bold px-2 py-1 rounded-full border ${getStatusColor(delivery.status)} focus:outline-none cursor-pointer`}
                                        >
                                            <option value="Chờ giao">Chờ giao</option>
                                            <option value="Đang giao">Đang giao</option>
                                            <option value="Đã giao thành công">Đã giao</option>
                                            <option value="Giao thất bại">Thất bại</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button onClick={() => setPrintingDeliveryId(delivery.id)} className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors" title="In phiếu"><FiPrinter /></button>
                                        <button onClick={() => setEditingDelivery(delivery)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Sửa"><FiEdit /></button>
                                        <button onClick={() => setDeliveryToDelete(delivery)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Xóa"><FiTrash2 /></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6} className="text-center py-10 text-slate-500">Chưa có phiếu giao hàng nào.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={filteredDeliveries.length} itemsPerPage={10} />
            </div>
            
            {deliveryToDelete && (
                <ConfirmationModal 
                    isOpen={!!deliveryToDelete} 
                    onClose={() => setDeliveryToDelete(null)} 
                    onConfirm={handleConfirmDelete} 
                    title="Xóa phiếu giao hàng"
                >
                    Bạn có chắc chắn muốn xóa phiếu <strong>{deliveryToDelete.deliveryNumber}</strong>?
                </ConfirmationModal>
            )}
        </div>
    );
};

export default DeliveriesPage;