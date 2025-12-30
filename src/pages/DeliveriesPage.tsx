import React, { useState, useEffect } from 'react';
import { 
    FiTruck, FiSearch, FiFilter, FiPhone, FiMapPin, FiCheckCircle, 
    FiLoader, FiBox, FiClock, FiRefreshCw, FiMoreVertical 
} from 'react-icons/fi';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import Pagination from '../components/Pagination';
import OrderDetailsModal from '../components/business/OrderDetailsModal';

const DeliveriesPage: React.FC = () => {
    // State quản lý dữ liệu
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('Đang xử lý'); // Tab mặc định: Chờ lấy hàng
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // State mở modal chi tiết
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    // 1. Tải dữ liệu từ API (Lấy từ Orders với điều kiện isDelivery = true)
    const fetchDeliveries = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                limit: '9', // Hiển thị dạng lưới 3x3
                search: searchTerm,
                isDelivery: 'true', // Chỉ lấy đơn có giao hàng
                status: activeTab === 'All' ? '' : activeTab
            });
            
            const res = await api(`/api/orders?${query.toString()}`);
            setOrders(res.data || []);
            setTotalPages(res.totalPages || 1);
        } catch (err: any) {
            console.error(err);
            toast.error('Không thể tải dữ liệu vận chuyển');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeliveries();
    }, [page, searchTerm, activeTab]);

    // 2. Hàm cập nhật nhanh trạng thái (Dành cho điều phối viên)
    const updateStatus = async (e: React.MouseEvent, id: string, newStatus: string) => {
        e.stopPropagation(); // Ngăn sự kiện click lan ra Card cha
        if(!window.confirm(`Xác nhận chuyển trạng thái đơn này sang: ${newStatus}?`)) return;

        try {
            await api(`/api/orders/${id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
            toast.success(`Đã cập nhật trạng thái thành công!`);
            fetchDeliveries(); // Tải lại dữ liệu
        } catch (error) { toast.error('Lỗi cập nhật trạng thái'); }
    };

    // 3. Component con: Nút Tab chuyển trạng thái
    const TabButton = ({ label, value, icon: Icon, colorClass }: any) => (
        <button 
            onClick={() => { setActiveTab(value); setPage(1); }}
            className={`
                flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm transition-all border
                ${activeTab === value 
                    ? `bg-white text-slate-800 shadow-md ring-1 ring-slate-200 border-transparent ${colorClass}` 
                    : 'text-slate-500 bg-transparent border-transparent hover:bg-white/50 hover:text-slate-700'
                }
            `}
        >
            <Icon size={18} className={activeTab === value ? '' : 'opacity-70'} />
            {label}
        </button>
    );

    return (
        <div className="p-6 animate-fade-in min-h-screen bg-slate-50/50">
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <span className="bg-primary-600 text-white p-2 rounded-lg"><FiTruck size={24}/></span>
                        Điều Phối Vận Chuyển
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 ml-14">Theo dõi hành trình đơn hàng và Shipper</p>
                </div>
                
                {/* Search Bar */}
                <div className="relative group w-full md:w-80">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors"/>
                    <input 
                        type="text" 
                        placeholder="Tìm mã vận đơn, SĐT, tên khách..." 
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* --- TABS TRẠNG THÁI --- */}
            <div className="flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar">
                <TabButton label="Chờ Lấy Hàng" value="Đang xử lý" icon={FiBox} colorClass="text-yellow-600" />
                <TabButton label="Đang Giao" value="Đang giao" icon={FiTruck} colorClass="text-purple-600" />
                <TabButton label="Đã Giao Xong" value="Hoàn thành" icon={FiCheckCircle} colorClass="text-green-600" />
                <TabButton label="Tất Cả" value="All" icon={FiFilter} colorClass="text-primary-600" />
            </div>

            {/* --- DANH SÁCH THẺ VẬN ĐƠN (GRID) --- */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <FiLoader className="w-10 h-10 animate-spin mb-3 text-primary-500"/>
                    <p>Đang tìm kiếm đơn hàng...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                    <div className="bg-slate-50 p-4 rounded-full mb-4"><FiBox className="w-8 h-8 opacity-20"/></div>
                    <p className="font-medium">Chưa có đơn hàng nào ở mục này</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {orders.map((order) => (
                        <div 
                            key={order._id} 
                            onClick={() => setSelectedOrder(order)}
                            className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer group flex flex-col h-full relative"
                        >
                            {/* Card Header: Mã & Ngày */}
                            <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded">#{order.orderNumber}</span>
                                    <span className="text-slate-400 text-xs flex items-center gap-1">
                                        <FiClock size={10}/> {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                                {/* Đèn trạng thái */}
                                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                    order.status === 'Đang giao' ? 'bg-purple-100 text-purple-700' : 
                                    order.status === 'Hoàn thành' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                        order.status === 'Đang giao' ? 'bg-purple-500 animate-pulse' : 
                                        order.status === 'Hoàn thành' ? 'bg-green-500' : 'bg-yellow-500'
                                    }`}></div>
                                    {order.status}
                                </div>
                            </div>

                            {/* Card Body: Thông tin vận chuyển */}
                            <div className="p-5 flex-1 space-y-4">
                                {/* Visual Route Line */}
                                <div className="relative pl-4 border-l-2 border-dashed border-slate-200 space-y-5 ml-1">
                                    {/* Điểm đi: Kho */}
                                    <div className="relative">
                                        <div className="absolute -left-[21px] top-1 w-3 h-3 bg-slate-300 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100"></div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Kho xuất hàng</p>
                                        <p className="text-sm font-medium text-slate-700">Kho tổng (Cửa hàng)</p>
                                    </div>
                                    
                                    {/* Điểm đến: Khách hàng */}
                                    <div className="relative">
                                        <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100 ${order.status === 'Hoàn thành' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Người nhận</p>
                                        <p className="text-base font-bold text-slate-900 leading-tight mb-1">{order.customerName}</p>
                                        
                                        <div className="flex items-start gap-2 text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                            <FiMapPin className="text-red-500 w-4 h-4 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm line-clamp-2 leading-snug">{order.delivery?.address || 'Nhận tại quầy'}</p>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 mt-2 ml-1">
                                            <FiPhone className="text-blue-500 w-3.5 h-3.5" />
                                            <a href={`tel:${order.delivery?.phone}`} className="text-sm text-blue-600 font-bold hover:underline" onClick={e => e.stopPropagation()}>
                                                {order.delivery?.phone || '---'}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* COD Section */}
                            <div className="mx-5 mb-4 px-4 py-3 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100 flex justify-between items-center group-hover:border-primary-100 group-hover:from-primary-50/30 transition-colors">
                                <span className="text-xs font-bold text-slate-400 uppercase">Thu hộ (COD)</span>
                                <span className="text-lg font-black text-slate-800 group-hover:text-primary-600 transition-colors">
                                    {(order.totalAmount - (order.depositAmount || 0)).toLocaleString()} ₫
                                </span>
                            </div>

                            {/* Card Footer: Action Buttons */}
                            <div className="p-3 bg-slate-50/50 border-t border-slate-100 grid grid-cols-1">
                                {order.status === 'Đang xử lý' && (
                                    <button 
                                        onClick={(e) => updateStatus(e, order._id, 'Đang giao')}
                                        className="w-full py-2.5 bg-white border border-purple-200 text-purple-700 hover:bg-purple-600 hover:text-white rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md flex justify-center items-center gap-2"
                                    >
                                        <FiTruck size={16}/> Giao cho Shipper
                                    </button>
                                )}
                                {order.status === 'Đang giao' && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                                        className="w-full py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-200 flex justify-center items-center gap-2"
                                    >
                                        <FiCheckCircle size={16}/> Hoàn tất đơn
                                    </button>
                                )}
                                {(order.status === 'Hoàn thành' || order.status === 'Hủy') && (
                                    <button className="w-full py-2 text-slate-400 text-sm font-medium cursor-default flex justify-center items-center gap-1">
                                        Xem chi tiết
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Phân trang */}
            <div className="mt-8 pb-10">
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>

            {/* Modal Chi Tiết */}
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