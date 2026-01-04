import React, { useState } from 'react';
import { 
    FiX, FiPrinter, FiUser, FiMapPin, FiCheckCircle, 
    FiTruck, FiXCircle, FiPackage, FiCalendar
} from 'react-icons/fi';
import { api } from '../../../utils/api';
import toast from 'react-hot-toast';

interface OrderDetailsModalProps {
    order: any;
    onClose: () => void;
    onUpdate: () => void;
    onPrintOrder: () => void;
    onPrintDelivery: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ 
    order, onClose, onUpdate, onPrintOrder, onPrintDelivery 
}) => {
    const [processing, setProcessing] = useState(false);

    // Nếu không có order thì không render gì cả
    if (!order) return null;

    // --- HELPER AN TOÀN ---
    // Hàm format tiền an toàn (tránh lỗi crash nếu value = undefined/null)
    const formatMoney = (amount: any) => {
        return (Number(amount) || 0).toLocaleString('vi-VN');
    };

    // Hàm format ngày an toàn
    const formatDate = (dateString: any) => {
        try {
            if (!dateString) return '---';
            return new Date(dateString).toLocaleString('vi-VN');
        } catch {
            return 'Ngày không hợp lệ';
        }
    };

    // --- LOGIC ---
    const handleUpdateStatus = async (newStatus: string) => {
        if (!window.confirm(`Xác nhận chuyển trạng thái sang "${newStatus}"?`)) return;

        setProcessing(true);
        try {
            await api(`/api/orders/${order._id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            toast.success(`Đã cập nhật trạng thái: ${newStatus}`);
            onUpdate(); 
            onClose(); 
        } catch (err: any) {
            toast.error(err.message || 'Lỗi khi cập nhật');
        } finally {
            setProcessing(false);
        }
    };

    // Tính tổng số lượng item an toàn
    const items = Array.isArray(order.items) ? order.items : [];
    const totalItems = items.reduce((sum: number, item: any) => sum + (Number(item?.quantity) || 0), 0);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* --- HEADER --- */}
                <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-slate-800">Đơn hàng #{order.orderNumber || '---'}</h2>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                order.status === 'Mới' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                order.status === 'Hoàn thành' ? 'bg-green-100 text-green-700 border-green-200' :
                                order.status === 'Đã hủy' ? 'bg-red-100 text-red-700 border-red-200' :
                                'bg-orange-100 text-orange-700 border-orange-200'
                            }`}>
                                {order.status || 'Mới'}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                            <FiCalendar /> Ngày tạo: {formatDate(order.createdAt)}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                        <FiX size={24} />
                    </button>
                </div>

                {/* --- BODY --- */}
                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Cột Trái: Thông tin khách hàng */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-base border-b pb-2">
                                <FiUser className="text-primary-600"/> Thông tin khách hàng
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Họ tên:</span>
                                    <span className="font-medium text-slate-900">{order.customerName || 'Khách lẻ'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Số điện thoại:</span>
                                    <span className="font-medium text-slate-900">{order.customerPhone || order.phone || '---'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block mb-1">Địa chỉ:</span>
                                    <p className="flex items-start gap-2 font-medium text-slate-900 bg-slate-50 p-2 rounded">
                                        <FiMapPin className="mt-0.5 text-slate-400 shrink-0"/> 
                                        {order.customerAddress || order.address || 'Mua tại quầy'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Cột Phải: Thông tin thanh toán */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-base border-b pb-2">
                                <FiCheckCircle className="text-primary-600"/> Thanh toán & Giao vận
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500">Hình thức:</span>
                                    <span className="font-medium px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                                        {order.isDelivery ? 'Giao hàng tận nơi' : 'Nhận tại cửa hàng'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500">Thanh toán:</span>
                                    <span className="font-bold text-green-600">{order.paymentMethod || 'Tiền mặt'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block mb-1">Ghi chú đơn hàng:</span>
                                    <p className="italic text-slate-600 bg-slate-50 p-2 rounded min-h-[40px] text-xs">
                                        {order.note || 'Không có ghi chú'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Danh sách sản phẩm */}
                    <div>
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <FiPackage className="text-primary-600"/> Chi tiết sản phẩm ({totalItems})
                        </h3>
                        <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-3">Tên sản phẩm</th>
                                        <th className="px-4 py-3 text-center">SL</th>
                                        <th className="px-4 py-3 text-right">Đơn giá</th>
                                        <th className="px-4 py-3 text-right">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.length === 0 ? (
                                        <tr><td colSpan={4} className="p-4 text-center text-slate-400">Không có sản phẩm nào</td></tr>
                                    ) : (
                                        items.map((item: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-slate-800">{item?.name || item?.productName || 'Sản phẩm lỗi'}</p>
                                                    {item?.sku && <span className="text-xs text-slate-400 font-mono">{item.sku}</span>}
                                                </td>
                                                <td className="px-4 py-3 text-center font-medium">x{item?.quantity || 0}</td>
                                                <td className="px-4 py-3 text-right text-slate-500">{formatMoney(item?.price)} ₫</td>
                                                <td className="px-4 py-3 text-right font-bold text-slate-800">
                                                    {formatMoney((item?.price || 0) * (item?.quantity || 0))} ₫
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                <tfoot className="bg-slate-50 border-t border-slate-200">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-3 text-right font-bold text-slate-600">Tổng tiền hàng:</td>
                                        <td className="px-4 py-3 text-right font-bold text-lg text-slate-800">
                                            {formatMoney(order.totalAmount)} ₫
                                        </td>
                                    </tr>
                                    {order.depositAmount > 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-2 text-right text-slate-500 text-xs">Đã thanh toán (Cọc):</td>
                                            <td className="px-4 py-2 text-right font-bold text-green-600">
                                                - {formatMoney(order.depositAmount)} ₫
                                            </td>
                                        </tr>
                                    )}
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                {/* --- FOOTER --- */}
                <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center gap-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                    
                    {/* Nút In */}
                    <div className="flex gap-2">
                        <button 
                            onClick={onPrintOrder}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 font-medium transition-all shadow-sm"
                        >
                            <FiPrinter size={18} /> In Hóa Đơn
                        </button>

                        {order.isDelivery && (
                            <button 
                                onClick={onPrintDelivery}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium transition-all shadow-sm"
                            >
                                <FiTruck size={18} /> In Phiếu Ship
                            </button>
                        )}
                    </div>

                    {/* Nút Hành động */}
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Đóng</button>

                        {order.status === 'Mới' && (
                            <>
                                <button 
                                    disabled={processing}
                                    onClick={() => handleUpdateStatus('Đã hủy')}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors"
                                >
                                    <FiXCircle /> Hủy đơn
                                </button>
                                <button 
                                    disabled={processing}
                                    onClick={() => handleUpdateStatus(order.isDelivery ? 'Đang giao' : 'Hoàn thành')}
                                    className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-md font-bold transition-transform active:scale-95"
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
                                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md font-bold transition-transform active:scale-95"
                            >
                                <FiCheckCircle /> Xác nhận giao thành công
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsModal;