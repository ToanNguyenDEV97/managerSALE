import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { FiPrinter, FiX } from 'react-icons/fi';

const PrintOrderModal = ({ order, onClose }: { order: any, onClose: () => void }) => {
    const componentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
    });

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl flex flex-col h-[90vh]">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-bold">Xem Trước Khi In</h3>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center gap-2"><FiPrinter/> In Ngay</button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded"><FiX/></button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                    <div ref={componentRef} className="bg-white p-8 shadow-sm mx-auto max-w-[80mm] sm:max-w-full text-sm leading-relaxed text-slate-800" style={{ minHeight: '500px' }}>
                        
                        {/* Header Phiếu */}
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold uppercase mb-1">Phiếu Giao Hàng</h1>
                            <p className="text-slate-500">Mã đơn: <b>#{order.orderNumber}</b></p>
                            <p className="text-xs text-slate-400">Ngày tạo: {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                        </div>

                        {/* Thông tin */}
                        <div className="mb-6 border-b pb-4 border-dashed border-slate-300">
                            <div className="grid grid-cols-3 gap-2 mb-2">
                                <span className="text-slate-500">Khách hàng:</span>
                                <span className="col-span-2 font-bold">{order.customerName}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-2">
                                <span className="text-slate-500">Số điện thoại:</span>
                                <span className="col-span-2">{order.delivery?.phone || '---'}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-slate-500">Địa chỉ:</span>
                                <span className="col-span-2">{order.delivery?.address || 'Tại quầy'}</span>
                            </div>
                        </div>

                        {/* List hàng */}
                        <table className="w-full mb-6">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="text-left py-1">Tên hàng</th>
                                    <th className="text-center py-1 w-10">SL</th>
                                    <th className="text-right py-1">Đ.Giá</th>
                                    <th className="text-right py-1">T.Tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item: any, i: number) => (
                                    <tr key={i} className="border-b border-slate-200 border-dashed">
                                        <td className="py-2 pr-2">{item.name}</td>
                                        <td className="py-2 text-center font-bold">{item.quantity}</td>
                                        <td className="py-2 text-right">{item.price.toLocaleString()}</td>
                                        <td className="py-2 text-right">{ (item.price * item.quantity).toLocaleString() }</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Tổng kết */}
                        <div className="flex justify-between items-center font-bold text-lg border-t pt-4">
                            <span>Phải thu:</span>
                            <span>{ (order.totalAmount - order.depositAmount).toLocaleString() } ₫</span>
                        </div>
                        {order.depositAmount > 0 && <p className="text-right text-xs italic mt-1">(Đã trừ cọc: {order.depositAmount.toLocaleString()})</p>}
                        
                        <div className="mt-8 text-center text-xs text-slate-400">
                            <p>Cảm ơn quý khách đã ủng hộ!</p>
                            <p>Hotline: 0909.xxx.xxx</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintOrderModal;