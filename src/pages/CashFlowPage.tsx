import React, { useState } from 'react';
import { FiPlus, FiArrowUpCircle, FiArrowDownCircle, FiFilter, FiDownload } from 'react-icons/fi';
import { Button } from '../components/common/Button'; // Component chuẩn mới
import CashFlowModal from '../components/features/finance/CashFlowModal';
import Pagination from '../components/common/Pagination';
import { useCashFlow } from '../hooks/useCashFlow'; // Đảm bảo hook này tồn tại
import { formatCurrency } from '../utils/currency';

const CashFlowPage: React.FC = () => {
    const [page, setPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');

    // Lấy dữ liệu từ Hook
    const { data: transactionsData, isLoading, stats } = useCashFlow(page, 10);
    const transactions = transactionsData?.data || [];
    const totalPages = transactionsData?.totalPages || 1;

    // Handler mở modal
    const handleOpenModal = (type: 'income' | 'expense') => {
        setTransactionType(type);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 1. Header & Stats */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Sổ quỹ tiền mặt</h2>
                    <p className="text-slate-500">Quản lý thu chi và dòng tiền doanh nghiệp</p>
                </div>
                <div className="flex gap-2">
                     <Button variant="secondary" icon={<FiDownload />}>Xuất Excel</Button>
                </div>
            </div>

            {/* 2. Thẻ thống kê (Overview) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium uppercase">Tổng thu (Tháng này)</p>
                        <p className="text-2xl font-bold text-green-600">+{formatCurrency(stats?.income || 0)}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-full text-green-600"><FiArrowUpCircle size={24} /></div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium uppercase">Tổng chi (Tháng này)</p>
                        <p className="text-2xl font-bold text-red-600">-{formatCurrency(stats?.expense || 0)}</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-full text-red-600"><FiArrowDownCircle size={24} /></div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500 font-medium uppercase">Quỹ hiện tại</p>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats?.balance || 0)}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-full text-blue-600"><FiFilter size={24} /></div>
                </div>
            </div>

            {/* 3. Toolbar & Actions */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex gap-2">
                    {/* Bộ lọc nhanh (Optional) */}
                    <select className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5">
                        <option value="this_month">Tháng này</option>
                        <option value="last_month">Tháng trước</option>
                    </select>
                </div>
                
                <div className="flex gap-3 w-full md:w-auto">
                    <Button 
                        variant="danger" 
                        icon={<FiPlus />} 
                        onClick={() => handleOpenModal('expense')}
                        className="flex-1 md:flex-none"
                    >
                        Lập phiếu chi
                    </Button>
                    <Button 
                        variant="primary" 
                        icon={<FiPlus />} 
                        onClick={() => handleOpenModal('income')}
                        className="flex-1 md:flex-none"
                    >
                        Lập phiếu thu
                    </Button>
                </div>
            </div>

            {/* 4. Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Mã phiếu</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Ngày tạo</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Loại</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Đối tượng / Lý do</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Số tiền</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {isLoading ? (
                                <tr><td colSpan={6} className="text-center py-8">Đang tải dữ liệu...</td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-8 text-slate-500 italic">Chưa có giao dịch nào.</td></tr>
                            ) : (
                                transactions.map((t: any) => (
                                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-blue-600">{t.code}</td>
                                        <td className="px-6 py-4 text-slate-600">{new Date(t.date).toLocaleDateString('vi-VN')}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {t.type === 'income' ? 'Thu' : 'Chi'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-800">{t.partnerName || 'Khách lẻ'}</div>
                                            <div className="text-xs text-slate-500">{t.description}</div>
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold ${
                                            t.type === 'income' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium">Hoàn thành</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={transactionsData?.total || 0} itemsPerPage={10} />
            </div>

            {/* Modal Lập phiếu */}
            <CashFlowModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                type={transactionType}
            />
        </div>
    );
};

export default CashFlowPage;