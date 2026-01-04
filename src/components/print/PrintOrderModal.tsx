import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { FiPrinter, FiX } from 'react-icons/fi';
import { useAppContext } from '../../context/DataContext';

interface Props {
    order: any;
    onClose: () => void;
}

const PrintOrderModal: React.FC<Props> = ({ order, onClose }) => {
    const componentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({ content: () => componentRef.current });
    const { companyInfo } = useAppContext();

    const shop = companyInfo || { name: "CỬA HÀNG CỦA BẠN", address: "Địa chỉ...", phone: "..." };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-slate-100">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><FiPrinter/> In Hóa Đơn</h3>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg">IN NGAY</button>
                        <button onClick={onClose} className="p-2 hover:bg-white bg-slate-200 rounded-lg"><FiX/></button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 bg-slate-500/20 flex justify-center">
                    <div ref={componentRef} className="bg-white text-black p-4 text-sm" style={{ width: '80mm', minHeight: '100mm', fontFamily: 'monospace' }}>
                        <div className="text-center mb-4 border-b-2 border-dashed border-black pb-2">
                            <h1 className="font-bold text-lg uppercase">{shop.name}</h1>
                            <p className="text-xs">{shop.address}</p>
                            <p className="text-xs">Hotline: {shop.phone}</p>
                        </div>
                        <div className="text-center mb-4">
                            <h2 className="font-bold uppercase text-base">HÓA ĐƠN BÁN LẺ</h2>
                            <p className="text-xs">Số: #{order.orderNumber}</p>
                            <p className="text-[10px]">{new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                        </div>
                        <div className="border-b border-black pb-2 mb-2">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-black"><th className="text-left">SP</th><th className="text-center">SL</th><th className="text-right">Tiền</th></tr>
                                </thead>
                                <tbody>
                                    {order.items?.map((item: any, i: number) => (
                                        <tr key={i}>
                                            <td className="py-1">{item.name}</td>
                                            <td className="text-center">{item.quantity}</td>
                                            <td className="text-right">{(item.price * item.quantity).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="text-right font-bold text-sm">
                            <p>TỔNG CỘNG: {order.totalAmount?.toLocaleString()} đ</p>
                        </div>
                        <div className="text-center mt-6 text-xs italic"><p>Cảm ơn quý khách & Hẹn gặp lại!</p></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintOrderModal;