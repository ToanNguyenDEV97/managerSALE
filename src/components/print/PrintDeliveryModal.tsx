import React, { useEffect, useMemo } from 'react';
import { FiPrinter } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
import { useDeliveries } from '../hooks/useDeliveries'; // Hook Delivery
import { useInvoices } from '../hooks/useInvoices';     // Hook Invoice

const PrintDeliveryPage: React.FC = () => {
    const { printingDeliveryId, setPrintingDeliveryId, settings } = useAppContext();
    
    // Lấy dữ liệu Delivery
    const { data: deliveryData } = useDeliveries(1);
    const deliveries = Array.isArray(deliveryData) ? deliveryData : (deliveryData?.data || []);
    
    // Lấy dữ liệu Invoice (để hiển thị chi tiết hàng hóa)
    const { data: invoicesData } = useInvoices(1);
    const invoices = Array.isArray(invoicesData) ? invoicesData : (invoicesData?.data || []);

    const delivery = useMemo(() => {
        if (!printingDeliveryId) return null;
        return deliveries.find((d: any) => d.id === printingDeliveryId);
    }, [deliveries, printingDeliveryId]);

    const invoice = useMemo(() => {
        if (!delivery) return null;
        return invoices.find((inv: any) => inv.id === delivery.invoiceId);
    }, [invoices, delivery]);

    useEffect(() => {
        const handleAfterPrint = () => setPrintingDeliveryId(null);
        window.addEventListener('afterprint', handleAfterPrint);
        return () => window.removeEventListener('afterprint', handleAfterPrint);
    }, [setPrintingDeliveryId]);

    if (!delivery || !invoice) return <div className="flex justify-center items-center h-screen">Đang tải phiếu giao hàng...</div>;

    return (
        <div className="bg-white min-h-screen text-slate-900 font-sans p-8 md:p-12">
            <style>{`@media print { @page { margin: 0; } body { margin: 1.6cm; } .no-print { display: none !important; } }`}</style>

            <div className="max-w-3xl mx-auto border border-slate-200 p-8 shadow-sm print:border-0 print:shadow-none print:p-0">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-xl font-bold text-slate-700 uppercase">{settings.companyName}</h1>
                        <p className="text-sm text-slate-600">{settings.address}</p>
                        <p className="text-sm text-slate-600">SĐT: {settings.phone}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-bold text-slate-800 uppercase tracking-wide">Phiếu Giao Hàng</h2>
                        <p className="text-sm text-slate-500 mt-1">Số: <span className="font-semibold text-slate-900">{delivery.deliveryNumber}</span></p>
                        <p className="text-sm text-slate-500">Ngày: {delivery.deliveryDate}</p>
                    </div>
                </div>

                <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-lg print:border-slate-300">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Người nhận</p>
                            <p className="font-bold text-lg">{delivery.customerName}</p>
                            <p className="text-sm">{delivery.customerAddress}</p>
                            <p className="text-sm">SĐT: {delivery.customerPhone}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Thông tin vận chuyển</p>
                            <p className="text-sm"><span className="font-semibold">Tài xế:</span> {delivery.driverName || '---'}</p>
                            <p className="text-sm"><span className="font-semibold">Biển số:</span> {delivery.vehicleNumber || '---'}</p>
                            <p className="text-sm"><span className="font-semibold">Theo HĐ:</span> {invoice.invoiceNumber}</p>
                        </div>
                    </div>
                </div>

                <table className="w-full text-sm mb-8">
                    <thead>
                        <tr className="border-b-2 border-slate-800">
                            <th className="py-2 text-left w-12">STT</th>
                            <th className="py-2 text-left">Tên hàng hóa / Quy cách</th>
                            <th className="py-2 text-center w-24">ĐVT</th>
                            <th className="py-2 text-center w-24">Số lượng</th>
                            <th className="py-2 text-center w-32">Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.items.map((item: any, index: number) => (
                            <tr key={index} className="border-b border-slate-200">
                                <td className="py-3 text-left">{index + 1}</td>
                                <td className="py-3 font-medium">{item.name}</td>
                                <td className="py-3 text-center">{item.unit || 'Cái'}</td>
                                <td className="py-3 text-center font-bold">{item.quantity}</td>
                                <td className="py-3 text-center"></td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {delivery.notes && (
                    <div className="mb-8 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800 print:border-slate-300 print:bg-transparent print:text-slate-800">
                        <span className="font-bold">Ghi chú:</span> {delivery.notes}
                    </div>
                )}

                <div className="mt-16 grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="font-bold text-sm uppercase">Người lập phiếu</p>
                        <p className="text-xs text-slate-500 italic mb-16">(Ký, họ tên)</p>
                    </div>
                    <div>
                        <p className="font-bold text-sm uppercase">Người giao hàng</p>
                        <p className="text-xs text-slate-500 italic mb-16">(Ký, họ tên)</p>
                    </div>
                    <div>
                        <p className="font-bold text-sm uppercase">Người nhận hàng</p>
                        <p className="text-xs text-slate-500 italic mb-16">(Ký, họ tên)</p>
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex justify-center gap-4 no-print shadow-lg">
                    <button onClick={() => setPrintingDeliveryId(null)} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium">Quay lại</button>
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg font-medium shadow-md"><FiPrinter /> In Phiếu</button>
                </div>
            </div>
        </div>
    );
};

export default PrintDeliveryPage;