import React, { useState } from 'react';
import { FiX, FiPrinter, FiCheckCircle, FiTruck, FiXCircle, FiArrowRight, FiFileText } from 'react-icons/fi';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import PrintOrderModal from './business/PrintOrderModal';

interface Props {
    order: any;
    onClose: () => void;
    onUpdate: () => void;
}

const OrderDetailsModal: React.FC<Props> = ({ order, onClose, onUpdate }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [showPrint, setShowPrint] = useState(false);

    // 1. Chức năng: Chuyển Đơn hàng -> Hóa đơn (Hoàn tất bán hàng)
    const handleConvertToInvoice = async () => {
        if (!window.confirm('Xác nhận: Khách đã nhận hàng/thanh toán? Hệ thống sẽ tạo Hóa đơn và trừ kho chính thức.')) return;
        
        setIsProcessing(true);
        try {
            // Bước 1: Gọi API tạo hóa đơn từ dữ liệu đơn hàng
            await api('/api/invoices', {
                method: 'POST',
                body: JSON.stringify({
                    orderId: order._id,
                    customerId: order.customerId,
                    items: order.items, // Backend sẽ tự lấy lại giá vốn mới nhất để an toàn
                    discountAmount: 0,
                    paymentAmount: order.totalAmount, // Giả định khách trả hết (hoặc bạn có thể làm popup nhập tiền)
                    paymentMethod: 'Tiền mặt',
                    deliveryInfo: order.delivery,
                    note: `Chuyển từ đơn hàng #${order.orderNumber}`
                })
            });

            // Bước 2: Cập nhật trạng thái Đơn hàng -> Hoàn thành
            await api(`/api/orders/${order._id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'Hoàn thành' })
            });

            toast.success('Đã xuất hàng và tạo hóa đơn thành công!');
            onUpdate();
        } catch (err: any) {
            toast.error(err.message || 'Lỗi khi chuyển đổi');
        } finally {
            setIsProcessing(false);
        }
    };

    // 2. Chức năng: Cập nhật trạng thái thủ công (Ví dụ: Đang giao)
    const updateStatus = async (status: string) => {
        try {
            await api(`/api/orders/${order._id}`, { method: 'PUT', body: JSON.stringify({ status }) });
            toast.success(`Đã cập nhật: ${status}`);
            onUpdate();
        } catch (error) { toast.error('Lỗi cập nhật'); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            Đơn hàng #{order.orderNumber}
                            <span className={`px-3 py-1 rounded-full text-xs ${
                                order.status === 'Mới' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'Hoàn thành' ? 'bg-green-100 text-green-700' :
                                order.status === 'Hủy' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>{order.status}</span>
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><FiX size={24} /></button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {/* Thông tin khách & Giao hàng */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><FiFileText/> Thông tin khách hàng</h3>
                            <p><span className="text-slate-500">Tên:</span> <b>{order.customerName}</b></p>
                            {order.delivery?.phone && <p><span className="text-slate-500">SĐT:</span> {order.delivery.phone}</p>}
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><FiTruck/> Giao nhận</h3>
                            <p><span className="text-slate-500">Hình thức:</span> {order.isDelivery ? 'Giao tận nơi' : 'Nhận tại quầy'}</p>
                            {order.isDelivery && <p className="truncate"><span className="text-slate-500">Địa chỉ:</span> {order.delivery?.address}</p>}
                            {order.note && <p className="text-yellow-600 mt-1 italic">Ghi chú: {order.note}</p>}
                        </div>
                    </div>

                    {/* Bảng sản phẩm */}
                    <table className="w-full text-sm text-left mb-6">
                        <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">Sản phẩm</th>
                                <th className="px-4 py-3 text-center">SL</th>
                                <th className="px-4 py-3 text-right">Đơn giá</th>
                                <th className="px-4 py-3 text-right rounded-r-lg">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {order.items.map((item: any, idx: number) => (
                                <tr key={idx}>
                                    <td className="px-4 py-3 font-medium">{item.name}</td>
                                    <td className="px-4 py-3 text-center">{item.quantity}</td>
                                    <td className="px-4 py-3 text-right">{item.price.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right font-bold">{(item.price * item.quantity).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t border-slate-200">
                            <tr>
                                <td colSpan={3} className="px-4 py-3 text-right font-bold text-slate-600">Tổng tiền hàng</td>
                                <td className="px-4 py-3 text-right font-bold">{(order.totalAmount - (order.delivery?.shipFee || 0)).toLocaleString()}</td>
                            </tr>
                            {order.isDelivery && (
                                <tr>
                                    <td colSpan={3} className="px-4 py-1 text-right text-slate-500">Phí vận chuyển</td>
                                    <td className="px-4 py-1 text-right">{order.delivery?.shipFee?.toLocaleString()}</td>
                                </tr>
                            )}
                            <tr className="text-lg text-primary-600">
                                <td colSpan={3} className="px-4 py-3 text-right font-bold">TỔNG CỘNG</td>
                                <td className="px-4 py-3 text-right font-bold">{order.totalAmount.toLocaleString()} ₫</td>
                            </tr>
                            {order.depositAmount > 0 && (
                                <tr className="text-green-600">
                                    <td colSpan={3} className="px-4 py-1 text-right italic">Đã đặt cọc</td>
                                    <td className="px-4 py-1 text-right italic">-{order.depositAmount.toLocaleString()}</td>
                                </tr>
                            )}
                        </tfoot>
                    </table>
                </div>

                {/* Footer Action */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-3 justify-end">
                    <button 
                        onClick={() => setShowPrint(true)}
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-2 font-medium"
                    >
                        <FiPrinter /> In Phiếu
                    </button>

                    {order.status === 'Mới' && (
                        <>
                            <button 
                                onClick={() => updateStatus('Hủy')}
                                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-2 font-medium"
                            >
                                <FiXCircle /> Hủy Đơn
                            </button>
                            <button 
                                onClick={() => updateStatus('Đang xử lý')}
                                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-2 font-medium"
                            >
                                <FiArrowRight /> Duyệt Đơn
                            </button>
                        </>
                    )}

                    {order.status === 'Đang xử lý' && (
                        <button 
                            onClick={() => updateStatus('Đang giao')}
                            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center gap-2 font-medium"
                        >
                            <FiTruck /> Giao Hàng
                        </button>
                    )}

                    {/* NÚT QUAN TRỌNG NHẤT: CHUYỂN THÀNH HÓA ĐƠN */}
                    {(order.status === 'Mới' || order.status === 'Đang xử lý' || order.status === 'Đang giao') && (
                        <button 
                            onClick={handleConvertToInvoice}
                            disabled={isProcessing}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-lg shadow-green-200 flex items-center gap-2 font-bold transition-all hover:-translate-y-0.5"
                        >
                            {isProcessing ? 'Đang xử lý...' : <><FiCheckCircle /> Xuất Hàng & Hoàn Tất</>}
                        </button>
                    )}
                </div>
            </div>

            {showPrint && (
                <PrintOrderModal order={order} onClose={() => setShowPrint(false)} />
            )}
        </div>
    );
};

export default OrderDetailsModal;