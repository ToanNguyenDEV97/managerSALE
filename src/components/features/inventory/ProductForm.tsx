import React, { useState, useEffect } from 'react';
import { FiSave, FiX } from 'react-icons/fi';
import { useAppContext } from '../../../context/DataContext';
import { useCreateProduct, useUpdateProduct, useCategories } from '../../../hooks/useProducts';
import toast from 'react-hot-toast';

const ProductForm: React.FC = () => {
    const { editingProduct, setEditingProduct } = useAppContext();
    const isNew = editingProduct === 'new';
    const product = isNew ? null : editingProduct;

    const createMutation = useCreateProduct();
    const updateMutation = useUpdateProduct();
    const { data: categories } = useCategories(); 

    // --- STATE ---
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [category, setCategory] = useState('');
    const [unit, setUnit] = useState('Cái');
    const [price, setPrice] = useState<number>(0);     
    const [costPrice, setCostPrice] = useState<number>(0); 
    const [stock, setStock] = useState<number>(0);
    // 👉 THÊM STATE CHO VAT
    const [vat, setVat] = useState<number>(0); 

    // Load dữ liệu khi sửa
    useEffect(() => {
        if (product && 'id' in product) {
            setName(product.name);
            setSku(product.sku);
            setCategory(product.category || '');
            setUnit(product.unit || 'Cái');
            setPrice(product.price || 0);
            setCostPrice(product.costPrice || 0);
            setStock(product.stock || 0);
            // 👉 Load VAT (nếu không có thì mặc định 0)
            setVat(product.vat || 0); 
        } else {
            setName('');
            setSku('');
            setCategory('');
            setUnit('Cái');
            setPrice(0);
            setCostPrice(0);
            setStock(0);
            setVat(0); // 👉 Reset VAT
        }
    }, [product]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // 👉 THÊM vat VÀO OBJECT GỬI ĐI
        const formData = {
            name, sku, category, unit, price, costPrice, stock, vat,
            ...(product && 'id' in product ? { id: product.id } : {})
        };

        try {
            if (isNew) {
                await createMutation.mutateAsync(formData);
                toast.success('Thêm sản phẩm thành công!');
            } else {
                await updateMutation.mutateAsync(formData);
                toast.success('Cập nhật thành công!');
            }
            setEditingProduct(null);
        } catch (error: any) {
            toast.error('Lỗi: ' + (error.message || 'Không thể lưu'));
        }
    };

    const labelClass = "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1";
    const inputClass = "w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none";

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full animate-fade-in">
            <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                    {isNew ? 'Thêm Sản Phẩm Mới' : 'Cập Nhật Sản Phẩm'}
                </h1>
                <button type="button" onClick={() => setEditingProduct(null)} className="md:hidden p-2 bg-slate-100 rounded-full"><FiX /></button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>
                            Mã sản phẩm (SKU) 
                            <span className="text-slate-400 font-normal text-xs ml-2">(Tự sinh nếu để trống)</span>
                        </label>
                        <input 
                            className={`${inputClass} bg-slate-50`} 
                            value={sku} 
                            onChange={e => setSku(e.target.value)} 
                            placeholder="VD: SP-00001 (Hoặc để trống)" 
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Tên sản phẩm <span className="text-red-500">*</span></label>
                        <input required className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="VD: Xi măng Hà Tiên" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Danh mục</label>
                        <select className={inputClass} value={category} onChange={e => setCategory(e.target.value)}>
                            <option value="">-- Chọn danh mục --</option>
                            {categories?.map((c: any) => (
                                <option key={c.id || c._id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Đơn vị tính</label>
                        <input className={inputClass} value={unit} onChange={e => setUnit(e.target.value)} list="units" />
                        <datalist id="units">
                            <option value="Cái" /><option value="Bao" /><option value="Hộp" /><option value="Kg" /><option value="Mét" />
                        </datalist>
                    </div>
                </div>

                {/* SỬA LẠI GRID THÀNH 4 CỘT ĐỂ CHỨA THÊM VAT */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div>
                        <label className={labelClass}>Giá vốn</label>
                        <input type="number" className={inputClass} min="0" value={costPrice} onChange={e => setCostPrice(Number(e.target.value))} />
                    </div>
                    <div>
                        <label className={labelClass}>Giá bán</label>
                        <input type="number" className={inputClass} min="0" value={price} onChange={e => setPrice(Number(e.target.value))} />
                    </div>
                    {/* 👉 Ô NHẬP VAT MỚI THÊM */}
                    <div>
                        <label className={labelClass}>Thuế VAT (%)</label>
                        <input 
                            type="number" className={inputClass} min="0" max="100" 
                            value={vat} onChange={e => setVat(Number(e.target.value))} 
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Tồn kho</label>
                        <input type="number" className={inputClass} min="0" value={stock} onChange={e => setStock(Number(e.target.value))} />
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2 border rounded-lg hover:bg-slate-50">Hủy</button>
                <button type="submit" className="px-6 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 flex items-center gap-2">
                    <FiSave /> Lưu sản phẩm
                </button>
            </div>
        </form>
    );
};

export default ProductForm;