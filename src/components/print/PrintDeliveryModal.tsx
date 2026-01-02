import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { FiPrinter, FiX, FiPhone, FiMapPin, FiBox } from 'react-icons/fi';
import { useAppContext } from '../../context/DataContext';

interface Props {
    order: any;
    onClose: () => void;
}

const PrintDeliveryModal: React.FC<Props> = ({ order, onClose }) => {
    const componentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({ content: () => componentRef.current });
    const { companyInfo } = useAppContext();

    // Dữ liệu shop mặc định
    const shop = companyInfo || {
        name: "CỬA HÀNG CỦA BẠN",
        address: "Chưa cập nhật địa chỉ",
        phone: "..."
    };

    // Tính tiền thu hộ (COD)
    // Nếu đã thanh toán hết (paidAmount >= totalAmount) thì COD = 0
    const codAmount = Math.max(0, (order.totalAmount || 0) - (order.depositAmount || 0) - (order.paidAmount || 0));

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden">
                
                {/* Header Toolbar */}
                <div className="p-4 border-b flex justify-between items-center bg-slate-100">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <FiPrinter/> Phiếu Giao Hàng (Shipper)
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg flex items-center gap-2">
                            <FiPrinter/> IN PHIẾU
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-white bg-slate-200 rounded-lg"><FiX/></button>
                    </div>
                </div>
                
                {/* Vùng hiển thị bản in (Khổ A5 hoặc tem dán) */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-500/20 flex justify-center">
                    
                    <div 
                        ref={componentRef} 
                        className="bg-white text-black p-4 box-border text-sm"
                        style={{ 
                            width: '100%', 
                            maxWidth: '148mm', // Khổ A5 hoặc tem in nhiệt lớn
                            fontFamily: 'Arial, sans-serif',
                            lineHeight: '1.4'
                        }}
                    >
                        {/* 1. Tiêu đề & Mã đơn */}
                        <div className="border-b-2 border-black pb-3 mb-3 flex justify-between items-start">
                            <div>
                                <h1 className="text-xl font-bold uppercase">Phiếu Giao Hàng</h1>
                                <p className="italic text-xs text-slate-500">Ngày tạo: {new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-black border-2 border-black px-2 py-1 inline-block">
                                    {order.orderNumber}
                                </p>
                            </div>
                        </div>

                        {/* 2. Thông tin Người Gửi & Người Nhận */}
                        <div className="grid grid-cols-2 gap-4 mb-4 border-b border-dashed border-slate-400 pb-4">
                            {/* Người gửi */}
                            <div className="pr-2 border-r border-dashed border-slate-300">
                                <p className="font-bold uppercase text-[11px] text-slate-500 mb-1">Từ (Người gửi):</p>
                                <p className="font-bold uppercase">{shop.name}</p>
                                <p className="text-xs">{shop.address}</p>
                                <p className="font-bold text-xs mt-1">SĐT: {shop.phone}</p>
                            </div>

                            {/* Người nhận */}
                            <div>
                                <p className="font-bold uppercase text-[11px] text-slate-500 mb-1">Đến (Người nhận):</p>
                                <p className="font-bold uppercase text-lg">{order.customerName}</p>
                                
                                {/* ĐỊA CHỈ & SĐT (Quan trọng nhất) */}
                                <div className="mt-1">
                                    <p className="flex items-start gap-1 font-bold">
                                        <span className="mt-0.5"><FiMapPin size={10}/></span> 
                                        {order.delivery?.address || '---'}
                                    </p>
                                    <p className="flex items-center gap-1 font-bold text-lg mt-1 border border-black p-1 inline-block">
                                        <span className="mt-0.5"><FiPhone size={14}/></span> 
                                        {order.delivery?.phone || '...'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 3. Nội dung hàng hóa */}
                        <div className="mb-4">
                            <p className="font-bold uppercase text-[11px] text-slate-500 mb-1">Nội dung hàng:</p>
                            <ul className="list-disc pl-4 text-xs space-y-1">
                                {order.items.map((item: any, idx: number) => (
                                    <li key={idx}>
                                        <span className="font-bold">{item.name}</span> x {item.quantity} {item.unit}
                                    </li>
                                ))}
                            </ul>
                            {order.note && (
                                <div className="mt-2 border border-slate-300 p-2 text-xs italic bg-slate-50">
                                    <span className="font-bold not-italic">Lưu ý giao hàng:</span> {order.note}
                                </div>
                            )}
                        </div>

                        {/* 4. Tiền thu hộ (COD) */}
                        <div className="border-t-2 border-black pt-3 flex justify-between items-center">
                            <div>
                                <p className="text-xs italic">Vui lòng gọi khách trước khi giao</p>
                                <p className="text-xs italic">Cho xem hàng: [  ] Có   [  ] Không</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold uppercase text-xs text-slate-600">Tổng tiền thu hộ (COD):</p>
                                <p className="text-3xl font-bold text-black">
                                    {codAmount > 0 ? codAmount.toLocaleString() : '0'} đ
                                </p>
                                {codAmount === 0 && <p className="text-xs font-bold uppercase border border-black px-1 inline-block">Đã thanh toán</p>}
                            </div>
                        </div>

                        {/* Footer Chữ ký Shipper */}
                        <div className="grid grid-cols-2 gap-4 mt-6 text-center text-[10px]">
                            <div>
                                <p className="font-bold uppercase">Người nhận</p>
                                <p className="italic">(Ký, ghi rõ họ tên)</p>
                            </div>
                            <div>
                                <p className="font-bold uppercase">Nhân viên giao hàng</p>
                                <p className="italic">(Ký, xác nhận)</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintDeliveryModal;