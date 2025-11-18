
import React, { useState, useMemo } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiChevronUp, FiChevronDown, FiSettings } from 'react-icons/fi';
import type { Product, PageKey } from '../types';
import ProductModal from '../components/ProductModal';
import ConfirmationModal from '../components/ConfirmationModal';
import Pagination from '../components/Pagination';
import CategoryManagementModal from '../components/CategoryManagementModal';
import { useAppContext } from '../context/DataContext';
import ColumnToggler from '../components/ColumnToggler';

type SortKey = keyof Product | 'priceWithVat';

const productColumns: Record<string, string> = {
    sku: 'Mã SKU',
    name: 'Tên sản phẩm',
    category: 'Phân loại',
    unit: 'Đơn vị',
    price: 'Giá bán (gồm VAT)',
    stock: 'Tồn kho',
    vat: 'Thuế GTGT (%)',
};

const ProductsPage: React.FC = () => {
  const { products, categories, handleSaveProduct, handleDeleteProduct, handleDeleteProducts, columnVisibility, handleColumnVisibilityChange } = useAppContext();
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending'});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const pageKey: PageKey = 'products';

  const handleOpenModal = (product: Product | null) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingProduct(null);
    setIsProductModalOpen(false);
  };

  const onSave = async (product: Product) => {
    await handleSaveProduct(product);
    handleCloseModal();
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
  };

  const handleConfirmDelete = async () => {
    if (productToDelete) {
        await handleDeleteProduct(productToDelete.id);
        setProductToDelete(null);
    }
  };
  
  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedProducts = useMemo(() => {
    let sortableProducts = [...products];

    if (searchTerm) {
      sortableProducts = sortableProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
        sortableProducts = sortableProducts.filter(product => product.category === categoryFilter);
    }

    if (sortConfig !== null) {
      sortableProducts.sort((a, b) => {
        const valA = a[sortConfig.key as keyof Product];
        const valB = b[sortConfig.key as keyof Product];
        
        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableProducts;
  }, [products, searchTerm, categoryFilter, sortConfig]);
  
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedProducts, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedProducts.map(p => p.id));
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
  
  const isAllSelected = paginatedProducts.length > 0 && selectedIds.length === paginatedProducts.length;

  const handleBulkDelete = async () => {
    await handleDeleteProducts(selectedIds);
    setSelectedIds([]);
  }

  const getSortIcon = (name: SortKey) => {
    if (!sortConfig || sortConfig.key !== name) {
      return <div className="w-4 h-4" />;
    }
    return sortConfig.direction === 'ascending' ? <FiChevronUp /> : <FiChevronDown />;
  };

  const SortableHeader: React.FC<{ sortKey: SortKey, label: string }> = ({ sortKey, label }) => (
    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">
        <button onClick={() => requestSort(sortKey)} className="flex items-center gap-1">
            {label}
            {getSortIcon(sortKey)}
        </button>
    </th>
  );


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="hidden lg:block">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-200">Quản lý Sản phẩm</h1>
          <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400 mt-1">Quản lý kho và chi tiết sản phẩm của bạn.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex items-center justify-center w-full sm:w-auto px-4 py-2 text-slate-700 dark:text-slate-200 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300"
            >
              <FiSettings className="w-5 h-5" />
              <span className="ml-2 font-medium">Quản lý Phân loại</span>
            </button>
            <button
              onClick={() => handleOpenModal(null)}
              className="flex items-center justify-center w-full sm:w-auto px-4 py-2 text-white rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-px"
            >
              <FiPlus className="w-5 h-5" />
              <span className="ml-2 font-medium">Thêm Sản phẩm</span>
            </button>
        </div>
      </div>
      
      {/* Search and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc Mã SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg shadow-sm py-2 px-3 pl-10 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 sm:text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-slate-400" />
                </div>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">Tất cả phân loại</option>
              {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
            </select>
             <ColumnToggler 
                pageKey={pageKey}
                columns={productColumns} 
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
        {/* Table View for large screens */}
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
                  {columnVisibility.products.sku && <SortableHeader sortKey="sku" label="Mã SKU" />}
                  {columnVisibility.products.name && <SortableHeader sortKey="name" label="Tên sản phẩm" />}
                  {columnVisibility.products.category && <SortableHeader sortKey="category" label="Phân loại" />}
                  {columnVisibility.products.unit && <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Đơn vị</th>}
                  {columnVisibility.products.price && <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Giá bán (gồm VAT)</th>}
                  {columnVisibility.products.stock && <SortableHeader sortKey="stock" label="Tồn kho" />}
                  {columnVisibility.products.vat && <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Thuế GTGT (%)</th>}
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Hành động</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800">
                {paginatedProducts.length > 0 ? (
                  paginatedProducts.map((product) => (
                  <tr key={product.id} className={`border-b border-slate-200 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200 ${selectedIds.includes(product.id) ? 'bg-primary-50 dark:bg-primary-500/10' : ''}`}>
                    <td className="px-6 py-4">
                      <input type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-500 text-primary-600 focus:ring-primary-500 bg-white dark:bg-slate-600"
                        checked={selectedIds.includes(product.id)}
                        onChange={(e) => handleSelectOne(e, product.id)}
                      />
                    </td>
                    {columnVisibility.products.sku && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">{product.sku}</td>}
                    {columnVisibility.products.name && <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 dark:text-slate-300">{product.name}</td>}
                    {columnVisibility.products.category && <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{product.category}</td>}
                    {columnVisibility.products.unit && <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{product.unit}</td>}
                    {columnVisibility.products.price && <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{product.price.toLocaleString('vi-VN')} đ</td>}
                    {columnVisibility.products.stock && <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{product.stock.toLocaleString('vi-VN')}</td>}
                    {columnVisibility.products.vat && <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{product.vat}%</td>}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                      <button onClick={() => handleOpenModal(product)} className="text-primary-600 hover:text-primary-800 inline-flex items-center gap-1 transition-transform hover:scale-110">
                        <FiEdit className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleDeleteClick(product)} className="text-red-500 hover:text-red-700 inline-flex items-center gap-1 transition-transform hover:scale-110">
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
                ) : (
                  <tr>
                    <td colSpan={Object.values(columnVisibility.products).filter(Boolean).length + 2} className="text-center py-10 text-slate-500 dark:text-slate-400">
                      Không tìm thấy sản phẩm nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
        </div>
        
        {/* Card View for small screens */}
        <div className="lg:hidden">
            {paginatedProducts.length > 0 ? (
                paginatedProducts.map(product => (
                    <div key={product.id} className={`p-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0 ${selectedIds.includes(product.id) ? 'bg-primary-50 dark:bg-primary-500/10' : 'bg-white dark:bg-slate-800'}`}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-start gap-3">
                                <input type="checkbox"
                                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-500 text-primary-600 focus:ring-primary-500 mt-1 bg-white dark:bg-slate-600"
                                    checked={selectedIds.includes(product.id)}
                                    onChange={(e) => handleSelectOne(e, product.id)}
                                />
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">{product.name}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{product.sku}</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{product.category}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => handleOpenModal(product)} className="text-primary-600 hover:text-primary-800 p-1">
                                    <FiEdit className="h-5 w-5" />
                                </button>
                                <button onClick={() => handleDeleteClick(product)} className="text-red-500 hover:text-red-700 p-1">
                                    <FiTrash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-xs text-slate-400 dark:text-slate-500">Giá bán</p>
                                <p className="font-medium text-slate-700 dark:text-slate-300">{product.price.toLocaleString('vi-VN')} đ</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 dark:text-slate-500">Tồn kho</p>
                                <p className="font-medium text-slate-700 dark:text-slate-300">{product.stock.toLocaleString('vi-VN')} {product.unit}</p>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                    Không tìm thấy sản phẩm nào.
                </div>
            )}
        </div>
        
         <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filteredAndSortedProducts.length} itemsPerPage={ITEMS_PER_PAGE} />
      </div>

      {isProductModalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={handleCloseModal}
          onSave={onSave}
        />
      )}

      {isCategoryModalOpen && (
        <CategoryManagementModal
            onClose={() => setIsCategoryModalOpen(false)}
        />
      )}

      {productToDelete && (
        <ConfirmationModal
            isOpen={!!productToDelete}
            onClose={() => setProductToDelete(null)}
            onConfirm={handleConfirmDelete}
            title="Xác nhận Xóa Sản phẩm"
        >
            Bạn có chắc chắn muốn xóa sản phẩm "<strong>{productToDelete.name}</strong>"? 
            Hành động này không thể hoàn tác.
        </ConfirmationModal>
      )}
    </div>
  );
};

export default ProductsPage;
