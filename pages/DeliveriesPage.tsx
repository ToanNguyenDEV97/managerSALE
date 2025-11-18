
import React, { useState, useMemo } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiPrinter } from 'react-icons/fi';
import type { Delivery } from '../types';
import { useAppContext } from '../context/DataContext';
import Pagination from '../components/Pagination';
import ConfirmationModal from '../components/ConfirmationModal';

const DeliveriesPage: React.FC = () => {
    const { deliveries, setEditingDelivery, handleDeleteDelivery, handleUpdateDeliveryStatus, setPrintingDeliveryId } = useAppContext();
    const [currentPage, setCurrentPage] = useState(1);
    const [deliveryToDelete, setDeliveryToDelete] = useState<Delivery | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const ITEMS_PER_PAGE = 10;
    
    const filteredDeliveries = useMemo(() => {
         return [...deliveries]
            .filter(d => statusFilter === 'all' || d.status === statusFilter)
            .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
    }, [deliveries, statusFilter]);
    
    const paginatedDeliveries = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredDeliveries.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredDeliveries, currentPage]);

    const totalPages = Math.ceil(filteredDeliveries.length / ITEMS_PER_PAGE);
    
    const handleDeleteClick = (delivery: Delivery) => {
        setDeliveryToDelete(delivery);
    };
    
    const handleConfirmDelete = () => {
        if (deliveryToDelete) {
            handleDeleteDelivery(deliveryToDelete.id);
            setDeliveryToDelete(null);
        }
    };
    
    const getStatusClass = (status: Delivery['status']) => {
        switch (status) {
            case 'Chờ giao': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300';
            case 'Đang giao': return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300';
            case 'Đã giao thành công': return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300';
            case 'Giao thất bại': return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
        }
    };
    
    const statusOptions: Delivery['status'][] = ['Chờ giao', 'Đang giao', 'Đã giao thành công', 'Giao thất bại'];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="hidden lg:block">
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-200">Quản lý Giao hàng</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Theo dõi và cập nhật trạng thái các đơn hàng.</p>
                </div>
                <button
                    onClick={() => setEditingDelivery('new')}
                    className="flex items-center justify-center w-full md:w-auto px-4 py-2 text-white rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-px"
                >
                    <FiPlus />
                    <span className="ml-2 font-medium">Tạo Phiếu Giao</span>
                </button>
            </div>

             <div className="flex justify-end">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full sm:w-auto border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 sm:text-sm"
                >
                    <option value="all">Tất cả trạng thái</option>
                    {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Table View */}
                <div className="overflow-x-auto hidden lg:block">
                    <table className="min-w-full">
                        <thead className="bg-primary-50 dark:bg-slate-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Số Phiếu</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Khách hàng</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Ngày giao</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Tài xế</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Trạng thái</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800">
                            {paginatedDeliveries.map(delivery => (
                                <tr key={delivery.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600 dark:text-primary-400">{delivery.deliveryNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 dark:text-slate-200">{delivery.customerName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{delivery.deliveryDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{delivery.driverName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <select
                                            value={delivery.status}
                                            onChange={(e) => handleUpdateDeliveryStatus(delivery.id, e.target.value as Delivery['status'])}
                                            className={`w-full p-1 rounded-md text-xs font-medium border-0 focus:ring-0 ${getStatusClass(delivery.status)}`}
                                        >
                                            {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => setPrintingDeliveryId(delivery.id)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 inline-flex items-center gap-1 transition-transform hover:scale-110 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600" title="In phiếu giao">
                                            <FiPrinter className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => setEditingDelivery(delivery)} className="text-primary-600 hover:text-primary-800 inline-flex items-center gap-1 transition-transform hover:scale-110 p-1 rounded-full hover:bg-primary-100 dark:hover:bg-primary-500/20" title="Sửa">
                                            <FiEdit className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => handleDeleteClick(delivery)} className="text-red-500 hover:text-red-700 inline-flex items-center gap-1 transition-transform hover:scale-110 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20" title="Xóa">
                                            <FiTrash2 className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {/* Card View */}
                <div className="lg:hidden">
                    {paginatedDeliveries.length > 0 ? paginatedDeliveries.map(delivery => (
                        <div key={delivery.id} className="p-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                             <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-primary-600 dark:text-primary-400">{delivery.deliveryNumber}</p>
                                    <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">{delivery.customerName}</p>
                                </div>
                                 <div className="flex items-center space-x-2">
                                    <button onClick={() => setPrintingDeliveryId(delivery.id)} className="text-slate-500 dark:text-slate-400 p-1">
                                        <FiPrinter className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => setEditingDelivery(delivery)} className="text-primary-600 p-1">
                                        <FiEdit className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handleDeleteClick(delivery)} className="text-red-500 p-1">
                                        <FiTrash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="mt-2 text-sm">
                                <p><span className="text-slate-500 dark:text-slate-400">Ngày giao:</span> {delivery.deliveryDate}</p>
                                <p><span className="text-slate-500 dark:text-slate-400">Tài xế:</span> {delivery.driverName}</p>
                                <div className="mt-2">
                                     <select
                                        value={delivery.status}
                                        onChange={(e) => handleUpdateDeliveryStatus(delivery.id, e.target.value as Delivery['status'])}
                                        className={`w-full p-1 rounded-md text-xs font-medium border-0 focus:ring-0 ${getStatusClass(delivery.status)}`}
                                    >
                                        {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-10 text-slate-500 dark:text-slate-400">Chưa có phiếu giao hàng nào.</div>
                    )}
                </div>
                 <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filteredDeliveries.length} itemsPerPage={ITEMS_PER_PAGE} />
            </div>
            
            {deliveryToDelete && (
                <ConfirmationModal
                    isOpen={!!deliveryToDelete}
                    onClose={() => setDeliveryToDelete(null)}
                    onConfirm={handleConfirmDelete}
                    title="Xác nhận Xóa Phiếu Giao Hàng"
                >
                    Bạn có chắc chắn muốn xóa phiếu giao hàng "<strong>{deliveryToDelete.deliveryNumber}</strong>"?
                </ConfirmationModal>
            )}
        </div>
    );
};

export default DeliveriesPage;
