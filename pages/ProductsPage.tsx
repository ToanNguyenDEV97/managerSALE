import React, { useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiLoader } from 'react-icons/fi';
import { useQuery, keepPreviousData } from '@tanstack/react-query'; // Import mới
import type { Product } from '../types';
import ProductModal from '../components/ProductModal';
import ConfirmationModal from '../components/ConfirmationModal';
import Pagination from '../components/Pagination';
import CategoryManagementModal from '../components/CategoryManagementModal';
import { useAppContext } from '../context/DataContext';

// Helper fetch data (có thể tách ra file riêng utils/api.ts)
const fetchProducts = async (token: string, page: number, search: string) => {
    const response = await fetch(`http://localhost:5001/api/products?page=${page}&limit=10&search=${search}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Lỗi tải dữ liệu');
    return response.json();
};

const ProductsPage: React.FC = () => {
  // Chỉ lấy các hàm xử lý, KHÔNG lấy state 'products' từ Context nữa để nhẹ gánh
  const { token, handleSaveProduct, handleDeleteProduct } = useAppContext(); 

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  // Debounce search: Đợi người dùng gõ xong mới tìm (tránh gọi API liên tục)
  const [debouncedSearch, setDebouncedSearch] = useState(''); 

  // --- REACT QUERY (TANSTACK QUERY) ---
  // Tự động tải dữ liệu, tự động cache, tự động loading state
  const { data, isLoading, isError, refetch } = useQuery({
      queryKey: ['products', page, debouncedSearch], // Key thay đổi -> Tự gọi lại API
      queryFn: () => fetchProducts(token!, page, debouncedSearch),
      placeholderData: keepPreviousData, // Giữ dữ liệu cũ khi đang tải trang mới (UX mượt)
      enabled: !!token // Chỉ chạy khi có token
  });
  // ------------------------------------

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Xử lý tìm kiếm (Debounce thủ công đơn giản)
  React.useEffect(() => {
      const timer = setTimeout(() => {
          setPage(1); // Reset về trang 1 khi tìm kiếm
          setDebouncedSearch(searchTerm);
      }, 500);
      return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleOpenModal = (product: Product | null) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const onSave = async (product: Product) => {
    await handleSaveProduct(product);
    setIsProductModalOpen(false);
    refetch(); // Làm mới danh sách sau khi lưu
  };

  const handleConfirmDelete = async () => {
    if (productToDelete) {
        await handleDeleteProduct(productToDelete.id);
        setProductToDelete(null);
        refetch(); // Làm mới danh sách sau khi xóa
    }
  };

  // Dữ liệu từ API trả về
  const productsList = data?.data || [];
  const pagination = data?.pagination || { totalPages: 1, total: 0 };

  if (isError) return <div className="p-10 text-red-500">Lỗi khi tải dữ liệu sản phẩm.</div>;

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="hidden lg:block">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-200">Quản lý Sản phẩm</h1>
          <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400 mt-1">Quản lý kho và chi tiết sản phẩm.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
             {/* ... Các nút quản lý Category, Thêm mới giữ nguyên ... */}
            <button onClick={() => setIsCategoryModalOpen(true)} className="px-4 py-2 bg-white border rounded-lg hover:bg-slate-50">Quản lý Phân loại</button>
            <button onClick={() => handleOpenModal(null)} className="px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 flex items-center gap-2"><FiPlus/> Thêm Sản phẩm</button>
        </div>
      </div>
      
      {/* Search */}
      <div className="flex items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="relative flex-grow max-w-md">
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc Mã SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg py-2 px-3 pl-10 focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {isLoading ? <FiLoader className="animate-spin text-primary-500"/> : <FiSearch className="text-slate-400" />}
                </div>
            </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-primary-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase">Mã SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase">Tên sản phẩm</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase">Phân loại</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase">Giá bán</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase">Tồn kho</th>
                  <th className="px-6 py-3 relative"><span className="sr-only">Hành động</span></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {isLoading ? (
                    // Skeleton Loading Rows
                    [...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                            <td colSpan={6} className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div></td>
                        </tr>
                    ))
                ) : productsList.length > 0 ? (
                  productsList.map((product: Product) => (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-200">{product.sku}</td>
                    <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-300">{product.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{product.category}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-200 font-medium">{product.price.toLocaleString('vi-VN')} đ</td>
                    <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.stock <= 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {product.stock.toLocaleString('vi-VN')} {product.unit}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                      <button onClick={() => handleOpenModal(product)} className="text-primary-600 hover:text-primary-800 p-1"><FiEdit className="h-5 w-5"/></button>
                      <button onClick={() => setProductToDelete(product)} className="text-red-500 hover:text-red-700 p-1"><FiTrash2 className="h-5 w-5"/></button>
                    </td>
                  </tr>
                ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500">Không tìm thấy sản phẩm nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
        </div>
        
        {/* Pagination */}
        <Pagination 
            currentPage={page} 
            totalPages={pagination.totalPages} 
            onPageChange={setPage} 
            totalItems={pagination.total} 
            itemsPerPage={10} 
        />
      </div>

      {/* Modals */}
      {isProductModalOpen && <ProductModal product={editingProduct} onClose={() => setIsProductModalOpen(false)} onSave={onSave} />}
      {isCategoryModalOpen && <CategoryManagementModal onClose={() => setIsCategoryModalOpen(false)} />}
      {productToDelete && (
        <ConfirmationModal isOpen={!!productToDelete} onClose={() => setProductToDelete(null)} onConfirm={handleConfirmDelete} title="Xác nhận Xóa">
            Bạn có chắc chắn muốn xóa sản phẩm này không?
        </ConfirmationModal>
      )}
    </div>
  );
};

export default ProductsPage;