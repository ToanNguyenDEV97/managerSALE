import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { FiPlus, FiArrowUp, FiArrowDown, FiFilter, FiLoader } from 'react-icons/fi';
import CashFlowModal from '../components/CashFlowModal';

const CashFlowPage: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Gọi API lấy danh sách giao dịch (đã có sẵn trong server.js: /api/cashflow-transactions)
    const { data: cashFlowData, isLoading } = useQuery({
        queryKey: ['cashflow'],
        queryFn: () => api('/api/cashflow-transactions')
    } as any);

    const transactions = cashFlowData?.data || [];

    // Tính toán tổng quỹ
    const totalIncome = transactions.filter((t: any) => t.type === 'thu').reduce((sum: number, t: any) => sum + t.amount, 0);
    const totalExpense = transactions.filter((t: any) => t.type === 'chi').reduce((sum: number, t: any) => sum + t.amount, 0);
    const currentBalance = totalIncome - totalExpense;

    if (isLoading) return <div className="flex justify-center p-10"><FiLoader className="animate-spin text-2xl" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 1. Header & Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Sổ Quỹ Tiền Mặt</h2>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg"
                >
                    <FiPlus /> Lập Phiếu Thu/Chi
                </button>
            </div>

            {/* 2. Cards Tổng Quan */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="text-slate-500 text-sm font-medium uppercase mb-1">Tổng Thu</div>
                    <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
                        <FiArrowUp /> {totalIncome.toLocaleString()} đ
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="text-slate-500 text-sm font-medium uppercase mb-1">Tổng Chi</div>
                    <div className="text-2xl font-bold text-red-600 flex items-center gap-2">
                        <FiArrowDown /> {totalExpense.toLocaleString()} đ
                    </div>
                </div>
                <div className="bg-primary-600 text-white p-6 rounded-xl shadow-lg shadow-primary-500/30">
                    <div className="text-primary-100 text-sm font-medium uppercase mb-1">Tồn Quỹ Hiện Tại</div>
                    <div className="text-3xl font-bold">
                        {currentBalance.toLocaleString()} đ
                    </div>
                </div>
            </div>

            {/* 3. Bảng Giao Dịch */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700/50">
                    <h3 className="font-bold text-slate-700 dark:text-white">Lịch sử giao dịch</h3>
                    <button className="text-slate-500 hover:text-primary-600"><FiFilter /></button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            <tr>
                                <th className="p-4">Mã phiếu</th>
                                <th className="p-4">Ngày</th>
                                <th className="p-4">Loại</th>
                                <th className="p-4">Đối tượng</th>
                                <th className="p-4">Diễn giải</th>
                                <th className="p-4 text-right">Số tiền</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {transactions.length > 0 ? (
                                transactions.map((t: any) => (
                                    <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="p-4 font-medium text-slate-800 dark:text-white">{t.transactionNumber}</td>
                                        <td className="p-4 text-slate-500">{new Date(t.date).toLocaleDateString('vi-VN')}</td>
                                        <td className="p-4">
                                            {t.type === 'thu' ? (
                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase">Thu</span>
                                            ) : (
                                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold uppercase">Chi</span>
                                            )}
                                        </td>
                                        <td className="p-4 font-medium">{t.payerReceiverName || '-'}</td>
                                        <td className="p-4 text-slate-600 max-w-xs truncate" title={t.description}>{t.description}</td>
                                        <td className={`p-4 text-right font-bold ${t.type === 'thu' ? 'text-green-600' : 'text-red-600'}`}>
                                            {t.type === 'thu' ? '+' : '-'}{t.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500 italic">Chưa có giao dịch nào.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <CashFlowModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
};

export default CashFlowPage;