import React, { useState, useEffect } from 'react';
import { 
    FiSearch, FiTruck, FiMapPin, FiPhone, FiUser, FiCalendar, 
    FiCheckCircle, FiXCircle, FiClock, FiBox, FiTrash2, FiPrinter 
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import moment from 'moment';

import { useDeliveries, useUpdateDeliveryStatus, useDeleteDelivery } from '../hooks/useDeliveries';
import { useDebounce } from '../hooks/useDebounce';
import { formatCurrency } from '../utils/currency';
import { Button } from '../components/common/Button';
import Pagination from '../components/common/Pagination';
import PrintDeliveryModal from '../components/print/PrintDeliveryModal';
import ConfirmModal from '../components/common/ConfirmModal';

const DELIVERY_STATUSES = ['Tất cả', 'Chờ giao', 'Đang giao', 'Đã giao', 'Đã hủy', 'Trả hàng'];

interface ConfirmModalConfig {
    isOpen: boolean;
    type: 'danger' | 'info' | 'warning';
    title: string;
    message: string;
    onConfirm: () => void;
}

const DeliveriesPage: React.FC = () => {
    // --- STATE ---
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tất cả');
    const debouncedSearch = useDebounce(search, 500);

    // [QUAN TRỌNG] Reset về trang 1 khi thay đổi bộ lọc tìm kiếm hoặc trạng thái
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, statusFilter]);

    // Modal States
    const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState<ConfirmModalConfig>({
        isOpen: false, type: 'info', title: '', message: '', onConfirm: () => {}
    });

    // API Hooks
    const { data: deliveriesData, isLoading } = useDeliveries(page, debouncedSearch, statusFilter);
    const updateStatusMutation = useUpdateDeliveryStatus();
    const deleteMutation = useDeleteDelivery();

    // --- HANDLERS ---
    const openConfirm = (type: 'danger' | 'info' | 'warning', title: string, message: string, action: () => void) => {
        setConfirmConfig({
            isOpen: true, type, title, message,
            onConfirm: () => {
                action();
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleStatusChange = (id: string, newStatus: string) => {
        openConfirm('info', `Cập nhật trạng thái?`, `Chuyển đơn sang "${newStatus}"?`, () => {
            updateStatusMutation.mutate({ id, status: newStatus }, {
                onSuccess: () => toast.success(`Đã cập nhật: ${newStatus}`),
                onError: (err: any) => toast.error(err.message || 'Lỗi cập nhật')
            });
        });
    };

    const handleDelete = (id: string) => {
        openConfirm('danger', 'Xóa Vận Đơn?', 'Hành động này không thể hoàn tác.', () => {
            deleteMutation.mutate(id, {
                onSuccess: () => toast.success('Đã xóa vận đơn'),
                onError: (err: any) => toast.error(err.message || 'Lỗi xóa')
            });
        });
    };

    const handlePrint = (delivery: any) => {
        setSelectedDelivery(delivery);
        setShowPrintModal(true);
    };

    const renderStatusBadge = (status: string) => {
        const config: any = {
            'Chờ giao': { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <FiClock/> },
            'Đang giao': { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <FiTruck/> },
            'Đã giao':   { color: 'bg-green-100 text-green-700 border-green-200', icon: <FiCheckCircle/> },
            'Đã hủy':    { color: 'bg-red-100 text-red-700 border-red-200', icon: <FiXCircle/> },
            'Trả hàng':  { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: <FiBox/> },
        };
        const style = config[status] || { color: 'bg-gray-100 text-gray-600', icon: null };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 w-fit mx-auto ${style.color}`}>
                {style.icon} {status}
            </span>
        );
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen bg-slate-50/50">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FiTruck className="text-blue-600"/> Quản lý Vận Chuyển
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Quản lý shipper, thu hộ COD và hành trình đơn hàng</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-2 z-10">
                <div className="relative w-full md:w-96 group">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Tìm Mã vận đơn, Hóa đơn, Tên, SĐT..." 
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
                    {DELIVERY_STATUSES.map(st => (
                        <button key={st} onClick={() => setStatusFilter(st)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border
                                ${statusFilter === st ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-blue-600'}
                            `}
                        >
                            {st}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <span>Đang tải dữ liệu...</span>
                    </div>
                ) : !deliveriesData?.data || deliveriesData.data.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <div className="bg-slate-100 p-4 rounded-full mb-4"><FiBox size={40}/></div>
                        <p>Không tìm thấy vận đơn nào.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">Mã Vận Đơn</th>
                                        <th className="px-6 py-4">Khách Hàng</th>
                                        <th className="px-6 py-4">Giao Hàng</th>
                                        <th className="px-6 py-4 text-center">COD</th>
                                        <th className="px-6 py-4 text-center">Trạng Thái</th>
                                        <th className="px-6 py-4 text-right">Thao Tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {deliveriesData.data.map((delivery: any) => (
                                        <tr key={delivery.id} className="hover:bg-blue-50/40 transition-colors group">
                                            <td className="px-6 py-4 align-top">
                                                <div className="font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1" onClick={() => handlePrint(delivery)}>
                                                    {delivery.deliveryNumber}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                    <FiCalendar size={10}/> {moment(delivery.issueDate).format('DD/MM/YYYY HH:mm')}
                                                </div>
                                                {delivery.invoiceId && (
                                                    <div className="mt-1.5 text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 border border-slate-200 w-fit">
                                                        HĐ: {delivery.invoiceId.invoiceNumber}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 align-top">
                                                <div className="font-bold text-slate-800">{delivery.customerName}</div>
                                                <div className="text-slate-500 text-xs mt-1 flex items-center gap-1.5">
                                                    <FiPhone size={12}/> {delivery.customerPhone}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-top max-w-xs">
                                                <div className="flex items-start gap-2">
                                                    <FiMapPin className="text-red-500 mt-0.5 shrink-0" size={14}/>
                                                    <span className="text-slate-600 leading-snug line-clamp-2">{delivery.customerAddress}</span>
                                                </div>
                                                <div className="mt-2 ml-5">
                                                    {delivery.driverName ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">
                                                            <FiTruck size={12}/> {delivery.driverName}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">Chưa gán shipper</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-top text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    {delivery.codAmount > 0 ? (
                                                        <div className="font-bold text-base text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                                                            {formatCurrency(delivery.codAmount)}
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Không thu COD</div>
                                                    )}
                                                    <span className="text-xs text-slate-500 font-medium">Ship: {formatCurrency(delivery.shipFee)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                {renderStatusBadge(delivery.status)}
                                            </td>
                                            <td className="px-6 py-4 align-middle text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <button onClick={() => handlePrint(delivery)} className="p-2 bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 rounded-lg shadow-sm transition-all" title="In Phiếu">
                                                        <FiPrinter size={16}/>
                                                    </button>
                                                    {delivery.status === 'Chờ giao' && <Button size="sm" variant="primary" onClick={() => handleStatusChange(delivery.id, 'Đang giao')}>Giao hàng</Button>}
                                                    {delivery.status === 'Đang giao' && <Button size="sm" variant="success" onClick={() => handleStatusChange(delivery.id, 'Đã giao')}>Hoàn tất</Button>}
                                                    {(delivery.status !== 'Đã giao' && delivery.status !== 'Đã hủy') && (
                                                        <button onClick={() => handleStatusChange(delivery.id, 'Đã hủy')} className="p-2 hover:bg-orange-50 text-orange-500 rounded-lg transition-colors" title="Hủy đơn"><FiXCircle size={18}/></button>
                                                    )}
                                                    <button onClick={() => handleDelete(delivery.id)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Xóa"><FiTrash2 size={18}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination Section */}
                        {deliveriesData?.totalPages > 1 && (
                            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
                                <Pagination currentPage={page} totalPages={deliveriesData.totalPages} onPageChange={setPage} />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            {showPrintModal && selectedDelivery && <PrintDeliveryModal order={selectedDelivery} onClose={() => setShowPrintModal(false)} />}
            <ConfirmModal isOpen={confirmConfig.isOpen} type={confirmConfig.type} title={confirmConfig.title} message={confirmConfig.message} onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} onConfirm={confirmConfig.onConfirm} />
        </div>
    );
};

export default DeliveriesPage;