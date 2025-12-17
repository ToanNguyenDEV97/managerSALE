import React, { useEffect, useMemo } from 'react';
import { FiPrinter } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
import { useCashFlow } from '../hooks/useCashFlow'; // Import Hook lấy giao dịch

// Hàm đọc số thành chữ (Giữ nguyên hoặc dùng thư viện n-2-vi)
const docSoThanhChu = (so: number): string => {
    if (so === 0) return 'không đồng';
    // Logic đơn giản để tránh lỗi, bạn có thể thay bằng thư viện 'n-2-vi'
    return so.toLocaleString('vi-VN') + ' đồng'; 
};

const PrintVoucherPage: React.FC = () => {
    const { printingVoucherId, setPrintingVoucherId, settings } = useAppContext();
    
    // Lấy dữ liệu từ Hook
    const { data: cashFlowData } = useCashFlow();
    const transactions = Array.isArray(cashFlowData) ? cashFlowData : (cashFlowData?.data || []);

    const transaction = useMemo(() => {
        if (!printingVoucherId) return null;
        return transactions.find((t: any) => t.id === printingVoucherId);
    }, [transactions, printingVoucherId]);

    useEffect(() => {
        const handleAfterPrint = () => setPrintingVoucherId(null);
        window.addEventListener('afterprint', handleAfterPrint);
        return () => window.removeEventListener('afterprint', handleAfterPrint);
    }, [setPrintingVoucherId]);

    if (!transaction) return <div className="flex justify-center items-center h-screen">Đang tải phiếu...</div>;

    const isReceipt = transaction.type === 'thu';
    const title = isReceipt ? 'PHIẾU THU' : 'PHIẾU CHI';

    return (
        <div className="bg-white min-h-screen text-slate-900 font-sans p-8 md:p-12 flex justify-center">
            <style>{`@media print { @page { margin: 0; } body { margin: 0; } .no-print { display: none !important; } }`}</style>

            <div className="w-full max-w-2xl border border-slate-300 p-8 shadow-md print:shadow-none print:border-0">
                <div className="flex justify-between mb-6">
                    <div>
                        <h3 className="font-bold text-sm uppercase">{settings.companyName}</h3>
                        <p className="text-xs text-slate-600">{settings.address}</p>
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold uppercase tracking-wider">{title}</h1>
                        <p className="text-xs italic mt-1">Ngày: {transaction.date}</p>
                        <p className="text-xs mt-1">Số: <span className="font-semibold">{transaction.transactionNumber}</span></p>
                    </div>
                    <div className="w-24"></div> {/* Spacer để căn giữa tiêu đề */}
                </div>

                <div className="space-y-4 text-sm leading-relaxed mb-8">
                    <div className="flex">
                        <span className="w-32 flex-shrink-0">Họ và tên người {isReceipt ? 'nộp' : 'nhận'}:</span>
                        <span className="font-semibold border-b border-dotted border-slate-400 flex-grow pl-2">{transaction.payerReceiverName || '................................................'}</span>
                    </div>
                    <div className="flex">
                        <span className="w-32 flex-shrink-0">Địa chỉ:</span>
                        <span className="border-b border-dotted border-slate-400 flex-grow pl-2">{transaction.payerReceiverAddress || '................................................'}</span>
                    </div>
                    <div className="flex">
                        <span className="w-32 flex-shrink-0">Lý do {isReceipt ? 'nộp' : 'chi'}:</span>
                        <span className="border-b border-dotted border-slate-400 flex-grow pl-2">{transaction.description}</span>
                    </div>
                    <div className="flex">
                        <span className="w-32 flex-shrink-0">Số tiền:</span>
                        <span className="font-bold text-lg border-b border-dotted border-slate-400 flex-grow pl-2">{transaction.amount.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="flex">
                        <span className="w-32 flex-shrink-0">Viết bằng chữ:</span>
                        <span className="italic border-b border-dotted border-slate-400 flex-grow pl-2">{docSoThanhChu(transaction.amount)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-center mt-8">
                    <div>
                        <p className="font-bold text-xs uppercase">Giám đốc</p>
                        <p className="text-[10px] italic">(Ký, họ tên, đóng dấu)</p>
                    </div>
                    <div>
                        <p className="font-bold text-xs uppercase">Kế toán trưởng</p>
                        <p className="text-[10px] italic">(Ký, họ tên)</p>
                    </div>
                    <div>
                        <p className="font-bold text-xs uppercase">Người lập phiếu</p>
                        <p className="text-[10px] italic">(Ký, họ tên)</p>
                    </div>
                    <div>
                        <p className="font-bold text-xs uppercase">Người {isReceipt ? 'nộp' : 'nhận'} tiền</p>
                        <p className="text-[10px] italic">(Ký, họ tên)</p>
                    </div>
                </div>
                
                <div className="mt-20 text-center no-print">
                    <button onClick={() => window.print()} className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium shadow-md hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 mx-auto">
                        <FiPrinter /> In Phiếu
                    </button>
                    <button onClick={() => setPrintingVoucherId(null)} className="mt-3 text-slate-500 hover:text-slate-700 text-sm underline">
                        Đóng cửa sổ này
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrintVoucherPage;