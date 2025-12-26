import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../utils/api';
import { FiX, FiPrinter, FiPackage, FiUser, FiCalendar, FiFileText, FiMapPin, FiPhone } from 'react-icons/fi';

interface Props {
    orderId: string | null;
    onClose: () => void;
    onPrint: (id: string) => void;
}

const OrderDetailsModal: React.FC<Props> = ({ orderId, onClose, onPrint }) => {
    // 1. Lấy thông tin ĐƠN HÀNG
    const { data: order, isLoading } = useQuery({
        queryKey: ['order', orderId],
        queryFn: async () => {
            if (!orderId) return null;
            const res: any = await api(`/api/orders/${orderId}`);
            return res.data ? res.data : res;
        },
        enabled: !!orderId,
    });

    // 2. [MỚI] Lấy thông tin chi tiết KHÁCH HÀNG (SĐT, Địa chỉ)
    const { data: customer } = useQuery({
        queryKey: ['customer', order?.customerId],
        queryFn: async () => {
            if (!order?.customerId) return null;
            try {
                const res: any = await api(`/api/customers/${order.customerId}`);
                return res.data ? res.data : res;
            } catch (e) { return null; }
        },
        enabled: !!order?.customerId, // Chỉ chạy khi đã lấy được đơn hàng
    });

    if (!orderId) return null;

    // Logic hiển thị trạng thái
    const renderStatus = (status: string) => {
        if (status === 'Mới') return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold border border-blue-200 shadow-sm">Mới tạo</span>;
        if (status === 'Hoàn thành') return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200 shadow-sm">Đã xuất kho</span>;
        if (status === 'Hủy') return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-200 shadow-sm">Đã hủy</span>;
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">{status}</span>;
    };

    // Ưu tiên lấy thông tin từ hồ sơ khách hàng
    const displayPhone = customer?.phone || '...';
    const displayAddress = customer?.address || 'Tại quầy';

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b bg-white">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-slate-800">
                                {isLoading ? 'Đang tải...' : `Đơn đặt hàng ${order?.orderNumber}`}
                            </h3>
                            {!isLoading && order && renderStatus(order.status)}
                        </div>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                            <FiCalendar size={14}/> 
                            Ngày đặt: {order ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '...'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => onPrint(orderId)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors" title="In phiếu giao hàng">
                            <FiPrinter size={18}/> In phiếu
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"><FiX size={24}/></button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                    {isLoading || !order ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Thông tin 2 cột */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Cột Trái: Khách hàng */}
                                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-50">
                                        <FiUser className="text-blue-600" size={20} />
                                        <h4 className="font-bold text-slate-800">Thông tin Khách hàng</h4>
                                    </div>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Tên khách:</span>
                                            <span className="font-medium text-slate-900">{order.customerName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 flex items-center gap-1"><FiPhone size={14}/> Điện thoại:</span>
                                            <span className="font-medium text-slate-900">{displayPhone}</span>
                                        </div>
                                        <div className="flex justify-between items-start">
                                            <span className="text-slate-500 flex items-center gap-1 shrink-0"><FiMapPin size={14}/> Địa chỉ:</span>
                                            <span className="font-medium text-slate-900 text-right truncate max-w-[180px]" title={displayAddress}>
                                                {displayAddress}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Cột Phải: Thông tin đơn */}
                                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-50">
                                        <FiFileText className="text-purple-600" size={20} />
                                        <h4 className="font-bold text-slate-800">Thông tin Đơn hàng</h4>
                                    </div>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Người tạo:</span>
                                            <span className="font-medium text-slate-900">Admin</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Ghi chú:</span>
                                            <span className="font-medium text-slate-700 italic">{order.note || 'Không có ghi chú'}</span>
                                        </div>
                                        <div className="flex justify-between mt-2 pt-2 border-t border-dashed border-slate-100">
                                            <span className="text-slate-500 font-bold">Tổng tiền:</span>
                                            <span className="font-bold text-blue-600 text-lg">{order.totalAmount?.toLocaleString()} đ</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bảng sản phẩm */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center gap-2 font-bold text-slate-700">
                                    <FiPackage /> Danh sách sản phẩm
                                </div>
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-white text-slate-500 font-bold uppercase text-xs border-b border-slate-100">
                                        <tr>
                                            <th className="px-5 py-3 w-10 text-center">#</th>
                                            <th className="px-5 py-3">Tên sản phẩm</th>
                                            <th className="px-5 py-3 text-center w-20">ĐVT</th>
                                            <th className="px-5 py-3 text-center w-20">SL</th>
                                            <th className="px-5 py-3 text-right">Đơn giá</th>
                                            <th className="px-5 py-3 text-right">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {order.items?.map((item: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="px-5 py-3 text-center text-slate-400">{idx + 1}</td>
                                                <td className="px-5 py-3 font-medium text-slate-800">{item.name}</td>
                                                <td className="px-5 py-3 text-center text-slate-500">{item.unit || 'Cái'}</td>
                                                <td className="px-5 py-3 text-center">
                                                    <span className="bg-slate-100 px-2 py-1 rounded font-bold text-slate-700">{item.quantity}</span>
                                                </td>
                                                <td className="px-5 py-3 text-right text-slate-600">{item.price?.toLocaleString()}</td>
                                                <td className="px-5 py-3 text-right font-bold text-slate-800">
                                                    {((item.price || 0) * (item.quantity || 0)).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsModal;