import React, { useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiLoader, FiSearch, FiTruck } from 'react-icons/fi';
import { useSuppliers, useDeleteSupplier } from '../hooks/useSuppliers';
import toast from 'react-hot-toast';

// Import Components chuẩn
import Pagination from '../components/common/Pagination';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { FormInput } from '../components/common/FormInput'; // Tận dụng UI Input
import SupplierModal from '../components/features/partners/SupplierModal'; // Đường dẫn đúng theo cấu trúc mới

// Định nghĩa kiểu dữ liệu (Nếu chưa có file types chung)
interface Supplier {
    _id: string; // Hoặc id tùy vào backend trả về
    id?: string;
    name: string;
    phone: string;
    address: string;
    debt?: number;
    email?: string;
    contactPerson?: string;
}

const SuppliersPage: React.FC = () => {
    // --- STATE QUẢN LÝ ---
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    
    // State cho Modal Thêm/Sửa
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | undefined>(undefined);

    // State cho Modal Xóa
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // --- HOOKS ---
    // Giả sử hook useSuppliers hỗ trợ tham số search
    const { data: suppliersData, isLoading, refetch } = useSuppliers(page, 10, searchTerm);
    
    const suppliers = suppliersData?.data || [];
    const totalPages = suppliersData?.totalPages || 1;
    const totalItems = suppliersData?.total || 0;

    const deleteMutation = useDeleteSupplier();

    // --- HANDLERS ---
    
    // Mở modal thêm mới
    const handleAdd = () => {
        setSelectedSupplier(undefined); // Reset data
        setIsModalOpen(true);
    };

    // Mở modal sửa
    const handleEdit = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsModalOpen(true);
    };

    // Xử lý xóa
    const handleDelete = async () => {
        if (deleteId) {
            try {
                await deleteMutation.mutateAsync(deleteId);
                toast.success('Đã xóa nhà cung cấp');
                setDeleteId(null);
                refetch(); // Tải lại danh sách
            } catch (error) {
                toast.error('Lỗi khi xóa nhà cung cấp');
            }
        }
    };

    // Callback khi modal thêm/sửa thành công
    const handleModalSuccess = () => {
        setIsModalOpen(false);
        refetch(); // Reload data
    };

    return (
        <div className="p-6 space-y-6 animate-fade-in">
            {/* --- HEADER & TOOLBAR --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FiTruck className="text-primary-600"/> Quản Lý Nhà Cung Cấp
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Theo dõi danh sách và công nợ nhà cung cấp</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {/* Ô tìm kiếm */}
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm tên, SĐT..." 
                            className="pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-64"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                    </div>

                    {/* Nút thêm mới */}
                    <button 
                        onClick={handleAdd} 
                        className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-primary-200 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <FiPlus size={20}/> Thêm Mới
                    </button>
                </div>
            </div>

            {/* --- TABLE CONTENT --- */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs">
                            <tr>
                                <th className="px-6 py-4">Tên Nhà Cung Cấp</th>
                                <th className="px-6 py-4">Liên Hệ</th>
                                <th className="px-6 py-4">Địa Chỉ</th>
                                <th className="px-6 py-4 text-right">Công Nợ</th>
                                <th className="px-6 py-4 text-center">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-slate-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <FiLoader className="animate-spin text-primary-600" size={24}/> Đang tải dữ liệu...
                                        </div>
                                    </td>
                                </tr>
                            ) : suppliers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-slate-500 italic">
                                        Không tìm thấy nhà cung cấp nào.
                                    </td>
                                </tr>
                            ) : (
                                suppliers.map((item: any) => (
                                    <tr key={item._id || item.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{item.name}</div>
                                            {item.contactPerson && <div className="text-xs text-slate-500">LH: {item.contactPerson}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-700 font-medium">{item.phone}</div>
                                            <div className="text-xs text-slate-400">{item.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 truncate max-w-xs" title={item.address}>
                                            {item.address || '---'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`font-bold ${(item.debt || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {(item.debt || 0).toLocaleString()} ₫
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleEdit(item)}
                                                    className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                    title="Chỉnh sửa"
                                                >
                                                    <FiEdit size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => setDeleteId(item._id || item.id)}
                                                    className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                    title="Xóa"
                                                >
                                                    <FiTrash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {!isLoading && suppliers.length > 0 && (
                    <Pagination 
                        currentPage={page} 
                        totalPages={totalPages} 
                        onPageChange={setPage} 
                        totalItems={totalItems}
                    />
                )}
            </div>

            {/* --- MODALS --- */}
            
            {/* Modal Thêm/Sửa */}
            {isModalOpen && (
                <SupplierModal 
                    supplier={selectedSupplier}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleModalSuccess}
                />
            )}

            {/* Modal Xóa */}
            {deleteId && (
                <ConfirmationModal 
                    isOpen={!!deleteId} 
                    onClose={() => setDeleteId(null)} 
                    onConfirm={handleDelete} 
                    title="Xóa Nhà Cung Cấp"
                    type="danger"
                >
                    <p>Bạn có chắc chắn muốn xóa nhà cung cấp này?</p>
                    <p className="text-sm text-slate-500 mt-2">Hành động này không thể hoàn tác và có thể ảnh hưởng đến lịch sử nhập hàng.</p>
                </ConfirmationModal>
            )}
        </div>
    );
};

export default SuppliersPage;