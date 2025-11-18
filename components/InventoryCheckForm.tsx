
import React, { useState, useEffect, useMemo } from 'react';
import { FiSave, FiCheckSquare } from 'react-icons/fi';
import type { InventoryCheck, InventoryCheckItem } from '../types';
import { useAppContext } from '../context/DataContext';

const InventoryCheckForm: React.FC = () => {
    const { editingInventoryCheck, products, handleSaveInventoryCheck, setEditingInventoryCheck } = useAppContext();
    const check = editingInventoryCheck === 'new' ? null : editingInventoryCheck;

    const [checkDate, setCheckDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<InventoryCheckItem[]>([]);
    const [notes, setNotes] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (check) {
            setCheckDate(check.checkDate);
            setItems(check.items);
            setNotes(check.notes || '');
        } else {
            // New check, populate with all products
            const allItems: InventoryCheckItem[] = products.map(p => ({
                productId: p.id,
                productName: p.name,
                productSku: p.sku,
                unit: p.unit,
                stockOnHand: p.stock,
                actualStock: p.stock, // Default actual to on-hand
                difference: 0,
                costPrice: p.costPrice,
            }));
            setItems(allItems);
        }
    }, [check, products]);

    const handleActualStockChange = (productId: string, value: string) => {
        const actualStock = parseInt(value) || 0;
        setItems(prevItems => prevItems.map(item => {
            if (item.productId === productId) {
                return {
                    ...item,
                    actualStock,
                    difference: actualStock - item.stockOnHand,
                };
            }
            return item;
        }));
    };
    
    const filteredItems = useMemo(() => {
        if (!searchTerm) return items;
        return items.filter(item => 
            item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.productSku.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [items, searchTerm]);

    const handleSubmit = (status: 'Nháp' | 'Hoàn thành') => {
        if (status === 'Hoàn thành' && !window.confirm("Bạn có chắc muốn hoàn thành phiếu kiểm kho? Tồn kho sản phẩm sẽ được cập nhật và các phiếu chênh lệch sẽ được tạo tự động. Hành động này không thể hoàn tác.")) {
            return;
        }

        const checkToSave: InventoryCheck = {
            id: check?.id || '',
            checkNumber: check?.checkNumber || '',
            checkDate,
            status,
            items,
            notes,
        };

        handleSaveInventoryCheck(checkToSave);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">{check ? 'Chỉnh sửa Phiếu Kiểm kho' : 'Tạo Phiếu Kiểm kho mới'}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Nhập số lượng tồn kho thực tế để đối chiếu.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ngày kiểm kho</label>
                        <input 
                            type="date" 
                            value={checkDate}
                            onChange={e => setCheckDate(e.target.value)}
                            required 
                            className="mt-1 block w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 sm:text-sm" 
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ghi chú</label>
                        <input 
                            type="text"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="mt-1 block w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 sm:text-sm"
                        />
                    </div>
                </div>
                 <div className="mb-4">
                     <input
                      type="text"
                      placeholder="Tìm sản phẩm..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full md:w-1/3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 sm:text-sm"
                    />
                 </div>
                 <div className="overflow-x-auto max-h-[60vh]">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0">
                            <tr>
                                <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300">Sản phẩm</th>
                                <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">Tồn kho Sổ sách</th>
                                <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">Tồn kho Thực tế</th>
                                <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">Chênh lệch</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800">
                            {filteredItems.map(item => (
                                <tr key={item.productId} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                                    <td className="p-3">
                                        <p className="font-medium text-slate-800 dark:text-slate-200">{item.productName}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.productSku}</p>
                                    </td>
                                    <td className="p-3 text-center text-slate-700 dark:text-slate-300 font-medium">
                                        {item.stockOnHand} <span className="text-xs text-slate-400">{item.unit}</span>
                                    </td>
                                    <td className="p-3 text-center">
                                        <input
                                            type="number"
                                            value={item.actualStock}
                                            onChange={e => handleActualStockChange(item.productId, e.target.value)}
                                            className="w-24 text-center border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md py-1 px-1"
                                        />
                                    </td>
                                    <td className={`p-3 text-center font-bold ${item.difference > 0 ? 'text-green-600' : item.difference < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                                        {item.difference > 0 ? `+${item.difference}` : item.difference}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>
            
            <div className="flex justify-end space-x-3">
                 <button type="button" onClick={() => setEditingInventoryCheck(null)} className="px-6 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors duration-200 font-medium text-sm">Hủy</button>
                 <button type="button" onClick={() => handleSubmit('Nháp')} className="flex items-center gap-2 px-6 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 shadow-md font-medium text-sm">
                    <FiSave/> Lưu nháp
                 </button>
                 <button type="button" onClick={() => handleSubmit('Hoàn thành')} className="flex items-center gap-2 px-6 py-2 text-white rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-md hover:shadow-lg transition-all font-medium text-sm">
                    <FiCheckSquare/> Hoàn thành & Cân bằng kho
                </button>
            </div>
        </div>
    );
};

export default InventoryCheckForm;
