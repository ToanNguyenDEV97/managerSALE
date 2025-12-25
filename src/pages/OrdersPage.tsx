import React, { useState } from 'react';
import { 
    FiPlus, FiSearch, FiFileText, FiTrash2, FiCheckCircle, 
    FiTruck, FiPrinter, FiCopy, FiEdit, FiFilter
} from 'react-icons/fi'; 
import { useOrders, useDeleteOrder, useConvertToInvoice, useSaveOrder } from '../hooks/useOrders';
import Pagination from '../components/Pagination';
import ConfirmationModal from '../components/ConfirmationModal';
import toast from 'react-hot-toast';

// Import các Modal
import OrderDetailsModal from '../components/OrderDetailsModal';
import PrintOrderModal from '../components/PrintOrderModal';
import OrderFormModal from '../components/OrderFormModal'; 
import ExportOrderModal from '../components/ExportOrderModal';

const OrdersPage: React.FC = () => {
    // State quản lý
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    
    // State Modal Xem/In/Xóa
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);
    const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
    
    // State cho Modal Tạo/Sửa
    const [editingOrder, setEditingOrder] = useState<any>(null); 
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

    // State Chuyển đổi (Xuất kho)
    const [convertModalOpen, setConvertModalOpen] = useState<{id: string, code: string, total: number, items: any[]} | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Hooks
    const { data: orderData, isLoading } = useOrders(page, searchTerm, statusFilter);
    const orders = Array.isArray(orderData) ? orderData : (orderData?.data || []);
    const totalPages = orderData?.totalPages || 1;

    const deleteMutation = useDeleteOrder();
    const convertMutation = useConvertToInvoice();
    const saveOrderMutation = useSaveOrder();

    // --- HANDLERS ---
    
    const handleOpenCreate = () => {
        setEditingOrder(null);
        setIsOrderModalOpen(true);
    };

    const handleOpenEdit = (order: any) => {
        setEditingOrder(order);
        setIsOrderModalOpen(true);
    };

    const handleDuplicateOrder = async (order: any) => {
        const loadingId = toast.loading('Đang sao chép đơn...');
        try {
            const newOrderData = {
                customerId: order.customerId,
                customerName: order.customerName,
                items: order.items.map((item: any) => ({
                    productId: item.productId,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    costPrice: item.costPrice || 0,
                    unit: item.unit
                })),
                totalAmount: order.totalAmount,
                status: 'Mới',
                note: `Sao chép từ đơn ${order.orderNumber}`
            };
            await saveOrderMutation.mutateAsync(newOrderData);
            toast.success('Sao chép đơn hàng thành công!', { id: loadingId });
        } catch (error) { toast.error('Lỗi khi sao chép', { id: loadingId }); }
    };

    const handleDelete = async () => {
        if (orderToDelete) {
            await deleteMutation.mutateAsync(orderToDelete);
            setOrderToDelete(null);
        }
    };

    // [FIXED] Hàm xử lý xác nhận xuất kho
    const handleConfirmExport = async (amount: number) => {
        if (!convertModalOpen) return;
        try {
            await convertMutation.mutateAsync({
                id: convertModalOpen.id,
                paymentAmount: amount
            });
            toast.success('Xuất kho & Tạo hóa đơn thành công!');
            setConvertModalOpen(null);
        } catch (error) {
            // Error handling is likely done in the mutation hook via toast
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === orders.length) setSelectedIds([]);
        else setSelectedIds(orders.map((o: any) => o.id || o._id));
    };

    const toggleSelectOne = (id: string) => {
        if (selectedIds.includes(id)) setSelectedIds(prev => prev.filter(i => i !== id));
        else setSelectedIds(prev => [...prev, id]);
    };

    const renderStatusBadge = (status: string) => {
        switch(status) {
            case 'Mới': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold border border-blue-200">Mới tạo</span>;
            case 'Hoàn thành': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold border border-green-200">Đã xuất kho</span>;
            case 'Hủy': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold border border-red-200">Đã hủy</span>;
            default: return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-bold">{status}</span>;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Quản lý Đơn đặt hàng</h2>
                    <p className="text-slate-500 text-sm">Quản lý các đơn đặt trước và in phiếu giao hàng.</p>
                </div>
                <button 
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-primary-500/30 transition-all"
                >
                    <FiPlus /> Tạo đơn hàng
                </button>
            </div>

            {/* TAB TRẠNG THÁI */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4 overflow-x-auto">
                {['all', 'Mới', 'Hoàn thành'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => { setStatusFilter(tab); setPage(1); }}
                        className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
                            statusFilter === tab 
                            ? 'border-primary-600 text-primary-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {tab === 'all' ? 'Tất cả đơn' : tab === 'Mới' ? 'Đơn mới (Chưa xuất)' : 'Lịch sử xuất kho'}
                    </button>
                ))}
            </div>

            {/* Toolbar Tìm kiếm */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" placeholder="Tìm mã đơn, tên khách..." 
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 focus:ring-2 focus:ring-primary-500"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                </div>
            </div>

            {/* Bảng dữ liệu */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-4 py-3 text-center w-10">
                                    <input type="checkbox" checked={orders.length > 0 && selectedIds.length === orders.length} onChange={toggleSelectAll} className="rounded text-primary-600 focus:ring-primary-500"/>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Mã Đơn</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Ngày đặt</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Khách hàng</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Tổng tiền</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">Trạng thái</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase sticky right-0 bg-slate-50 dark:bg-slate-700">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {isLoading ? (
                                <tr><td colSpan={7} className="text-center py-10 text-slate-500">Đang tải dữ liệu...</td></tr>
                            ) : orders.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-10 text-slate-500">Không có đơn hàng nào.</td></tr>
                            ) : orders.map((order: any) => {
                                const isSelected = selectedIds.includes(order.id || order._id);
                                return (
                                    <tr key={order.id || order._id} className={`transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                                        <td className="px-4 py-4 text-center">
                                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelectOne(order.id || order._id)} className="rounded text-primary-600 focus:ring-primary-500"/>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-700 whitespace-nowrap">{order.orderNumber}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-800">{order.customerName}</td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-800">{order.totalAmount?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">{renderStatusBadge(order.status)}</td>
                                        
                                        <td className="px-6 py-4 text-center sticky right-0 bg-white group-hover:bg-slate-50">
                                            <div className="flex justify-center items-center gap-2">
                                                {order.status === 'Mới' && (
                                                    <>
                                                        <button 
                                                            onClick={() => setConvertModalOpen({id: order.id || order._id, code: order.orderNumber, total: order.totalAmount, items: order.items})}
                                                            className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded transition-colors" 
                                                            title="Xuất kho & Tạo hóa đơn"
                                                        >
                                                            <FiCheckCircle size={18}/>
                                                        </button>

                                                        <button 
                                                            onClick={() => handleOpenEdit(order)}
                                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" 
                                                            title="Sửa đơn hàng"
                                                        >
                                                            <FiEdit size={18}/>
                                                        </button>
                                                    </>
                                                )}

                                                <button onClick={() => setSelectedOrderId(order.id || order._id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Xem chi tiết"><FiFileText size={18}/></button>
                                                <button onClick={() => setPrintingOrderId(order.id || order._id)} className="p-2 text-slate-600 hover:bg-slate-100 rounded" title="In phiếu giao hàng"><FiTruck size={18}/></button>
                                                <button onClick={() => handleDuplicateOrder(order)} className="p-2 text-purple-600 hover:bg-purple-50 rounded" title="Sao chép đơn này"><FiCopy size={18}/></button>
                                                
                                                {order.status === 'Mới' && (
                                                    <button onClick={() => setOrderToDelete(order.id || order._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><FiTrash2 size={18}/></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="border-t border-slate-200 p-4">
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={orderData?.total || 0} itemsPerPage={10} />
                </div>
            </div>

            {/* --- CÁC MODAL --- */}
            
            {isOrderModalOpen && (
                <OrderFormModal 
                    initialData={editingOrder} 
                    onClose={() => setIsOrderModalOpen(false)}
                />
            )}

            {selectedOrderId && (
                <OrderDetailsModal
                    orderId={selectedOrderId}
                    onClose={() => setSelectedOrderId(null)}
                    onPrint={(id) => { setSelectedOrderId(null); setPrintingOrderId(id); }}
                />
            )}

            {printingOrderId && (
                <PrintOrderModal
                    orderId={printingOrderId}
                    onClose={() => setPrintingOrderId(null)}
                />
            )}

             {/* [FIXED] SỬA LỖI MODAL XUẤT KHO */}
             {convertModalOpen && (
                <ExportOrderModal 
                    isOpen={!!convertModalOpen}
                    onClose={() => setConvertModalOpen(null)}
                    onConfirm={handleConfirmExport}
                    orderNumber={convertModalOpen.code || ''}
                    totalAmount={convertModalOpen.total || 0}
                    items={convertModalOpen.items || []}
                    isProcessing={convertMutation.isPending}
                />
            )}

            {orderToDelete && (
                <ConfirmationModal 
                    isOpen={!!orderToDelete} onClose={() => setOrderToDelete(null)}
                    onConfirm={handleDelete} title="Xóa đơn hàng" confirmColor="bg-red-600" confirmText="Xóa"
                >
                    <p>Bạn có chắc muốn xóa đơn hàng này không?</p>
                </ConfirmationModal>
            )}
        </div>
    );
};

export default OrdersPage;