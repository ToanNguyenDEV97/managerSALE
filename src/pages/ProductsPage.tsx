import React, { useState, useEffect } from 'react';
import { 
    FiSearch, FiPlus, FiEdit3, FiTrash2, FiBox, FiFilter, 
    FiActivity 
} from 'react-icons/fi';
import { useProducts, useDeleteProduct, useCategories } from '../hooks/useProducts';
import { useDebounce } from '../hooks/useDebounce';
import { formatCurrency } from '../utils/currency';
import { Button } from '../components/common/Button';
import Pagination from '../components/common/Pagination';
import ProductModal from '../components/features/inventory/ProductModal';
import CategoryModal from '../components/features/inventory/CategoryManagementModal';
import ConfirmModal from '../components/common/ConfirmModal';
import StockHistoryModal from '../components/features/inventory/StockHistoryModal';
import toast from 'react-hot-toast';

const ProductsPage: React.FC = () => {
    // --- STATE ---
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const debouncedSearch = useDebounce(search, 500);

    // Modal States
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);
    
    // State Modal Thẻ kho
    const [selectedProductHistory, setSelectedProductHistory] = useState<any>(null);

    // --- API HOOKS ---
    const { data: productsData, isLoading } = useProducts(page, 10, debouncedSearch, selectedCategory);
    const { data: categories } = useCategories();
    const deleteMutation = useDeleteProduct();

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, selectedCategory]);

    // --- HANDLERS ---
    const handleEdit = (product: any) => {
        setSelectedProduct(product);
        setIsProductModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedProduct(null);
        setIsProductModalOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setProductToDelete(id);
    };

    const confirmDelete = async () => {
        if (productToDelete) {
            try {
                await deleteMutation.mutateAsync(productToDelete);
                toast.success('Xóa sản phẩm thành công');
                setProductToDelete(null);
            } catch (error) {
                toast.error('Xóa thất bại');
            }
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen bg-slate-50/50">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FiBox className="text-blue-600"/> Quản lý Sản Phẩm
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Quản lý danh mục, giá cả và tồn kho</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsCategoryModalOpen(true)}>
                        Danh mục
                    </Button>
                    <Button variant="primary" icon={<FiPlus/>} onClick={handleCreate}>
                        Thêm sản phẩm
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-2 z-10">
                <div className="relative w-full md:w-96 group">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Tìm tên sản phẩm, SKU..." 
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <FiFilter className="text-slate-400"/>
                    <select 
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="">Tất cả danh mục</option>
                        {/* [FIX KEY 1] Thêm index fallback cho danh mục */}
                        {categories?.map((cat: any, index: number) => (
                            <option key={cat._id || cat.id || index} value={cat._id || cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <span>Đang tải dữ liệu...</span>
                    </div>
                ) : !productsData?.data || productsData.data.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <div className="bg-slate-100 p-4 rounded-full mb-4"><FiBox size={40}/></div>
                        <p>Không tìm thấy sản phẩm nào.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">Sản Phẩm</th>
                                        <th className="px-6 py-4">Danh Mục</th>
                                        <th className="px-6 py-4 text-right">Giá Bán</th>
                                        <th className="px-6 py-4 text-right">Giá Vốn</th>
                                        <th className="px-6 py-4 text-center">Tồn Kho</th>
                                        <th className="px-6 py-4 text-right">Thao Tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {/* [FIX KEY 2] Thêm index fallback cho danh sách sản phẩm */}
                                    {productsData.data.map((product: any, index: number) => (
                                        <tr key={product._id || product.id || index} className="hover:bg-blue-50/40 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{product.name}</div>
                                                <div className="text-xs text-slate-500">SKU: {product.sku}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {product.category?.name || '---'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-blue-600">
                                                {formatCurrency(product.retailPrice ?? product.price ?? 0)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-500">
                                                {formatCurrency(product.importPrice ?? 0)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                                    (product.quantity ?? product.stock ?? 0) > 10 
                                                        ? 'bg-green-100 text-green-700 border-green-200' 
                                                        : (product.quantity ?? product.stock ?? 0) > 0 
                                                            ? 'bg-yellow-100 text-yellow-700 border-yellow-200' 
                                                            : 'bg-red-100 text-red-700 border-red-200'
                                                }`}>
                                                    {product.quantity ?? product.stock ?? 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => setSelectedProductHistory(product)}
                                                        className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg shadow-sm transition-all"
                                                        title="Xem thẻ kho"
                                                    >
                                                        <FiActivity size={16} />
                                                    </button>

                                                    <button onClick={() => handleEdit(product)} className="p-2 bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 rounded-lg shadow-sm transition-all" title="Sửa">
                                                        <FiEdit3 size={16}/>
                                                    </button>
                                                    <button onClick={() => handleDeleteClick(product._id || product.id)} className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 rounded-lg shadow-sm transition-all" title="Xóa">
                                                        <FiTrash2 size={16}/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination */}
                        {productsData?.totalPages > 1 && (
                            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
                                <Pagination currentPage={page} totalPages={productsData.totalPages} onPageChange={setPage} />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            <ProductModal 
                isOpen={isProductModalOpen} 
                onClose={() => setIsProductModalOpen(false)} 
                productToEdit={selectedProduct} 
            />
            
            <CategoryModal 
                isOpen={isCategoryModalOpen} 
                onClose={() => setIsCategoryModalOpen(false)} 
            />
            
            <ConfirmModal
                isOpen={!!productToDelete}
                type="danger"
                title="Xóa sản phẩm"
                message="Bạn có chắc chắn muốn xóa sản phẩm này không? Hành động này không thể hoàn tác."
                onClose={() => setProductToDelete(null)}
                onConfirm={confirmDelete}
            />

            {/* Modal Thẻ Kho */}
            {selectedProductHistory && (
                <StockHistoryModal 
                    product={selectedProductHistory} 
                    onClose={() => setSelectedProductHistory(null)} 
                />
            )}
        </div>
    );
};

export default ProductsPage;