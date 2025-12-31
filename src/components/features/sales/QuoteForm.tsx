import React, { useState, useEffect, useMemo } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import type { Quote, QuoteItem } from '../../../types';
import { useAppContext } from '../../../context/DataContext';

// --- 1. IMPORT CÁC HOOK CẦN THIẾT ---
// (Đảm bảo bạn đã có các file hook này trong thư mục hooks)
import { useCustomers } from '../../../hooks/useCustomers';
import { useProducts } from '../../../hooks/useProducts';
import { useCreateQuote, useUpdateQuote } from '../../../hooks/useQuotes'; 
import toast from 'react-hot-toast'; // Thêm toast để báo lỗi đẹp hơn

const QuoteForm: React.FC = () => {
    // 2. CHỈ LẤY NHỮNG GÌ CÓ THỰC TRONG CONTEXT
    const { editingQuote, setEditingQuote } = useAppContext();
    const quote = (editingQuote && editingQuote !== 'new') ? (editingQuote as Quote) : null;

    // 3. GỌI HOOK ĐỂ LẤY DỮ LIỆU (Thay vì lấy từ Context)
    // limit=1000 để lấy hết danh sách cho dropdown
    const { data: customersData } = useCustomers(1, 1000); 
    const customers = customersData?.data || [];

    const { data: productsData } = useProducts(1, 1000);
    const products = productsData?.data || [];

    // 4. KHAI BÁO MUTATION ĐỂ LƯU
    const createMutation = useCreateQuote();
    const updateMutation = useUpdateQuote();

    const [customerId, setCustomerId] = useState<string>('');
    const [items, setItems] = useState<QuoteItem[]>([]);
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [currentQuantity, setCurrentQuantity] = useState<number>(1);
    
    useEffect(() => {
        if (quote) {
            setCustomerId(quote.customerId);
            setItems(quote.items);
            setIssueDate(quote.issueDate);
        }
    }, [quote]);

    const handleAddItem = () => {
        const product = products.find(p => p.id === selectedProductId);
        if (!product || currentQuantity <= 0) {
            toast.error("Vui lòng chọn sản phẩm và nhập số lượng hợp lệ.");
            return;
        }

        const newItem: QuoteItem = {
            productId: product.id,
            name: product.name,
            quantity: currentQuantity,
            price: product.price,
            vat: product.vat || 0, // Thêm fallback cho VAT
        };

        const existingItemIndex = items.findIndex(i => i.productId === newItem.productId);
        if (existingItemIndex > -1) {
            const updatedItems = [...items];
            updatedItems[existingItemIndex].quantity += newItem.quantity;
            setItems(updatedItems);
        } else {
            setItems([...items, newItem]);
        }

        setSelectedProductId('');
        setCurrentQuantity(1);
    };
    
    const handleRemoveItem = (productId: string) => {
        setItems(items.filter(item => item.productId !== productId));
    };

    const totals = useMemo(() => {
        const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
        return { total };
    }, [items]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerId) {
            toast.error("Vui lòng chọn khách hàng.");
            return;
        }
        if (items.length === 0) {
            toast.error("Vui lòng thêm ít nhất một sản phẩm.");
            return;
        }

        const customer = customers.find(c => c.id === customerId);
        if (!customer) return;

        const quoteToSave: Quote = {
            id: quote?.id || '',
            quoteNumber: quote?.quoteNumber || '',
            customerId,
            customerName: customer.name,
            issueDate,
            items,
            totalAmount: totals.total,
            status: quote?.status || 'Mới'
        };

        try {
            if (quote) {
                await updateMutation.mutateAsync(quoteToSave);
                toast.success('Cập nhật báo giá thành công!');
            } else {
                await createMutation.mutateAsync(quoteToSave);
                toast.success('Tạo báo giá thành công!');
            }
            setEditingQuote(null); // Đóng form
        } catch (error) {
            console.error(error);
            toast.error('Có lỗi xảy ra khi lưu báo giá.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                    {quote ? 'Chỉnh sửa Báo giá' : 'Tạo Báo giá mới'}
                </h1>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Thông tin chung</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Khách hàng</label>
                        <select 
                            value={customerId} 
                            onChange={e => setCustomerId(e.target.value)} 
                            required
                            className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white sm:text-sm"
                        >
                            <option value="" disabled>-- Chọn khách hàng --</option>
                            {/* Dùng Optional Chaining ?. để tránh lỗi undefined */}
                            {customers?.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ngày tạo</label>
                        <input 
                            type="date" 
                            value={issueDate}
                            onChange={e => setIssueDate(e.target.value)}
                            required 
                            className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white sm:text-sm" 
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Chi tiết sản phẩm</h2>
                <div className="flex flex-col md:flex-row items-end gap-4 mb-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex-grow">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sản phẩm</label>
                        <select 
                            value={selectedProductId}
                            onChange={e => setSelectedProductId(e.target.value)}
                            className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white sm:text-sm"
                        >
                            <option value="" disabled>-- Chọn sản phẩm --</option>
                            {products?.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                     <div className="w-full md:w-32">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Số lượng</label>
                        <input 
                            type="number" 
                            value={currentQuantity}
                            onChange={e => setCurrentQuantity(parseInt(e.target.value) || 1)}
                            min="1"
                            className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white sm:text-sm"
                        />
                    </div>
                    <button type="button" onClick={handleAddItem} className="flex items-center justify-center w-full md:w-auto px-4 py-2 text-white rounded-lg bg-primary-600 hover:bg-primary-700 transition-colors">
                        <FiPlus /> <span className="ml-2">Thêm</span>
                    </button>
                </div>

                 <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-slate-50 dark:bg-slate-700">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Sản phẩm</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Số lượng</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Đơn giá</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Thành tiền</th>
                                <th className="relative px-4 py-2"><span className="sr-only">Xóa</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800">
                            {items.map(item => (
                                <tr key={item.productId} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                                    <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-200">{item.name}</td>
                                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{item.quantity}</td>
                                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{item.price.toLocaleString('vi-VN')} đ</td>
                                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-white font-medium">{(item.quantity * item.price).toLocaleString('vi-VN')} đ</td>
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
                <div className="w-full md:w-1/3 space-y-2 text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between text-xl font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                        <span>Tổng cộng:</span>
                        <span>{totals.total.toLocaleString('vi-VN')} đ</span>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-end space-x-3">
                 <button type="button" onClick={() => setEditingQuote(null)} className="px-6 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 font-medium text-sm">Hủy</button>
                 <button type="submit" className="px-6 py-2 text-white rounded-lg bg-primary-600 hover:bg-primary-700 shadow-md font-medium text-sm">{quote ? 'Cập nhật' : 'Lưu'}</button>
            </div>
        </form>
    );
};

export default QuoteForm;