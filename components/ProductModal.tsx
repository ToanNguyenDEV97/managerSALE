
import React, { useState, useEffect } from 'react';
import type { Product } from '../types';
import { useAppContext } from '../context/DataContext';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: (product: Product) => Promise<void>;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onSave }) => {
  const { categories } = useAppContext();
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    sku: '',
    name: '',
    category: categories.length > 0 ? categories[0].name : '',
    unit: 'Cái',
    price: 0,
    costPrice: 0,
    stock: 0,
    vat: 10,
  });

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
      setFormData(prev => ({ 
        ...prev, 
        sku: '',
        name: '',
        unit: 'Cái',
        price: 0,
        costPrice: 0,
        stock: 0,
        vat: 10,
        category: categories.length > 0 ? categories[0].name : '' 
      }));
    }
  }, [product, categories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumberField = ['price', 'costPrice', 'stock', 'vat'].includes(name);
    setFormData(prev => ({
      ...prev,
      [name]: isNumberField ? parseFloat(value) || 0 : value
    }));
  };

  // Trong components/ProductModal.tsx

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate số âm (Chặn cứng)
    if (formData.price < 0 || formData.costPrice < 0 || formData.stock < 0) {
        alert("Lỗi: Giá bán, Giá vốn và Tồn kho không được là số âm.");
        return;
    }

    // 2. Validate Giá vốn > Giá bán (Cảnh báo)
    if (formData.costPrice > formData.price) {
      const confirm = window.confirm(
          `Cảnh báo: Giá vốn (${formData.costPrice.toLocaleString('vi-VN')}) đang cao hơn Giá bán (${formData.price.toLocaleString('vi-VN')}).\n\nBạn có chắc chắn muốn lưu sản phẩm này không?`
      );
      if (!confirm) return;
    }

    const productToSave: Product = {
      ...formData,
      id: product?.id || '',
    };
    await onSave(productToSave);
  };
  
  const inputStyles = "mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400";
  const labelStyles = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";


  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{product ? 'Chỉnh sửa Sản phẩm' : 'Thêm Sản phẩm mới'}</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelStyles}>Tên sản phẩm</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputStyles} />
              </div>
              <div>
                <label className={labelStyles}>Mã SKU</label>
                <input type="text" name="sku" value={formData.sku} onChange={handleChange} required className={inputStyles} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <div>
                <label className={labelStyles}>Phân loại</label>
                <select name="category" value={formData.category} onChange={handleChange} required className={inputStyles}>
                   {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelStyles}>Đơn vị tính</label>
                <input type="text" name="unit" value={formData.unit} onChange={handleChange} required className={inputStyles} />
              </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelStyles}>Giá vốn</label>
                <input type="number" name="costPrice" value={formData.costPrice} onChange={handleChange} required min="0" className={inputStyles} />
              </div>
              <div>
                <label className={labelStyles}>Giá bán (gồm VAT)</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} required min="0" className={inputStyles} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelStyles}>Số lượng tồn kho</label>
                <input type="number" name="stock" value={formData.stock} onChange={handleChange} required min="0" className={inputStyles} />
              </div>
              <div>
                <label className={labelStyles}>Thuế GTGT (%)</label>
                <input type="number" name="vat" value={formData.vat} onChange={handleChange} required min="0" className={inputStyles} />
              </div>
            </div>
          </div>
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 hover:border-slate-400 transition-colors duration-200 font-medium text-sm">Hủy</button>
            <button type="submit" className="px-4 py-2 text-white rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-px font-medium text-sm">{product ? 'Cập nhật' : 'Lưu sản phẩm'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
