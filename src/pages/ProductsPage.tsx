import React, { useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiLoader, FiLayers } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
import { useProducts, useSaveProduct, useDeleteProduct } from '../hooks/useProducts'; // Import Hook mới
import type { Product } from '../types';

// Components
import ProductModal from '../components/ProductModal';
import ConfirmationModal from '../components/ConfirmationModal';
import Pagination from '../components/Pagination';
import CategoryManagementModal from '../components/CategoryManagementModal';

const ProductsPage: React.FC = () => {
    // --- 1. State & Hooks ---
    // Chỉ lấy các state UI từ Context (không lấy data products nữa)
    const { setEditingProduct, editingProduct } = useAppContext();
    
    // Local State cho UI
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const ITEMS_PER_PAGE = 10;

    // --- 2. React Query (Lấy dữ liệu & Xử lý API) ---
    // Tự động fetch data, handle loading, error
    const { data: productsData, isLoading, isError } = useProducts(page, searchTerm);
    
    const saveMutation = useSaveProduct();
    const deleteMutation = useDeleteProduct();

    // --- 3. Xử lý dữ liệu hiển thị ---
    // Kiểm tra cấu trúc trả về từ API (Mảng hay Object phân trang)
    const products = Array.isArray(productsData) ? productsData : (productsData?.data || []);
    
    // Nếu API trả về mảng full (chưa phân trang server), ta phân trang ở client tạm thời
    // Nếu API đã phân trang, dùng total từ server
    const isClientSidePagination = Array.isArray(productsData);
    
    const totalItems = isClientSidePagination ? products.length : (productsData?.total || 0);
    const totalPages = isClientSidePagination 
        ? Math.ceil(totalItems / ITEMS_PER_PAGE) 
        : (productsData?.totalPages || 1);

    const displayProducts = isClientSidePagination
        ? products
            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
            .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
        : products; // API đã lọc và phân trang sẵn

    // --- 4. Handlers ---
    const handleOpenModal = (product: Product | null) => {
        // Lưu vào Context để Modal truy cập (hoặc truyền props)
        setEditingProduct(product || 'new');
        setIsProductModalOpen(true);
    };

    const handleSave = async (product: Product) => {
        // Gọi Mutation để lưu (tự động hiện toast success/error bên trong hook)
        await saveMutation.mutateAsync(product);
        setIsProductModalOpen(false);
    };

    const handleConfirmDelete = async () => {
        if (productToDelete) {
            await deleteMutation.mutateAsync(productToDelete.id);
            setProductToDelete(null);
        }
    };

    // --- 5. Render ---
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <FiLoader className="w-8 h-8 animate-spin text-primary-600" />
                <span className="ml-2 text-slate-500">Đang tải dữ liệu...</span>
            </div>
        );
    }

    if (isError) {
        return <div className="text-red-500 text-center p-10">Lỗi không thể tải dữ liệu sản phẩm. Vui lòng kiểm tra kết nối Server.</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header & Tools */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiSearch className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm kiếm sản phẩm (Tên, Mã)..."
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg leading-5 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(1); // Reset về trang 1 khi tìm kiếm
                        }}
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 font-medium transition-all"
                    >
                        <FiLayers className="mr-2" /> Phân loại
                    </button>
                    <button
                        onClick={() => handleOpenModal(null)}
                        className="flex items-center px-4 py-2 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all font-medium"
                    >
                        <FiPlus className="mr-2" /> Thêm mới
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mã SP</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tên sản phẩm</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phân loại</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Giá bán</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tồn kho</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {displayProducts.length > 0 ? (
                                displayProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600 dark:text-primary-400">
                                            {product.sku}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 dark:text-slate-200 font-medium">
                                            {product.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                                                {product.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-slate-700 dark:text-slate-300">
                                            {product.price.toLocaleString('vi-VN')} đ
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                product.stock <= 10 
                                                ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300' 
                                                : 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300'
                                            }`}>
                                                {product.stock} {product.unit}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleOpenModal(product)} 
                                                    className="p-2 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                    title="Chỉnh sửa"
                                                >
                                                    <FiEdit className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => setProductToDelete(product)} 
                                                    className="p-2 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                    title="Xóa"
                                                >
                                                    <FiTrash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <FiLayers className="w-12 h-12 text-slate-300 mb-3" />
                                            <p className="text-lg font-medium">Không tìm thấy sản phẩm nào</p>
                                            <p className="text-sm mt-1">Thử thay đổi từ khóa tìm kiếm hoặc thêm sản phẩm mới.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                <Pagination 
                    currentPage={page} 
                    totalPages={totalPages} 
                    onPageChange={setPage} 
                    totalItems={totalItems} 
                    itemsPerPage={ITEMS_PER_PAGE} 
                />
            </div>

            {/* Modals */}
            {isProductModalOpen && (
                <ProductModal 
                    product={editingProduct === 'new' ? null : editingProduct} 
                    onClose={() => setIsProductModalOpen(false)} 
                    onSave={handleSave} 
                />
            )}
            
            {isCategoryModalOpen && (
                <CategoryManagementModal onClose={() => setIsCategoryModalOpen(false)} />
            )}
            
            {productToDelete && (
                <ConfirmationModal 
                    isOpen={!!productToDelete} 
                    onClose={() => setProductToDelete(null)} 
                    onConfirm={handleConfirmDelete} 
                    title="Xác nhận Xóa Sản phẩm"
                >
                    Bạn có chắc chắn muốn xóa sản phẩm "<strong>{productToDelete.name}</strong>"?
                    <br />
                    <span className="text-sm text-slate-500 mt-1 block">Hành động này không thể hoàn tác.</span>
                </ConfirmationModal>
            )}
        </div>
    );
};

export default ProductsPage;