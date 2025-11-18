
import React, { useState, useMemo } from 'react';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import type { CashFlowTransaction } from '../types';
import { useAppContext } from '../context/DataContext';

const StatCard: React.FC<{ title: string; value: string; color: string; }> = ({ title, value, color }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
    </div>
);

const CashFlowPage: React.FC = () => {
  const { cashFlowTransactions, setEditingTransaction, handleDeleteCashFlowTransaction } = useAppContext();
  const [filter, setFilter] = useState('all'); // 'all', 'thu', 'chi'

  const { totalIncome, totalExpense, balance } = useMemo(() => {
    const totalIncome = cashFlowTransactions
      .filter(t => t.type === 'thu')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = cashFlowTransactions
      .filter(t => t.type === 'chi')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;
    return { totalIncome, totalExpense, balance };
  }, [cashFlowTransactions]);

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') {
      return cashFlowTransactions;
    }
    return cashFlowTransactions.filter(t => t.type === filter);
  }, [cashFlowTransactions, filter]).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDelete = async (transactionId: string) => {
    await handleDeleteCashFlowTransaction(transactionId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="hidden lg:block">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-200">Sổ quỹ</h1>
          <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400 mt-1">Theo dõi và quản lý dòng tiền của bạn.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
            <button onClick={() => setEditingTransaction('new-thu')} className="flex items-center justify-center w-full sm:w-auto px-4 py-2 text-white rounded-lg bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-px">
                <FiPlus />
                <span className="ml-2 font-medium">Tạo Phiếu Thu</span>
            </button>
            <button onClick={() => setEditingTransaction('new-chi')} className="flex items-center justify-center w-full sm:w-auto px-4 py-2 text-white rounded-lg bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-px">
                <FiPlus />
                <span className="ml-2 font-medium">Tạo Phiếu Chi</span>
            </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Tổng Thu" value={`${totalIncome.toLocaleString('vi-VN')} đ`} color="text-green-600 dark:text-green-400" />
        <StatCard title="Tổng Chi" value={`${totalExpense.toLocaleString('vi-VN')} đ`} color="text-red-600 dark:text-red-400" />
        <StatCard title="Số Dư Hiện tại" value={`${balance.toLocaleString('vi-VN')} đ`} color="text-slate-800 dark:text-slate-200" />
      </div>

       <div className="flex justify-end">
          <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full sm:w-auto border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 sm:text-sm"
          >
              <option value="all">Tất cả giao dịch</option>
              <option value="thu">Chỉ Phiếu Thu</option>
              <option value="chi">Chỉ Phiếu Chi</option>
          </select>
       </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Table View */}
        <div className="overflow-x-auto hidden lg:block">
            <table className="min-w-full">
              <thead className="bg-primary-50 dark:bg-slate-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Ngày</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Số phiếu</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Loại</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Số tiền</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Người nộp/nhận</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Nội dung</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Phân loại</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Hành động</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800">
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{t.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700 dark:text-slate-300">{t.transactionNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs ${t.type === 'thu' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300'}`}>
                           {t.type === 'thu' ? 'Phiếu Thu' : 'Phiếu Chi'}
                        </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${t.type === 'thu' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{t.amount.toLocaleString('vi-VN')} đ</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">{t.payerReceiverName || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 dark:text-slate-300 max-w-sm truncate">{t.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{t.category || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                      <button onClick={() => setEditingTransaction(t)} className="text-primary-600 hover:text-primary-800 inline-flex items-center gap-1 transition-transform hover:scale-110">
                        <FiEdit className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700 inline-flex items-center gap-1 transition-transform hover:scale-110">
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
        {/* Card View */}
        <div className="lg:hidden">
            {filteredTransactions.length > 0 ? filteredTransactions.map(t => (
                <div key={t.id} className="p-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold text-slate-600 dark:text-slate-300">{t.transactionNumber}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.type === 'thu' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300'}`}>
                               {t.type === 'thu' ? 'Phiếu Thu' : 'Phiếu Chi'}
                            </span>
                             <p className={`text-lg font-bold mt-1 ${t.type === 'thu' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{t.amount.toLocaleString('vi-VN')} đ</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button onClick={() => setEditingTransaction(t)} className="text-primary-600 hover:text-primary-800 p-1">
                                <FiEdit className="h-5 w-5" />
                            </button>
                            <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700 p-1">
                                <FiTrash2 className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                        <p>{t.description}</p>
                        {t.payerReceiverName && <p className="text-xs text-slate-500 dark:text-slate-400">Người nộp/nhận: {t.payerReceiverName}</p>}
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <span>{t.date}</span>
                            <span>{t.category || ''}</span>
                        </div>
                    </div>
                </div>
            )) : (
                <div className="text-center py-10 text-slate-500 dark:text-slate-400">Không có giao dịch nào.</div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CashFlowPage;
