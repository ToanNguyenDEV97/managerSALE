import React, { useState, useEffect } from 'react';
import { 
    FiPlus, FiSearch, FiEye, FiTrash2, FiLoader, 
    FiCheckCircle, FiTruck, FiPackage, FiPrinter, FiFileText 
} from 'react-icons/fi';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

// --- COMPONENTS ---
import Pagination from '../components/common/Pagination';
import ConfirmModal from '../components/common/ConfirmModal';
import OrderFormModal from '../components/features/sales/OrderFormModal';
import OrderDetailsModal from '../components/features/sales/OrderDetailsModal';
import PrintOrderModal from '../components/print/PrintOrderModal';
import PrintDeliveryModal from '../components/print/PrintDeliveryModal'; // Nhớ import file này

const OrdersPage: React.FC = () => {
    // --- STATE QUẢN LÝ DỮ LIỆU ---
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    
    // --- STATE PHÂN TRANG ---
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0); 
    const ITEMS_PER_PAGE = 10;
    
    // --- STATE MODALS ---
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    // 3 Modal quan trọng
    const [selectedOrder, setSelectedOrder] = useState<any>(null); // Modal Xem chi tiết
    const [printOrder, setPrintOrder] = useState<any>(null);       // Modal In Hóa đơn
    const [printDelivery, setPrintDelivery] = useState<any>(null); // Modal In Phiếu Ship

    // --- STATE XÁC NHẬN ---
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean; title: string; message: string; type: 'danger' | 'info'; action: (() => void) | null;
    }>({ isOpen: false, title: '', message: '', type: 'info', action: null });

    // --- FETCH DATA ---
    const fetchOrders = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(), 
                limit: ITEMS_PER_PAGE.toString(), 
                search: searchTerm, 
                status: statusFilter === 'all' ? '' : statusFilter
            });
            const res = await api(`/api/orders?${query.toString()}`);
            setOrders(res.data || []);
            setTotalPages(res.totalPages || 1);
            setTotalItems(res.totalDocs || res.total || 0);
        } catch (err: any) { 
            console.error("Fetch error:", err);
            setOrders([]); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { setPage(1); }, [searchTerm, statusFilter]);
    useEffect(() => { fetchOrders(); }, [page, searchTerm, statusFilter]);

    // --- LOGIC XỬ LÝ API ---
    const processApprove = async (order: any) => {
        try {
            const newStatus = order.isDelivery ? 'Đang xử lý' : 'Hoàn thành';
            await api(`/api/orders/${order._id}`, { 
                method: 'PUT', 
                body: JSON.stringify({ status: newStatus }) 
            });
            toast.success(order.isDelivery ? 'Đã duyệt đơn giao hàng!' : 'Đã hoàn tất đơn hàng!');
            fetchOrders(); 
        } catch (err: any) { toast.error(err.message); }
    };

    const processDelete = async (orderId: string) => {
        try {
            await api(`/api/orders/${orderId}`, { method: 'DELETE' });
            toast.success('Đã xóa đơn hàng');
            if (orders.length === 1 && page > 1) setPage(p => p - 1);
            else fetchOrders();
        } catch (err: any) { toast.error(err.message); }
    };

    // --- HANDLERS ---
    const confirmApproveAction = (order: any) => {
        setConfirmConfig({
            isOpen: true, type: 'info',
            title: order.isDelivery ? 'Duyệt giao hàng' : 'Hoàn tất đơn hàng',
            message: `Xác nhận xử lý đơn hàng #${order.orderNumber}?`,
            action: () => processApprove(order)
        });
    };

    const confirmDeleteAction = (orderId: string, orderNumber: string) => {
        setConfirmConfig({
            isOpen: true, type: 'danger',
            title: 'Xóa đơn hàng?',
            message: `Xóa vĩnh viễn đơn #${orderNumber}? Không thể hoàn tác.`,
            action: () => processDelete(orderId)
        });
    };

    const getStatusColor = (st: string) => {
        switch(st) {
            case 'Mới': return 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20';
            case 'Đang xử lý': return 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20';
            case 'Đang giao': return 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20';
            case 'Hoàn thành': return 'bg-green-50 text-green-700 ring-1 ring-green-600/20';
            case 'Đã hủy': return 'bg-red-50 text-red-700 ring-1 ring-red-600/20';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    // Tính toán phân trang
    const indexOfLastItem = page * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const displayStart = totalItems === 0 ? 0 : indexOfFirstItem + 1;
    const displayEnd = totalItems > 0 ? Math.min(indexOfLastItem, totalItems) : 0;

    return (
        <div className="p-6 animate-fade-in min-h-screen bg-slate-50/50">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Quản Lý Đơn Hàng</h1>
                    <p className="text-slate-500 text-sm mt-1">Theo dõi, xử lý và quản lý vận đơn</p>
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition-all active:scale-95"><FiPlus size={20}/> Tạo Đơn Mới</button>
            </div>
            
            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input className="w-full pl-10 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition-all" placeholder="Tìm kiếm đơn hàng..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <select className="border border-slate-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">Tất cả trạng thái</option>
                    <option value="Mới">Mới</option>
                    <option value="Đang xử lý">Đang xử lý</option>
                    <option value="Đang giao">Đang giao</option>
                    <option value="Hoàn thành">Hoàn thành</option>
                    <option value="Đã hủy">Đã hủy</option>
                </select>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Mã Đơn</th>
                                <th className="px-6 py-4">Khách Hàng</th>
                                <th className="px-6 py-4 text-right">Tổng Tiền</th>
                                <th className="px-6 py-4 text-center">Trạng Thái</th>
                                <th className="px-6 py-4 text-right">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && <tr><td colSpan={5} className="py-12 text-center"><FiLoader className="animate-spin inline text-primary-600" size={24}/></td></tr>}
                            
                            {!loading && orders.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="bg-slate-100 p-4 rounded-full mb-3 text-slate-400"><FiPackage size={32} /></div>
                                            <p className="font-medium text-slate-600">Không tìm thấy đơn hàng nào</p>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {!loading && orders.map(order => (
                                <tr 
                                    key={order._id} 
                                    onClick={() => setSelectedOrder(order)} 
                                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                                >
                                    <td className="px-6 py-4 font-bold text-slate-700">#{order.orderNumber}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800">{order.customerName}</div>
                                        {order.isDelivery && <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 mt-1 font-semibold"><FiTruck size={10} /> Giao hàng</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-800">{(order.totalAmount || 0).toLocaleString()} ₫</td>
                                    <td className="px-6 py-4 text-center"><span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>{order.status}</span></td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Nút Duyệt Nhanh */}
                                            {order.status === 'Mới' && (
                                                <button onClick={(e) => { e.stopPropagation(); confirmApproveAction(order); }} className={`p-2 text-white rounded-lg transition-all shadow-sm ${order.isDelivery ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`} title="Duyệt đơn">
                                                    {order.isDelivery ? <FiTruck size={16}/> : <FiCheckCircle size={16}/>}
                                                </button>
                                            )}

                                            {/* Nút In Nhanh */}
                                            <button onClick={(e) => { e.stopPropagation(); setPrintOrder(order); }} className="p-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200" title="In Hóa Đơn">
                                                <FiPrinter size={18}/>
                                            </button>

                                            {/* Nút Xem */}
                                            <button onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }} className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-primary-600 hover:border-primary-200" title="Xem chi tiết">
                                                <FiEye size={18}/>
                                            </button>
                                            
                                            {/* Nút Xóa */}
                                            {['Mới', 'Đã hủy'].includes(order.status) && (
                                                <button onClick={(e) => { e.stopPropagation(); confirmDeleteAction(order._id, order.orderNumber); }} className="p-2 bg-white border border-red-100 text-red-500 rounded-lg hover:bg-red-50 hover:border-red-200" title="Xóa đơn">
                                                    <FiTrash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {!loading && orders.length > 0 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <span className="text-sm text-slate-500 font-medium">Hiển thị {displayStart}-{displayEnd} / {totalItems} kết quả</span>
                        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                    </div>
                )}
            </div>

            {/* --- KHU VỰC HIỂN THỊ MODAL --- */}
            
            {/* 1. Modal Tạo Mới */}
            {isCreateModalOpen && <OrderFormModal onClose={() => setIsCreateModalOpen(false)} onSuccess={() => { fetchOrders(); setIsCreateModalOpen(false); }} />}
            
            {/* 2. Modal Chi Tiết (Truyền đủ 2 hàm in) */}
            {selectedOrder && (
                <OrderDetailsModal 
                    order={selectedOrder} 
                    onClose={() => setSelectedOrder(null)} 
                    onUpdate={() => { fetchOrders(); setSelectedOrder(null); }} 
                    onPrintOrder={() => setPrintOrder(selectedOrder)}       // Hàm mở modal Hóa đơn
                    onPrintDelivery={() => setPrintDelivery(selectedOrder)} // Hàm mở modal Phiếu ship
                />
            )}
            
            {/* 3. Modal In Hóa Đơn */}
            {printOrder && <PrintOrderModal order={printOrder} onClose={() => setPrintOrder(null)} />}

            {/* 4. Modal In Phiếu Giao Hàng */}
            {printDelivery && <PrintDeliveryModal order={printDelivery} onClose={() => setPrintDelivery(null)} />}

            {/* 5. Modal Xác Nhận */}
            <ConfirmModal isOpen={confirmConfig.isOpen} title={confirmConfig.title} message={confirmConfig.message} type={confirmConfig.type} onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })} onConfirm={() => { if (confirmConfig.action) confirmConfig.action(); }} />
        </div>
    );
};

export default OrdersPage;