import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { useAppContext } from '../context/DataContext';
import { FiX, FiPrinter, FiLoader } from 'react-icons/fi';

interface Props {
    orderId: string;
    onClose: () => void;
}

const PrintOrderModal: React.FC<Props> = ({ orderId, onClose }) => {
    const { settings } = useAppContext();

    const { data: order, isLoading } = useQuery({
        queryKey: ['order', orderId],
        queryFn: async () => {
            const res: any = await api(`/api/orders/${orderId}`);
            return res.data ? res.data : res;
        },
        enabled: !!orderId
    });

    // Lấy thông tin khách để hiện địa chỉ giao hàng
    const { data: customer } = useQuery({
        queryKey: ['customer', order?.customerId],
        queryFn: async () => {
            if (!order?.customerId) return null;
            try {
                const res: any = await api(`/api/customers/${order.customerId}`);
                return res.data ? res.data : res;
            } catch (e) { return null; }
        },
        enabled: !!order?.customerId
    });

    if (isLoading || !order) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 text-white"><FiLoader className="animate-spin"/></div>;

    const DeliveryContent = () => (
        <div className="p-[10mm] font-sans text-sm h-full bg-white text-black">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 border-b-2 border-slate-800 pb-4">
                <div className="w-2/3">
                    <h1 className="text-lg font-bold uppercase">{settings?.companyName || 'CỬA HÀNG VẬT LIỆU XÂY DỰNG'}</h1>
                    <p className="text-sm italic">{settings?.address}</p>
                    <p className="text-sm">Hotline: {settings?.phone}</p>
                </div>
                <div className="w-1/3 text-right">
                    <h2 className="text-2xl font-bold uppercase tracking-wider">PHIẾU GIAO HÀNG</h2>
                    <p className="text-sm mt-1">Số: <b>{order.orderNumber}</b></p>
                    <p className="text-sm">Ngày: {new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
            </div>

            {/* Thông tin giao hàng */}
            <div className="mb-6 border border-slate-300 p-4 rounded">
                <p className="mb-1"><span className="font-bold w-32 inline-block">Người nhận:</span> <span className="uppercase font-semibold">{customer?.name || order.customerName}</span></p>
                <p className="mb-1"><span className="font-bold w-32 inline-block">Điện thoại:</span> {customer?.phone || '...'}</p>
                <p className="mb-1"><span className="font-bold w-32 inline-block">Địa chỉ giao:</span> {customer?.address || '...'}</p>
                <p><span className="font-bold w-32 inline-block">Ghi chú:</span> {order.note || 'Không có'}</p>
            </div>

            {/* Bảng hàng */}
            <table className="w-full border-collapse border border-slate-400 mb-6">
                <thead>
                    <tr className="bg-slate-100 font-bold uppercase text-xs">
                        <th className="border border-slate-400 p-2 w-12 text-center">STT</th>
                        <th className="border border-slate-400 p-2 text-left">Tên hàng hóa</th>
                        <th className="border border-slate-400 p-2 w-20 text-center">ĐVT</th>
                        <th className="border border-slate-400 p-2 w-20 text-center">SL</th>
                        <th className="border border-slate-400 p-2 w-32 text-center">Thực giao</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items.map((item: any, i: number) => (
                        <tr key={i}>
                            <td className="border border-slate-400 p-2 text-center">{i + 1}</td>
                            <td className="border border-slate-400 p-2 font-medium">{item.name}</td>
                            <td className="border border-slate-400 p-2 text-center">{item.unit || 'Cái'}</td>
                            <td className="border border-slate-400 p-2 text-center font-bold">{item.quantity}</td>
                            <td className="border border-slate-400 p-2"></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Footer Ký tên */}
            <div className="grid grid-cols-3 gap-4 mt-8 text-center">
                <div>
                    <p className="font-bold uppercase text-xs">Người lập phiếu</p>
                    <p className="text-[10px] italic mb-12">(Ký & ghi rõ họ tên)</p>
                </div>
                <div>
                    <p className="font-bold uppercase text-xs">Người giao hàng</p>
                    <p className="text-[10px] italic mb-12">(Ký & ghi rõ họ tên)</p>
                </div>
                <div>
                    <p className="font-bold uppercase text-xs">Người nhận hàng</p>
                    <p className="text-[10px] italic mb-12">(Ký & ghi rõ họ tên)</p>
                    <p className="text-xs font-bold">Đã nhận đủ hàng & nguyên vẹn</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm print:bg-white print:p-0">
            <div className="bg-slate-200 p-4 rounded-xl shadow-2xl h-[90vh] flex flex-col items-center gap-4 print:hidden">
                <div className="bg-white shadow-lg overflow-y-auto custom-scrollbar h-full w-[210mm]">
                    <DeliveryContent />
                </div>
                <div className="flex gap-4">
                    <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700">
                        <FiPrinter size={20}/> IN PHIẾU
                    </button>
                    <button onClick={onClose} className="bg-white text-slate-700 px-6 py-3 rounded-lg font-bold hover:bg-red-50 hover:text-red-600">
                        Đóng lại
                    </button>
                </div>
            </div>
            <div className="hidden print:block w-full h-full">
                <DeliveryContent />
            </div>
        </div>
    );
};

export default PrintOrderModal;