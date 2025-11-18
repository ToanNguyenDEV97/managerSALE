
import React, { useEffect, useMemo } from 'react';
import { FiBox, FiPrinter } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';

const PrintQuotePage: React.FC = () => {
    const { printingQuoteId, quotes, setPrintingQuoteId, settings } = useAppContext();
    const quote = useMemo(() => quotes.find(q => q.id === printingQuoteId), [quotes, printingQuoteId]);

    useEffect(() => {
        const handleAfterPrint = () => {
            setPrintingQuoteId(null);
        };

        window.addEventListener('afterprint', handleAfterPrint);

        return () => {
            // 2. Thêm dòng này để dọn dẹp timer
            // clearTimeout(printTimer);
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, [setPrintingQuoteId]);

    if (!quote || !quote.items) { // <-- Thêm kiểm tra !quote.items
        return <div className="p-10">Đang tải báo giá...</div>;
    }

    const totals = {
        total: quote.totalAmount,
        vatAmount: quote.items.reduce((acc, item) => {
            const itemTotal = item.price * item.quantity;
            const basePrice = itemTotal / (1 + item.vat / 100);
            return acc + (itemTotal - basePrice);
        }, 0),
        get subtotal() { return this.total - this.vatAmount },
    };

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
                {/* Header */}
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
                            <p>Email: {settings.email}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h1 className="text-3xl font-bold text-primary-600 uppercase tracking-wider">Báo giá</h1>
                        <p className="text-lg font-semibold text-slate-600 mt-2">{quote.quoteNumber}</p>
                        <p className="text-sm text-slate-500">Ngày tạo: {quote.issueDate}</p>
                    </div>
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-8 mt-6">
                    <div>
                        <h3 className="text-sm font-semibold uppercase text-slate-500 tracking-wider">Khách hàng</h3>
                        <p className="font-bold text-slate-800 mt-1">{quote.customerName}</p>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mt-8">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-100">
                                <th className="p-3 text-sm font-semibold text-slate-700 uppercase tracking-wider">Sản phẩm</th>
                                <th className="p-3 text-sm font-semibold text-slate-700 uppercase tracking-wider text-center">Số lượng</th>
                                <th className="p-3 text-sm font-semibold text-slate-700 uppercase tracking-wider text-right">Đơn giá (gồm VAT)</th>
                                <th className="p-3 text-sm font-semibold text-slate-700 uppercase tracking-wider text-right">Thành tiền (gồm VAT)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quote.items.map(item => (
                                <tr key={item.productId} className="border-b border-slate-100">
                                    <td className="p-3">{item.name}</td>
                                    <td className="p-3 text-center">{item.quantity}</td>
                                    <td className="p-3 text-right">{item.price.toLocaleString('vi-VN')}đ</td>
                                    <td className="p-3 text-right">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end mt-8">
                    <div className="w-full max-w-sm space-y-3">
                        <div className="flex justify-between text-slate-600">
                            <span>Tổng phụ:</span>
                            <span>{totals.subtotal.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}đ</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>Thuế GTGT:</span>
                            <span>{totals.vatAmount.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}đ</span>
                        </div>
                        <div className="flex justify-between text-2xl font-bold text-slate-800 pt-2 border-t border-slate-200">
                            <span>Tổng cộng:</span>
                            <span>{totals.total.toLocaleString('vi-VN')}đ</span>
                        </div>
                    </div>
                </div>
                
                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-slate-200 text-center text-sm text-slate-500">
                    <p>Báo giá có hiệu lực trong vòng 15 ngày.</p>
                    <p>Cảm ơn quý khách đã quan tâm!</p>
                </div>
                
                 <div className="mt-8 text-center no-print flex justify-center gap-4">
                    <button onClick={() => setPrintingQuoteId(null)} className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700">
                        Quay lại
                    </button>
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                        <FiPrinter />
                        In Báo giá
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrintQuotePage;
