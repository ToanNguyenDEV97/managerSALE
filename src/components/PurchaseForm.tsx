import React, { useState, useMemo, useEffect } from 'react';
import { FiPlus, FiTrash2, FiSave, FiX, FiRefreshCw } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
import { useProducts, useCreateProduct } from '../hooks/useProducts'; 
import { useSuppliers } from '../hooks/useSuppliers';
import { useCreatePurchase } from '../hooks/usePurchases';
import toast from 'react-hot-toast';

const PurchaseForm: React.FC = () => {
    const { setEditingPurchase } = useAppContext();
    
    // --- LẤY DỮ LIỆU ---
    const { data: suppliersData } = useSuppliers(1, 1000);
    const suppliers = suppliersData?.data || [];
    
    const { data: productsData, refetch: refetchProducts } = useProducts(1, 1000);
    const createProductMutation = useCreateProduct();
    const createPurchaseMutation = useCreatePurchase();

    // Logic xử lý danh sách sản phẩm
    const products = useMemo(() => {
        if (!productsData) return [];
        if (Array.isArray(productsData)) return productsData;
        if (Array.isArray(productsData.data)) return productsData.data;
        return [];
    }, [productsData]);

    // --- STATE ---
    const [supplierId, setSupplierId] = useState<string>('');
    const [items, setItems] = useState<any[]>([]);
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    
    // State thanh toán (MỚI)
    const [paidAmount, setPaidAmount] = useState<number>(0); 

    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [currentQuantity, setCurrentQuantity] = useState<number>(1);
    const [currentCostPrice, setCurrentCostPrice] = useState<number>(0);

    const handleCreateQuickProduct = async () => {
        const loadingId = toast.loading("Đang tạo SP mẫu...");
        try {
            await createProductMutation.mutateAsync({
                name: "SP Test " + Math.floor(Math.random() * 100),
                sku: "TEST-" + Math.floor(Math.random() * 1000),
                unit: "Cái",
                price: 150000,
                costPrice: 100000,
                stock: 10,
                category: "Test",
                stock: 10,
                vat: 0
            });
            toast.success("Đã tạo xong!", { id: loadingId });
            refetchProducts();
        } catch (e) {
            toast.error("Lỗi tạo SP", { id: loadingId });
        }
    };

    const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const pId = e.target.value;
        setSelectedProductId(pId);
        const prod = products.find((p: any) => (p._id || p.id) === pId);
        if (prod) setCurrentCostPrice(prod.costPrice || 0);
    };

    const handleAddItem = () => {
        const product = products.find((p: any) => (p._id || p.id) === selectedProductId);
        if (!product || currentQuantity <= 0) {
            toast.error("Vui lòng kiểm tra lại sản phẩm và số lượng");
            return;
        }

        const newItem = {
            productId: product._id || product.id,
            name: product.name,
            quantity: currentQuantity,
            costPrice: currentCostPrice,
            unit: product.unit
        };

        const existingIndex = items.findIndex(i => i.productId === newItem.productId);
        if (existingIndex > -1) {
            const updated = [...items];
            updated[existingIndex].quantity += newItem.quantity;
            updated[existingIndex].costPrice = newItem.costPrice;
            setItems(updated);
        } else {
            setItems([...items, newItem]);
        }

        setSelectedProductId('');
        setCurrentQuantity(1);
        setCurrentCostPrice(0);
    };

    const handleRemoveItem = (pId: string) => setItems(items.filter(i => i.productId !== pId));

    const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.costPrice, 0), [items]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplierId || items.length === 0) {
            toast.error("Vui lòng nhập đầy đủ thông tin");
            return;
        }

        try {
            await createPurchaseMutation.mutateAsync({
                supplierId,
                issueDate,
                items,
                totalAmount,
                paidAmount // Gửi thêm số tiền đã trả
            });
            toast.success("Lưu phiếu nhập thành công!");
            setEditingPurchase(null);
        } catch (error: any) {
            toast.error("Lỗi: " + (error.message || "Không thể lưu"));
        }
    };

    const labelClass = "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1";
    const inputClass = "w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none";

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full animate-fade-in">
            <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-primary-600 dark:text-white">Nhập Hàng Mới</h1>
                    <p className="text-sm text-slate-500">Tạo phiếu nhập và chi tiền</p>
                </div>
                <button type="button" onClick={() => setEditingPurchase(null)} className="md:hidden p-2 bg-slate-100 rounded-full"><FiX /></button>
            </div>
            
            <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar p-1">
                <div className="bg-white dark:bg-slate-800 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Nhà cung cấp <span className="text-red-500">*</span></label>
                            <select className={inputClass} value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                                <option value="">-- Chọn Nhà cung cấp --</option>
                                {suppliers?.map((s: any) => (
                                    <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Ngày nhập kho</label>
                            <input type="date" className={inputClass} value={issueDate} onChange={e => setIssueDate(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <label className={labelClass}>Sản phẩm ({products.length})</label>
                        <button type="button" onClick={handleCreateQuickProduct} className="text-xs bg-white border border-primary-500 text-primary-600 px-3 py-1 rounded hover:bg-primary-50 font-bold flex items-center gap-1">
                            <FiRefreshCw /> + Tạo SP Mẫu
                        </button>
                    </div>
                    <div className="grid grid-cols-12 gap-3 items-end">
                        <div className="col-span-12 md:col-span-5">
                            <select className={inputClass} value={selectedProductId} onChange={handleProductSelect}>
                                <option value="">-- Chọn sản phẩm --</option>
                                {products.map((p: any) => (
                                    <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-6 md:col-span-2">
                            <input type="number" placeholder="SL" className={inputClass} min="1" value={currentQuantity} onChange={e => setCurrentQuantity(Number(e.target.value))} />
                        </div>
                        <div className="col-span-6 md:col-span-3">
                            <input type="number" placeholder="Giá" className={inputClass} min="0" value={currentCostPrice} onChange={e => setCurrentCostPrice(Number(e.target.value))} />
                        </div>
                        <div className="col-span-12 md:col-span-2">
                            <button type="button" onClick={handleAddItem} className="w-full py-2 bg-primary-600 text-white font-bold rounded-lg flex items-center justify-center gap-1 shadow-md">
                                <FiPlus size={18} /> Thêm
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-700 font-bold">
                            <tr>
                                <th className="p-3">Sản phẩm</th>
                                <th className="p-3 text-right">SL</th>
                                <th className="p-3 text-right">Giá</th>
                                <th className="p-3 text-right">Thành tiền</th>
                                <th className="p-3 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                            {items.map((item, index) => (
                                <tr key={index}>
                                    <td className="p-3 font-medium">{item.name}</td>
                                    <td className="p-3 text-right">{item.quantity}</td>
                                    <td className="p-3 text-right">{item.costPrice.toLocaleString()}</td>
                                    <td className="p-3 text-right font-bold text-primary-600">{(item.costPrice * item.quantity).toLocaleString()}</td>
                                    <td className="p-3 text-center"><button onClick={() => handleRemoveItem(item.productId)} className="text-red-500"><FiTrash2 /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* --- PHẦN THANH TOÁN (MỚI) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl">
                    <div>
                        <div className="flex justify-between mb-2 text-sm font-bold">
                            <span>Tổng tiền hàng:</span>
                            <span className="text-xl text-primary-600">{totalAmount.toLocaleString()} đ</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold text-slate-700 dark:text-slate-300">
                            <span>Còn nợ NCC:</span>
                            <span className="text-red-500">{(totalAmount - paidAmount).toLocaleString()} đ</span>
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Thanh toán ngay (VNĐ)</label>
                        <input 
                            type="number" 
                            className={`${inputClass} font-bold text-green-600`} 
                            min="0" 
                            max={totalAmount}
                            value={paidAmount} 
                            onChange={e => setPaidAmount(Number(e.target.value))} 
                        />
                        <p className="text-xs text-slate-500 mt-1">Nhập số tiền trả ngay. Để 0 nếu ghi nợ toàn bộ.</p>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingPurchase(null)} className="px-4 py-2 border rounded-lg">Hủy</button>
                <button type="submit" className="px-6 py-2 bg-primary-600 text-white font-bold rounded-lg shadow-md flex gap-2 items-center"><FiSave /> Lưu & Tạo Phiếu Chi</button>
            </div>
        </form>
    );
};

export default PurchaseForm;