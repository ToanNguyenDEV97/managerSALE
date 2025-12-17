import React, { useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiLoader } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
import Pagination from '../components/Pagination';
import ConfirmationModal from '../components/ConfirmationModal';
import { usePurchases, useDeletePurchase } from '../hooks/usePurchases'; // Import Hook

const PurchasesPage: React.FC = () => {
    const { setEditingPurchase } = useAppContext();
    const [page, setPage] = useState(1);
    const [purchaseToDelete, setPurchaseToDelete] = useState<any>(null);
    
    // Hooks
    const { data: purchasesData, isLoading } = usePurchases(page);
    const deleteMutation = useDeletePurchase();

    const purchases = Array.isArray(purchasesData) ? purchasesData : (purchasesData?.data || []);
    const totalPages = Array.isArray(purchasesData) ? 1 : (purchasesData?.totalPages || 1);
    const totalItems = Array.isArray(purchasesData) ? purchases.length : (purchasesData?.total || 0);

    const handleConfirmDelete = async () => {
        if (purchaseToDelete) {
            await deleteMutation.mutateAsync(purchaseToDelete.id);
            setPurchaseToDelete(null);
        }
    };

    if (isLoading) return <div className="flex justify-center p-10"><FiLoader className="animate-spin" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Nhập kho</h2>
                <button onClick={() => setEditingPurchase('new')} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-md">
                    <FiPlus /> Tạo phiếu nhập
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mã phiếu</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nhà cung cấp</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ngày nhập</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Tổng tiền</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {purchases.length > 0 ? purchases.map((purchase: any) => (
                                <tr key={purchase.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-6 py-4 font-medium text-primary-600">{purchase.purchaseNumber}</td>
                                    <td className="px-6 py-4 text-slate-800 dark:text-slate-200">{purchase.supplierName}</td>
                                    <td className="px-6 py-4 text-slate-500">{purchase.issueDate}</td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-slate-200">{purchase.totalAmount.toLocaleString()} đ</td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button onClick={() => setEditingPurchase(purchase)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><FiEdit /></button>
                                        <button onClick={() => setPurchaseToDelete(purchase)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg"><FiTrash2 /></button>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan={5} className="text-center py-10 text-slate-500">Chưa có phiếu nhập nào.</td></tr>}
                        </tbody>
                    </table>
                </div>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} itemsPerPage={10} />
            </div>
            
            {purchaseToDelete && (
                <ConfirmationModal 
                    isOpen={!!purchaseToDelete} 
                    onClose={() => setPurchaseToDelete(null)} 
                    onConfirm={handleConfirmDelete} 
                    title="Xóa phiếu nhập"
                >
                    Bạn có chắc chắn muốn xóa phiếu nhập <strong>{purchaseToDelete.purchaseNumber}</strong>?
                </ConfirmationModal>
            )}
        </div>
    );
};

export default PurchasesPage;