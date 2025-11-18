
import React, { useState, useEffect, useMemo } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import type { Purchase, PurchaseItem } from '../types';
import { useAppContext } from '../context/DataContext';

const PurchaseForm: React.FC = () => {
    const { editingPurchase, suppliers, products, handleSavePurchase, setEditingPurchase } = useAppContext();
    const purchase = editingPurchase === 'new' ? null : editingPurchase;

    const [supplierId, setSupplierId] = useState<string>('');
    const [items, setItems] = useState<PurchaseItem[]>([]);
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [currentQuantity, setCurrentQuantity] = useState<number>(1);
    const [currentCostPrice, setCurrentCostPrice] = useState<number>(0);

    useEffect(() => {
        if (purchase) {
            setSupplierId(purchase.supplierId);
            setItems(purchase.items);
            setIssueDate(purchase.issueDate);
        }
    }, [purchase]);

    useEffect(() => {
        const product = products.find(p => p.id === selectedProductId);
        if (product) {
            setCurrentCostPrice(product.costPrice);
        }
    }, [selectedProductId, products]);

    const handleAddItem = () => {
        const product = products.find(p => p.id === selectedProductId);
        if (!product || currentQuantity <= 0 || currentCostPrice < 0) {
            alert("Vui lòng chọn sản phẩm và nhập số lượng, giá hợp lệ.");
            return;
        }

        const newItem: PurchaseItem = {
            productId: product.id,
            name: product.name,
            quantity: currentQuantity,
            costPrice: currentCostPrice,
        };

        const existingItemIndex = items.findIndex(i => i.productId === newItem.productId);
        if (existingItemIndex > -1) {
            const updatedItems = [...items];
            const existingItem = updatedItems[existingItemIndex];
            existingItem.quantity += newItem.quantity;
            existingItem.costPrice = newItem.costPrice;
            setItems(updatedItems);
        } else {
            setItems([...items, newItem]);
        }

        setSelectedProductId('');
        setCurrentQuantity(1);
        setCurrentCostPrice(0);
    };
    
    const handleRemoveItem = (productId: string) => {
        setItems(items.filter(item => item.productId !== productId));
    };

    const totalAmount = useMemo(() => {
        return items.reduce((acc, item) => acc + item.costPrice * item.quantity, 0);
    }, [items]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplierId) {
            alert("Vui lòng chọn nhà cung cấp.");
            return;
        }
        if (items.length === 0) {
            alert("Vui lòng thêm ít nhất một sản phẩm.");
            return;
        }

        const supplier = suppliers.find(c => c.id === supplierId);
        if (!supplier) return;

        const purchaseToSave: Purchase = {
            id: purchase?.id || '',
            purchaseNumber: purchase?.purchaseNumber || '',
            supplierId,
            supplierName: supplier.name,
            issueDate,
            items,
            totalAmount: totalAmount,
        };

        await handleSavePurchase(purchaseToSave);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">{purchase ? 'Chỉnh sửa Phiếu Nhập kho' : 'Tạo Phiếu Nhập kho'}</h1>
            </div>

            {/* Purchase Details */}
            <div className="bg-white p-6 rounded-xl border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Thông tin chung</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nhà cung cấp</label>
                        <select 
                            value={supplierId} 
                            onChange={e => setSupplierId(e.target.value)} 
                            required
                            className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 sm:text-sm"
                        >
                            <option value="" disabled>-- Chọn nhà cung cấp --</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ngày nhập</label>
                        <input 
                            type="date" 
                            value={issueDate}
                            onChange={e => setIssueDate(e.target.value)}
                            required 
                            className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 sm:text-sm" 
                        />
                    </div>
                </div>
            </div>

            {/* Purchase Items */}
            <div className="bg-white p-6 rounded-xl border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Chi tiết sản phẩm nhập</h2>
                <div className="grid md:grid-cols-12 items-end gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
                    <div className="md:col-span-5">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sản phẩm</label>
                        <select 
                            value={selectedProductId}
                            onChange={e => setSelectedProductId(e.target.value)}
                            className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 sm:text-sm"
                        >
                            <option value="" disabled>-- Chọn sản phẩm --</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng</label>
                        <input 
                            type="number" 
                            value={currentQuantity}
                            onChange={e => setCurrentQuantity(parseInt(e.target.value) || 1)}
                            min="1"
                            className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 sm:text-sm"
                        />
                    </div>
                    <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Giá nhập</label>
                        <input 
                            type="number" 
                            value={currentCostPrice}
                            onChange={e => setCurrentCostPrice(parseFloat(e.target.value) || 0)}
                            min="0"
                            className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 sm:text-sm"
                        />
                    </div>
                    <button type="button" onClick={handleAddItem} className="md:col-span-2 flex items-center justify-center w-full px-4 py-2 text-white rounded-lg bg-primary-600 hover:bg-primary-700 transition-colors">
                        <FiPlus /> <span className="ml-2">Thêm</span>
                    </button>
                </div>

                 <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Sản phẩm</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Số lượng</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Giá nhập</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Thành tiền</th>
                                <th className="relative px-4 py-2"><span className="sr-only">Xóa</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {items.map(item => (
                                <tr key={item.productId} className="border-b border-slate-200 last:border-b-0">
                                    <td className="px-4 py-3 text-sm text-slate-800">{item.name}</td>
                                    <td className="px-4 py-3 text-sm text-slate-500">{item.quantity}</td>
                                    <td className="px-4 py-3 text-sm text-slate-500">{item.costPrice.toLocaleString('vi-VN')} đ</td>
                                    <td className="px-4 py-3 text-sm text-slate-900 font-medium">{(item.quantity * item.costPrice).toLocaleString('vi-VN')} đ</td>
                                    <td className="px-4 py-3 text-right">
                                        <button type="button" onClick={() => handleRemoveItem(item.productId)} className="text-red-500 hover:text-red-700">
                                            <FiTrash2 />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>

            <div className="flex justify-end">
                <div className="w-full md:w-1/3 space-y-2 text-slate-700">
                    <div className="flex justify-between text-xl font-bold text-slate-900 border-t border-slate-200 pt-2 mt-2">
                        <span>Tổng cộng:</span>
                        <span>{totalAmount.toLocaleString('vi-VN')} đ</span>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-end space-x-3">
                 <button type="button" onClick={() => setEditingPurchase(null)} className="px-6 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 hover:border-slate-400 transition-colors duration-200 font-medium text-sm">Hủy</button>
                 <button type="submit" className="px-6 py-2 text-white rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-px font-medium text-sm">{purchase ? 'Cập nhật' : 'Lưu'}</button>
            </div>
        </form>
    );
};

export default PurchaseForm;
