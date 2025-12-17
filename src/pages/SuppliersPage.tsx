import React, { useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiTruck, FiLoader } from 'react-icons/fi';
import type { Supplier } from '../types';
import SupplierModal from '../components/SupplierModal';
import Pagination from '../components/Pagination';
import { useAppContext } from '../context/DataContext';
import ConfirmationModal from '../components/ConfirmationModal';
import { useSuppliers, useSaveSupplier, useDeleteSupplier } from '../hooks/useSuppliers'; // Import Hook mới

const SuppliersPage: React.FC = () => {
  const { setPayingSupplierId } = useAppContext();
  
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Hooks
  const { data: suppliersData, isLoading } = useSuppliers(page, searchTerm);
  const saveMutation = useSaveSupplier();
  const deleteMutation = useDeleteSupplier();

  const suppliers = Array.isArray(suppliersData) ? suppliersData : (suppliersData?.data || []);
  const totalPages = Array.isArray(suppliersData) ? 1 : (suppliersData?.totalPages || 1);
  const totalItems = Array.isArray(suppliersData) ? suppliers.length : (suppliersData?.total || 0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  const handleOpenModal = (supplier: Supplier | null) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleSave = async (supplier: Supplier) => {
    await saveMutation.mutateAsync(supplier);
    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (supplierToDelete) {
        await deleteMutation.mutateAsync(supplierToDelete.id);
        setSupplierToDelete(null);
    }
  };

  if (isLoading) return <div className="flex justify-center p-10"><FiLoader className="animate-spin text-primary-600 w-8 h-8" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="relative w-full sm:w-96">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm nhà cung cấp..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 transition-all"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>
        <button onClick={() => handleOpenModal(null)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-md transition-all font-medium">
          <FiPlus /> Thêm NCC
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tên NCC</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Liên hệ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Địa chỉ</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Nợ phải trả</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Hành động</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {suppliers.length > 0 ? suppliers.map((s: any) => (
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <td className="px-6 py-4">
                                <div className="font-medium text-slate-900 dark:text-white">{s.name}</div>
                                <div className="text-xs text-slate-500">{s.taxCode ? `MST: ${s.taxCode}` : ''}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{s.phone}</td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 truncate max-w-xs">{s.address}</td>
                            <td className="px-6 py-4 text-right">
                                <span className={`font-bold ${s.debt > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                                    {s.debt.toLocaleString()} đ
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                {s.debt > 0 && (
                                    <button onClick={() => setPayingSupplierId(s.id)} className="p-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg" title="Thanh toán nợ">
                                        <FiTruck />
                                    </button>
                                )}
                                <button onClick={() => handleOpenModal(s)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg" title="Sửa"><FiEdit /></button>
                                <button onClick={() => setSupplierToDelete(s)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg" title="Xóa"><FiTrash2 /></button>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan={5} className="text-center py-10 text-slate-500">Không tìm thấy dữ liệu.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} itemsPerPage={10} />
      </div>

      {isModalOpen && <SupplierModal supplier={editingSupplier} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
      
      {supplierToDelete && (
        <ConfirmationModal
            isOpen={!!supplierToDelete}
            onClose={() => setSupplierToDelete(null)}
            onConfirm={handleConfirmDelete}
            title="Xác nhận Xóa NCC"
        >
            Bạn có chắc chắn muốn xóa nhà cung cấp "<strong>{supplierToDelete.name}</strong>"?
        </ConfirmationModal>
      )}
    </div>
  );
};

export default SuppliersPage;