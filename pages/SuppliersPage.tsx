
import React, { useState, useMemo } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiCreditCard } from 'react-icons/fi';
import type { Supplier } from '../types';
import SupplierModal from '../components/SupplierModal';
import Pagination from '../components/Pagination';
import { useAppContext } from '../context/DataContext';
import ConfirmationModal from '../components/ConfirmationModal';

const SuppliersPage: React.FC = () => {
  const { suppliers, handleSaveSupplier, handleDeleteSupplier, handleDeleteSuppliers, setPayingSupplierId } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debtStatus, setDebtStatus] = useState('all'); // 'all', 'debt', 'no-debt'
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const handleOpenModal = (supplier: Supplier | null) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingSupplier(null);
    setIsModalOpen(false);
  };

  const onSave = async (supplier: Supplier) => {
    await handleSaveSupplier(supplier);
    handleCloseModal();
  };
  
  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
  };

  const handleConfirmDelete = async () => {
    if (supplierToDelete) {
        await handleDeleteSupplier(supplierToDelete.id);
        setSupplierToDelete(null);
    }
  };

  const filteredSuppliers = useMemo(() => suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone.includes(searchTerm);
    
    const matchesDebt = 
      debtStatus === 'all' ||
      (debtStatus === 'debt' && supplier.debt > 0) ||
      (debtStatus === 'no-debt' && supplier.debt === 0);

    return matchesSearch && matchesDebt;
  }), [suppliers, searchTerm, debtStatus]);

  const paginatedSuppliers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSuppliers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSuppliers, currentPage]);
  
  const totalPages = Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedSuppliers.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    if (e.target.checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const isAllSelected = paginatedSuppliers.length > 0 && selectedIds.length === paginatedSuppliers.length;
  
  const handleBulkDelete = async () => {
    await handleDeleteSuppliers(selectedIds);
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="hidden lg:block">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-200">Quản lý Nhà cung cấp</h1>
          <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400 mt-1">Theo dõi thông tin và công nợ phải trả.</p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="flex items-center justify-center w-full md:w-auto px-4 py-2 text-white rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-px"
        >
          <FiPlus />
          <span className="ml-2 font-medium">Thêm Nhà cung cấp</span>
        </button>
      </div>
      
       <div className="flex flex-col md:flex-row justify-between items-center gap-4">
         <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Tìm theo tên hoặc SĐT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg shadow-sm py-2 px-3 pl-10 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 sm:text-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-slate-400" />
              </div>
            </div>
            <select
              value={debtStatus}
              onChange={(e) => setDebtStatus(e.target.value)}
              className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">Tất cả công nợ</option>
              <option value="debt">Nhà cung cấp có nợ</option>
              <option value="no-debt">Nhà cung cấp không nợ</option>
            </select>
        </div>
        {selectedIds.length > 0 && (
            <button
                onClick={handleBulkDelete}
                className="flex items-center px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md transition-colors"
            >
                <FiTrash2 className="w-5 h-5" />
                <span className="ml-2 font-medium">Xóa ({selectedIds.length})</span>
            </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Table View */}
        <div className="overflow-x-auto hidden lg:block">
          <table className="min-w-full">
            <thead className="bg-primary-50 dark:bg-slate-700">
              <tr>
                <th scope="col" className="px-6 py-3">
                    <input type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 dark:border-slate-500 text-primary-600 focus:ring-primary-500 bg-white dark:bg-slate-600"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                    />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Tên nhà cung cấp</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Công nợ</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Số điện thoại</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Mã số thuế</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Hành động</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800">
              {paginatedSuppliers.length > 0 ? (
                paginatedSuppliers.map((supplier) => (
                  <tr key={supplier.id} className={`border-b border-slate-200 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200 ${selectedIds.includes(supplier.id) ? 'bg-primary-50 dark:bg-primary-500/10' : ''}`}>
                    <td className="px-6 py-4">
                      <input type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-500 text-primary-600 focus:ring-primary-500 bg-white dark:bg-slate-600"
                        checked={selectedIds.includes(supplier.id)}
                        onChange={(e) => handleSelectOne(e, supplier.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">{supplier.name}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${supplier.debt > 0 ? 'text-red-600' : 'text-slate-500 dark:text-slate-400'}`}>
                      {supplier.debt.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{supplier.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{supplier.taxCode || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {supplier.debt > 0 && (
                        <button onClick={() => setPayingSupplierId(supplier.id)} className="text-green-600 hover:text-green-800 inline-flex items-center gap-1 transition-transform hover:scale-110 p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-500/20" title="Thanh toán nợ">
                          <FiCreditCard className="h-5 w-5"/>
                        </button>
                       )}
                      <button onClick={() => handleOpenModal(supplier)} className="text-primary-600 hover:text-primary-800 transition-transform hover:scale-110 p-1 rounded-full hover:bg-primary-100 dark:hover:bg-primary-500/20" title="Sửa">
                        <FiEdit className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleDeleteClick(supplier)} className="text-red-500 hover:text-red-700 transition-transform hover:scale-110 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20" title="Xóa">
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500 dark:text-slate-400">
                    Không tìm thấy nhà cung cấp nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Card View */}
        <div className="lg:hidden">
            {paginatedSuppliers.length > 0 ? paginatedSuppliers.map(supplier => (
                <div key={supplier.id} className={`p-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0 ${selectedIds.includes(supplier.id) ? 'bg-primary-50 dark:bg-primary-500/10' : 'bg-white dark:bg-slate-800'}`}>
                    <div className="flex justify-between items-start">
                         <div className="flex items-start gap-3">
                           <input type="checkbox"
                              className="h-4 w-4 rounded border-slate-300 dark:border-slate-500 text-primary-600 focus:ring-primary-500 mt-1 bg-white dark:bg-slate-600"
                              checked={selectedIds.includes(supplier.id)}
                              onChange={(e) => handleSelectOne(e, supplier.id)}
                            />
                            <div>
                               <p className="font-semibold text-slate-800 dark:text-slate-200">{supplier.name}</p>
                               <p className="text-sm text-slate-500 dark:text-slate-400">{supplier.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-1">
                             {supplier.debt > 0 && (
                                <button onClick={() => setPayingSupplierId(supplier.id)} className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-500/20" title="Thanh toán nợ">
                                  <FiCreditCard className="h-5 w-5"/>
                                </button>
                             )}
                             <button onClick={() => handleOpenModal(supplier)} className="text-primary-600 hover:text-primary-800 p-1 rounded-full hover:bg-primary-100 dark:hover:bg-primary-500/20" title="Sửa">
                                <FiEdit className="h-5 w-5" />
                            </button>
                            <button onClick={() => handleDeleteClick(supplier)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20" title="Xóa">
                                <FiTrash2 className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    <div className="mt-2 pl-7 space-y-1 text-sm">
                        <p>
                            <span className="text-slate-500 dark:text-slate-400">Công nợ: </span>
                             <span className={`font-medium ${supplier.debt > 0 ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>{supplier.debt.toLocaleString('vi-VN')} đ</span>
                        </p>
                         <p>
                            <span className="text-slate-500 dark:text-slate-400">MST: </span>
                            <span className="text-slate-700 dark:text-slate-300">{supplier.taxCode || '—'}</span>
                        </p>
                    </div>
                </div>
            )) : (
                 <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                    Không tìm thấy nhà cung cấp nào.
                  </div>
            )}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filteredSuppliers.length} itemsPerPage={ITEMS_PER_PAGE} />
      </div>

      {isModalOpen && (
        <SupplierModal
          supplier={editingSupplier}
          onClose={handleCloseModal}
          onSave={onSave}
        />
      )}
      
      {supplierToDelete && (
        <ConfirmationModal
            isOpen={!!supplierToDelete}
            onClose={() => setSupplierToDelete(null)}
            onConfirm={handleConfirmDelete}
            title="Xác nhận Xóa Nhà cung cấp"
        >
            Bạn có chắc chắn muốn xóa nhà cung cấp "<strong>{supplierToDelete.name}</strong>"?
            Hành động này không thể hoàn tác.
        </ConfirmationModal>
      )}

    </div>
  );
};

export default SuppliersPage;
