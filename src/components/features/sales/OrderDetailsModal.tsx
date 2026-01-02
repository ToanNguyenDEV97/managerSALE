import React, { useState } from 'react';
import { FiX, FiPrinter, FiEdit, FiTruck, FiMapPin, FiPhone, FiUser, FiBox, FiDollarSign } from 'react-icons/fi';
import { BaseModal } from '../../common/BaseModal';
import { Button } from '../../common/Button';

// Import các Modal in ấn
import PrintOrderModal from '../../print/PrintOrderModal';
import PrintDeliveryModal from '../../print/PrintDeliveryModal'; // [MỚI] Import phiếu giao hàng

interface Props {
    order: any;
    onClose: () => void;
    onUpdate?: () => void;
}

const OrderDetailsModal: React.FC<Props> = ({ order, onClose, onUpdate }) => {
    // State quản lý các modal in
    const [isPrintOrderOpen, setIsPrintOrderOpen] = useState(false);
    const [isPrintDeliveryOpen, setIsPrintDeliveryOpen] = useState(false); // [MỚI] State mở phiếu giao

    if (!order) return null;

    // Tính toán hiển thị
    const deposit = order.depositAmount || 0;
    const paid = order.paidAmount || 0; // Đã thanh toán (bao gồm cọc)
    const total = order.totalAmount || 0;
    const cod = Math.max(0, total - paid); // Tiền thu hộ = Tổng - Đã trả

    return (
        <BaseModal 
            isOpen={true} 
            onClose={onClose} 
            title={`Chi Tiết Đơn Hàng #${order.orderNumber}`} 
            width="max-w-4xl"
            icon={<FiBox/>}
        >
            <div className="flex flex-col h-[80vh] bg-slate-50">
                {/* 1. HEADER ACTIONS (Thanh công cụ) */}
                <div className="bg-white p-4 border-b flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            order.status === 'Hoàn thành' ? 'bg-green-100 text-green-700' :
                            order.status === 'Hủy' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                        }`}>
                            {order.status}
                        </span>
                        {order.isDelivery && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
                                <FiTruck/> Giao hàng
                            </span>
                        )}
                    </div>
                    
                    <div className="flex gap-2">
                        {/* NÚT IN ĐƠN HÀNG (Cho khách) */}
                        <button 
                            onClick={() => setIsPrintOrderOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-bold transition-colors shadow-sm"
                        >
                            <FiPrinter/> In Đơn
                        </button>

                        {/* [MỚI] NÚT IN PHIẾU GIAO (Cho Shipper) - Chỉ hiện khi là đơn giao hàng */}
                        {order.isDelivery && (
                            <button 
                                onClick={() => setIsPrintDeliveryOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 rounded-lg font-bold transition-colors shadow-sm"
                            >
                                <FiTruck/> In Phiếu Giao
                            </button>
                        )}
                        
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                            <FiX size={20}/>
                        </button>
                    </div>
                </div>

                {/* 2. BODY CONTENT (Cuộn được) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* Block: Thông tin chung & Khách hàng */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Cột Trái: Thông tin Khách */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3 border-b pb-2">
                                <FiUser className="text-primary-600"/> Thông Tin Khách Hàng
                            </h3>
                            <div className="space-y-2 text-sm">
                                <p className="flex justify-between"><span className="text-slate-500">Tên khách:</span> <span className="font-bold">{order.customerName}</span></p>
                                <p className="flex justify-between"><span className="text-slate-500">Ngày đặt:</span> <span>{new Date(order.createdAt).toLocaleString('vi-VN')}</span></p>
                                <p className="flex justify-between"><span className="text-slate-500">Ghi chú:</span> <span className="italic text-slate-600">{order.note || 'Không có'}</span></p>
                            </div>
                        </div>

                        {/* Cột Phải: Thông tin Giao Hàng */}
                        {order.isDelivery && (
                            <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm bg-purple-50/30">
                                <h3 className="font-bold text-purple-700 flex items-center gap-2 mb-3 border-b border-purple-100 pb-2">
                                    <FiTruck/> Thông Tin Giao Hàng
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex gap-2">
                                        <FiUser className="text-slate-400 mt-0.5 flex-shrink-0"/>
                                        <span className="font-medium text-slate-800">{order.customerName}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <FiPhone className="text-slate-400 mt-0.5 flex-shrink-0"/>
                                        <span className="font-bold text-slate-800">{order.delivery?.phone || '---'}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <FiMapPin className="text-slate-400 mt-0.5 flex-shrink-0"/>
                                        <span className="text-slate-600 leading-snug">{order.delivery?.address || '---'}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-purple-100 pt-2 mt-2">
                                        <span className="text-slate-500">Phí Ship:</span>
                                        <span className="font-bold text-slate-800">{order.delivery?.shipFee?.toLocaleString()} ₫</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Block: Danh sách sản phẩm */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-700 font-bold border-b">
                                <tr>
                                    <th className="px-4 py-3">Sản Phẩm</th>
                                    <th className="px-4 py-3 text-center">ĐVT</th>
                                    <th className="px-4 py-3 text-center">SL</th>
                                    <th className="px-4 py-3 text-right">Đơn Giá</th>
                                    <th className="px-4 py-3 text-right">Thành Tiền</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {order.items?.map((item: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                                        <td className="px-4 py-3 text-center text-slate-500">{item.unit || 'Cái'}</td>
                                        <td className="px-4 py-3 text-center font-bold">{item.quantity}</td>
                                        <td className="px-4 py-3 text-right">{item.price?.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right font-bold">
                                            {(item.price * item.quantity).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Block: Tổng kết tài chính */}
                    <div className="flex justify-end">
                        <div className="w-full md:w-1/2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Tổng tiền hàng:</span>
                                <span className="font-bold">{total.toLocaleString()} ₫</span>
                            </div>
                            {order.delivery?.shipFee > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Phí vận chuyển:</span>
                                    <span className="font-bold">{order.delivery.shipFee.toLocaleString()} ₫</span>
                                </div>
                            )}
                            <div className="border-t my-2"></div>
                            <div className="flex justify-between text-lg font-bold">
                                <span className="text-slate-800">TỔNG CỘNG:</span>
                                <span className="text-primary-600">{(total + (order.delivery?.shipFee || 0)).toLocaleString()} ₫</span>
                            </div>
                            
                            {/* Thông tin thanh toán / Công nợ */}
                            <div className="bg-slate-50 p-3 rounded-lg space-y-1 mt-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Đã thanh toán / Cọc:</span>
                                    <span className="font-bold text-green-600">{paid.toLocaleString()} ₫</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Cần thu (COD):</span>
                                    <span className="font-bold text-red-600">{cod.toLocaleString()} ₫</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. FOOTER ACTIONS */}
                <div className="bg-white p-4 border-t flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Đóng</Button>
                    {/* Có thể thêm các nút hành động khác như: Sửa đơn, Hủy đơn nếu cần */}
                </div>
            </div>

            {/* --- MODALS IN ẤN --- */}
            
            {/* Modal In Đơn Hàng (Cho Khách) */}
            {isPrintOrderOpen && (
                <PrintOrderModal 
                    order={order} 
                    onClose={() => setIsPrintOrderOpen(false)} 
                />
            )}

            {/* Modal In Phiếu Giao (Cho Shipper) */}
            {isPrintDeliveryOpen && (
                <PrintDeliveryModal 
                    order={order} 
                    onClose={() => setIsPrintDeliveryOpen(false)} 
                />
            )}

        </BaseModal>
    );
};

export default OrderDetailsModal;