import React, { useState, useEffect } from 'react';
import { FiSave, FiX, FiLoader } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
import { useSaveProduct, useCategories } from '../hooks/useProducts'; // Sử dụng Hook

const ProductForm: React.FC = () => {
    const { editingProduct, setEditingProduct } = useAppContext();
    const saveMutation = useSaveProduct();
    const { data: categoriesData } = useCategories(); // Lấy danh mục từ API
    
    const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data || []);
    const isEditing = typeof editingProduct === 'object' && editingProduct !== null;

    // State form
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category: '',
        price: 0,
        costPrice: 0,
        stock: 0,
        unit: 'Cái',
        vat: 0, // Thêm trường VAT nếu cần
        minStock: 5
    });

    useEffect(() => {
        if (isEditing) {
            setFormData({
                name: editingProduct.name || '',
                sku: editingProduct.sku || '',
                category: editingProduct.category || '',
                price: editingProduct.price || 0,
                costPrice: editingProduct.costPrice || 0,
                stock: editingProduct.stock || 0,
                unit: editingProduct.unit || 'Cái',
                vat: editingProduct.vat || 0,
                minStock: editingProduct.minStock || 5
            });
        } else {
            // Reset form khi thêm mới
            setFormData({
                name: '', sku: '', category: categories[0]?.name || '', price: 0, costPrice: 0, stock: 0, unit: 'Cái', vat: 0, minStock: 5
            });
        }
    }, [editingProduct, categories]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await saveMutation.mutateAsync({
                ...formData,
                id: isEditing ? editingProduct.id : undefined
            });
            setEditingProduct(null); // Đóng form sau khi lưu xong
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between">
                    <h3 className="text-xl font-bold dark:text-white">{isEditing ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</h3>
                    <button onClick={() => setEditingProduct(null)}><FiX className="w-6 h-6 text-slate-500" /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Tên sản phẩm <span className="text-red-500">*</span></label>
                            <input required type="text" className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-white" 
                                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Mã SKU</label>
                         <input type="text" className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-white placeholder-slate-400" 
                            value={formData.sku} 
                            onChange={e => setFormData({...formData, sku: e.target.value})} 
        
                             // THAY ĐỔI PLACEHOLDER
                            placeholder="Để trống để tự tạo (VD: SP-00001)"/>
                            <p className="text-xs text-slate-500 mt-1">Hệ thống sẽ tự sinh mã nếu bỏ trống.</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Danh mục</label>
                            <select className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-white"
                                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                <option value="">-- Chọn danh mục --</option>
                                {categories.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Giá vốn</label>
                            <input type="number" className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-white" 
                                value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Giá bán</label>
                            <input type="number" className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-white font-bold text-primary-600" 
                                value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Tồn kho</label>
                            <input type="number" className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-white" 
                                value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
                        </div>
                        
                         <div>
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Đơn vị</label>
                            <input type="text" className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-white" 
                                value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                        <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2 border rounded-lg hover:bg-slate-100 dark:text-white dark:hover:bg-slate-700">Hủy</button>
                        <button type="submit" disabled={saveMutation.isPending} className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold">
                            {saveMutation.isPending ? <FiLoader className="animate-spin"/> : <FiSave />} Lưu lại
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductForm; // <--- QUAN TRỌNG: Phải có dòng này để ProductsPage import được