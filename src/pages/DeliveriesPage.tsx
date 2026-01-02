import React, { useState, useEffect } from 'react';
import { 
    FiTruck, FiSearch, FiFilter, FiPhone, FiMapPin, FiCheckCircle, 
    FiLoader, FiBox, FiClock 
} from 'react-icons/fi';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import Pagination from '../components/common/Pagination';
import OrderDetailsModal from '../components/features/sales/OrderDetailsModal';

const DeliveriesPage: React.FC = () => {
    // State
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('Đang xử lý'); // Mặc định hiển thị đơn đã duyệt
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    // 1. Fetch dữ liệu
    const fetchDeliveries = async () => {
        setLoading(true);
        try {
            // Logic lọc:
            // - Tab 'All': Lấy tất cả đơn có isDelivery=true
            // - Các Tab khác: Lấy theo status cụ thể
            const statusParam = activeTab === 'All' ? '' : activeTab;
            
            const query = new URLSearchParams({
                page: page.toString(),
                limit: '9', 
                search: searchTerm,
                isDelivery: 'true', // [QUAN TRỌNG] Chỉ lấy đơn giao hàng
                status: statusParam
            });
            
            const res = await api(`/api/orders?${query.toString()}`);
            setOrders(res.data || []);
            setTotalPages(res.totalPages || 1);
        } catch (err: any) {
            console.error(err);
            toast.error('Lỗi tải dữ liệu: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeliveries();
    }, [page, searchTerm, activeTab]);

    // 2. Chuyển trạng thái nhanh
    const updateStatus = async (e: React.MouseEvent, id: string, newStatus: string) => {
        e.stopPropagation();
        if(!window.confirm(`Xác nhận chuyển trạng thái sang: ${newStatus}?`)) return;

        try {
            await api(`/api/orders/${id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
            toast.success(`Đã cập nhật thành công!`);
            fetchDeliveries(); 
        } catch (error) { toast.error('Lỗi cập nhật'); }
    };

    // Component Tab
    const TabButton = ({ label, value, icon: Icon, colorClass }: any) => (
        <button 
            onClick={() => { setActiveTab(value); setPage(1); }}
            className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all border whitespace-nowrap
                ${activeTab === value 
                    ? `bg-white text-slate-800 shadow-md ring-1 ring-slate-200 border-transparent ${colorClass}` 
                    : 'text-slate-500 hover:bg-white/60'
                }
            `}
        >
            <Icon size={16} className={activeTab === value ? '' : 'opacity-70'} />
            {label}
        </button>
    );

    return (
        <div className="p-6 animate-fade-in min-h-screen bg-slate-50">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <span className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><FiTruck className="text-primary-600"/></span>
                        Vận Chuyển & Giao Nhận
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Điều phối đơn hàng cần giao cho khách</p>
                </div>
                
                <div className="relative w-full md:w-72">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input 
                        type="text" 
                        placeholder="Tìm theo mã đơn, khách hàng..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-primary-500"
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar">
                <TabButton label="Chờ Lấy Hàng" value="Đang xử lý" icon={FiBox} colorClass="text-yellow-600" />
                <TabButton label="Đang Giao" value="Đang giao" icon={FiTruck} colorClass="text-purple-600" />
                <TabButton label="Hoàn Thành" value="Hoàn thành" icon={FiCheckCircle} colorClass="text-green-600" />
                <div className="w-px bg-slate-300 mx-1"></div>
                <TabButton label="Tất Cả Đơn Giao" value="All" icon={FiFilter} colorClass="text-slate-800" />
            </div>

            {/* Content */}
            {loading ? (
                <div className="py-20 text-center"><FiLoader className="animate-spin inline text-primary-500 text-3xl"/></div>
            ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                    <div className="bg-slate-50 p-4 rounded-full mb-3"><FiBox className="text-slate-300 text-3xl"/></div>
                    <p className="text-slate-500 font-medium">Không có đơn hàng nào trong mục này</p>
                    {activeTab === 'Đang xử lý' && (
                        <p className="text-sm text-slate-400 mt-1">Hãy vào mục "Đơn hàng" và duyệt các đơn Mới để chuyển sang đây.</p>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {orders.map((order) => (
                        <div key={order._id} onClick={() => setSelectedOrder(order)} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col group">
                            {/* Card Header */}
                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <span className="font-bold text-slate-700">#{order.orderNumber}</span>
                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${
                                    order.status === 'Đang giao' ? 'bg-purple-100 text-purple-700' :
                                    order.status === 'Hoàn thành' ? 'bg-green-100 text-green-700' : 
                                    'bg-yellow-100 text-yellow-700'
                                }`}>{order.status}</span>
                            </div>
                            
                            {/* Card Body */}
                            <div className="p-4 flex-1">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className={`mt-1 min-w-[10px] h-[10px] rounded-full ${order.status==='Hoàn thành'?'bg-green-500':'bg-orange-500'}`}></div>
                                    <div>
                                        <p className="font-bold text-slate-800">{order.customerName}</p>
                                        <p className="text-sm text-slate-500 line-clamp-2 mt-0.5">{order.delivery?.address || 'Chưa có địa chỉ'}</p>
                                        <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                                            <FiPhone size={14}/> <span>{order.delivery?.phone || '...'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                                    <span className="text-xs text-slate-500">COD (Thu hộ):</span>
                                    <span className="font-bold text-primary-700">
                                        {(order.totalAmount - (order.depositAmount || 0)).toLocaleString()} ₫
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            {order.status === 'Đang xử lý' && (
                                <button onClick={(e) => updateStatus(e, order._id, 'Đang giao')} className="mx-4 mb-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors flex justify-center items-center gap-2">
                                    <FiTruck/> Bắt đầu giao hàng
                                </button>
                            )}
                            {order.status === 'Đang giao' && (
                                <button onClick={(e) => updateStatus(e, order._id, 'Hoàn thành')} className="mx-4 mb-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors flex justify-center items-center gap-2">
                                    <FiCheckCircle/> Xác nhận đã giao
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            <div className="mt-6">
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>

            {/* Modal Detail */}
            {selectedOrder && (
                <OrderDetailsModal 
                    order={selectedOrder} 
                    onClose={() => setSelectedOrder(null)} 
                    onUpdate={() => { fetchDeliveries(); setSelectedOrder(null); }} 
                />
            )}
        </div>
    );
};

export default DeliveriesPage;