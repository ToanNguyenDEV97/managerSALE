import React, { useState, useEffect, useMemo } from 'react';
import { FiPlus, FiTrash2, FiSave, FiUser, FiSearch, FiX } from 'react-icons/fi';
import { useCreateQuote, useUpdateQuote } from '../../../hooks/useQuotes';
import { useProducts } from '../../../hooks/useProducts';
import { useDebounce } from '../../../hooks/useDebounce';
import { useAllCustomers } from '../../../hooks/useCustomers';
import { NumericFormat } from 'react-number-format';
import { Button } from '../../common/Button';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../../utils/currency';

interface Props {
    initialData?: any;
    onSuccess: () => void;
    onCancel: () => void;
}

const QuoteForm: React.FC<Props> = ({ initialData, onSuccess, onCancel }) => {
    // --- STATE ---
    const [customerSearch, setCustomerSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    
    const [productSearch, setProductSearch] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    
    const [items, setItems] = useState<any[]>([]);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [note, setNote] = useState('');
    const [expiryDate, setExpiryDate] = useState('');

    // --- HOOKS ---
    const createMutation = useCreateQuote();
    const updateMutation = useUpdateQuote();
    const debouncedProductSearch = useDebounce(productSearch, 300);
    
    // Gọi API sản phẩm
    const { data: productsData } = useProducts(1, 20, debouncedProductSearch);
    const { data: customersData } = useAllCustomers();

    // --- EFFECT: Load Initial Data ---
    useEffect(() => {
        if (initialData) {
            setSelectedCustomer({
                _id: initialData.customerId,
                name: initialData.customerName,
                phone: initialData.customerPhone,
                address: initialData.customerAddress
            });
            setItems(initialData.items || []);
            setDiscountAmount(initialData.discountAmount || 0);
            setNote(initialData.note || '');
            if(initialData.expiryDate) {
                setExpiryDate(new Date(initialData.expiryDate).toISOString().split('T')[0]);
            }
        }
    }, [initialData]);

    // --- LOGIC: Xử lý dữ liệu an toàn ---
    const productList = useMemo(() => {
        if (!productsData) return [];
        if (productsData.data && Array.isArray(productsData.data)) return productsData.data;
        if (Array.isArray(productsData)) return productsData;
        return (productsData as any).products || [];
    }, [productsData]);

    const customerList = customersData?.data || [];
    
    const filteredCustomers = customerList.filter((c: any) => 
        c.name?.toLowerCase().includes(customerSearch.toLowerCase()) || 
        c.phone?.includes(customerSearch)
    );

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const finalAmount = totalAmount - discountAmount;

    // --- HANDLERS ---
    const handleSelectCustomer = (c: any) => {
        setSelectedCustomer(c);
        setCustomerSearch('');
        setShowCustomerDropdown(false);
    };

    const handleAddProduct = (p: any) => {
        const productId = p._id || p.id;
        const exist = items.find(i => (i.productId || i.id) === productId);
        
        // [FIX] Lấy đúng giá trị từ API (ưu tiên price/stock, dự phòng retailPrice/quantity)
        const productPrice = p.price ?? p.retailPrice ?? 0;
        
        if (exist) {
            setItems(items.map(i => ((i.productId || i.id) === productId) ? { ...i, quantity: i.quantity + 1 } : i));
            toast.success(`Đã tăng số lượng: ${p.name}`);
        } else {
            setItems([...items, {
                productId: productId,
                sku: p.sku,
                name: p.name,
                unit: p.unit || 'Cái',
                quantity: 1,
                price: productPrice // [FIX] Sử dụng giá đã check
            }]);
            toast.success(`Đã thêm: ${p.name}`);
        }
        setShowProductDropdown(false);
        setProductSearch('');
    };

    const handleUpdateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomer) return toast.error('Vui lòng chọn khách hàng');
        if (items.length === 0) return toast.error('Vui lòng chọn sản phẩm');

        const payload = {
            customerId: selectedCustomer._id || selectedCustomer.id,
            customerName: selectedCustomer.name,
            customerPhone: selectedCustomer.phone,
            customerAddress: selectedCustomer.address,
            items: items.map(i => ({
                productId: i.productId || i.id,
                sku: i.sku,
                name: i.name,
                unit: i.unit,
                quantity: Number(i.quantity),
                price: Number(i.price),
                total: Number(i.quantity) * Number(i.price)
            })),
            discountAmount,
            note,
            expiryDate: expiryDate ? new Date(expiryDate) : undefined
        };

        try {
            if (initialData) {
                await updateMutation.mutateAsync({ id: initialData._id || initialData.id, data: payload });
            } else {
                await createMutation.mutateAsync(payload);
            }
            onSuccess();
        } catch (error) {
            // Error handled by hook
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-20">
            {/* 1. KHÁCH HÀNG */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative z-[60]">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Khách hàng</label>
                    {selectedCustomer ? (
                        <div className="flex justify-between items-center p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <div>
                                <div className="font-bold text-blue-800">{selectedCustomer.name}</div>
                                <div className="text-xs text-slate-500">{selectedCustomer.phone} - {selectedCustomer.address}</div>
                            </div>
                            <button type="button" onClick={() => setSelectedCustomer(null)} className="text-red-500 hover:bg-red-100 p-1 rounded">
                                <FiTrash2/>
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="relative">
                                <input 
                                    type="text" className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Tìm khách hàng (Tên/SĐT)..."
                                    value={customerSearch}
                                    onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                                    onFocus={() => setShowCustomerDropdown(true)}
                                    autoComplete="off"
                                />
                                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                            </div>
                            
                            {showCustomerDropdown && (
                                <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-fade-in">
                                    {filteredCustomers.length > 0 ? (
                                        filteredCustomers.map((c: any) => (
                                            <div key={c._id || c.id} onClick={() => handleSelectCustomer(c)} className="p-2.5 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0">
                                                <div className="font-bold text-sm text-slate-700">{c.name}</div>
                                                <div className="text-xs text-slate-500">{c.phone}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-3 text-center text-slate-500 text-sm">
                                            {customerSearch ? 'Không tìm thấy khách hàng' : 'Nhập tên để tìm...'}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="relative z-10">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ngày hết hạn</label>
                    <input 
                        type="date" className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
                    />
                </div>
            </div>

            {/* 2. SẢN PHẨM */}
            <div className="relative z-[50]">
                <label className="block text-sm font-medium text-slate-700 mb-1">Thêm sản phẩm</label>
                <div className="relative">
                    <input 
                        type="text" className="w-full pl-9 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Gõ tên hoặc mã sản phẩm..."
                        value={productSearch}
                        onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true); }}
                        onFocus={() => setShowProductDropdown(true)}
                        autoComplete="off"
                    />
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                    {productSearch && (
                        <button 
                            type="button" 
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            onClick={() => { setProductSearch(''); setShowProductDropdown(false); }}
                        >
                            <FiX />
                        </button>
                    )}
                </div>
                
                {showProductDropdown && (
                    <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-fade-in">
                        {productList.length > 0 ? (
                            productList.map((p: any) => (
                                <div key={p._id || p.id} onClick={() => handleAddProduct(p)} className="p-2.5 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center group">
                                    <div>
                                        <div className="font-bold text-sm text-slate-700 group-hover:text-blue-700">{p.name}</div>
                                        {/* [FIX] Hiển thị Tồn kho (stock hoặc quantity) */}
                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                            <span>SKU: {p.sku || '---'}</span>
                                            <span className="text-slate-300">|</span>
                                            <span>Tồn: <strong className="text-slate-700">{p.stock ?? p.quantity ?? 0}</strong></span>
                                        </div>
                                    </div>
                                    {/* [FIX] Hiển thị Giá (price hoặc retailPrice) */}
                                    <div className="font-bold text-blue-600 text-sm">
                                        {formatCurrency(p.price ?? p.retailPrice ?? 0)}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-slate-500 text-sm flex flex-col items-center">
                                <span className="mb-1">Không tìm thấy sản phẩm nào.</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 3. BẢNG CHI TIẾT */}
            <div className="border rounded-lg overflow-hidden border-slate-200 z-0 relative">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                        <tr>
                            <th className="p-3">Sản phẩm</th>
                            <th className="p-3 w-20">ĐVT</th>
                            <th className="p-3 w-24">SL</th>
                            <th className="p-3 w-32">Đơn giá</th>
                            <th className="p-3 w-32 text-right">Thành tiền</th>
                            <th className="p-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.map((item, index) => (
                            <tr key={index} className="hover:bg-slate-50">
                                <td className="p-3">
                                    <div className="font-medium text-slate-800">{item.name}</div>
                                    <div className="text-xs text-slate-500">{item.sku}</div>
                                </td>
                                <td className="p-3"><input className="w-full bg-transparent border-b border-slate-200 focus:border-blue-500 outline-none pb-1" value={item.unit} onChange={e => handleUpdateItem(index, 'unit', e.target.value)}/></td>
                                <td className="p-3"><input type="number" className="w-full bg-transparent border rounded p-1 text-center outline-none focus:ring-1 focus:ring-blue-500" value={item.quantity} onChange={e => handleUpdateItem(index, 'quantity', Number(e.target.value))}/></td>
                                <td className="p-3">
                                    <NumericFormat className="w-full bg-transparent border rounded p-1 text-right outline-none focus:ring-1 focus:ring-blue-500" value={item.price} thousandSeparator="," onValueChange={(v) => handleUpdateItem(index, 'price', v.floatValue)}/>
                                </td>
                                <td className="p-3 text-right font-bold text-slate-700">{formatCurrency(item.quantity * item.price)}</td>
                                <td className="p-3 text-right">
                                    <button type="button" onClick={() => handleRemoveItem(index)} className="text-slate-400 hover:text-red-500 p-1 transition-colors"><FiTrash2/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {items.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-sm bg-slate-50/50 flex flex-col items-center">
                        <FiSearch size={24} className="mb-2 opacity-50"/>
                        Hãy chọn sản phẩm từ ô tìm kiếm bên trên
                    </div>
                )}
            </div>

            {/* 4. TỔNG KẾT */}
            <div className="flex flex-col items-end space-y-2 pt-4 border-t border-slate-200">
                <div className="flex justify-between w-64 text-sm">
                    <span className="text-slate-600">Tổng tiền hàng:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between w-64 text-sm items-center">
                    <span className="text-slate-600">Chiết khấu:</span>
                    <NumericFormat 
                        className="w-24 text-right border-b border-dashed border-slate-300 outline-none focus:border-blue-500 bg-transparent py-0.5" 
                        value={discountAmount} thousandSeparator="," 
                        onValueChange={(v) => setDiscountAmount(v.floatValue || 0)}
                        placeholder="0"
                    />
                </div>
                <div className="flex justify-between w-64 text-base font-bold pt-3 border-t border-slate-100 text-blue-700">
                    <span>Khách phải trả:</span>
                    <span>{formatCurrency(finalAmount)}</span>
                </div>
            </div>

            {/* 5. GHI CHÚ & BUTTONS */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                <textarea 
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none text-sm"
                    placeholder="Ghi chú báo giá..."
                    value={note} onChange={e => setNote(e.target.value)}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button type="button" variant="outline" onClick={onCancel}>Hủy bỏ</Button>
                <Button type="submit" variant="primary" icon={<FiSave/>} isLoading={createMutation.isPending || updateMutation.isPending}>
                    {initialData ? 'Cập Nhật' : 'Lưu Báo Giá'}
                </Button>
            </div>
        </form>
    );
};

export default QuoteForm;