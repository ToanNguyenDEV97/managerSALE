import React, { useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiFilter, FiLoader, FiBox, FiSettings } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
import Pagination from '../components/Pagination';
import ConfirmationModal from '../components/ConfirmationModal';
import ProductForm from '../components/ProductForm'; // Import Form
import CategoryManager from '../components/CategoryManager'; // Import Quản lý danh mục
import { useProducts, useDeleteProduct, useCategories } from '../hooks/useProducts';

const ProductsPage: React.FC = () => {
    const { setEditingProduct, editingProduct } = useAppContext();
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [productToDelete, setProductToDelete] = useState<any>(null);
    const [showCategoryManager, setShowCategoryManager] = useState(false); // State bật Modal Danh mục

    // Hooks
    const { data: productsData, isLoading } = useProducts(page, searchTerm, categoryFilter);
    const { data: categoriesData } = useCategories();
    const deleteMutation = useDeleteProduct();

    // Xử lý data
    const products = Array.isArray(productsData) ? productsData : (productsData?.data || []);
    const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data || []);
    const totalPages = productsData?.totalPages || 1;
    const totalItems = productsData?.total || 0;

    const handleConfirmDelete = async () => {
        if (productToDelete) {
            await deleteMutation.mutateAsync(productToDelete.id);
            setProductToDelete(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FiBox className="text-primary-600"/> Sản phẩm
                </h2>
                
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    {/* Tìm kiếm */}
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" placeholder="Tìm tên, SKU..." 
                            className="pl-10 pr-4 py-2 border rounded-lg w-full sm:w-64 dark:bg-slate-700 dark:text-white"
                            value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }} 
                        />
                    </div>

                    {/* Lọc danh mục */}
                    <div className="relative">
                         <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                         <select 
                            className="pl-10 pr-8 py-2 border rounded-lg dark:bg-slate-700 dark:text-white appearance-none"
                            value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
                        >
                            <option value="all">Tất cả danh mục</option>
                            {categories.map((cat: any) => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                        </select>
                    </div>
                    
                    {/* Nút Quản lý Danh mục (Mở Modal) */}
                    <button 
                        onClick={() => setShowCategoryManager(true)}
                        className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 dark:bg-slate-700 dark:text-white border border-slate-300 dark:border-slate-600"
                        title="Quản lý danh mục"
                    >
                        <FiSettings />
                    </button>

                    {/* Nút Thêm mới */}
                    <button 
                        onClick={() => setEditingProduct('new')} 
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-md"
                    >
                        <FiPlus /> Thêm mới
                    </button>
                </div>
            </div>

            {/* Bảng Dữ liệu */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {isLoading ? <div className="p-10 text-center"><FiLoader className="animate-spin inline text-primary-600 w-8 h-8"/></div> : (
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Sản phẩm</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Danh mục</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Giá bán</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Tồn kho</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {products.length > 0 ? products.map((product: any) => (
                                <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium dark:text-white">{product.name}</div>
                                        <div className="text-xs text-slate-500">{product.sku}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                            {product.category || '---'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-primary-600">
                                        {product.price?.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold">
                                        {product.stock}
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button onClick={() => setEditingProduct(product)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><FiEdit /></button>
                                        <button onClick={() => setProductToDelete(product)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg"><FiTrash2 /></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Chưa có sản phẩm nào.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
                {!isLoading && products.length > 0 && (
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} itemsPerPage={10} />
                )}
            </div>

            {/* MODALS */}
            {productToDelete && (
                <ConfirmationModal 
                    isOpen={!!productToDelete} onClose={() => setProductToDelete(null)} 
                    onConfirm={handleConfirmDelete} title="Xóa sản phẩm"
                >
                    Bạn có chắc chắn muốn xóa <strong>{productToDelete.name}</strong>?
                </ConfirmationModal>
            )}

            {/* Form Thêm/Sửa (Hiện khi editingProduct có dữ liệu) */}
            {editingProduct && <ProductForm />}

            {/* Quản lý Danh mục (Hiện khi bấm nút Setting) */}
            {showCategoryManager && <CategoryManager onClose={() => setShowCategoryManager(false)} />}
        </div>
    );
};

export default ProductsPage;