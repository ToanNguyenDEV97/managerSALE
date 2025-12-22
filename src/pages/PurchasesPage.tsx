import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiLoader } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
import Pagination from '../components/Pagination';
import ConfirmationModal from '../components/ConfirmationModal';
import PurchaseModal from '../components/PurchaseModal'; // Import Modal vỏ bọc
import { usePurchases, useDeletePurchase } from '../hooks/usePurchases';

const PurchasesPage: React.FC = () => {
    const { setEditingPurchase, editingPurchase } = useAppContext();
    const [page, setPage] = useState(1);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { data: purchasesData, isLoading } = usePurchases(page, 10);
    const purchases = purchasesData?.data || [];
    const totalPages = purchasesData?.totalPages || 1;
    const totalItems = purchasesData?.total || 0;

    const deleteMutation = useDeletePurchase();

    const handleDelete = async () => {
        if (deleteId) {
            await deleteMutation.mutateAsync(deleteId);
            setDeleteId(null);
        }
    };

    if (isLoading) return <div className="flex justify-center p-10"><FiLoader className="animate-spin" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Nhập hàng (Purchase)</h2>
                <button 
                    onClick={() => setEditingPurchase('new')} // Bấm nút này sẽ mở Modal
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-md"
                >
                    <FiPlus /> Nhập hàng mới
                </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mã PN</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nhà cung cấp</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ngày nhập</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Tổng tiền</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {purchases.length > 0 ? purchases.map((p: any) => (
                                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-6 py-4 font-medium text-primary-600">{p.purchaseNumber}</td>
                                    <td className="px-6 py-4 text-slate-800 dark:text-slate-200">
                                        {/* Hiển thị tên NCC hoặc ID nếu không có tên */}
                                        {p.supplierName || (p.supplierId ? 'NCC #' + p.supplierId.slice(-4) : 'Khách lẻ')}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">{p.issueDate}</td>
                                    <td className="px-6 py-4 text-right font-bold">{p.totalAmount?.toLocaleString()} đ</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => setDeleteId(p.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg" title="Xóa và Hoàn tác kho">
                                            <FiTrash2 />
                                        </button>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan={5} className="text-center py-10 text-slate-500">Chưa có phiếu nhập nào.</td></tr>}
                        </tbody>
                    </table>
                </div>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} itemsPerPage={10} />
            </div>

            {/* Modal Xóa */}
            {deleteId && (
                <ConfirmationModal 
                    isOpen={!!deleteId} 
                    onClose={() => setDeleteId(null)} 
                    onConfirm={handleDelete} 
                    title="Hủy phiếu nhập"
                >
                    Bạn có chắc chắn muốn xóa phiếu nhập này? <br/>
                    <span className="text-red-500 text-sm">Lưu ý: Tồn kho sản phẩm sẽ bị trừ đi và Công nợ NCC sẽ giảm xuống.</span>
                </ConfirmationModal>
            )}

            {/* --- MODAL NHẬP HÀNG --- */}
            {(editingPurchase === 'new') && (
                <PurchaseModal 
                    isOpen={true}
                    onClose={() => setEditingPurchase(null)}
                />
            )}
        </div>
    );
};

export default PurchasesPage;