import React, { useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiLoader } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
import Pagination from '../components/Pagination';
import ConfirmationModal from '../components/ConfirmationModal';
import SupplierModal from '../components/SupplierModal'; // Import Modal
// Chỉ import useSuppliers và useDeleteSupplier
import { useSuppliers, useDeleteSupplier } from '../hooks/useSuppliers';

const SuppliersPage: React.FC = () => {
    const { setEditingSupplier, editingSupplier } = useAppContext();
    const [page, setPage] = useState(1);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { data: suppliersData, isLoading } = useSuppliers(page, 10);
    const suppliers = suppliersData?.data || [];
    const totalPages = suppliersData?.totalPages || 1;
    const totalItems = suppliersData?.total || 0;

    const deleteMutation = useDeleteSupplier();

    const handleDelete = async () => {
        if (deleteId) {
            await deleteMutation.mutateAsync(deleteId);
            setDeleteId(null);
        }
    };

    if (isLoading) return <div className="flex justify-center p-10"><FiLoader className="animate-spin" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Nhà cung cấp</h2>
                <button 
                    onClick={() => setEditingSupplier('new')} 
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-md"
                >
                    <FiPlus /> Thêm mới
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tên NCC</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">SĐT</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Địa chỉ</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Công nợ</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {suppliers.length > 0 ? suppliers.map((s: any) => (
                                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{s.name}</td>
                                    <td className="px-6 py-4 text-slate-500">{s.phone}</td>
                                    <td className="px-6 py-4 text-slate-500 truncate max-w-xs">{s.address}</td>
                                    <td className={`px-6 py-4 text-right font-bold ${s.debt > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        {s.debt?.toLocaleString()} đ
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button onClick={() => setEditingSupplier(s)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg">
                                            <FiEdit />
                                        </button>
                                        <button onClick={() => setDeleteId(s.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg">
                                            <FiTrash2 />
                                        </button>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan={5} className="text-center py-10 text-slate-500">Chưa có nhà cung cấp nào.</td></tr>}
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
                    title="Xóa Nhà cung cấp"
                >
                    Bạn có chắc chắn muốn xóa?
                </ConfirmationModal>
            )}

            {/* Modal Thêm/Sửa */}
            {(editingSupplier === 'new' || editingSupplier?.id || (editingSupplier && 'id' in editingSupplier)) && (
                <SupplierModal 
                    isOpen={true} 
                    onClose={() => setEditingSupplier(null)} 
                />
            )}
        </div>
    );
};

export default SuppliersPage;