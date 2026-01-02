import React, { useState } from 'react';
import { 
    FiX, FiPrinter, FiUser, FiMapPin, FiCheckCircle, 
    FiTruck, FiXCircle, FiPackage, FiPhone, FiCalendar
} from 'react-icons/fi';
import { api } from '../../../utils/api';
import toast from 'react-hot-toast';

interface OrderDetailsModalProps {
    order: any;
    onClose: () => void;
    onUpdate: () => void;
    onPrintOrder: () => void;      // Nhận hàm in Hóa đơn từ cha
    onPrintDelivery: () => void;   // Nhận hàm in Phiếu ship từ cha
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ 
    order, onClose, onUpdate, onPrintOrder, onPrintDelivery 
}) => {
    const [processing, setProcessing] = useState(false);

    // Hàm xử lý đổi trạng thái
    const handleUpdateStatus = async (newStatus: string) => {
        if (!window.confirm(`Xác nhận chuyển trạng thái sang "${newStatus}"?`)) return;

        setProcessing(true);
        try {
            await api(`/api/orders/${order._id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            toast.success(`Đã cập nhật trạng thái: ${newStatus}`);
            onUpdate(); // Refresh data
            onClose();  // Đóng modal
        } catch (err: any) {
            toast.error(err.message || 'Lỗi khi cập nhật');
        } finally {
            setProcessing(false);
        }
    };

    if (!order) return null;

    // Tính tổng số lượng item
    const totalItems = order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* --- HEADER --- */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-slate-800">Đơn hàng #{order.orderNumber}</h2>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                order.status === 'Mới' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                order.status === 'Hoàn thành' ? 'bg-green-100 text-green-700 border-green-200' :
                                'bg-orange-100 text-orange-700 border-orange-200'
                            }`}>
                                {order.status}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                            <FiCalendar /> Ngày tạo: {new Date(order.createdAt).toLocaleString('vi-VN')}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <FiX size={24} />
                    </button>
                </div>

                {/* --- BODY (NỘI DUNG CHI TIẾT) --- */}
                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Cột Trái: Thông tin khách hàng */}
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <FiUser className="text-primary-600"/> Thông tin khách hàng
                            </h3>
                            <div className="space-y-3 text-sm">
                                <p><span className="text-slate-500 block text-xs uppercase font-semibold">Họ tên</span> {order.customerName}</p>
                                <p>
                                    <span className="text-slate-500 block text-xs uppercase font-semibold">Số điện thoại</span> 
                                    {order.phone || order.phoneNumber || order.customerPhone || 'Chưa cập nhật'}
                                </p>
                                <p className="flex items-start gap-2">
                                    <FiMapPin className="mt-1 text-slate-400 shrink-0"/> 
                                    <span>{order.address || order.customerAddress || 'Mua tại quầy'}</span>
                                </p>
                            </div>
                        </div>

                        {/* Cột Phải: Thông tin thanh toán */}
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <FiCheckCircle className="text-primary-600"/> Thanh toán & Vận chuyển
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between border-b border-dashed border-slate-300 pb-2">
                                    <span className="text-slate-500">Hình thức</span>
                                    <span className="font-medium">{order.isDelivery ? 'Giao hàng tận nơi' : 'Nhận tại cửa hàng'}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed border-slate-300 pb-2">
                                    <span className="text-slate-500">Thanh toán</span>
                                    <span className="font-medium text-green-600">{order.paymentMethod || 'Tiền mặt'}</span>
                                </div>
                                <div className="flex justify-between pt-1">
                                    <span className="text-slate-500">Ghi chú</span>
                                    <span className="italic text-slate-600 max-w-[200px] text-right">{order.note || 'Không có ghi chú'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Danh sách sản phẩm */}
                    <div>
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <FiPackage className="text-primary-600"/> Danh sách sản phẩm ({totalItems})
                        </h3>
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-3">Sản phẩm</th>
                                        <th className="px-4 py-3 text-center">SL</th>
                                        <th className="px-4 py-3 text-right">Đơn giá</th>
                                        <th className="px-4 py-3 text-right">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {order.items?.map((item: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-slate-700">{item.productName || item.name}</p>
                                                {item.variant && <span className="text-xs text-slate-500">Phân loại: {item.variant}</span>}
                                            </td>
                                            <td className="px-4 py-3 text-center font-medium">x{item.quantity}</td>
                                            <td className="px-4 py-3 text-right text-slate-500">{item.price?.toLocaleString()} ₫</td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-800">
                                                {(item.price * item.quantity).toLocaleString()} ₫
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-3 text-right font-bold text-slate-600">Tổng cộng:</td>
                                        <td className="px-4 py-3 text-right font-bold text-primary-600 text-lg">
                                            {order.totalAmount?.toLocaleString()} ₫
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                {/* --- FOOTER (ACTION BAR) --- */}
                <div className="p-4 bg-white border-t border-slate-100 flex justify-between items-center gap-3">
                    
                    {/* KHU VỰC NÚT IN (BÊN TRÁI) */}
                    <div className="flex gap-2">
                        {/* 1. Nút In Hóa Đơn */}
                        <button 
                            onClick={onPrintOrder}
                            className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 hover:border-slate-400 font-medium transition-colors"
                            title="In hóa đơn bán lẻ"
                        >
                            <FiPrinter size={18} /> 
                            <span>In Hóa Đơn</span>
                        </button>

                        {/* 2. Nút In Phiếu Ship (Chỉ hiện nếu là đơn Giao hàng) */}
                        {order.isDelivery && (
                            <button 
                                onClick={onPrintDelivery}
                                className="flex items-center gap-2 px-3 py-2 border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium transition-colors"
                                title="In phiếu giao hàng cho Shipper"
                            >
                                <FiTruck size={18} /> 
                                <span>In Phiếu Ship</span>
                            </button>
                        )}
                    </div>

                    {/* KHU VỰC NÚT XỬ LÝ (BÊN PHẢI) */}
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Đóng</button>

                        {/* Logic hiển thị nút theo trạng thái */}
                        {order.status === 'Mới' && (
                            <>
                                <button 
                                    disabled={processing}
                                    onClick={() => handleUpdateStatus('Đã hủy')}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 font-medium transition-colors"
                                >
                                    <FiXCircle /> Hủy đơn
                                </button>
                                <button 
                                    disabled={processing}
                                    onClick={() => handleUpdateStatus(order.isDelivery ? 'Đang giao' : 'Hoàn thành')}
                                    className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-lg font-bold transition-all active:scale-95"
                                >
                                    {processing ? 'Đang xử lý...' : (
                                        order.isDelivery ? <><FiTruck /> Duyệt & Giao</> : <><FiCheckCircle /> Hoàn tất đơn</>
                                    )}
                                </button>
                            </>
                        )}

                        {order.status === 'Đang giao' && (
                            <button 
                                disabled={processing}
                                onClick={() => handleUpdateStatus('Hoàn thành')}
                                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-lg font-bold transition-all active:scale-95"
                            >
                                <FiCheckCircle /> Xác nhận đã giao xong
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsModal;