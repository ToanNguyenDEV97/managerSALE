import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
    FiX, FiSearch, FiTrash2, FiSave, FiLoader, FiUser, 
    FiFileText, FiChevronDown, FiAlertCircle 
} from 'react-icons/fi';
import { useAllProducts } from '../hooks/useProducts';
import { useAllCustomers } from '../hooks/useCustomers';
import { useSaveOrder } from '../hooks/useOrders';
import toast from 'react-hot-toast';

interface Props {
    initialData?: any;
    onClose: () => void;
}

const OrderFormModal: React.FC<Props> = ({ initialData, onClose }) => {
    const isEditMode = !!initialData;
    
    // --- 1. DATA ---
    const { data: productsData } = useAllProducts();
    const products = Array.isArray(productsData) ? productsData : (productsData?.data || []);
    const { data: customersData } = useAllCustomers();
    const customers = Array.isArray(customersData) ? customersData : (customersData?.data || []);
    const saveOrderMutation = useSaveOrder();

    // --- 2. STATE ---
    const [customerId, setCustomerId] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [note, setNote] = useState('');
    const [items, setItems] = useState<any[]>([]);

    // Search Box State
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Load dữ liệu khi sửa
    useEffect(() => {
        if (initialData) {
            setCustomerId(initialData.customerId || '');
            setCustomerName(initialData.customerName || '');
            setNote(initialData.note || '');
            setItems(initialData.items.map((i: any) => ({
                productId: i.productId,
                sku: i.sku || '',
                name: i.name,
                unit: i.unit || 'Cái',
                price: i.price,
                quantity: i.quantity,
                stock: 999 
            })));
        }
    }, [initialData]);

    // Click outside để đóng dropdown
    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Lọc sản phẩm tìm kiếm
    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products.slice(0, 20); 
        const lower = searchTerm.toLowerCase();
        return products.filter((p: any) => 
            p.name.toLowerCase().includes(lower) || 
            (p.sku && p.sku.toLowerCase().includes(lower))
        ).slice(0, 20); 
    }, [searchTerm, products]);

    // --- 3. ACTIONS ---

    const handleSelectProduct = (product: any) => {
        if (product.stock <= 0) {
            toast.error('Sản phẩm đã hết hàng!');
            return;
        }

        const pid = product.id || product._id;
        const exists = items.find(i => i.productId === pid);

        if (exists) {
            setItems(prev => prev.map(i => i.productId === pid ? { ...i, quantity: i.quantity + 1 } : i));
            toast.success('Đã tăng số lượng');
        } else {
            setItems(prev => [...prev, {
                productId: pid,
                sku: product.sku,
                name: product.name,
                unit: product.unit || 'Cái',
                price: product.price,
                quantity: 1,
                stock: product.stock
            }]);
        }
        setSearchTerm('');
        setShowDropdown(false);
    };

    const handleQuantityChange = (index: number, val: string) => {
        const qty = parseInt(val);
        if (isNaN(qty) || qty < 1) return;
        
        setItems(prev => {
            const newItems = [...prev];
            if (qty > newItems[index].stock) {
                toast.error(`Kho chỉ còn ${newItems[index].stock}`);
                newItems[index].quantity = newItems[index].stock;
            } else {
                newItems[index].quantity = qty;
            }
            return newItems;
        });
    };

    const handlePriceChange = (index: number, val: string) => {
        const price = parseInt(val.replace(/[^0-9]/g, ''));
        if (isNaN(price)) return;
        setItems(prev => {
            const newItems = [...prev];
            newItems[index].price = price;
            return newItems;
        });
    };

    const handleRemove = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!customerId && !customerName) return toast.error('Vui lòng chọn khách hàng');
        if (items.length === 0) return toast.error('Đơn hàng chưa có sản phẩm');

        let finalName = customerName;
        if (customerId) {
            const c = customers.find((cu: any) => (cu.id || cu._id) === customerId);
            if (c) finalName = c.name;
        }

        const totalAmount = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

        const payload = {
            id: initialData?.id || initialData?._id,
            customerId,
            customerName: finalName,
            items,
            totalAmount,
            note,
            status: initialData?.status || 'Mới'
        };

        try {
            await saveOrderMutation.mutateAsync(payload);
            onClose();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const grandTotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    return (
        <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
                
                {/* --- HEADER --- */}
                <div className="px-6 py-4 border-b flex justify-between items-center bg-white">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 uppercase flex items-center gap-2">
                            {/* Đổi icon sang màu Primary */}
                            <FiFileText className="text-primary-600"/>
                            {isEditMode ? `Cập nhật đơn #${initialData.orderNumber}` : 'Tạo phiếu đặt hàng'}
                        </h2>
                        <p className="text-xs text-slate-500">Nhập thông tin chi tiết đơn hàng</p>
                    </div>
                    <div className="flex gap-3">
                         <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium transition-colors">Đóng</button>
                         {/* ĐỔI MÀU NÚT THÀNH PRIMARY */}
                         <button 
                            onClick={handleSave} 
                            disabled={saveOrderMutation.isPending}
                            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 shadow-md flex items-center gap-2 transition-transform active:scale-95 shadow-primary-500/30"
                        >
                             {saveOrderMutation.isPending ? <FiLoader className="animate-spin"/> : <FiSave/>}
                             Lưu đơn hàng
                         </button>
                    </div>
                </div>

                {/* --- BODY --- */}
                <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
                    
                    {/* KHUNG THÔNG TIN CHUNG */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Chọn khách */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Khách hàng <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <select 
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all appearance-none"
                                    value={customerId}
                                    onChange={(e) => setCustomerId(e.target.value)}
                                >
                                    <option value="">-- Chọn khách hàng --</option>
                                    {customers.map((c: any) => (
                                        <option key={c.id || c._id} value={c.id || c._id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                                    ))}
                                </select>
                                <FiUser className="absolute left-3.5 top-3 text-slate-400"/>
                                <FiChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none"/>
                            </div>
                        </div>

                        {/* Ghi chú */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Ghi chú</label>
                            <input 
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Ghi chú nội bộ..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* KHUNG CHI TIẾT SẢN PHẨM */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px] flex flex-col">
                        
                        {/* Thanh tìm kiếm sản phẩm */}
                        <div className="p-4 border-b bg-slate-50/50 relative" ref={searchRef}>
                            <div className="relative">
                                {/* Đổi icon & border sang Primary */}
                                <FiSearch className="absolute left-3 top-3 text-primary-500"/>
                                <input 
                                    className="w-full pl-10 pr-4 py-2.5 border border-primary-200 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                    placeholder="Tìm kiếm và thêm sản phẩm (Gõ tên hoặc mã SKU)..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                                    onFocus={() => setShowDropdown(true)}
                                />
                            </div>

                            {/* Dropdown Gợi ý */}
                            {showDropdown && (
                                <div className="absolute top-full left-4 right-4 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                                    {filteredProducts.length === 0 ? (
                                        <div className="p-4 text-center text-slate-400">Không tìm thấy sản phẩm</div>
                                    ) : (
                                        filteredProducts.map((p: any) => (
                                            <div 
                                                key={p.id || p._id} 
                                                className="px-4 py-3 hover:bg-primary-50 cursor-pointer border-b last:border-0 flex justify-between items-center group"
                                                onClick={() => handleSelectProduct(p)}
                                            >
                                                <div>
                                                    <div className="font-bold text-slate-800 group-hover:text-primary-700">{p.name}</div>
                                                    <div className="text-xs text-slate-500">SKU: {p.sku || '---'} | ĐVT: {p.unit || 'Cái'}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-primary-600">{p.price?.toLocaleString()} ₫</div>
                                                    <div className={`text-xs ${p.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>Tồn: {p.stock}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Bảng dữ liệu */}
                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-100 text-slate-600 text-xs uppercase font-bold tracking-wider">
                                        <th className="p-4 w-10 text-center">#</th>
                                        <th className="p-4">Mã SP</th>
                                        <th className="p-4">Tên Sản Phẩm</th>
                                        <th className="p-4 w-24">ĐVT</th>
                                        <th className="p-4 w-32 text-center">Số lượng</th>
                                        <th className="p-4 w-40 text-right">Đơn giá</th>
                                        <th className="p-4 w-40 text-right">Thành tiền</th>
                                        <th className="p-4 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="p-10 text-center text-slate-400 italic bg-white">
                                                <FiAlertCircle className="inline-block mb-2 text-2xl"/>
                                                <br/>Chưa có dòng hàng nào. Vui lòng tìm kiếm sản phẩm ở trên.
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                                <td className="p-4 text-center text-slate-400">{idx + 1}</td>
                                                <td className="p-4 font-mono text-slate-500">{item.sku || '---'}</td>
                                                <td className="p-4 font-medium text-slate-800">{item.name}</td>
                                                <td className="p-4 text-slate-500">{item.unit}</td>
                                                <td className="p-4">
                                                    <input 
                                                        type="number" min="1"
                                                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-center focus:ring-2 focus:ring-primary-500 outline-none font-bold"
                                                        value={item.quantity}
                                                        onChange={(e) => handleQuantityChange(idx, e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-4 text-right">
                                                    <input 
                                                        type="text"
                                                        className="w-full px-2 py-1.5 border border-transparent hover:border-slate-300 focus:border-primary-500 rounded text-right outline-none bg-transparent focus:bg-white"
                                                        value={item.price?.toLocaleString()}
                                                        onChange={(e) => handlePriceChange(idx, e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-4 text-right font-bold text-slate-800">
                                                    {(item.price * item.quantity).toLocaleString()}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button 
                                                        onClick={() => handleRemove(idx)}
                                                        className="text-slate-300 hover:text-red-500 p-2 transition-colors"
                                                        title="Xóa dòng"
                                                    >
                                                        <FiTrash2 size={16}/>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer tổng tiền */}
                        <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end">
                            <div className="w-64 space-y-3">
                                <div className="flex justify-between text-slate-500 text-sm">
                                    <span>Số lượng dòng:</span>
                                    <span>{items.length}</span>
                                </div>
                                <div className="flex justify-between text-slate-500 text-sm">
                                    <span>Tổng số lượng SP:</span>
                                    <span>{items.reduce((s, i) => s + i.quantity, 0)}</span>
                                </div>
                                <div className="h-px bg-slate-200 my-2"></div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-800 text-lg">Tổng cộng:</span>
                                    <span className="font-bold text-primary-600 text-2xl">{grandTotal.toLocaleString()} ₫</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default OrderFormModal;