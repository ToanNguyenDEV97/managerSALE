import React, { useState, useMemo } from 'react';
import { FiCalendar, FiFileText, FiLoader } from 'react-icons/fi';
import { useAllInvoices } from '../hooks/useInvoices';
import { useAllCashFlow } from '../hooks/useCashFlow';

const TaxPage: React.FC = () => {
    // 1. Lấy dữ liệu
    const { data: invoicesData, isLoading: load1 } = useAllInvoices();
    const { data: cashFlowData, isLoading: load2 } = useAllCashFlow();

    const invoices = Array.isArray(invoicesData) ? invoicesData : (invoicesData?.data || []);
    const transactions = Array.isArray(cashFlowData) ? cashFlowData : (cashFlowData?.data || []);

    // 2. State bộ lọc ngày
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]); // Đầu tháng
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]); // Hôm nay

    // 3. Tính toán thuế
    const taxReport = useMemo(() => {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        // A. Thuế đầu ra (Từ hóa đơn bán hàng)
        // Logic: Lọc hóa đơn trong khoảng thời gian -> Tính tổng VAT từ items
        const filteredInvoices = invoices.filter((inv: any) => {
            const time = new Date(inv.issueDate).getTime();
            return time >= start && time <= end;
        });

        const outputVat = filteredInvoices.reduce((sum: number, inv: any) => {
            // Giả sử mỗi item có trường vat (%), công thức: (Price * Qty) * (VAT / 100)
            const vatOfInvoice = inv.items.reduce((v: number, item: any) => {
                const itemTotal = item.price * item.quantity;
                // Nếu giá đã bao gồm thuế: VAT = itemTotal - (itemTotal / (1 + rate/100))
                // Nếu giá chưa thuế: VAT = itemTotal * (rate/100)
                // Ở đây ta dùng logic đơn giản (giá chưa thuế) hoặc lấy từ field vatAmount nếu backend tính sẵn.
                // Tạm tính: VAT = TotalAmount * (10 / 110) nếu 10%
                return v + (itemTotal * (item.vat || 0) / 100); 
            }, 0);
            return sum + vatOfInvoice;
        }, 0);

        const totalRevenueNoVat = filteredInvoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0) - outputVat;


        // B. Thuế đầu vào (Từ phiếu chi có hóa đơn đỏ)
        const filteredExpenses = transactions.filter((t: any) => {
            const time = new Date(t.date).getTime();
            return t.type === 'chi' && time >= start && time <= end;
        });

        const inputVat = filteredExpenses.reduce((sum: number, t: any) => sum + (t.inputVat || 0), 0);

        return {
            invoiceCount: filteredInvoices.length,
            expenseCount: filteredExpenses.length,
            totalRevenueNoVat,
            outputVat,
            inputVat,
            payableVat: outputVat - inputVat
        };
    }, [invoices, transactions, startDate, endDate]);

    if (load1 || load2) return <div className="flex justify-center p-10"><FiLoader className="animate-spin" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-end gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FiFileText className="text-primary-600"/> Báo cáo Thuế GTGT
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Tự động tính toán dựa trên Hóa đơn và Phiếu chi</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 p-2 rounded-lg border border-slate-200 dark:border-slate-600">
                    <FiCalendar className="text-slate-400" />
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-transparent text-sm font-medium focus:outline-none dark:text-white"
                    />
                    <span className="text-slate-400">-</span>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-transparent text-sm font-medium focus:outline-none dark:text-white"
                    />
                </div>
            </div>

            {/* Cards Kết quả */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Thuế GTGT Đầu ra (Bán ra)</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">+{taxReport.outputVat.toLocaleString()} đ</p>
                    <p className="text-xs text-slate-400 mt-1">Từ {taxReport.invoiceCount} hóa đơn</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Thuế GTGT Đầu vào (Mua vào)</p>
                    <p className="text-2xl font-bold text-red-600 mt-2">-{taxReport.inputVat.toLocaleString()} đ</p>
                    <p className="text-xs text-slate-400 mt-1">Từ {taxReport.expenseCount} phiếu chi</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800 shadow-sm">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Thuế phải nộp (Ước tính)</p>
                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-400 mt-2">
                        {taxReport.payableVat.toLocaleString()} đ
                    </p>
                    <p className="text-xs text-blue-600/70 mt-1">
                        {taxReport.payableVat > 0 ? 'Cần nộp ngân sách' : 'Được khấu trừ chuyển kỳ sau'}
                    </p>
                </div>
            </div>

            {/* Chi tiết bảng kê (Ví dụ bảng kê bán ra) */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200">
                    Bảng kê chi tiết
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500">
                            <tr>
                                <th className="px-4 py-3 text-left">Chỉ tiêu</th>
                                <th className="px-4 py-3 text-right">Doanh số (Chưa VAT)</th>
                                <th className="px-4 py-3 text-right">Thuế GTGT</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            <tr>
                                <td className="px-4 py-3 font-medium">1. Hàng hóa, dịch vụ bán ra</td>
                                <td className="px-4 py-3 text-right">{taxReport.totalRevenueNoVat.toLocaleString()} đ</td>
                                <td className="px-4 py-3 text-right font-bold text-green-600">{taxReport.outputVat.toLocaleString()} đ</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-3 font-medium">2. Hàng hóa, dịch vụ mua vào</td>
                                <td className="px-4 py-3 text-right">---</td>
                                <td className="px-4 py-3 text-right font-bold text-red-600">{taxReport.inputVat.toLocaleString()} đ</td>
                            </tr>
                            <tr className="bg-slate-50 dark:bg-slate-700/30">
                                <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">3. Thuế GTGT phải nộp (1 - 2)</td>
                                <td className="px-4 py-3 text-right"></td>
                                <td className="px-4 py-3 text-right font-bold text-blue-600 text-lg">{taxReport.payableVat.toLocaleString()} đ</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TaxPage;