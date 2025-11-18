
import React, { useEffect, useMemo } from 'react';
import { FiBox, FiPrinter } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';

const PrintDeliveryPage: React.FC = () => {
    const { printingDeliveryId, deliveries, invoices, setPrintingDeliveryId, settings } = useAppContext();
    const delivery = useMemo(() => deliveries.find(d => d.id === printingDeliveryId), [deliveries, printingDeliveryId]);
    const invoice = useMemo(() => invoices.find(inv => inv.id === delivery?.invoiceId), [invoices, delivery]);

    useEffect(() => {
        const handleAfterPrint = () => {
            setPrintingDeliveryId(null);
        };

        window.addEventListener('afterprint', handleAfterPrint);

        return () => {
            // 2. Thêm dòng này để dọn dẹp timer
            // clearTimeout(printTimer);
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, [setPrintingDeliveryId]);

    if (!delivery || !invoice || !invoice.items) { // <-- Thêm kiểm tra !invoice.items
        return <div className="p-10">Đang tải phiếu giao hàng...</div>;
    }

    return (
        <div className="bg-white p-8 md:p-12 font-sans text-slate-800">
            <style>
                {`
                    @media print {
                        body {
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        .no-print {
                            display: none;
                        }
                    }
                `}
            </style>
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-start pb-6 border-b border-slate-200">
                    <div>
                        <div className="flex items-center h-14">
                           {settings.logo ? (
                                <img src={settings.logo} alt="Logo công ty" className="h-full max-w-[200px] object-contain" />
                            ) : (
                                <>
                                    <FiBox className="w-8 h-8 text-primary-600" />
                                    <span className="ml-3 text-2xl font-bold text-slate-800">{settings.companyName}</span>
                                </>
                            )}
                        </div>
                        <div className="text-sm text-slate-500 mt-2">
                            <p>{settings.address}</p>
                            <p>Điện thoại: {settings.phone}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h1 className="text-3xl font-bold text-primary-600 uppercase tracking-wider">Phiếu Giao Hàng</h1>
                        <p className="text-lg font-semibold text-slate-600 mt-2">{delivery.deliveryNumber}</p>
                        <p className="text-sm text-slate-500">Ngày tạo: {delivery.issueDate}</p>
                         <p className="text-sm text-slate-500">Hóa đơn gốc: {invoice.invoiceNumber}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mt-6">
                    <div>
                        <h3 className="text-sm font-semibold uppercase text-slate-500 tracking-wider">Thông tin Giao hàng</h3>
                        <p className="font-bold text-slate-800 mt-1">{delivery.customerName}</p>
                        <p className="text-sm text-slate-600">Địa chỉ: {delivery.customerAddress}</p>
                        <p className="text-sm text-slate-600">SĐT: {delivery.customerPhone}</p>
                    </div>
                     <div className="text-right">
                        <h3 className="text-sm font-semibold uppercase text-slate-500 tracking-wider">Chi tiết Vận chuyển</h3>
                        <p className="text-sm text-slate-600 mt-1">Ngày giao dự kiến: {delivery.deliveryDate}</p>
                        <p className="text-sm text-slate-600">Tài xế: {delivery.driverName}</p>
                        <p className="text-sm text-slate-600">Biển số xe: {delivery.vehicleNumber}</p>
                    </div>
                </div>

                <div className="mt-8">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-100">
                                <th className="p-3 text-sm font-semibold text-slate-700 uppercase tracking-wider">Sản phẩm</th>
                                <th className="p-3 text-sm font-semibold text-slate-700 uppercase tracking-wider text-center">Đơn vị</th>
                                <th className="p-3 text-sm font-semibold text-slate-700 uppercase tracking-wider text-center">Số lượng</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map(item => (
                                <tr key={item.productId} className="border-b border-slate-100">
                                    <td className="p-3">{item.name}</td>
                                    <td className="p-3 text-center">{useAppContext().products.find(p=>p.id===item.productId)?.unit}</td>
                                    <td className="p-3 text-center">{item.quantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {delivery.notes && (
                    <div className="mt-8 bg-slate-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-sm">Ghi chú:</h4>
                        <p className="text-sm text-slate-600">{delivery.notes}</p>
                    </div>
                )}
                
                <div className="mt-12 pt-6 grid grid-cols-2 gap-8 text-center">
                    <div>
                        <p className="font-semibold">Nhân viên Giao hàng</p>
                        <p className="text-xs text-slate-500">(Ký, ghi rõ họ tên)</p>
                        <div className="h-20"></div>
                    </div>
                     <div>
                        <p className="font-semibold">Khách hàng</p>
                        <p className="text-xs text-slate-500">(Ký, ghi rõ họ tên)</p>
                        <div className="h-20"></div>
                    </div>
                </div>
                
                 <div className="mt-8 text-center no-print flex justify-center gap-4">
                    <button onClick={() => setPrintingDeliveryId(null)} className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700">
                        Quay lại
                    </button>
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                        <FiPrinter />
                        In Phiếu
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrintDeliveryPage;