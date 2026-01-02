import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { FiPrinter, FiX } from 'react-icons/fi';
import { PrintTemplate } from './PrintTemplate'; 

interface Props {
    order: any;
    onClose: () => void;
}

const PrintOrderModal: React.FC<Props> = ({ order, onClose }) => {
    const componentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({ content: () => componentRef.current });

    // Tính toán
    const totalAmount = order.totalAmount || 0;
    const discount = order.discountAmount || 0; 
    const paidAmount = order.depositAmount || 0;
    const debt = (totalAmount - discount) - paidAmount;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-xl w-full max-w-4xl flex flex-col h-[90vh] shadow-2xl overflow-hidden">
                {/* Header Toolbar */}
                <div className="p-4 border-b flex justify-between items-center bg-slate-100 shrink-0">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <FiPrinter/> Xem Trước Bản In
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg flex items-center gap-2">
                            <FiPrinter/> IN NGAY
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-white bg-slate-200 rounded-lg"><FiX size={20}/></button>
                    </div>
                </div>
                
                {/* Vùng hiển thị bản in */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-500/20 flex justify-center">  
                        <PrintTemplate 
                            ref={componentRef}
                            title="ĐƠN ĐẶT HÀNG" 
                            subTitle="(Kiêm Phiếu giao hàng)"
                            
                            // [SỬA LỖI TẠI ĐÂY] Chỉ truyền order.orderNumber, không ghép thêm 'DH-'
                            code={order.orderNumber} 
                            
                            date={order.createdAt}
                            
                            customer={{
                                name: order.customerName,
                                phone: order.customerPhone || order.delivery?.phone || '...', 
                                address: order.customerAddress || order.delivery?.address || '...'
                            }}
                            
                            payment={{
                                totalAmount: totalAmount,
                                discount: discount,
                                paidAmount: paidAmount,
                                debt: debt
                            }}
                            note={order.note}
                        >
                            {/* BẢNG SẢN PHẨM - Style viền đen chuẩn hóa đơn */}
                            <table className="w-full border-collapse border border-slate-300 mb-2">
                                <thead>
                                    <tr className="bg-slate-100 text-slate-800 font-bold uppercase text-xs">
                                        <th className="border border-slate-300 py-2 px-2 w-10 text-center font-bold">STT</th>
                                        <th className="border border-slate-300 py-2 px-2 text-left font-bold">Tên hàng hóa, quy cách</th>
                                        <th className="border border-slate-300 py-2 px-2 w-14 text-center font-bold">ĐVT</th>
                                        <th className="border border-slate-300 py-2 px-2 w-14 text-center font-bold">SL</th>
                                        <th className="border border-slate-300 py-2 px-2 w-24 text-right font-bold">Đơn giá</th>
                                        <th className="border border-slate-300 py-2 px-2 w-28 text-right font-bold">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items.map((item: any, idx: number) => (
                                        <tr key={idx}>
                                            <td className="border border-slate-300 px-2 py-1.5 text-center">{idx + 1}</td>
                                            <td className="border border-slate-300 px-2 py-1.5 font-medium">{item.name}</td>
                                            <td className="border border-slate-300 px-2 py-1.5 text-center">{item.unit || 'Cái'}</td>
                                            <td className="border border-slate-300 px-2 py-1.5 text-center font-bold">{item.quantity}</td>
                                            <td className="border border-slate-300 px-2 py-1.5 text-right">{item.price.toLocaleString()}</td>
                                            <td className="border border-slate-300 px-2 py-1.5 text-right font-bold">
                                                {(item.price * item.quantity).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                    
                                    {/* Dòng Phí vận chuyển */}
                                    {order.delivery?.shipFee > 0 && (
                                        <tr>
                                            <td className="border border-slate-300 px-2 py-1.5 text-center">{order.items.length + 1}</td>
                                            <td className="border border-slate-300 px-2 py-1.5">Phí vận chuyển / Giao hàng</td>
                                            <td className="border border-slate-300 px-2 py-1.5 text-center">Lần</td>
                                            <td className="border border-slate-300 px-2 py-1.5 text-center">1</td>
                                            <td className="border border-slate-300 px-2 py-1.5 text-right">{order.delivery.shipFee.toLocaleString()}</td>
                                            <td className="border border-slate-300 px-2 py-1.5 text-right font-bold">{order.delivery.shipFee.toLocaleString()}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </PrintTemplate>
                    </div>
                </div>
            </div>
        );
    };

export default PrintOrderModal;