import React, { useState } from 'react';
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiPhone, FiGlobe, FiTruck, FiMapPin } from 'react-icons/fi';
import { Button } from '../components/common/Button';
import Pagination from '../components/common/Pagination';
import ConfirmationModal from '../components/common/ConfirmationModal';
import SupplierModal from '../components/features/partners/SupplierModal';
import { useSuppliers, useDeleteSupplier } from '../hooks/useSuppliers';
import { useDebounce } from '../hooks/useDebounce'; // [1] Import Hook chống spam
import { toast } from 'react-hot-toast';

const SuppliersPage: React.FC = () => {
    // State quản lý trang và tìm kiếm
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    
    // [2] Tạo biến tìm kiếm "chậm" (đợi 0.5s sau khi gõ mới tìm)
    const debouncedSearch = useDebounce(searchTerm, 500);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<any>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // [3] Gọi Hook lấy dữ liệu (Sử dụng debouncedSearch thay vì searchTerm)
    const { data: suppliersData, isLoading } = useSuppliers(page, 10, debouncedSearch);
    
    const suppliers = suppliersData?.data || [];
    const totalPages = suppliersData?.totalPages || 1;
    const totalItems = suppliersData?.total || 0;

    const deleteMutation = useDeleteSupplier();

    // Handlers
    const handleAdd = () => {
        setEditingSupplier(null);
        setIsModalOpen(true);
    };

    const handleEdit = (supplier: any) => {
        setEditingSupplier(supplier);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (deleteId) {
            try {
                await deleteMutation.mutateAsync(deleteId);
                toast.success('Đã xóa nhà cung cấp');
                setDeleteId(null);
            } catch (error) {
                toast.error('Không thể xóa (Có thể đang có phiếu nhập liên quan)');
            }
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Nhà Cung Cấp</h2>
                    <p className="text-sm text-slate-500">Quản lý đối tác và công nợ phải trả</p>
                </div>
                
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm tên, SĐT, Mã số thuế..." 
                            className="w-full md:w-64 pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                    </div>
                    <Button icon={<FiPlus />} onClick={handleAdd}>
                        Thêm mới
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Nhà cung cấp</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Thông tin liên hệ</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Phân loại</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Nợ phải trả</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {isLoading ? (
                                <tr><td colSpan={5} className="text-center py-10">Đang tải dữ liệu...</td></tr>
                            ) : suppliers.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-10 text-slate-500 italic">Chưa có nhà cung cấp nào.</td></tr>
                            ) : (
                                suppliers.map((s: any) => (
                                    <tr key={s.id || Math.random()} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mr-3 border border-orange-100">
                                                    <FiTruck size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">{s.name}</div>
                                                    {s.taxCode ? (
                                                        <div className="text-xs text-slate-500 mt-0.5">MST: {s.taxCode}</div>
                                                    ) : (
                                                        <div className="text-xs text-slate-400 mt-0.5 flex items-center"><FiMapPin size={10} className="mr-1"/> {s.address || '---'}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col text-sm">
                                                <span className="flex items-center gap-2 text-slate-700">
                                                    <FiPhone size={14} className="text-slate-400"/> {s.phone || '---'}
                                                </span>
                                                {s.website && (
                                                    <a href={s.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-500 hover:underline mt-1">
                                                        <FiGlobe size={14}/> {s.website.replace(/^https?:\/\//, '')}
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                                                s.group === 'Chính hãng' 
                                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}>
                                                {s.group || 'Chính hãng'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`font-bold ${s.debt > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                                                {s.debt ? s.debt.toLocaleString() : '0'} đ
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleEdit(s)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Sửa thông tin"
                                                >
                                                    <FiEdit size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => setDeleteId(s.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Xóa nhà cung cấp"
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                <div className="border-t border-slate-200 bg-slate-50/50">
                    <Pagination 
                        currentPage={page} 
                        totalPages={totalPages} 
                        onPageChange={setPage} 
                        totalItems={totalItems} 
                        itemsPerPage={10} 
                    />
                </div>
            </div>

            {/* Modals */}
            <SupplierModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                editingSupplier={editingSupplier} 
            />

            <ConfirmationModal 
                isOpen={!!deleteId} 
                onClose={() => setDeleteId(null)} 
                onConfirm={handleDelete}
                title="Xóa Nhà Cung Cấp"
            >
                Bạn có chắc chắn muốn xóa đối tác này? 
                <p className="mt-2 text-sm text-red-500 bg-red-50 p-2 rounded border border-red-100">
                    ⚠️ Lưu ý: Nếu đã có lịch sử nhập hàng, hệ thống sẽ chặn việc xóa để bảo toàn dữ liệu kế toán.
                </p>
            </ConfirmationModal>
        </div>
    );
};

export default SuppliersPage;