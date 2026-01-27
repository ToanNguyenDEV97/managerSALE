import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { FiPrinter, FiX } from 'react-icons/fi';
import { useAppContext } from '../../context/DataContext';
// Import hàm dùng chung từ file currency.ts
import { formatCurrency, readMoneyToText } from '../../utils/currency'; 
import moment from 'moment';

interface Props {
    order: any;
    onClose: () => void;
}

const PrintOrderModal: React.FC<Props> = ({ order, onClose }) => {
    const componentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({ content: () => componentRef.current });
    const { companyInfo } = useAppContext();

    // Dữ liệu Shop fallback
    const shop = companyInfo || {
        name: "CỬA HÀNG CỦA BẠN",
        address: "Cập nhật địa chỉ trong Cài đặt",
        phone: "09xx.xxx.xxx",
        email: "contact@email.com",
        website: "www.myshop.com"
    };

    // --- [LOGIC TÍNH TOÁN AN TOÀN] ---
    // 1. Lấy các giá trị cơ bản và ép kiểu số để tránh NaN
    const totalAmount = Number(order.totalAmount) || 0;
    const discountAmount = Number(order.discountAmount) || 0;
    let finalAmount = Number(order.finalAmount) || 0;

    // 2. [FIX QUAN TRỌNG] Nếu finalAmount = 0 mà totalAmount > 0 (dữ liệu bị lỗi), tự động tính lại
    if (finalAmount === 0 && totalAmount > 0) {
        finalAmount = totalAmount - discountAmount;
    }

    // 3. Tính tiền cọc và còn lại dựa trên finalAmount chuẩn
    const deposit = Number(order.depositAmount) || 0;
    const remaining = Math.max(0, finalAmount - deposit);

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-xl w-full max-w-4xl flex flex-col shadow-2xl h-[95vh] overflow-hidden">
                
                {/* --- HEADER TOOLBAR --- */}
                <div className="p-4 border-b flex justify-between items-center bg-slate-50 shrink-0">
                    <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                            <FiPrinter className="text-blue-600"/> Xem Trước Đơn Hàng
                        </h3>
                        <p className="text-xs text-slate-500">Khổ giấy A4 - Form chuẩn</p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={handlePrint} 
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg flex items-center gap-2 transition-all"
                        >
                            <FiPrinter size={18}/> IN NGAY
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-red-100 text-slate-500 hover:text-red-500 rounded-lg transition-colors">
                            <FiX size={24}/>
                        </button>
                    </div>
                </div>
                
                {/* --- PRINT AREA --- */}
                <div className="flex-1 overflow-y-auto bg-slate-100 p-8 flex justify-center custom-scrollbar">
                    <div 
                        ref={componentRef} 
                        className="bg-white text-black p-10 box-border shadow-lg print:shadow-none"
                        style={{ 
                            width: '210mm', 
                            minHeight: '297mm', // Chuẩn A4
                            fontFamily: '"Times New Roman", Times, serif',
                            fontSize: '13px',
                            lineHeight: '1.4'
                        }}
                    >
                        {/* 1. HEADER CÔNG TY */}
                        <div className="flex justify-between items-start mb-6 border-b-2 border-black pb-4">
                            <div className="w-2/3 pr-4">
                                <div className="font-bold text-xl uppercase mb-1">{shop.name}</div>
                                <div className="text-sm mb-1">{shop.address}</div>
                                <div className="text-sm font-bold">Hotline: {shop.phone}</div>
                                {shop.email && <div className="text-sm italic text-slate-600">Email: {shop.email}</div>}
                            </div>
                            <div className="w-1/3 text-right">
                                <div className="text-2xl font-black uppercase tracking-wider mb-1">ĐƠN ĐẶT HÀNG</div>
                                <div className="text-sm">Số ĐH: <span className="font-bold">{order.orderNumber || order.code}</span></div>
                                <div className="text-sm italic">Ngày: {moment(order.createdAt).format('DD/MM/YYYY')}</div>
                                <div className="text-sm italic mt-1 text-slate-500">
                                    Trạng thái: {order.status}
                                </div>
                            </div>
                        </div>

                        {/* 2. THÔNG TIN KHÁCH HÀNG */}
                        <div className="border-2 border-black rounded-lg p-4 mb-6 relative">
                            <div className="absolute -top-3 left-4 bg-white px-2 font-bold text-sm uppercase">
                                Thông tin khách hàng
                            </div>
                            <div className="grid grid-cols-1 gap-1">
                                <div className="flex">
                                    <span className="w-28 font-bold shrink-0">Khách hàng:</span>
                                    <span className="uppercase font-bold">{order.customerName}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-28 font-bold shrink-0">Điện thoại:</span>
                                    <span>{order.customerPhone || '---'}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-28 font-bold shrink-0">Địa chỉ:</span>
                                    <span>{order.customerAddress || '---'}</span>
                                </div>
                                {order.deliveryDate && (
                                    <div className="flex text-blue-800">
                                        <span className="w-28 font-bold shrink-0">Ngày giao (dự kiến):</span>
                                        <span className="font-bold">{moment(order.deliveryDate).format('DD/MM/YYYY')}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. BẢNG SẢN PHẨM */}
                        <table className="w-full mb-4 border-collapse border border-black text-sm">
                            <thead>
                                <tr className="bg-slate-100 font-bold text-center uppercase text-xs">
                                    <th className="border border-black p-2 w-10">STT</th>
                                    <th className="border border-black p-2">Tên Hàng Hóa / Dịch Vụ</th>
                                    <th className="border border-black p-2 w-16">ĐVT</th>
                                    <th className="border border-black p-2 w-16">SL</th>
                                    <th className="border border-black p-2 w-28">Đơn Giá</th>
                                    <th className="border border-black p-2 w-32">Thành Tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items?.map((item: any, index: number) => (
                                    <tr key={index}>
                                        <td className="border border-black p-2 text-center">{index + 1}</td>
                                        <td className="border border-black p-2 font-medium">
                                            {item.productName || item.name}
                                            {item.sku && <div className="text-[11px] italic text-slate-500">{item.sku}</div>}
                                        </td>
                                        <td className="border border-black p-2 text-center">{item.unit || 'Cái'}</td>
                                        <td className="border border-black p-2 text-center font-bold">{item.quantity}</td>
                                        <td className="border border-black p-2 text-right">{formatCurrency(item.price)}</td>
                                        <td className="border border-black p-2 text-right font-bold">
                                            {formatCurrency(item.total || item.quantity * item.price)}
                                        </td>
                                    </tr>
                                ))}
                                {/* Dòng trống */}
                                {(!order.items || order.items.length < 5) && Array.from({ length: 5 - (order.items?.length || 0) }).map((_, i) => (
                                    <tr key={`empty-${i}`}>
                                        <td className="border border-black p-3">&nbsp;</td>
                                        <td className="border border-black p-3"></td><td className="border border-black p-3"></td>
                                        <td className="border border-black p-3"></td><td className="border border-black p-3"></td><td className="border border-black p-3"></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* 4. TỔNG KẾT & CHỮ */}
                        <div className="flex gap-6 mb-8">
                            {/* Cột Trái: Bằng chữ & Ghi chú */}
                            <div className="w-3/5 text-sm flex flex-col gap-3">
                                <div>
                                    <span className="font-bold italic">Bằng chữ: </span>
                                    {/* Sử dụng biến finalAmount đã được fix lỗi 0đ */}
                                    <span className="italic">{readMoneyToText(finalAmount)}</span>
                                </div>
                                <div className="border border-black p-2 rounded bg-slate-50 flex-1">
                                    <div className="font-bold underline mb-1 text-xs uppercase">Ghi chú & Điều khoản:</div>
                                    <ul className="list-disc pl-4 italic text-xs leading-relaxed text-slate-700">
                                        <li>Đơn hàng có giá trị trong 07 ngày.</li>
                                        <li>Quý khách vui lòng kiểm tra kỹ thông tin đơn hàng.</li>
                                        {order.note && <li className="text-black font-semibold not-italic">{order.note}</li>}
                                    </ul>
                                </div>
                            </div>

                            {/* Cột Phải: Tính toán số liệu */}
                            <div className="w-2/5">
                                <table className="w-full text-sm">
                                    <tbody>
                                        <tr>
                                            <td className="text-right pr-4 py-1">Tổng tiền hàng:</td>
                                            <td className="text-right font-bold py-1 w-32">{formatCurrency(totalAmount)}</td>
                                        </tr>
                                        {discountAmount > 0 && (
                                            <tr>
                                                <td className="text-right pr-4 py-1 italic">Chiết khấu:</td>
                                                <td className="text-right italic py-1">- {formatCurrency(discountAmount)}</td>
                                            </tr>
                                        )}
                                        <tr className="text-lg">
                                            <td className="text-right pr-4 py-2 font-black border-t-2 border-black uppercase">TỔNG CỘNG:</td>
                                            <td className="text-right py-2 font-black border-t-2 border-black">
                                                {formatCurrency(finalAmount)}
                                            </td>
                                        </tr>
                                        
                                        {/* Phần dành riêng cho Order: Cọc & Còn lại */}
                                        {deposit > 0 && (
                                            <tr>
                                                <td className="text-right pr-4 py-1 font-bold text-blue-700">Đã đặt cọc:</td>
                                                <td className="text-right py-1 font-bold text-blue-700">
                                                    {formatCurrency(deposit)}
                                                </td>
                                            </tr>
                                        )}
                                        <tr>
                                            <td className="text-right pr-4 py-1 font-bold text-red-600 border-t border-dashed border-slate-300">CÒN LẠI:</td>
                                            <td className="text-right py-1 font-black text-red-600 border-t border-dashed border-slate-300">
                                                {formatCurrency(remaining)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 5. CHỮ KÝ */}
                        <div className="flex mt-auto pt-4 pb-12">
                            <div className="w-1/3 text-center">
                                <div className="font-bold uppercase text-xs mb-16">Người lập đơn</div>
                                <div className="text-[10px] italic border-t border-black w-24 mx-auto pt-1">Ký và ghi rõ họ tên</div>
                            </div>
                            <div className="w-1/3 text-center">
                                <div className="font-bold uppercase text-xs mb-16">Thủ kho / Kế toán</div>
                                <div className="text-[10px] italic border-t border-black w-24 mx-auto pt-1">Ký và ghi rõ họ tên</div>
                            </div>
                            <div className="w-1/3 text-center">
                                <div className="font-bold uppercase text-xs mb-16">Khách hàng</div>
                                <div className="text-[10px] italic border-t border-black w-24 mx-auto pt-1">Ký và ghi rõ họ tên</div>
                            </div>
                        </div>

                        {/* Footer Info */}
                        <div className="text-center text-[10px] italic text-slate-400 mt-2 border-t border-slate-200 pt-1">
                            In từ hệ thống ManagerSALE - {new Date().toLocaleString('vi-VN')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintOrderModal;