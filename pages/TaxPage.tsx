
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/DataContext';

const StatCard: React.FC<{ title: string; value: string; color: string; }> = ({ title, value, color }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
    </div>
);

const TaxPage: React.FC = () => {
    const { invoices, cashFlowTransactions } = useAppContext();
    const [startDate, setStartDate] = useState<string>('2023-10-01');
    const [endDate, setEndDate] = useState<string>('2023-12-31');

    const filteredData = useMemo(() => {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        const filteredInvoices = invoices.filter(inv => {
            const invDate = new Date(inv.issueDate).getTime();
            return invDate >= start && invDate <= end;
        });

        const filteredTransactions = cashFlowTransactions.filter(t => {
            const tDate = new Date(t.date).getTime();
            return t.type === 'chi' && (t.inputVat || 0) > 0 && tDate >= start && tDate <= end;
        });

        return { filteredInvoices, filteredTransactions };
    }, [invoices, cashFlowTransactions, startDate, endDate]);

    const taxSummary = useMemo(() => {
        const totalOutputVat = filteredData.filteredInvoices.reduce((sum, inv) => {
            const invoiceVat = inv.items.reduce((itemSum, item) => {
                const itemTotal = item.price * item.quantity;
                const basePrice = itemTotal / (1 + item.vat / 100);
                return itemSum + (itemTotal - basePrice);
            }, 0);
            return sum + invoiceVat;
        }, 0);

        const totalInputVat = filteredData.filteredTransactions.reduce((sum, t) => sum + (t.inputVat || 0), 0);
        
        const taxPayable = totalOutputVat - totalInputVat;

        return { totalOutputVat, totalInputVat, taxPayable };
    }, [filteredData]);

    const getVatDetails = (invoice: typeof invoices[0]) => {
         const totalAmount = invoice.totalAmount;
         const vatAmount = invoice.items.reduce((acc, item) => {
            const itemTotal = item.price * item.quantity;
            const basePrice = itemTotal / (1 + item.vat / 100);
            return acc + (itemTotal - basePrice);
        }, 0);
        const preTaxAmount = totalAmount - vatAmount;
        return { preTaxAmount, vatAmount };
    }

    return (
        <div className="space-y-6">
            <div className="hidden lg:block">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-200">Quản lý Thuế</h1>
                <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400 mt-1">Báo cáo và kê khai Thuế GTGT.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Từ ngày</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 sm:text-sm"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Đến ngày</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 sm:text-sm"/>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Tổng Thuế GTGT đầu ra" value={`${taxSummary.totalOutputVat.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} đ`} color="text-blue-600 dark:text-blue-400" />
                <StatCard title="Tổng Thuế GTGT đầu vào" value={`${taxSummary.totalInputVat.toLocaleString('vi-VN')} đ`} color="text-orange-600 dark:text-orange-400" />
                <StatCard title={taxSummary.taxPayable >= 0 ? "Số thuế phải nộp" : "Số thuế được hoàn"} value={`${Math.abs(taxSummary.taxPayable).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} đ`} color={taxSummary.taxPayable >= 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Output VAT Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 p-6 border-b border-slate-200 dark:border-slate-700">Bảng kê Thuế GTGT đầu ra</h3>
                    <div className="overflow-x-auto max-h-96">
                        <table className="min-w-full text-sm">
                            <thead className="bg-primary-50 dark:bg-slate-700 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left font-semibold text-primary-800 dark:text-primary-300">Ngày</th>
                                    <th className="px-4 py-2 text-left font-semibold text-primary-800 dark:text-primary-300">Số HĐ</th>
                                    <th className="px-4 py-2 text-right font-semibold text-primary-800 dark:text-primary-300">Tiền thuế</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800">
                                {filteredData.filteredInvoices.map(invoice => (
                                    <tr key={invoice.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                                        <td className="px-4 py-2 whitespace-nowrap text-slate-500 dark:text-slate-400">{invoice.issueDate}</td>
                                        <td className="px-4 py-2 whitespace-nowrap font-medium text-primary-600">{invoice.invoiceNumber}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-right font-medium text-slate-800 dark:text-slate-200">{getVatDetails(invoice).vatAmount.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} đ</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Input VAT Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 p-6 border-b border-slate-200 dark:border-slate-700">Bảng kê Thuế GTGT đầu vào</h3>
                    <div className="overflow-x-auto max-h-96">
                        <table className="min-w-full text-sm">
                            <thead className="bg-primary-50 dark:bg-slate-700 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left font-semibold text-primary-800 dark:text-primary-300">Ngày</th>
                                    <th className="px-4 py-2 text-left font-semibold text-primary-800 dark:text-primary-300">Nội dung</th>
                                    <th className="px-4 py-2 text-right font-semibold text-primary-800 dark:text-primary-300">Tiền thuế</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800">
                                {filteredData.filteredTransactions.map(t => (
                                    <tr key={t.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                                        <td className="px-4 py-2 whitespace-nowrap text-slate-500 dark:text-slate-400">{t.date}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-slate-800 dark:text-slate-200 max-w-xs truncate">{t.description}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-right font-medium text-slate-800 dark:text-slate-200">{(t.inputVat || 0).toLocaleString('vi-VN')} đ</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaxPage;
