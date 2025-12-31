import React, { useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiLoader, FiSearch, FiList, FiClock } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
import Pagination from '../components/common/Pagination';
import ConfirmationModal from '../components/common/ConfirmationModal';

// --- IMPORTS CÁC MODAL ---
import ProductModal from '../components/features/inventory/ProductModal';
import CategoryManagerModal from '../components/features/inventory/CategoryManagementModal';
import StockHistoryModal from '../components/features/inventory/StockHistoryModal'; // <--- Modal Thẻ kho mới

// --- IMPORTS HOOKS ---
import { useProducts, useDeleteProduct } from '../hooks/useProducts';

const ProductsPage: React.FC = () => {
    const { setEditingProduct, editingProduct } = useAppContext();
    
    // --- STATE ---
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    
    // State đóng mở các Modal phụ
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [historyProduct, setHistoryProduct] = useState<any>(null); // <--- State lưu SP đang xem thẻ kho

    // --- LẤY DỮ LIỆU ---
    const { data: productsData, isLoading } = useProducts(page, 10, searchTerm);
    const products = productsData?.data || [];
    const totalPages = productsData?.totalPages || 1;
    const totalItems = productsData?.total || 0;

    const deleteMutation = useDeleteProduct();

    // --- XỬ LÝ ---
    const handleDelete = async () => {
        if (deleteId) {
            await deleteMutation.mutateAsync(deleteId);
            setDeleteId(null);
        }
    };

    if (isLoading) return <div className="flex justify-center p-10"><FiLoader className="animate-spin text-primary-600 text-2xl" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 1. HEADER & TOOLBAR */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Danh sách Sản phẩm</h2>
                
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    {/* Ô tìm kiếm */}
                    <div className="relative flex-1 md:w-64">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm tên hoặc mã SKU..." 
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                    </div>
                    
                    {/* Các nút chức năng */}
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 font-medium shadow-sm whitespace-nowrap transition-colors"
                        >
                            <FiList /> Danh mục
                        </button>

                        <button 
                            onClick={() => setEditingProduct('new')} 
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-md whitespace-nowrap transition-colors"
                        >
                            <FiPlus /> Thêm mới
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. BẢNG DANH SÁCH */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Mã SKU</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tên sản phẩm</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Danh mục</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Giá bán</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Tồn kho</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {products.length > 0 ? products.map((p: any) => (
                                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{p.sku}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-primary-600 dark:text-primary-400">{p.name}</div>
                                        <div className="text-xs text-slate-400">{p.unit}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs border border-slate-200 dark:border-slate-600">
                                            {p.category || 'Chưa phân loại'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                        {p.price?.toLocaleString()} đ
                                    </td>
                                    <td className={`px-6 py-4 text-right font-bold whitespace-nowrap ${p.stock <= 5 ? 'text-red-500' : 'text-green-600'}`}>
                                        {p.stock}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {/* NÚT XEM THẺ KHO (MỚI) */}
                                            <button 
                                                onClick={() => setHistoryProduct(p)} 
                                                className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                                                title="Xem lịch sử nhập xuất (Thẻ kho)"
                                            >
                                                <FiClock size={18} />
                                            </button>

                                            {/* Nút Sửa */}
                                            <button 
                                                onClick={() => setEditingProduct(p)} 
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                title="Sửa thông tin"
                                            >
                                                <FiEdit size={18} />
                                            </button>

                                            {/* Nút Xóa */}
                                            <button 
                                                onClick={() => setDeleteId(p.id)} 
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                title="Xóa sản phẩm"
                                            >
                                                <FiTrash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6} className="text-center py-10 text-slate-500 italic">Không tìm thấy sản phẩm nào.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Phân trang */}
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} itemsPerPage={10} />
            </div>

            {/* --- CÁC MODAL --- */}

            {/* 1. Modal Xác nhận xóa */}
            {deleteId && (
                <ConfirmationModal 
                    isOpen={!!deleteId} 
                    onClose={() => setDeleteId(null)} 
                    onConfirm={handleDelete} 
                    title="Xóa sản phẩm"
                >
                    Bạn có chắc chắn muốn xóa sản phẩm này? <br/>
                    <span className="text-red-500 text-sm italic">Lưu ý: Không thể xóa nếu sản phẩm đã có lịch sử giao dịch.</span>
                </ConfirmationModal>
            )}

            {/* 2. Modal Thêm/Sửa Sản phẩm */}
            {(editingProduct === 'new' || editingProduct?.id || (editingProduct && 'id' in editingProduct)) && (
                <ProductModal isOpen={true} onClose={() => setEditingProduct(null)} />
            )}

            {/* 3. Modal Quản lý Danh mục */}
            <CategoryManagerModal 
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
            />

            {/* 4. Modal Thẻ Kho (MỚI) */}
            {historyProduct && (
                <StockHistoryModal 
                    isOpen={true} 
                    onClose={() => setHistoryProduct(null)} 
                    product={historyProduct} 
                />
            )}
        </div>
    );
};

export default ProductsPage;