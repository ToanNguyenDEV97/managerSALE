import React, { useState, useMemo } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiCreditCard, FiSearch } from 'react-icons/fi';
import type { Customer, PageKey } from '../types';
import CustomerModal from '../components/CustomerModal';
import Pagination from '../components/Pagination';
import { useAppContext } from '../context/DataContext';
import ColumnToggler from '../components/ColumnToggler';
import ConfirmationModal from '../components/ConfirmationModal'; // Import Modal xác nhận
import toast from 'react-hot-toast'; // Import Toast

const customerColumns: Record<string, string> = {
    name: 'Tên khách hàng',
    debt: 'Công nợ',
    phone: 'Số điện thoại',
    address: 'Địa chỉ',
};

const CustomersPage: React.FC = () => {
  const { customers, handleSaveCustomer, handleDeleteCustomer, setPayingCustomerId, handleDeleteCustomers, columnVisibility, handleColumnVisibilityChange } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debtStatus, setDebtStatus] = useState('all'); 
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  // State mới để quản lý việc xóa
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null); 
  
  const ITEMS_PER_PAGE = 10;
  const pageKey: PageKey = 'customers';

  const handleOpenModal = (customer: Customer | null) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingCustomer(null);
    setIsModalOpen(false);
  };

  const onSave = async (customer: Customer) => {
    try {
        await handleSaveCustomer(customer);
        toast.success(customer.id ? 'Cập nhật thành công!' : 'Thêm mới thành công!'); // Thông báo đẹp
        handleCloseModal();
    } catch (error: any) {
        toast.error(error.message || 'Có lỗi xảy ra khi lưu.');
    }
  };

  // Hàm này chỉ mở Modal xác nhận, chưa xóa ngay
  const handleDeleteClick = (customerId: string) => {
      setCustomerToDelete(customerId);
  };

  // Hàm này mới thực sự xóa (được gọi khi bấm "Xác nhận" trên Modal)
  const handleConfirmDelete = async () => {
    if (customerToDelete) {
        try {
            await handleDeleteCustomer(customerToDelete);
            toast.success('Đã xóa khách hàng thành công.');
        } catch (error: any) {
            toast.error(error.message || "Không thể xóa khách hàng này.");
        } finally {
            setCustomerToDelete(null); // Đóng modal
        }
    }
  };

  const filteredCustomers = useMemo(() => customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm);
    
    const matchesDebt = 
      debtStatus === 'all' ||
      (debtStatus === 'debt' && customer.debt > 0) ||
      (debtStatus === 'no-debt' && customer.debt === 0);

    return matchesSearch && matchesDebt;
  }), [customers, searchTerm, debtStatus]);

  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCustomers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCustomers, currentPage]);
  
  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedCustomers.map(p => p.id));
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

  const isAllSelected = paginatedCustomers.length > 0 && selectedIds.length === paginatedCustomers.length;
  
  const handleBulkDelete = async () => {
    if (window.confirm(`Bạn có chắc muốn xóa ${selectedIds.length} khách hàng đã chọn?`)) {
        try {
            await handleDeleteCustomers(selectedIds);
            toast.success(`Đã xóa ${selectedIds.length} khách hàng.`);
            setSelectedIds([]);
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi xóa nhiều khách hàng.');
        }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="hidden lg:block">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-200">Quản lý Khách hàng</h1>
          <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400 mt-1">Theo dõi thông tin và công nợ của khách hàng.</p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="flex items-center justify-center w-full md:w-auto px-4 py-2 text-white rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-px"
        >
          <FiPlus />
          <span className="ml-2 font-medium">Thêm Khách hàng</span>
        </button>
      </div>
      
      {/* Filters */}
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
              <option value="debt">Khách có nợ</option>
              <option value="no-debt">Khách không nợ</option>
            </select>
            <ColumnToggler 
                pageKey={pageKey}
                columns={customerColumns} 
                visibility={columnVisibility[pageKey]} 
                onToggle={handleColumnVisibilityChange} 
            />
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
                {columnVisibility.customers.name && <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Tên khách hàng</th>}
                {columnVisibility.customers.debt && <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Công nợ</th>}
                {columnVisibility.customers.phone && <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Số điện thoại</th>}
                {columnVisibility.customers.address && <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Địa chỉ</th>}
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Hành động</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800">
              {paginatedCustomers.length > 0 ? (
                paginatedCustomers.map((customer) => (
                  <tr key={customer.id} className={`border-b border-slate-200 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200 ${selectedIds.includes(customer.id) ? 'bg-primary-50 dark:bg-primary-500/10' : ''}`}>
                    <td className="px-6 py-4">
                      <input type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-500 text-primary-600 focus:ring-primary-500 bg-white dark:bg-slate-600"
                        checked={selectedIds.includes(customer.id)}
                        onChange={(e) => handleSelectOne(e, customer.id)}
                      />
                    </td>
                    {columnVisibility.customers.name && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">{customer.name}</td>}
                    {columnVisibility.customers.debt && <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${customer.debt > 0 ? 'text-red-600' : 'text-slate-500 dark:text-slate-400'}`}>
                      {customer.debt.toLocaleString('vi-VN')} đ
                    </td>}
                    {columnVisibility.customers.phone && <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{customer.phone}</td>}
                    {columnVisibility.customers.address && <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate">{customer.address}</td>}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                       {customer.debt > 0 && (
                        <button onClick={() => setPayingCustomerId(customer.id)} className="text-green-600 hover:text-green-800 inline-flex items-center gap-1 transition-transform hover:scale-110 p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-500/20" title="Thanh toán">
                          <FiCreditCard className="h-5 w-5"/>
                        </button>
                       )}
                      <button onClick={() => handleOpenModal(customer)} className="text-primary-600 hover:text-primary-800 transition-transform hover:scale-110 p-1 rounded-full hover:bg-primary-100 dark:hover:bg-primary-500/20" title="Sửa">
                        <FiEdit className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleDeleteClick(customer.id)} className="text-red-500 hover:text-red-700 transition-transform hover:scale-110 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20" title="Xóa">
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={Object.values(columnVisibility.customers).filter(Boolean).length + 2} className="text-center py-10 text-slate-500 dark:text-slate-400">
                    Không tìm thấy khách hàng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Card View (Mobile) */}
        <div className="lg:hidden">
            {paginatedCustomers.length > 0 ? paginatedCustomers.map(customer => (
                <div key={customer.id} className={`p-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0 ${selectedIds.includes(customer.id) ? 'bg-primary-50 dark:bg-primary-500/10' : 'bg-white dark:bg-slate-800'}`}>
                    <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                           <input type="checkbox"
                              className="h-4 w-4 rounded border-slate-300 dark:border-slate-500 text-primary-600 focus:ring-primary-500 mt-1 bg-white dark:bg-slate-600"
                              checked={selectedIds.includes(customer.id)}
                              onChange={(e) => handleSelectOne(e, customer.id)}
                            />
                            <div>
                               <p className="font-semibold text-slate-800 dark:text-slate-200">{customer.name}</p>
                               <p className="text-sm text-slate-500 dark:text-slate-400">{customer.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {customer.debt > 0 && (
                            <button onClick={() => setPayingCustomerId(customer.id)} className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-500/20" title="Thanh toán">
                              <FiCreditCard className="h-5 w-5"/>
                            </button>
                           )}
                           <button onClick={() => handleOpenModal(customer)} className="text-primary-600 hover:text-primary-800 p-1 rounded-full hover:bg-primary-100 dark:hover:bg-primary-500/20" title="Sửa">
                               <FiEdit className="h-5 w-5" />
                           </button>
                           <button onClick={() => handleDeleteClick(customer.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20" title="Xóa">
                               <FiTrash2 className="h-5 w-5" />
                           </button>
                        </div>
                    </div>
                    <div className="mt-2 pl-7">
                        <p className="text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Công nợ: </span>
                            <span className={`font-medium ${customer.debt > 0 ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>
                                {customer.debt.toLocaleString('vi-VN')} đ
                            </span>
                        </p>
                         <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{customer.address}</p>
                    </div>
                </div>
            )) : (
                 <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                    Không tìm thấy khách hàng nào.
                  </div>
            )}
        </div>
        
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filteredCustomers.length} itemsPerPage={ITEMS_PER_PAGE} />
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <CustomerModal
          customer={editingCustomer}
          onClose={handleCloseModal}
          onSave={onSave}
        />
      )}

      {/* Modal Xác nhận Xóa (Thay thế window.confirm) */}
      {customerToDelete && (
        <ConfirmationModal
            isOpen={!!customerToDelete}
            onClose={() => setCustomerToDelete(null)}
            onConfirm={handleConfirmDelete}
            title="Xác nhận Xóa Khách hàng"
        >
            Bạn có chắc chắn muốn xóa khách hàng này không? 
            Hệ thống sẽ kiểm tra ràng buộc (công nợ, hóa đơn) trước khi xóa.
        </ConfirmationModal>
      )}

    </div>
  );
};

export default CustomersPage;