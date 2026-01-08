import React, { useState } from 'react';
import { FiSearch, FiTruck, FiMapPin, FiPhone, FiCheckCircle, FiXCircle, FiClock, FiFileText } from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import Pagination from '../components/common/Pagination';
import { formatCurrency } from '../utils/currency';
import toast from 'react-hot-toast';
import PrintDeliveryModal from '../components/print/PrintDeliveryModal';

const DeliveriesPage: React.FC = () => {
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [printingId, setPrintingId] = useState<string | null>(null);

    const queryClient = useQueryClient();

    // Lấy danh sách giao hàng
    const { data: deliveryData, isLoading } = useQuery({
        queryKey: ['deliveries', page, statusFilter, searchTerm],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                status: statusFilter,
                search: searchTerm
            });
            return api(`/api/deliveries?${params.toString()}`);
        }
    });

    const deliveries = deliveryData?.data || [];
    const totalPages = deliveryData?.totalPages || 1;

    // Cập nhật trạng thái
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: string }) => 
            api(`/api/deliveries/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deliveries'] });
            toast.success('Cập nhật trạng thái thành công');
        },
        onError: (err: any) => toast.error(err.message)
    });

    // [QUAN TRỌNG] Hàm hiển thị trạng thái (Sửa ở đây)
    const renderStatus = (status: string) => {
        switch (status) {
            case 'PENDING':
                // Đổi "Chờ lấy hàng" -> "Chờ giao"
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 flex items-center gap-1 w-fit"><FiClock/> Chờ giao</span>;
            case 'SHIPPING':
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1 w-fit"><FiTruck/> Đang giao</span>;
            case 'COMPLETED':
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200 flex items-center gap-1 w-fit"><FiCheckCircle/> Đã giao</span>;
            case 'CANCELLED':
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1 w-fit"><FiXCircle/> Đã hủy</span>;
            default:
                return <span>{status}</span>;
        }
    };

    const handleUpdateStatus = (id: string, newStatus: string) => {
        if (window.confirm('Bạn có chắc muốn cập nhật trạng thái đơn này?')) {
            updateStatusMutation.mutate({ id, status: newStatus });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Thanh công cụ */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative flex-1 w-full md:max-w-md">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" placeholder="Tìm mã vận đơn, tên khách, SĐT..." 
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none"
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <select 
                    className="pl-3 pr-8 py-2 rounded-lg border border-slate-300 bg-white cursor-pointer"
                    value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="PENDING">Chờ giao</option> {/* Đổi text ở đây nữa */}
                    <option value="SHIPPING">Đang giao</option>
                    <option value="COMPLETED">Đã giao</option>
                    <option value="CANCELLED">Đã hủy</option>
                </select>
            </div>

            {/* Danh sách */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Mã Vận Đơn</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Thông tin nhận</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Thu hộ (COD)</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Phí Ship</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">Trạng thái</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {isLoading ? (
                                <tr><td colSpan={6} className="text-center py-10 text-slate-500">Đang tải dữ liệu...</td></tr>
                            ) : deliveries.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-10 text-slate-500">Chưa có đơn giao hàng nào.</td></tr>
                            ) : deliveries.map((item: any) => (
                                <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-primary-600">{item.deliveryCode}</div>
                                        <div className="text-xs text-slate-500 mt-1">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-700">{item.customerName}</div>
                                        <div className="text-sm text-slate-600 flex items-center gap-1 mt-1"><FiPhone size={12}/> {item.phone}</div>
                                        <div className="text-sm text-slate-500 flex items-start gap-1 mt-1"><FiMapPin size={12} className="mt-0.5 shrink-0"/> {item.address}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="font-bold text-red-600">{formatCurrency(item.codAmount)}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-slate-600">
                                        {formatCurrency(item.shipFee)}
                                    </td>
                                    <td className="px-6 py-4 flex justify-center">{renderStatus(item.status)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button 
                                                onClick={() => setPrintingId(item._id)}
                                                className="p-2 text-slate-600 hover:bg-slate-100 rounded" 
                                                title="In phiếu giao"
                                            >
                                                <FiFileText />
                                            </button>

                                            {item.status === 'PENDING' && (
                                                <button 
                                                    onClick={() => handleUpdateStatus(item._id, 'SHIPPING')}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded font-bold text-xs border border-blue-100"
                                                >
                                                    Giao hàng
                                                </button>
                                            )}
                                            {item.status === 'SHIPPING' && (
                                                <button 
                                                    onClick={() => handleUpdateStatus(item._id, 'COMPLETED')}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded font-bold text-xs border border-green-100"
                                                >
                                                    Hoàn tất
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-slate-200">
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={deliveryData?.total || 0} itemsPerPage={10}/>
                </div>
            </div>

            {printingId && (
                <PrintDeliveryModal 
                    deliveryId={printingId} 
                    onClose={() => setPrintingId(null)} 
                />
            )}
        </div>
    );
};

export default DeliveriesPage;