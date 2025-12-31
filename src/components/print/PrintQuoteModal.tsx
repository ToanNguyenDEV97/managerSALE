PrintQuoteModal.tsximport React, { useEffect, useMemo } from 'react';
import { FiPrinter } from 'react-icons/fi';
import { useAppContext } from '../../context/DataContext';
import { useQuotes } from '../../hooks/useQuotes'; // Import Hook mới

const PrintQuotePage: React.FC = () => {
    const { printingQuoteId, setPrintingQuoteId, settings } = useAppContext();
    
    // Lấy dữ liệu từ Hook
    const { data: quotesData } = useQuotes(1);
    const quotes = Array.isArray(quotesData) ? quotesData : (quotesData?.data || []);
    
    const quote = useMemo(() => {
        if (!printingQuoteId) return null;
        return quotes.find((q: any) => q.id === printingQuoteId);
    }, [quotes, printingQuoteId]);

    useEffect(() => {
        const handleAfterPrint = () => setPrintingQuoteId(null);
        window.addEventListener('afterprint', handleAfterPrint);
        return () => window.removeEventListener('afterprint', handleAfterPrint);
    }, [setPrintingQuoteId]);

    if (!quote) return <div className="flex justify-center items-center h-screen">Đang tải báo giá...</div>;

    const totals = {
        total: quote.totalAmount,
        vatAmount: quote.items.reduce((acc: number, item: any) => {
            const total = item.price * item.quantity;
            return acc + (total * (item.vat || 0) / 100);
        }, 0)
    };

    return (
        <div className="bg-white min-h-screen text-slate-900 font-sans p-8 md:p-12">
            <style>{`@media print { @page { margin: 0; } body { margin: 1.6cm; } .no-print { display: none !important; } }`}</style>

            <div className="max-w-3xl mx-auto border border-slate-200 p-8 shadow-sm print:border-0 print:shadow-none print:p-0">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        {settings.logo && <img src={settings.logo} alt="Logo" className="h-16 object-contain mb-2" />}
                        <h1 className="text-2xl font-bold text-primary-700 uppercase">{settings.companyName}</h1>
                        <p className="text-sm text-slate-600 mt-1">{settings.address}</p>
                        <p className="text-sm text-slate-600">SĐT: {settings.phone}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-bold text-slate-800 uppercase">Báo Giá</h2>
                        <p className="text-sm text-slate-500 mt-1">Số: <span className="font-semibold">{quote.quoteNumber}</span></p>
                        <p className="text-sm text-slate-500">Ngày: {quote.issueDate}</p>
                    </div>
                </div>

                <div className="mb-8 p-4 bg-slate-50 rounded-lg print:bg-transparent print:p-0 print:border print:border-slate-200">
                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Kính gửi</h3>
                    <p className="font-bold text-lg">{quote.customerName}</p>
                </div>

                <table className="w-full text-sm mb-8">
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
                        {quote.items.map((item: any, index: number) => (
                            <tr key={index} className="border-b border-slate-200">
                                <td className="py-3 text-left">{index + 1}</td>
                                <td className="py-3 font-medium">{item.name}</td>
                                <td className="py-3 text-center">{item.quantity}</td>
                                <td className="py-3 text-right">{item.price.toLocaleString('vi-VN')}</td>
                                <td className="py-3 text-right font-bold">{(item.price * item.quantity).toLocaleString('vi-VN')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between text-xl font-bold border-t border-slate-300 pt-2 mt-2">
                            <span>Tổng cộng:</span>
                            <span className="text-primary-700">{totals.total.toLocaleString('vi-VN')} đ</span>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-6 border-t border-slate-200 text-center text-sm text-slate-500">
                    <p>Báo giá có hiệu lực trong vòng 15 ngày.</p>
                    <p>Rất mong nhận được sự hợp tác của Quý khách!</p>
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex justify-center gap-4 no-print shadow-lg">
                    <button onClick={() => setPrintingQuoteId(null)} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium">Quay lại</button>
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg font-medium shadow-md"><FiPrinter /> In Báo giá</button>
                </div>
            </div>
        </div>
    );
};

export default PrintQuotePage;