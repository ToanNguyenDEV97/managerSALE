import React, { useState, useMemo } from 'react';
import { 
    FiPlus, FiSearch, FiFileText, FiTrash2, FiCheckCircle, 
    FiTruck, FiCopy, FiEdit, FiPrinter, FiCalendar, FiTrendingUp, FiClock, FiXCircle, FiRefreshCw
} from 'react-icons/fi'; 
import { useOrders, useDeleteOrder, useConvertToInvoice, useSaveOrder } from '../hooks/useOrders';
import Pagination from '../components/Pagination';
import ConfirmationModal from '../components/ConfirmationModal';
import toast from 'react-hot-toast';

import OrderDetailsModal from '../components/OrderDetailsModal';
import PrintOrderModal from '../components/PrintOrderModal';
import OrderFormModal from '../components/OrderFormModal'; 
import ExportOrderModal from '../components/ExportOrderModal';
import BulkPrintModal from '../components/BulkPrintModal';

// Component KPI Card
const StatCard = ({ title, value, subtext, icon: Icon, colorClass, loading }: any) => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between transition-transform hover:-translate-y-1">
        <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{title}</p>
            {loading ? (
                <div className="h-8 w-24 bg-slate-100 animate-pulse rounded mt-1"></div>
            ) : (
                <h4 className="text-2xl font-bold text-slate-800 mt-1">{value}</h4>
            )}
            {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClass}`}>
            <Icon size={24} className="text-white" />
        </div>
    </div>
);

const OrdersPage: React.FC = () => {
    // --- 1. STATE ---
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    
    // [QUAN TRỌNG] State Ngày tháng để lọc
    const [dateFrom, setDateFrom] = useState(''); 
    const [dateTo, setDateTo] = useState('');     
    
    // Modal State
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);
    const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
    const [editingOrder, setEditingOrder] = useState<any>(null); 
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [convertModalOpen, setConvertModalOpen] = useState<{id: string, code: string, total: number, items: any[]} | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // State cho Bulk Actions
    const [bulkPrintIds, setBulkPrintIds] = useState<string[]>([]); // [MỚI] Để kích hoạt modal in
    const [isBulkDeleteConfirm, setIsBulkDeleteConfirm] = useState(false); // [MỚI] Để kích hoạt modal xóa

    // --- 2. HOOKS (Đã kết nối lọc ngày) ---
    // Truyền dateFrom, dateTo vào hook để gửi lên Server
    const { data: orderResponse, isLoading, refetch } = useOrders(page, searchTerm, statusFilter, dateFrom, dateTo);
    
    const orders = Array.isArray(orderResponse?.data) ? orderResponse.data : [];
    const totalPages = orderResponse?.totalPages || 1;
    
    // [MỚI] Lấy số liệu thống kê thật từ Server trả về
    const serverStats = orderResponse?.stats || { totalRevenue: 0, pendingCount: 0, doneCount: 0 };

    const deleteMutation = useDeleteOrder();
    const convertMutation = useConvertToInvoice();
    const saveOrderMutation = useSaveOrder();

    // --- 3. HANDLERS ---
    const handleOpenCreate = () => { setEditingOrder(null); setIsOrderModalOpen(true); };
    const handleOpenEdit = (order: any) => { setEditingOrder(order); setIsOrderModalOpen(true); };

    const handleConfirmExport = async (amount: number) => {
        if (!convertModalOpen) return;
        try {
            await convertMutation.mutateAsync({ id: convertModalOpen.id, paymentAmount: amount });
            toast.success('Xuất kho & Tạo hóa đơn thành công!');
            setConvertModalOpen(null);
            refetch(); // Tải lại dữ liệu để cập nhật KPI
        } catch (error) { }
    };

    const handleDelete = async () => {
        if (orderToDelete) {
            await deleteMutation.mutateAsync(orderToDelete);
            setOrderToDelete(null);
        }
    };

    const confirmBulkDelete = async () => {
        const toastId = toast.loading('Đang xóa...');
        try {
            await Promise.all(selectedIds.map(id => deleteMutation.mutateAsync(id)));
            toast.success(`Đã xóa ${selectedIds.length} đơn hàng`, { id: toastId });
            setSelectedIds([]);
            setIsBulkDeleteConfirm(false); // Đóng modal
            // refetch(); // Nếu cần thiết
        } catch (e) {
            toast.error('Có lỗi xảy ra', { id: toastId });
        }
    };

    // Hàm gọi khi bấm nút "Xóa ... đơn"
    const handleBulkDeleteClick = () => {
        setIsBulkDeleteConfirm(true);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === orders.length) setSelectedIds([]);
        else setSelectedIds(orders.map((o: any) => o.id || o._id));
    };

    const toggleSelectOne = (id: string) => {
        if (selectedIds.includes(id)) setSelectedIds(prev => prev.filter(i => i !== id));
        else setSelectedIds(prev => [...prev, id]);
    };

    // Hàm reset bộ lọc
    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setDateFrom('');
        setDateTo('');
        setPage(1);
    };

    const renderStatusBadge = (status: string) => {
        switch(status) {
            case 'Mới': return <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100 flex items-center justify-center gap-1 w-fit"><FiClock size={10}/> Mới tạo</span>;
            case 'Hoàn thành': return <span className="px-2.5 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold border border-green-100 flex items-center justify-center gap-1 w-fit"><FiCheckCircle size={10}/> Đã xuất</span>;
            case 'Hủy': return <span className="px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold border border-red-100 flex items-center justify-center gap-1 w-fit"><FiXCircle size={10}/> Đã hủy</span>;
            default: return <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border border-slate-200">{status}</span>;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Quản lý Đơn hàng</h2>
                    <p className="text-slate-500 text-sm">Quản lý, theo dõi và xử lý đơn đặt hàng.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => refetch()} className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors" title="Tải lại"><FiRefreshCw/></button>
                    <button onClick={handleOpenCreate} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-primary-500/30 transition-all active:scale-95">
                        <FiPlus size={20} /> Tạo đơn hàng
                    </button>
                </div>
            </div>

            {/* KPI STATS - Dữ liệu thật từ Server */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard 
                    title="Doanh số (Theo bộ lọc)" 
                    value={`${serverStats.totalRevenue?.toLocaleString()} ₫`} 
                    loading={isLoading}
                    icon={FiTrendingUp} 
                    colorClass="bg-gradient-to-br from-green-500 to-green-600 shadow-green-200"
                />
                <StatCard 
                    title="Đơn chờ xử lý" 
                    value={`${serverStats.pendingCount} Đơn`} 
                    subtext="Cần xuất kho ngay"
                    loading={isLoading}
                    icon={FiClock} 
                    colorClass="bg-gradient-to-br from-orange-400 to-orange-600 shadow-orange-200"
                />
                <StatCard 
                    title="Đơn đã hoàn thành" 
                    value={`${serverStats.doneCount} Đơn`} 
                    loading={isLoading}
                    icon={FiCheckCircle} 
                    colorClass="bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-200"
                />
            </div>

            {/* FILTER BAR */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-4 justify-between">
                <div className="flex flex-col md:flex-row gap-3 flex-1">
                    {/* Tabs Trạng thái */}
                    <div className="flex bg-slate-100 p-1 rounded-lg shrink-0 overflow-x-auto">
                        {['all', 'Mới', 'Hoàn thành'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { setStatusFilter(tab); setPage(1); }}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap ${
                                    statusFilter === tab 
                                    ? 'bg-white text-primary-600 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {tab === 'all' ? 'Tất cả' : tab === 'Mới' ? 'Mới tạo' : 'Hoàn thành'}
                            </button>
                        ))}
                    </div>

                    {/* Bộ lọc ngày tháng (Đã hoạt động) */}
                    <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 bg-white h-[42px]">
                        <FiCalendar className="text-slate-400 shrink-0"/>
                        <input 
                            type="date" 
                            className="text-sm outline-none text-slate-600 bg-transparent w-full md:w-auto" 
                            value={dateFrom} 
                            onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                        />
                        <span className="text-slate-300">-</span>
                        <input 
                            type="date" 
                            className="text-sm outline-none text-slate-600 bg-transparent w-full md:w-auto" 
                            value={dateTo} 
                            onChange={e => { setDateTo(e.target.value); setPage(1); }}
                        />
                    </div>
                </div>

                {/* Search */}
                <div className="relative w-full xl:w-80">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" placeholder="Tìm tên khách, mã đơn..." 
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                    {searchTerm && <button onClick={resetFilters} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><FiXCircle/></button>}
                </div>
            </div>

            {/* --- BULK ACTIONS --- */}
            {selectedIds.length > 0 && (
                <div className="bg-primary-50 border border-primary-100 p-3 rounded-xl flex justify-between items-center animate-fade-in sticky top-4 z-20 shadow-lg ring-1 ring-primary-200">
                    <div className="flex items-center gap-3 px-2">
                        <div className="bg-primary-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                            {selectedIds.length}
                        </div>
                        <span className="text-primary-900 font-medium text-sm">đơn hàng đã chọn</span>
                    </div>
                    <div className="flex gap-2">
                        {/* Nút IN HÀNG LOẠT */}
                        <button 
                            onClick={() => setBulkPrintIds(selectedIds)} 
                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <FiPrinter size={14}/> In hàng loạt
                        </button>
                        
                        {/* Nút XÓA HÀNG LOẠT */}
                        <button 
                            onClick={handleBulkDeleteClick}
                            className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-sm font-bold hover:bg-red-200 flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <FiTrash2 size={14}/> Xóa {selectedIds.length} đơn
                        </button>
                    </div>
                </div>
            )}

            {/* TABLE */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-4 w-12 text-center">
                                    <input type="checkbox" checked={orders.length > 0 && selectedIds.length === orders.length} onChange={toggleSelectAll} className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300"/>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Mã Đơn</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày tạo</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Khách hàng</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng tiền</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {isLoading ? (
                                <tr><td colSpan={7} className="text-center py-20 text-slate-400">Đang tải dữ liệu...</td></tr>
                            ) : orders.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-20 text-slate-400 italic">Không tìm thấy đơn hàng phù hợp.</td></tr>
                            ) : orders.map((order: any) => {
                                const isSelected = selectedIds.includes(order.id || order._id);
                                return (
                                    <tr key={order.id || order._id} className={`transition-colors group ${isSelected ? 'bg-primary-50/30' : 'hover:bg-slate-50'}`}>
                                        <td className="px-4 py-4 text-center">
                                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelectOne(order.id || order._id)} className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300"/>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-700">{order.orderNumber}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                            <div className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-800">
                                            {order.customerName}
                                            {order.note && <div className="text-xs text-slate-400 truncate max-w-[150px] italic" title={order.note}>{order.note}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-800">{order.totalAmount?.toLocaleString()} ₫</td>
                                        <td className="px-6 py-4 flex justify-center">{renderStatusBadge(order.status)}</td>
                                        
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                                {order.status === 'Mới' && (
                                                    <>
                                                        <button 
                                                            onClick={() => setConvertModalOpen({id: order.id || order._id, code: order.orderNumber, total: order.totalAmount, items: order.items})}
                                                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors tooltip" 
                                                            title="Xuất kho"
                                                        >
                                                            <FiCheckCircle size={18}/>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleOpenEdit(order)}
                                                            className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors" 
                                                            title="Sửa"
                                                        >
                                                            <FiEdit size={18}/>
                                                        </button>
                                                    </>
                                                )}
                                                <button onClick={() => setPrintingOrderId(order.id || order._id)} className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg" title="In phiếu"><FiPrinter size={18}/></button>
                                                <button onClick={() => setSelectedOrderId(order.id || order._id)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg" title="Chi tiết"><FiFileText size={18}/></button>
                                                {order.status === 'Mới' && (
                                                    <button onClick={() => setOrderToDelete(order.id || order._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-lg"><FiTrash2 size={18}/></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="border-t border-slate-200 p-4 bg-slate-50">
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={orderResponse?.total || 0} itemsPerPage={10} />
                </div>
            </div>

            {/* --- MODALS --- */}
            {isOrderModalOpen && <OrderFormModal initialData={editingOrder} onClose={() => setIsOrderModalOpen(false)} />}
            
            {selectedOrderId && <OrderDetailsModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} onPrint={(id) => { setSelectedOrderId(null); setPrintingOrderId(id); }} />}
            
            {printingOrderId && <PrintOrderModal orderId={printingOrderId} onClose={() => setPrintingOrderId(null)} />}
            
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
                    <p>Hành động này không thể hoàn tác.</p>
                </ConfirmationModal>
            )}
            {/* [MỚI] Modal In Hàng Loạt */}
            {bulkPrintIds.length > 0 && (
                <BulkPrintModal 
                    orderIds={bulkPrintIds} 
                    onClose={() => setBulkPrintIds([])} 
                />
            )}
            {/* [MỚI] Modal Xác nhận Xóa Hàng Loạt */}
            {isBulkDeleteConfirm && (
                <ConfirmationModal 
                    isOpen={isBulkDeleteConfirm} 
                    onClose={() => setIsBulkDeleteConfirm(false)}
                    onConfirm={confirmBulkDelete} 
                    title={`Xóa ${selectedIds.length} đơn hàng?`} 
                    confirmColor="bg-red-600" 
                    confirmText="Xóa tất cả"
                >
                    <p>Bạn có chắc chắn muốn xóa <b>{selectedIds.length}</b> đơn hàng đã chọn không?</p>
                    <p className="text-sm text-slate-500 mt-1">Hành động này không thể hoàn tác.</p>
                </ConfirmationModal>
            )}
        </div>
    );
};

export default OrdersPage;