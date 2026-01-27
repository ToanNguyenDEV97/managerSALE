import React, { useRef, useState, useMemo } from 'react';
import { useReactToPrint } from 'react-to-print';
import { FiPrinter, FiX, FiPhone, FiMapPin, FiSettings, FiUser, FiEdit3, FiCheckSquare, FiSquare } from 'react-icons/fi';
import { useAppContext } from '../../context/DataContext';
import { formatCurrency } from '../../utils/currency';

interface Props {
    order: any; // Chấp nhận cả Order object và Delivery object
    onClose: () => void;
}

type InspectionType = 'view' | 'try' | 'no_view';

const PrintDeliveryModal: React.FC<Props> = ({ order, onClose }) => {
    const componentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({ content: () => componentRef.current });
    const { companyInfo } = useAppContext();

    // 1. Chuẩn bị dữ liệu từ Props (Order hoặc Delivery)
    const data = useMemo(() => {
        const isDeliveryObj = !!order.deliveryNumber;
        return {
            code: isDeliveryObj ? order.deliveryNumber : (order.delivery?.deliveryNumber || order.orderNumber),
            date: order.issueDate || order.createdAt,
            customerName: order.customerName,
            address: isDeliveryObj ? order.customerAddress : (order.delivery?.address || "Nhận tại cửa hàng"),
            phone: isDeliveryObj ? order.customerPhone : (order.delivery?.phone || order.customerPhone),
            cod: isDeliveryObj 
                ? (order.codAmount || 0) 
                : Math.max(0, (order.totalAmount || 0) - (order.depositAmount || 0) - (order.paidAmount || 0)),
            items: order.items || [],
            originalNote: order.notes || order.note || '',
            originalDriver: order.driverName || order.delivery?.shipperName || ''
        };
    }, [order]);

    // 2. State cho các tùy chọn in (Editable)
    const [shipperName, setShipperName] = useState(data.originalDriver);
    const [inspection, setInspection] = useState<InspectionType>('view'); // Mặc định: Cho xem hàng
    const [note, setNote] = useState(data.originalNote);

    const shop = companyInfo || {
        name: "CỬA HÀNG CỦA BẠN",
        address: "Chưa cập nhật địa chỉ",
        phone: "..."
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-xl w-full max-w-5xl flex flex-col shadow-2xl h-[90vh] overflow-hidden">
                
                {/* Header Toolbar */}
                <div className="p-4 border-b flex justify-between items-center bg-slate-100 shrink-0">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                        <FiPrinter className="text-blue-600"/> In Phiếu Giao Hàng
                    </h3>
                    <div className="flex gap-2">
                        <button 
                            onClick={handlePrint} 
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg flex items-center gap-2 transition-all transform active:scale-95"
                        >
                            <FiPrinter size={18}/> IN NGAY
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-red-100 text-slate-500 hover:text-red-500 rounded-lg transition-colors">
                            <FiX size={24}/>
                        </button>
                    </div>
                </div>
                
                <div className="flex flex-1 overflow-hidden">
                    
                    {/* --- CỘT TRÁI: TÙY CHỌN (Settings) --- */}
                    <div className="w-1/3 bg-slate-50 border-r border-slate-200 p-5 overflow-y-auto">
                        <div className="flex items-center gap-2 font-bold text-slate-700 mb-4 pb-2 border-b border-slate-200">
                            <FiSettings/> Tùy chọn phiếu in
                        </div>

                        {/* 1. Shipper */}
                        <div className="mb-5">
                            <label className="block text-sm font-semibold text-slate-600 mb-1.5">Tên Shipper / Đơn vị VC</label>
                            <div className="relative">
                                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                <input 
                                    type="text" 
                                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="Nhập tên shipper..."
                                    value={shipperName}
                                    onChange={(e) => setShipperName(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* 2. Kiểm hàng */}
                        <div className="mb-5">
                            <label className="block text-sm font-semibold text-slate-600 mb-2">Chế độ kiểm hàng</label>
                            <div className="space-y-2">
                                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${inspection === 'view' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-slate-300 hover:bg-slate-100'}`}>
                                    <input type="radio" name="inspection" className="w-4 h-4 text-blue-600" checked={inspection === 'view'} onChange={() => setInspection('view')} />
                                    <span className="text-sm font-medium">Cho xem hàng</span>
                                </label>
                                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${inspection === 'try' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-slate-300 hover:bg-slate-100'}`}>
                                    <input type="radio" name="inspection" className="w-4 h-4 text-blue-600" checked={inspection === 'try'} onChange={() => setInspection('try')} />
                                    <span className="text-sm font-medium">Cho thử hàng</span>
                                </label>
                                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${inspection === 'no_view' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-slate-300 hover:bg-slate-100'}`}>
                                    <input type="radio" name="inspection" className="w-4 h-4 text-blue-600" checked={inspection === 'no_view'} onChange={() => setInspection('no_view')} />
                                    <span className="text-sm font-medium">Không cho xem</span>
                                </label>
                            </div>
                        </div>

                        {/* 3. Ghi chú */}
                        <div className="mb-5">
                            <label className="block text-sm font-semibold text-slate-600 mb-1.5">Ghi chú trên đơn</label>
                            <div className="relative">
                                <FiEdit3 className="absolute left-3 top-3 text-slate-400"/>
                                <textarea 
                                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm h-24 resize-none"
                                    placeholder="Ghi chú giao hàng..."
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* --- CỘT PHẢI: PREVIEW (Bản in) --- */}
                    <div className="flex-1 bg-slate-200 p-8 overflow-y-auto flex justify-center">
                        <div 
                            ref={componentRef} 
                            className="bg-white text-black p-5 box-border shadow-lg print:shadow-none transition-all duration-300"
                            style={{ 
                                width: '100%', 
                                maxWidth: '148mm', // Khổ A5
                                minHeight: '210mm',
                                fontFamily: 'Arial, Helvetica, sans-serif',
                                lineHeight: '1.3',
                                fontSize: '13px'
                            }}
                        >
                            {/* HEADER */}
                            <div className="flex justify-between items-start mb-4 border-b-2 border-black pb-4">
                                <div className="w-3/5 pr-2">
                                    <div className="font-bold text-lg uppercase mb-1">{shop.name}</div>
                                    <div className="text-xs break-words mb-1">{shop.address}</div>
                                    <div className="text-xs font-bold">Hotline: {shop.phone}</div>
                                </div>
                                <div className="w-2/5 pl-2 text-right">
                                    <div className="inline-block border-2 border-black p-2 text-center min-w-[120px]">
                                        <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Mã vận đơn</div>
                                        <div className="text-xl font-black leading-none">{data.code}</div>
                                    </div>
                                    <div className="text-[10px] mt-1 text-slate-500">
                                        Ngày: {new Date(data.date).toLocaleDateString('vi-VN')}
                                    </div>
                                </div>
                            </div>

                            {/* NGƯỜI NHẬN */}
                            <div className="border-2 border-black rounded-lg p-3 mb-4 relative">
                                <div className="absolute -top-3 left-3 bg-white px-2 font-bold uppercase text-sm">
                                    Người nhận (To)
                                </div>
                                <div className="flex justify-between items-start mt-1">
                                    <div>
                                        <div className="text-lg font-bold uppercase mb-1">{data.customerName}</div>
                                        <div className="text-sm mb-2 max-w-[280px]">{data.address}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-slate-500 uppercase">Điện thoại</div>
                                        <div className="text-2xl font-black">{data.phone}</div>
                                    </div>
                                </div>
                            </div>

                            {/* NỘI DUNG & COD */}
                            <div className="flex gap-4 mb-4">
                                {/* Cột trái: Hàng hóa */}
                                <div className="w-2/3">
                                    <div className="font-bold uppercase border-b border-black mb-2 pb-1 text-xs">Nội dung hàng hóa</div>
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="text-left italic text-[10px]">
                                                <th className="pb-1 w-8">SL</th>
                                                <th className="pb-1">Tên sản phẩm</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.items.map((item: any, idx: number) => (
                                                <tr key={idx} className="border-b border-dashed border-slate-300 last:border-0">
                                                    <td className="font-bold py-1 align-top text-center">{item.quantity}</td>
                                                    <td className="py-1 align-top pl-2">
                                                        {item.name} 
                                                        {item.unit ? <span className="text-[10px] text-slate-500"> ({item.unit})</span> : ''}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    
                                    {note && (
                                        <div className="mt-3 border border-dashed border-slate-400 p-2 bg-slate-50 rounded text-xs">
                                            <span className="font-bold underline">Ghi chú:</span> {note}
                                        </div>
                                    )}
                                </div>

                                {/* Cột phải: COD & Kiểm hàng (Dynamic) */}
                                <div className="w-1/3 flex flex-col gap-2">
                                    {/* COD */}
                                    <div className="border-2 border-black p-2 text-center bg-slate-50">
                                        <div className="text-[10px] font-bold uppercase mb-1">Tiền thu người nhận</div>
                                        <div className="text-2xl font-black">
                                            {data.cod > 0 ? formatCurrency(data.cod).replace('₫','') : '0'}
                                        </div>
                                        <div className="text-xs font-bold uppercase mt-1">VNĐ</div>
                                    </div>

                                    {/* Kiểm hàng (Dynamic) */}
                                    <div className="border border-black p-2 text-[11px]">
                                        <div className="font-bold border-b border-black mb-1 pb-1">Chỉ dẫn giao hàng:</div>
                                        
                                        <div className="mb-1 flex items-center gap-1.5">
                                            {inspection === 'view' ? <FiCheckSquare size={14}/> : <FiSquare size={14}/>} 
                                            Cho xem hàng
                                        </div>
                                        <div className="mb-1 flex items-center gap-1.5">
                                            {inspection === 'try' ? <FiCheckSquare size={14}/> : <FiSquare size={14}/>} 
                                            Cho thử hàng
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {inspection === 'no_view' ? <FiCheckSquare size={14} className="fill-black text-white"/> : <FiSquare size={14}/>} 
                                            Không cho xem
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* FOOTER */}
                            <div className="flex mt-auto pt-4 border-t-2 border-black">
                                <div className="w-1/2 text-center">
                                    <div className="font-bold uppercase text-xs mb-8">Chữ ký người nhận</div>
                                    <div className="text-[10px] italic">Xác nhận hàng nguyên vẹn, không móp méo</div>
                                </div>
                                <div className="w-1/2 text-center border-l border-dashed border-black">
                                    <div className="font-bold uppercase text-xs mb-8">Chữ ký Shipper</div>
                                    {/* Tên Shipper (Dynamic) */}
                                    {shipperName ? (
                                        <div className="font-bold text-sm uppercase">{shipperName}</div>
                                    ) : (
                                        <div className="h-5"></div>
                                    )}
                                    <div className="text-[10px] italic mt-1">Ngày.....Tháng.....Năm 202...</div>
                                </div>
                            </div>

                            <div className="text-[10px] text-center mt-4 italic text-slate-400">
                                Powered by ManagerSale System
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintDeliveryModal;