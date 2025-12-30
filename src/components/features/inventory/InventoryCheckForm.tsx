import React, { useState, useEffect } from 'react';
import { FiSave, FiCheckSquare, FiLoader, FiSearch } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
import { useSaveInventoryCheck } from '../hooks/useInventoryChecks';
import { useAllProducts } from '../hooks/useProducts'; // Import Hook lấy sản phẩm

const InventoryCheckForm: React.FC = () => {
    const { editingInventoryCheck, setEditingInventoryCheck } = useAppContext();
    const check = editingInventoryCheck === 'new' ? null : editingInventoryCheck;

    const saveMutation = useSaveInventoryCheck();
    // Lấy toàn bộ sản phẩm để điền vào bảng kiểm
    const { data: productsData, isLoading: isLoadingProducts } = useAllProducts();
    const products = Array.isArray(productsData) ? productsData : (productsData?.data || []);

    const [checkDate, setCheckDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<any[]>([]);
    const [notes, setNotes] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (check) {
            setCheckDate(check.checkDate);
            setItems(check.items);
            setNotes(check.notes || '');
        } else if (products.length > 0) {
            // Nếu tạo mới, tự động load tất cả sản phẩm vào danh sách kiểm
            const allItems = products.map((p: any) => ({
                productId: p.id,
                productName: p.name,
                productSku: p.sku,
                unit: p.unit,
                stockOnHand: p.stock,
                actualStock: p.stock, // Mặc định thực tế = tồn kho
                difference: 0,
                costPrice: p.costPrice,
            }));
            setItems(allItems);
        }
    }, [check, products]);

    const handleActualStockChange = (productId: string, value: string) => {
        const actual = parseInt(value) || 0;
        setItems(prev => prev.map(item => {
            if (item.productId === productId) {
                return { ...item, actualStock: actual, difference: actual - item.stockOnHand };
            }
            return item;
        }));
    };

    const handleSubmit = async (status: 'Nháp' | 'Hoàn thành') => {
        const checkData = {
            id: check?.id,
            checkDate,
            items,
            notes,
            status
        };
        try {
            await saveMutation.mutateAsync(checkData);
            setEditingInventoryCheck(null);
        } catch (error) {
            console.error(error);
        }
    };

    const filteredItems = items.filter(item => 
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.productSku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-5xl flex flex-col h-[90vh]">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {check ? 'Cập nhật Phiếu Kiểm Kho' : 'Tạo Phiếu Kiểm Kho Mới'}
                    </h3>
                    <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            check?.status === 'Hoàn thành' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                            {check?.status || 'Mới'}
                        </span>
                    </div>
                </div>
                
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-700/30">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ngày kiểm</label>
                        <input type="date" value={checkDate} onChange={(e) => setCheckDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ghi chú</label>
                        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" placeholder="Ghi chú đợt kiểm kho..." />
                    </div>
                </div>

                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm sản phẩm trong danh sách..." 
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-0">
                    {isLoadingProducts ? (
                        <div className="flex justify-center p-10"><FiLoader className="animate-spin" /></div>
                    ) : (
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-100 dark:bg-slate-700 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase w-12">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Sản phẩm</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">ĐVT</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Tồn máy</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase w-32">Thực tế</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Chênh lệch</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {filteredItems.map((item, index) => (
                                    <tr key={item.productId} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="px-4 py-2 text-center text-slate-500">{index + 1}</td>
                                        <td className="px-4 py-2">
                                            <div className="font-medium text-slate-800 dark:text-white">{item.productName}</div>
                                            <div className="text-xs text-slate-500">{item.productSku}</div>
                                        </td>
                                        <td className="px-4 py-2 text-center text-slate-600">{item.unit}</td>
                                        <td className="px-4 py-2 text-center font-bold text-slate-700 dark:text-slate-300">{item.stockOnHand}</td>
                                        <td className="px-4 py-2 text-center">
                                            <input 
                                                type="number" 
                                                className="w-24 px-2 py-1 text-center border border-slate-300 rounded focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white font-bold"
                                                value={item.actualStock}
                                                onChange={(e) => handleActualStockChange(item.productId, e.target.value)}
                                                onFocus={(e) => e.target.select()}
                                            />
                                        </td>
                                        <td className={`px-4 py-2 text-center font-bold ${item.difference === 0 ? 'text-slate-400' : (item.difference > 0 ? 'text-green-600' : 'text-red-600')}`}>
                                            {item.difference > 0 ? `+${item.difference}` : item.difference}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                
                <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                    <button onClick={() => setEditingInventoryCheck(null)} className="px-4 py-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-white">Hủy</button>
                    {check?.status !== 'Hoàn thành' && (
                        <>
                            <button 
                                onClick={() => handleSubmit('Nháp')} 
                                disabled={saveMutation.isPending}
                                className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 font-medium"
                            >
                                Lưu Nháp
                            </button>
                            <button 
                                onClick={() => handleSubmit('Hoàn thành')} 
                                disabled={saveMutation.isPending}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center gap-2"
                            >
                                {saveMutation.isPending ? <FiLoader className="animate-spin"/> : <FiCheckSquare/>}
                                Hoàn thành & Cân bằng kho
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InventoryCheckForm;