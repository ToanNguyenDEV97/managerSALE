import React, { useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiCreditCard, FiLoader } from 'react-icons/fi';
import type { Customer } from '../types';
import CustomerModal from '../components/features/partners/CustomerModal';
import Pagination from '../components/common/Pagination';
import { useAppContext } from '../context/DataContext';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { useCustomers, useSaveCustomer, useDeleteCustomer } from '../hooks/useCustomers'; // Import Hook

const CustomersPage: React.FC = () => {
  // 1. Context chỉ dùng cho Modal state
  const { setPayingCustomerId } = useAppContext();
  
  // 2. React Query Hooks
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: customersData, isLoading } = useCustomers(page, searchTerm);
  const saveMutation = useSaveCustomer();
  const deleteMutation = useDeleteCustomer();

  // Chuẩn hóa dữ liệu từ API
  const customers = Array.isArray(customersData) ? customersData : (customersData?.data || []);
  const totalItems = Array.isArray(customersData) ? customers.length : (customersData?.total || 0);
  const totalPages = Array.isArray(customersData) ? 1 : (customersData?.totalPages || 1);

  // 3. Local State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const handleOpenModal = (customer: Customer | null) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleSave = async (customer: Customer) => {
    await saveMutation.mutateAsync(customer);
    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (customerToDelete) {
        await deleteMutation.mutateAsync(customerToDelete.id);
        setCustomerToDelete(null);
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
            placeholder="Tìm tên, SĐT..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 transition-all"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>
        <button onClick={() => handleOpenModal(null)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-md transition-all font-medium">
          <FiPlus /> Thêm Khách hàng
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {customers.length > 0 ? (
                customers.map((customer: any) => (
                <div key={customer.id} className="group relative bg-white dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-200">{customer.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                                <span>{customer.phone}</span>
                            </p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenModal(customer)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full" title="Sửa"><FiEdit /></button>
                            <button onClick={() => setCustomerToDelete(customer)} className="p-2 text-red-600 hover:bg-red-50 rounded-full" title="Xóa"><FiTrash2 /></button>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-600 flex justify-between items-center">
                        <div>
                            <p className="text-xs text-slate-500">Công nợ</p>
                            <p className={`font-bold ${customer.debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {customer.debt.toLocaleString()} đ
                            </p>
                        </div>
                        {customer.debt > 0 && (
                            <button 
                                onClick={() => setPayingCustomerId(customer.id)}
                                className="flex items-center gap-1 text-xs px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 font-medium"
                            >
                                <FiCreditCard /> Thanh toán
                            </button>
                        )}
                    </div>
                    <div className="mt-2 text-xs text-slate-400 truncate">{customer.address}</div>
                </div>
            ))) : (
                 <div className="col-span-full text-center py-10 text-slate-500">Không tìm thấy khách hàng nào.</div>
            )}
        </div>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} itemsPerPage={10} />
      </div>

      {isModalOpen && <CustomerModal customer={editingCustomer} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
      
      {customerToDelete && (
        <ConfirmationModal
            isOpen={!!customerToDelete}
            onClose={() => setCustomerToDelete(null)}
            onConfirm={handleConfirmDelete}
            title="Xác nhận Xóa Khách hàng"
        >
            Bạn có chắc chắn muốn xóa khách hàng "<strong>{customerToDelete.name}</strong>"? 
            <br/><span className="text-xs text-red-500">Lưu ý: Không thể xóa nếu khách đang có công nợ hoặc lịch sử mua hàng.</span>
        </ConfirmationModal>
      )}
    </div>
  );
};

export default CustomersPage;