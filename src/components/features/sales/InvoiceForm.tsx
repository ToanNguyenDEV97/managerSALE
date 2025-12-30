
import React, { useState, useEffect, useMemo } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import type { Invoice, InvoiceItem } from '../types';
import { useAppContext } from '../context/DataContext';

const InvoiceForm: React.FC = () => {
    const { editingInvoice, customers, products, handleSaveInvoice, setEditingInvoice } = useAppContext();
    const invoice = editingInvoice === 'new' ? null : editingInvoice;

    const [customerId, setCustomerId] = useState<string>('');
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState<Invoice['status']>('Chưa thanh toán');
    
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [currentQuantity, setCurrentQuantity] = useState<number>(1);
    
    useEffect(() => {
        if (invoice) {
            setCustomerId(invoice.customer?.id || (invoice as any).customerId || '');
            setItems(invoice.items);
            setIssueDate(invoice.issueDate);
            setStatus(invoice.status);
        }
    }, [invoice]);

    const handleAddItem = () => {
        const product = products.find(p => p.id === selectedProductId);
        if (!product || currentQuantity <= 0) {
            alert("Vui lòng chọn sản phẩm và nhập số lượng hợp lệ.");
            return;
        }

        const cartQuantity = items.find(i => i.productId === product.id)?.quantity || 0;
        const remainingStock = product.stock - cartQuantity;

        if(currentQuantity > remainingStock) {
            alert(`Số lượng tồn kho không đủ. Có thể thêm tối đa: ${remainingStock}`);
            return;
        }

        const newItem: InvoiceItem = {
            productId: product.id,
            name: product.name,
            quantity: currentQuantity,
            price: product.price,
            costPrice: product.costPrice,
            vat: product.vat,
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
        const vatAmount = items.reduce((acc, item) => {
            const itemTotal = item.price * item.quantity;
            const basePrice = itemTotal / (1 + item.vat / 100);
            return acc + (itemTotal - basePrice);
        }, 0);
        const subtotal = total - vatAmount;
        return { subtotal, vatAmount, total };
    }, [items]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerId) {
            alert("Vui lòng chọn khách hàng.");
            return;
        }
        if (items.length === 0) {
            alert("Vui lòng thêm ít nhất một sản phẩm vào hóa đơn.");
            return;
        }

        const customer = customers.find(c => c.id === customerId);
        if (!customer) return;

        const invoiceToSave: Invoice = {
            id: invoice?.id || '',
            invoiceNumber: invoice?.invoiceNumber || '',
            
            // THAY ĐỔI TẠI ĐÂY: Tạo Snapshot khách hàng
            customer: {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                address: customer.address,
                // taxCode: customer.taxCode // Thêm dòng này nếu trong Customer có MST
            },
            
            // XÓA 2 DÒNG CŨ NÀY ĐI:
            // customerId,
            // customerName: customer.name,
            
            issueDate,
            items,
            totalAmount: totals.total,
            paidAmount: invoice?.paidAmount || 0,
            status: status
        };

        await handleSaveInvoice(invoiceToSave);
    };
    
    const inputStyles = "mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400";
    const labelStyles = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";


    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">{invoice ? 'Chỉnh sửa Hóa đơn' : 'Tạo Hóa đơn mới'}</h1>
            </div>

            {/* Invoice Details */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Thông tin chung</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <label className={labelStyles}>Khách hàng</label>
                        <select 
                            value={customerId} 
                            onChange={e => setCustomerId(e.target.value)} 
                            required
                            className={inputStyles}
                        >
                            <option value="" disabled>-- Chọn khách hàng --</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className={labelStyles}>Ngày xuất hóa đơn</label>
                        <input 
                            type="date" 
                            value={issueDate}
                            onChange={e => setIssueDate(e.target.value)}
                            required 
                            className={inputStyles} 
                        />
                    </div>
                    <div>
                        <label className={labelStyles}>Trạng thái</label>
                         <select 
                            value={status} 
                            onChange={e => setStatus(e.target.value as Invoice['status'])} 
                            required
                            className={inputStyles}
                        >
                            <option value="Chưa thanh toán">Chưa thanh toán</option>
                            <option value="Đã thanh toán">Đã thanh toán</option>
                            <option value="Quá hạn">Quá hạn</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Invoice Items */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Chi tiết sản phẩm</h2>
                <div className="flex flex-col md:flex-row items-end gap-4 mb-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex-grow">
                        <label className={labelStyles}>Sản phẩm</label>
                        <select 
                            value={selectedProductId}
                            onChange={e => setSelectedProductId(e.target.value)}
                            className={inputStyles}
                        >
                            <option value="" disabled>-- Chọn sản phẩm --</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name} (Tồn: {p.stock})</option>)}
                        </select>
                    </div>
                     <div className="w-full md:w-32">
                        <label className={labelStyles}>Số lượng</label>
                        <input 
                            type="number" 
                            value={currentQuantity}
                            onChange={e => setCurrentQuantity(parseInt(e.target.value) || 1)}
                            min="1"
                            className={inputStyles}
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
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Đơn giá (gồm VAT)</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Thành tiền (gồm VAT)</th>
                                <th className="relative px-4 py-2"><span className="sr-only">Xóa</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800">
                            {items.map(item => (
                                <tr key={item.productId} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                                    <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-200">{item.name}</td>
                                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{item.quantity}</td>
                                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{item.price.toLocaleString('vi-VN')} đ</td>
                                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100 font-medium">{(item.quantity * item.price).toLocaleString('vi-VN')} đ</td>
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

            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="w-full md:w-1/3"></div>
                <div className="w-full md:w-1/3 space-y-2 text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between">
                        <span>Tổng phụ:</span>
                        <span className="font-medium">{totals.subtotal.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} đ</span>
                    </div>
                     <div className="flex justify-between">
                        <span>Thuế GTGT:</span>
                        <span className="font-medium">{totals.vatAmount.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} đ</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-slate-600 pt-2 mt-2">
                        <span>Tổng cộng:</span>
                        <span>{totals.total.toLocaleString('vi-VN')} đ</span>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-end space-x-3">
                 <button type="button" onClick={() => setEditingInvoice(null)} className="px-6 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors duration-200 font-medium text-sm">Hủy</button>
                 <button type="submit" className="px-6 py-2 text-white rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-px font-medium text-sm">{invoice ? 'Cập nhật Hóa đơn' : 'Lưu Hóa đơn'}</button>
            </div>
        </form>
    );
};

export default InvoiceForm;
