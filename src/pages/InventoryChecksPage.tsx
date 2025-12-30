import React, { useState } from 'react';
import { FiPlus, FiEye, FiTrash2, FiEdit, FiLoader, FiCheckSquare } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
import Pagination from '../components/common/Pagination';
import ConfirmationModal from '../components/common/ConfirmationModal';
import InventoryCheckDetailsModal from '../components/InventoryCheckDetailsModal';
import { useInventoryChecks, useDeleteInventoryCheck } from '../hooks/useInventoryChecks'; // Import Hook

const InventoryChecksPage: React.FC = () => {
    const { setEditingInventoryCheck } = useAppContext();
    const [page, setPage] = useState(1);
    const [checkToDelete, setCheckToDelete] = useState<any>(null);
    const [viewingCheck, setViewingCheck] = useState<any>(null);
    
    const { data: checksData, isLoading } = useInventoryChecks(page);
    const deleteMutation = useDeleteInventoryCheck();

    const inventoryChecks = Array.isArray(checksData) ? checksData : (checksData?.data || []);
    const totalPages = Array.isArray(checksData) ? 1 : (checksData?.totalPages || 1);
    const totalItems = Array.isArray(checksData) ? inventoryChecks.length : (checksData?.total || 0);

    const handleConfirmDelete = async () => {
        if (checkToDelete) {
            await deleteMutation.mutateAsync(checkToDelete.id);
            setCheckToDelete(null);
        }
    };

    if (isLoading) return <div className="flex justify-center p-10"><FiLoader className="animate-spin" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FiCheckSquare className="text-primary-600"/> Kiểm kho
                </h2>
                <button onClick={() => setEditingInventoryCheck('new')} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-md">
                    <FiPlus /> Tạo phiếu kiểm
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mã phiếu</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ngày kiểm</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Trạng thái</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {inventoryChecks.length > 0 ? inventoryChecks.map((check: any) => (
                                <tr key={check.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-6 py-4 font-medium text-primary-600">{check.checkNumber}</td>
                                    <td className="px-6 py-4 text-slate-500">{check.checkDate}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${check.status === 'Hoàn thành' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {check.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button onClick={() => setViewingCheck(check)} className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg"><FiEye /></button>
                                        {check.status === 'Nháp' && (
                                            <>
                                                <button onClick={() => setEditingInventoryCheck(check)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><FiEdit /></button>
                                                <button onClick={() => setCheckToDelete(check)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg"><FiTrash2 /></button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            )) : <tr><td colSpan={4} className="text-center py-10 text-slate-500">Chưa có phiếu kiểm kho nào.</td></tr>}
                        </tbody>
                    </table>
                </div>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} itemsPerPage={10} />
            </div>
            
            {checkToDelete && (
                <ConfirmationModal 
                    isOpen={!!checkToDelete} 
                    onClose={() => setCheckToDelete(null)} 
                    onConfirm={handleConfirmDelete} 
                    title="Xóa phiếu kiểm kho"
                >
                    Bạn có chắc chắn muốn xóa phiếu nháp <strong>{checkToDelete.checkNumber}</strong>?
                </ConfirmationModal>
            )}

            {viewingCheck && (
                <InventoryCheckDetailsModal check={viewingCheck} onClose={() => setViewingCheck(null)} />
            )}
        </div>
    );
};

export default InventoryChecksPage;