import React, { useEffect, useMemo } from 'react';
import { FiPrinter } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
import { useInvoices } from '../hooks/useInvoices'; // Import Hook lấy dữ liệu

const PrintInvoicePage: React.FC = () => {
    // 1. Chỉ lấy ID và Settings từ Context
    const { printingInvoiceId, setPrintingInvoiceId, settings } = useAppContext();
    
    // 2. Tự lấy danh sách hóa đơn từ API
    const { data: invoicesData } = useInvoices(1);
    const invoices = Array.isArray(invoicesData) ? invoicesData : (invoicesData?.data || []);
    
    // 3. Tìm hóa đơn cần in
    const invoice = useMemo(() => {
        if (!printingInvoiceId) return null;
        return invoices.find((inv: any) => inv.id === printingInvoiceId);
    }, [invoices, printingInvoiceId]);

    // Xử lý sự kiện sau khi in xong
    useEffect(() => {
        const handleAfterPrint = () => {
            setPrintingInvoiceId(null);
        };
        window.addEventListener('afterprint', handleAfterPrint);
        return () => window.removeEventListener('afterprint', handleAfterPrint);
    }, [setPrintingInvoiceId]);

    if (!invoice) {
        return (
            <div className="flex justify-center items-center h-screen text-slate-500">
                Đang tải dữ liệu hóa đơn...
            </div>
        );
    }

    const totals = {
        total: invoice.totalAmount,
        // Tính thuế sơ bộ (nếu item không có vat riêng thì lấy mặc định)
        vatAmount: invoice.items.reduce((acc: number, item: any) => {
            const itemTotal = item.price * item.quantity;
            // Giả sử price đã bao gồm VAT, tính ngược ra VAT
            // Hoặc nếu price chưa VAT: return acc + (itemTotal * (item.vat || 0) / 100);
            // Ở đây dùng logic đơn giản:
            return acc + (itemTotal * (item.vat || 0) / 100); 
        }, 0),
    };

    return (
        <div className="bg-white min-h-screen text-slate-900 font-sans p-8 md:p-12">
            <style>
                {`
                    @media print {
                        @page { margin: 0; size: auto; }
                        body { margin: 1.6cm; -webkit-print-color-adjust: exact; }
                        .no-print { display: none !important; }
                    }
                `}
            </style>

            <div className="max-w-3xl mx-auto border border-slate-200 p-8 shadow-sm print:border-0 print:shadow-none print:p-0">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        {settings.logo && <img src={settings.logo} alt="Logo" className="h-16 object-contain mb-2" />}
                        <h1 className="text-2xl font-bold text-primary-700 uppercase">{settings.companyName}</h1>
                        <p className="text-sm text-slate-600 mt-1 max-w-xs">{settings.address}</p>
                        <p className="text-sm text-slate-600">SĐT: {settings.phone}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-bold text-slate-800 uppercase tracking-wide">Hóa đơn</h2>
                        <p className="text-sm text-slate-500 mt-1">Số: <span className="font-semibold text-slate-900">{invoice.invoiceNumber}</span></p>
                        <p className="text-sm text-slate-500">Ngày: {invoice.issueDate}</p>
                    </div>
                </div>

                {/* Customer Info */}
                <div className="mb-8 p-4 bg-slate-50 rounded-lg print:bg-transparent print:p-0 print:border print:border-slate-200">
                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Khách hàng</h3>
                    <p className="font-bold text-lg">{invoice.customerName}</p>
                    {/* Các thông tin khác của khách nếu có trong invoice object */}
                </div>

                {/* Table */}
                <div className="mb-8">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b-2 border-slate-800">
                                <th className="py-2 text-left w-12">STT</th>
                                <th className="py-2 text-left">Tên sản phẩm</th>
                                <th className="py-2 text-center w-20">SL</th>
                                <th className="py-2 text-right w-32">Đơn giá</th>
                                <th className="py-2 text-right w-32">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((item: any, index: number) => (
                                <tr key={index} className="border-b border-slate-200">
                                    <td className="py-3 text-left">{index + 1}</td>
                                    <td className="py-3 font-medium">{item.name}</td>
                                    <td className="py-3 text-center">{item.quantity} {item.unit}</td>
                                    <td className="py-3 text-right">{item.price.toLocaleString('vi-VN')}</td>
                                    <td className="py-3 text-right font-bold">{(item.price * item.quantity).toLocaleString('vi-VN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Thành tiền:</span>
                            <span className="font-medium">{totals.total.toLocaleString('vi-VN')} đ</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Thuế (VAT):</span>
                            <span className="font-medium">Đã bao gồm</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold border-t border-slate-300 pt-2 mt-2">
                            <span>Tổng cộng:</span>
                            <span className="text-primary-700">{totals.total.toLocaleString('vi-VN')} đ</span>
                        </div>
                        <div className="flex justify-between text-sm text-green-600 pt-1">
                            <span>Đã thanh toán:</span>
                            <span>{invoice.paidAmount.toLocaleString('vi-VN')} đ</span>
                        </div>
                    </div>
                </div>

                {/* Signature */}
                <div className="mt-16 grid grid-cols-2 gap-8 text-center break-inside-avoid">
                    <div>
                        <p className="font-bold text-sm uppercase">Người mua hàng</p>
                        <p className="text-xs text-slate-500 italic">(Ký, ghi rõ họ tên)</p>
                    </div>
                    <div>
                        <p className="font-bold text-sm uppercase">Người bán hàng</p>
                        <p className="text-xs text-slate-500 italic">(Ký, ghi rõ họ tên)</p>
                    </div>
                </div>
            </div>

            {/* Action Buttons (No Print) */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex justify-center gap-4 no-print shadow-lg">
                <button 
                    onClick={() => setPrintingInvoiceId(null)}
                    className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
                >
                    Quay lại
                </button>
                <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-md"
                >
                    <FiPrinter /> In Hóa Đơn
                </button>
            </div>
        </div>
    );
};

export default PrintInvoicePage;