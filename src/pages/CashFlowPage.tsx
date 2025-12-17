import React, { useState, useMemo } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiTrendingUp, FiTrendingDown, FiLoader } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
import { useCashFlow, useDeleteTransaction } from '../hooks/useCashFlow'; // Cần đảm bảo file hook này tồn tại
import Pagination from '../components/Pagination';
import ConfirmationModal from '../components/ConfirmationModal';

const StatCard: React.FC<{ title: string; value: string; color: string; icon: any }> = ({ title, value, color, icon }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('600', '100')}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className={`text-xl font-bold ${color} mt-1`}>{value}</p>
        </div>
    </div>
);

const CashFlowPage: React.FC = () => {
    const { setEditingTransaction } = useAppContext();
    const [page, setPage] = useState(1);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [filterType, setFilterType] = useState('all');

    const { data: cashFlowData, isLoading } = useCashFlow(page);
    const deleteMutation = useDeleteTransaction();

    const transactions = Array.isArray(cashFlowData) ? cashFlowData : (cashFlowData?.data || []);
    const totalPages = Array.isArray(cashFlowData) ? 1 : (cashFlowData?.totalPages || 1);

    // Tính toán sơ bộ (Lưu ý: API nên trả về tổng thu/chi riêng để chính xác hơn)
    const { totalIncome, totalExpense } = useMemo(() => {
        const income = transactions.filter((t: any) => t.type === 'thu').reduce((sum: number, t: any) => sum + t.amount, 0);
        const expense = transactions.filter((t: any) => t.type === 'chi').reduce((sum: number, t: any) => sum + t.amount, 0);
        return { totalIncome: income, totalExpense: expense };
    }, [transactions]);

    const handleConfirmDelete = async () => {
        if (itemToDelete) {
            await deleteMutation.mutateAsync(itemToDelete.id);
            setItemToDelete(null);
        }
    };

    if (isLoading) return <div className="flex justify-center p-10"><FiLoader className="animate-spin" /></div>;

    const filteredTransactions = filterType === 'all' ? transactions : transactions.filter((t: any) => t.type === filterType);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Tổng Thu (Trang này)" value={`${totalIncome.toLocaleString()} đ`} color="text-green-600" icon={<FiTrendingUp className="text-green-600" />} />
                <StatCard title="Tổng Chi (Trang này)" value={`${totalExpense.toLocaleString()} đ`} color="text-red-600" icon={<FiTrendingDown className="text-red-600" />} />
                <StatCard title="Chênh lệch" value={`${(totalIncome - totalExpense).toLocaleString()} đ`} color="text-blue-600" icon={<FiPlus className="text-blue-600" />} />
            </div>

            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex gap-2">
                    <button onClick={() => setFilterType('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filterType === 'all' ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}>Tất cả</button>
                    <button onClick={() => setFilterType('thu')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filterType === 'thu' ? 'bg-green-100 text-green-700' : 'text-slate-500 hover:bg-green-50'}`}>Thu</button>
                    <button onClick={() => setFilterType('chi')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filterType === 'chi' ? 'bg-red-100 text-red-700' : 'text-slate-500 hover:bg-red-50'}`}>Chi</button>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setEditingTransaction('new-thu')} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm"><FiPlus /> Lập phiếu thu</button>
                    <button onClick={() => setEditingTransaction('new-chi')} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm"><FiPlus /> Lập phiếu chi</button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mã phiếu</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ngày</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Loại</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nội dung / Đối tượng</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Số tiền</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredTransactions.length > 0 ? filteredTransactions.map((t: any) => (
                                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-6 py-4 font-medium text-slate-500">{t.transactionNumber}</td>
                                    <td className="px-6 py-4 text-slate-800 dark:text-slate-200">{t.date}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${t.type === 'thu' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {t.type === 'thu' ? 'THU' : 'CHI'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="font-medium text-slate-800 dark:text-slate-200">{t.description}</div>
                                        <div className="text-xs text-slate-500">{t.payerReceiverName}</div>
                                    </td>
                                    <td className={`px-6 py-4 text-right font-bold ${t.type === 'thu' ? 'text-green-600' : 'text-red-600'}`}>
                                        {t.type === 'thu' ? '+' : '-'}{t.amount.toLocaleString()} đ
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button onClick={() => setEditingTransaction(t)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><FiEdit /></button>
                                        <button onClick={() => setItemToDelete(t)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg"><FiTrash2 /></button>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan={6} className="text-center py-10 text-slate-500">Chưa có giao dịch nào.</td></tr>}
                        </tbody>
                    </table>
                </div>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={transactions.length} itemsPerPage={10} />
            </div>

            {itemToDelete && (
                <ConfirmationModal 
                    isOpen={!!itemToDelete} 
                    onClose={() => setItemToDelete(null)} 
                    onConfirm={handleConfirmDelete} 
                    title="Xóa phiếu Thu/Chi"
                >
                    Bạn có chắc chắn muốn xóa phiếu <strong>{itemToDelete.transactionNumber}</strong>?
                </ConfirmationModal>
            )}
        </div>
    );
};

export default CashFlowPage;