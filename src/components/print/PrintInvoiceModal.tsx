import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../utils/api';
import { FiPrinter, FiX, FiLoader } from 'react-icons/fi';
import { PrintTemplate } from './PrintTemplate'; // Import Template

interface Props {
    invoiceId: string;
    onClose: () => void;
}

const PrintInvoiceModal: React.FC<Props> = ({ invoiceId, onClose }) => {
    const componentRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({ content: () => componentRef.current });

    const { data: invoice, isLoading } = useQuery({
        queryKey: ['invoice-print', invoiceId],
        queryFn: () => api(`/api/invoices/${invoiceId}`),
        enabled: !!invoiceId
    });
    const customerInfo = useMemo(() => {
        if (!invoice) return {};
        
        // Ưu tiên 1: Lấy từ object customerId (nếu backend đã populate)
        // Ưu tiên 2: Lấy từ thông tin giao hàng (nếu có)
        // Ưu tiên 3: Lấy trực tiếp từ invoice (nếu có lưu cứng)
        const cust = invoice.customerId || {}; 
        
        return {
            name: cust.name || invoice.customerName || 'Khách lẻ',
            companyName: cust.companyName,
            // Nếu có địa chỉ giao hàng thì dùng, không thì dùng địa chỉ khách, không thì để trống
            address: invoice.delivery?.address || cust.address || 'Mua tại quầy', 
            phone: invoice.delivery?.phone || cust.phone || invoice.customerPhone || '',
            taxCode: cust.taxCode
        };
    }, [invoice]);

    if (!invoiceId) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-xl w-full max-w-2xl h-[90vh] flex flex-col shadow-2xl">
                {/* Header Modal */}
                <div className="p-4 border-b flex justify-between items-center bg-slate-100 rounded-t-xl">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><FiPrinter/> Xem trước khi in</h3>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-2 text-sm shadow-md transition-all">
                            <FiPrinter /> In ngay
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors"><FiX size={20}/></button>
                    </div>
                </div>

                {/* Nội dung In */}
                <div className="flex-1 overflow-y-auto bg-slate-500/10 p-4 md:p-8">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full"><FiLoader className="animate-spin text-4xl text-blue-600"/></div>
                    ) : invoice ? (
                        /* SỬ DỤNG TEMPLATE Ở ĐÂY */
                        <PrintTemplate
                            ref={componentRef}
                            title="HÓA ĐƠN BÁN HÀNG"
                            subTitle="(Kiêm phiếu xuất kho)"
                            code={invoice.invoiceNumber}
                            date={invoice.issueDate}
                            customer={customerInfo as any}
                            payment={{
                                totalAmount: invoice.totalAmount, // Backend nên trả về tổng tiền hàng (chưa cộng ship)
                                discount: invoice.discountAmount,
                                shipFee: invoice.delivery?.shipFee || 0, // Lấy phí ship từ object delivery
                                paidAmount: invoice.paidAmount,
                                debt: (invoice.finalAmount || 0) - (invoice.paidAmount || 0)
                            }}
                            note={invoice.note}
                        >
                            {/* CHILDREN: BẢNG SẢN PHẨM */}
                            <table className="w-full text-sm border-collapse border border-slate-300">
                                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="border border-slate-300 py-2 px-2 text-center w-10">STT</th>
                                        <th className="border border-slate-300 py-2 px-2 text-left">Tên hàng hóa</th>
                                        <th className="border border-slate-300 py-2 px-2 text-center w-16">ĐVT</th>
                                        <th className="border border-slate-300 py-2 px-2 text-center w-16">SL</th>
                                        <th className="border border-slate-300 py-2 px-2 text-right">Đơn giá</th>
                                        <th className="border border-slate-300 py-2 px-2 text-right">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.items?.map((item: any, index: number) => (
                                        <tr key={index} className="border-b border-slate-200">
                                            <td className="border-r border-slate-300 py-2 px-2 text-center">{index + 1}</td>
                                            <td className="border-r border-slate-300 py-2 px-2 font-medium">{item.name}</td>
                                            <td className="border-r border-slate-300 py-2 px-2 text-center">{item.unit || 'Cái'}</td>
                                            <td className="border-r border-slate-300 py-2 px-2 text-center font-bold">{item.quantity}</td>
                                            <td className="border-r border-slate-300 py-2 px-2 text-right">{item.price.toLocaleString()}</td>
                                            <td className="py-2 px-2 text-right font-bold">{(item.quantity * item.price).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </PrintTemplate>
                    ) : (
                        <p className="text-center text-red-500 mt-10">Không tìm thấy hóa đơn</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PrintInvoiceModal;