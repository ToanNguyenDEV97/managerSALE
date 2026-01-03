import React, { useState } from 'react';
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiPhone, FiMapPin } from 'react-icons/fi';
import { Button } from '../components/common/Button';
import Pagination from '../components/common/Pagination';
import ConfirmationModal from '../components/common/ConfirmationModal';
import CustomerModal from '../components/features/partners/CustomerModal';
import { useCustomers, useDeleteCustomer } from '../hooks/useCustomers';
import { useDebounce } from '../hooks/useDebounce'; // [1] Import hook mới
import { toast } from 'react-hot-toast';

const CustomersPage: React.FC = () => {
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    
    // [2] Tạo biến search đã được debounce (chờ 500ms)
    const debouncedSearch = useDebounce(searchTerm, 500);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<any>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // [3] Truyền debouncedSearch vào hook thay vì searchTerm gốc
    const { data: customersData, isLoading } = useCustomers(page, 10, debouncedSearch);
    
    const customers = customersData?.data || [];
    const totalPages = customersData?.totalPages || 1;
    const totalItems = customersData?.total || 0;

    const deleteMutation = useDeleteCustomer();

    // ... (Giữ nguyên các hàm handleAdd, handleEdit, handleDelete, getAvatarChar)
    const handleAdd = () => { setEditingCustomer(null); setIsModalOpen(true); };
    const handleEdit = (c: any) => { setEditingCustomer(c); setIsModalOpen(true); };
    const handleDelete = async () => {
        if (deleteId) {
            try {
                await deleteMutation.mutateAsync(deleteId);
                toast.success('Đã xóa khách hàng');
                setDeleteId(null);
            } catch (error) { toast.error('Lỗi khi xóa'); }
        }
    };
    const getAvatarChar = (name: string) => (name || '?').charAt(0).toUpperCase();

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Khách hàng</h2>
                    <p className="text-sm text-slate-500">Quản lý danh sách và công nợ</p>
                </div>
                
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm tên hoặc SĐT..." 
                            className="w-full md:w-64 pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                    </div>
                    <Button icon={<FiPlus />} onClick={handleAdd}>Thêm mới</Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Khách hàng</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Liên hệ</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Nhóm</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Công nợ</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {isLoading ? (
                                <tr><td colSpan={5} className="text-center py-10">Đang tải dữ liệu...</td></tr>
                            ) : customers.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-10 text-slate-500 italic">Chưa có khách hàng nào.</td></tr>
                            ) : (
                                customers.map((c: any) => (
                                    <tr key={c.id || Math.random()} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-sm mr-3">
                                                    {getAvatarChar(c.name)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">{c.name}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                        <FiMapPin size={10} /> {c.address || '---'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-slate-700 flex items-center gap-2">
                                                    <FiPhone className="text-slate-400" size={14} /> {c.phone || '---'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                {c.group || 'Khách lẻ'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`font-bold ${c.debt > 0 ? 'text-danger-600' : 'text-slate-600'}`}>
                                                {c.debt ? c.debt.toLocaleString() : '0'} đ
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><FiEdit size={16} /></button>
                                                <button onClick={() => setDeleteId(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><FiTrash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="border-t border-slate-200 bg-slate-50/50">
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} itemsPerPage={10} />
                </div>
            </div>

            <CustomerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} editingCustomer={editingCustomer} />
            <ConfirmationModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Xóa khách hàng?">
                Bạn có chắc chắn muốn xóa khách hàng này?
            </ConfirmationModal>
        </div>
    );
};

export default CustomersPage;