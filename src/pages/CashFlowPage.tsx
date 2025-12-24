import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { FiArrowUp, FiArrowDown, FiLoader, FiFilter, FiDollarSign } from 'react-icons/fi';

const CashFlowPage: React.FC = () => {
    // 1. Lấy dữ liệu Sổ quỹ
    const { data: responseData, isLoading } = useQuery({
        queryKey: ['cashflow'],
        queryFn: () => api('/api/cashflow-transactions'),
    });

    const transactions = Array.isArray(responseData) ? responseData : (responseData?.data || []);

    // 2. Tính toán tổng thu/chi
    const stats = useMemo(() => {
        return transactions.reduce((acc: any, curr: any) => {
            if (curr.type === 'thu') acc.income += curr.amount;
            else acc.expense += curr.amount;
            return acc;
        }, { income: 0, expense: 0 });
    }, [transactions]);

    if (isLoading) return <div className="h-screen flex justify-center items-center"><FiLoader className="animate-spin text-2xl text-slate-400"/></div>;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            
            {/* THỐNG KÊ NHANH */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-xs uppercase font-bold">Tổng Thu</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">+{stats.income.toLocaleString()} đ</p>
                    </div>
                    <div className="p-3 bg-green-100 text-green-600 rounded-full"><FiArrowDown size={24}/></div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-xs uppercase font-bold">Tổng Chi</p>
                        <p className="text-2xl font-bold text-red-600 mt-1">-{stats.expense.toLocaleString()} đ</p>
                    </div>
                    <div className="p-3 bg-red-100 text-red-600 rounded-full"><FiArrowUp size={24}/></div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-xs uppercase font-bold">Tồn Quỹ Hiện Tại</p>
                        <p className="text-2xl font-bold text-primary-600 mt-1">{(stats.income - stats.expense).toLocaleString()} đ</p>
                    </div>
                    <div className="p-3 bg-primary-100 text-primary-600 rounded-full"><FiDollarSign size={24}/></div>
                </div>
            </div>

            {/* BẢNG DỮ LIỆU */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="font-bold text-slate-800 dark:text-white">Lịch sử Giao dịch</h2>
                    <div className="flex gap-2">
                         {/* Có thể thêm bộ lọc ngày ở đây sau này */}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Mã phiếu</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Ngày</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Loại</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Đối tượng</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Danh mục</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Diễn giải</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Số tiền</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {transactions.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-10 text-slate-500">Chưa có giao dịch nào.</td></tr>
                            ) : (
                                transactions.map((item: any) => (
                                    // 👇 FIX LỖI Ở ĐÂY: Thêm prop key={item._id}
                                    <tr key={item.id || item._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                                            {item.transactionNumber}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                            {new Date(item.date).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.type === 'thu' 
                                                ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Thu tiền</span>
                                                : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Chi tiền</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 font-medium">
                                            {item.payerReceiverName || '---'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {item.category}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate" title={item.description}>
                                            {item.description}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold ${item.type === 'thu' ? 'text-green-600' : 'text-red-600'}`}>
                                            {item.type === 'thu' ? '+' : '-'}{item.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CashFlowPage;