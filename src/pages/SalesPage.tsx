import React, { useState, useEffect, useRef } from 'react';
import { 
    FiSearch, FiShoppingCart, FiTrash2, FiPlus, FiMinus, 
    FiUser, FiCheckCircle, FiFilter, FiAlertCircle, FiCreditCard, FiDollarSign, FiPrinter, FiFileText,
    FiTruck, FiMapPin, FiPhone // [MỚI] Thêm icon
} from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query'; 
import { NumericFormat } from 'react-number-format';
import { Button } from '../components/common/Button';
import { useProducts } from '../hooks/useProducts';
import { useAllCustomers } from '../hooks/useCustomers'; 
import { useSaveInvoice } from '../hooks/useInvoices'; // [SỬA] Dùng hook tạo hóa đơn chuẩn
import { useDebounce } from '../hooks/useDebounce';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/currency';
import { api } from '../utils/api'; 
import QuickCustomerModal from '../components/features/partners/QuickCustomerModal';

// --- TYPE DEFINITIONS ---
interface CartItem {
    id: string; 
    sku: string;
    name: string;
    price: number;
    quantity: number;
    stock: number;
}

interface Category {
    _id: string;
    name: string;
}

const SalesPage: React.FC = () => {
    // --- 1. STATE & HOOKS ---
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [selectedCategory, setSelectedCategory] = useState(''); 
    
    // API Categories
    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res: any = await api('/api/categories');
            return Array.isArray(res) ? res : (res.data || []);
        },
        staleTime: 5 * 60 * 1000, 
    });

    const { data: productsData, isLoading: loadingProducts } = useProducts(1, 60, debouncedSearch, selectedCategory);
    const products = productsData?.data || [];

    const { data: customersData } = useAllCustomers();
    const customers = customersData?.data || [];

    // State Bán hàng
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerId, setCustomerId] = useState('');
    
    // State Thanh toán & Giao hàng [MỚI]
    const [amountPaid, setAmountPaid] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState('Tiền mặt');
    const [isPrintEnabled, setIsPrintEnabled] = useState(true); 
    const [orderNote, setOrderNote] = useState('');
    const [showNoteInput, setShowNoteInput] = useState(false);

    // [MỚI] State cho Giao hàng
    const [isDelivery, setIsDelivery] = useState(false);
    const [shipFee, setShipFee] = useState<number>(0);
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');

    // Helpers
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const createInvoiceMutation = useSaveInvoice(); // Dùng mutation tạo hóa đơn
    const searchInputRef = useRef<HTMLInputElement>(null);

    // --- 2. LOGIC TỰ ĐỘNG ---

    // [MỚI] Tự động điền thông tin giao hàng khi chọn khách
    useEffect(() => {
        if (customerId) {
            const customer = customers.find((c: any) => c.id === customerId || c._id === customerId);
            if (customer) {
                if (isDelivery) {
                    setDeliveryAddress(customer.address || '');
                    setRecipientPhone(customer.phone || '');
                }
            }
        } else {
            // Nếu bỏ chọn khách thì reset (tùy nhu cầu)
            if (isDelivery) {
                setDeliveryAddress('');
                setRecipientPhone('');
            }
        }
    }, [customerId, isDelivery, customers]);

    // --- 3. LOGIC GIỎ HÀNG ---
    
    const addToCart = (product: any) => {
        const prodId = product._id || product.id;
        
        if (product.stock <= 0) return toast.error('Sản phẩm đã hết hàng!');
        
        setCart(prev => {
            const existing = prev.find(item => item.id === prodId);
            if (existing) {
                if (existing.quantity >= product.stock) {
                    toast.error('Không đủ tồn kho!');
                    return prev;
                }
                return prev.map(item => item.id === prodId ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { 
                id: prodId, 
                sku: product.sku, 
                name: product.name, 
                price: product.price, 
                quantity: 1, 
                stock: product.stock 
            }];
        });
        searchInputRef.current?.focus();
    };

    const handleQuantityChange = (id: string, newQty: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                if (newQty > item.stock) {
                    toast.error(`Chỉ còn ${item.stock} sản phẩm!`);
                    return { ...item, quantity: item.stock };
                }
                if (newQty < 1) return { ...item, quantity: 1 };
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                if (newQty > item.stock) {
                    toast.error('Vượt quá tồn kho!');
                    return item;
                }
                if (newQty < 1) return item;
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    // [CẬP NHẬT] Tính toán tổng tiền
    const productTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const finalTotal = productTotal + (isDelivery ? shipFee : 0); // Cộng phí ship nếu có
    const changeAmount = amountPaid - finalTotal;

    // Tự động điền tiền khách đưa = tổng tiền khi tổng tiền thay đổi (nếu chưa nhập gì)
    useEffect(() => {
        if (finalTotal > 0 && amountPaid === 0) setAmountPaid(finalTotal);
    }, [finalTotal]);

    // --- 4. THANH TOÁN ---
    const handleCheckout = async () => {
        if (cart.length === 0) return toast.error('Giỏ hàng trống!');
        
        // [MỚI] Validate giao hàng
        if (isDelivery) {
            if (!deliveryAddress.trim()) return toast.error('Vui lòng nhập địa chỉ giao hàng!');
            if (!recipientPhone.trim()) return toast.error('Vui lòng nhập SĐT người nhận!');
        }

        try {
            const payload = {
                customerId: customerId || null,
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    price: item.price
                })),
                paymentAmount: amountPaid, 
                paymentMethod: paymentMethod,
                note: orderNote,
                
                // [MỚI] Thông tin giao hàng gửi xuống backend
                deliveryInfo: isDelivery ? {
                    isDelivery: true,
                    shipFee: shipFee,
                    address: deliveryAddress,
                    phone: recipientPhone,
                    shipperName: '', // Có thể thêm field chọn shipper sau
                    status: 'Chờ giao'
                } : { isDelivery: false }
            };

            await createInvoiceMutation.mutateAsync(payload);
            
            // Reset state
            setCart([]);
            setAmountPaid(0);
            setCustomerId('');
            setSearchTerm('');
            setOrderNote('');
            setShowNoteInput(false);
            
            // Reset Delivery
            setIsDelivery(false);
            setShipFee(0);
            setDeliveryAddress('');
            setRecipientPhone('');

            searchInputRef.current?.focus();
        } catch (error: any) {
            console.error(error);
            // Error đã được hook handle
        }
    };

    // Helper Components
   const PaymentMethodButton = ({ method, icon: Icon, label, currentMethod, setMethod }: any) => (
    <button
        onClick={() => setMethod(method)}
        className={`flex-1 flex flex-col items-center justify-center py-2 rounded-lg border transition-all duration-200 gap-1
            ${currentMethod === method 
                ? 'bg-primary-600 border-primary-600 text-white shadow-md' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-primary-50 hover:border-primary-200'
            }
        `}
    >
        <Icon size={18} />
        <span className="text-[11px] font-bold">{label}</span>
    </button>
    );

    const QuickCashButton = ({ value, onClick }: { value: number, onClick: (val: number) => void }) => (
        <button
            onClick={() => onClick(value)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition-colors"
        >
            {value.toLocaleString('vi-VN')}
        </button>
    );

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] gap-4 animate-fade-in pb-2">
            
            {/* === CỘT TRÁI: DANH SÁCH SẢN PHẨM === */}
            <div className="w-full lg:w-[65%] flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col gap-4 bg-white z-10 shadow-sm">
                    <div className="relative w-full">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                        <input 
                            ref={searchInputRef}
                            type="text" 
                            autoFocus
                            placeholder="Tìm tên sản phẩm, mã SKU, mã vạch..." 
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all font-medium text-slate-700"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar scroll-smooth">
                        <div className="flex items-center gap-1.5 text-slate-400 mr-2 shrink-0">
                            <FiFilter size={14}/> <span className="text-xs font-semibold uppercase">Lọc:</span>
                        </div>
                        <button onClick={() => setSelectedCategory('')} className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${selectedCategory === '' ? 'bg-primary-600 border-primary-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Tất cả</button>
                        {categories.map((cat: Category) => (
                            <button key={cat._id} onClick={() => setSelectedCategory(cat.name)} className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${selectedCategory === cat.name ? 'bg-primary-600 border-primary-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{cat.name}</button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50">
                    {loadingProducts ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div><p>Đang tải...</p></div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60"><FiAlertCircle size={40} className="mb-2"/><p>Không tìm thấy sản phẩm</p></div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 content-start">
                            {products.map((product: any) => (
                                <div key={product._id || product.id} onClick={() => addToCart(product)} className={`group bg-white rounded-lg border p-3 cursor-pointer flex flex-col shadow-sm select-none transition-all ${product.stock <= 0 ? 'border-slate-100 bg-slate-50 opacity-60 pointer-events-none' : 'border-slate-200 hover:border-primary-500 hover:shadow-md hover:-translate-y-0.5'}`}>
                                    <div className="flex justify-between items-start gap-2 mb-2">
                                        <h3 className="font-semibold text-slate-700 text-sm line-clamp-2 leading-snug group-hover:text-primary-700">{product.name}</h3>
                                        {product.stock <= 0 ? <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">HẾT</span> : <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">SL: {product.stock}</span>}
                                    </div>
                                    <div className="mt-auto flex justify-between items-center pt-2 border-t border-slate-50">
                                        <span className="text-primary-600 font-bold">{formatCurrency(product.price)}</span>
                                        <div className="w-6 h-6 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center opacity-0 group-hover:opacity-100"><FiPlus size={14} /></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* === CỘT PHẢI: GIỎ HÀNG & THANH TOÁN === */}
            <div className="w-full lg:w-[35%] flex flex-col bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden h-full">
                
                {/* 1. Chọn Khách hàng */}
                <div className="p-4 bg-primary-50 border-b border-primary-100 flex gap-2 shrink-0 items-center">
                    <div className="relative flex-1">
                        <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500 z-10" />
                        <select className="w-full pl-9 pr-8 py-2.5 bg-white border border-primary-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer shadow-sm appearance-none"
                            value={customerId} onChange={e => setCustomerId(e.target.value)}>
                            <option value="">Khách lẻ</option>
                            {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                        </select>
                    </div>
                    <button onClick={() => setIsCustomerModalOpen(true)} className="bg-white p-2.5 rounded-xl border border-primary-200 text-primary-600 hover:bg-primary-600 hover:text-white transition-all shadow-sm"><FiPlus size={20} /></button>
                </div>

                {/* 2. Danh sách Cart */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-slate-50">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-70"><div className="bg-white p-4 rounded-full shadow-sm mb-4"><FiShoppingCart size={40} className="text-slate-300"/></div><p>Giỏ hàng trống</p></div>
                    ) : cart.map(item => (
                        <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group">
                            <div className="flex-1 mr-3 overflow-hidden">
                                <div className="font-bold text-slate-700 text-sm truncate">{item.name}</div>
                                <div className="text-xs text-slate-500 mt-1">Đơn giá: {formatCurrency(item.price)}</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-600 hover:text-red-600"><FiMinus size={12}/></button>
                                    <input 
                                        type="number"
                                        className="w-10 text-center text-sm font-bold text-slate-800 bg-transparent outline-none focus:text-primary-600"
                                        value={item.quantity}
                                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                                        onFocus={(e) => e.target.select()}
                                    />
                                    <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-600 hover:text-green-600"><FiPlus size={12}/></button>
                                </div>
                                <div className="flex flex-col items-end min-w-[70px]">
                                    <span className="text-sm font-bold text-primary-700">{formatCurrency(item.price * item.quantity)}</span>
                                    <button onClick={() => removeFromCart(item.id)} className="text-[10px] text-slate-400 hover:text-red-500 mt-1 flex items-center gap-1"><FiTrash2 size={10}/> Xóa</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 3. Khu vực tính tiền & Giao hàng */}
                <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
                    
                    {/* [MỚI] Toggle Giao hàng */}
                    <div className="flex items-center justify-between mb-3 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isDelivery ? 'bg-blue-600' : 'bg-slate-300'}`} onClick={() => setIsDelivery(!isDelivery)}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isDelivery ? 'translate-x-4' : ''}`}></div>
                            </div>
                            <span className={`text-sm font-bold ${isDelivery ? 'text-blue-700' : 'text-slate-500'}`}>Giao hàng tận nơi</span>
                        </label>
                        {isDelivery && <FiTruck className="text-blue-500" />}
                    </div>

                    {/* [MỚI] Form nhập thông tin Giao hàng (Chỉ hiện khi bật Toggle) */}
                    {isDelivery && (
                        <div className="mb-3 space-y-2 animate-fade-in bg-blue-50 p-3 rounded-xl border border-blue-200">
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <FiMapPin className="absolute left-2.5 top-2.5 text-blue-400 text-xs"/>
                                    <input 
                                        type="text" placeholder="Địa chỉ giao hàng..." 
                                        className="w-full pl-7 pr-3 py-1.5 text-sm border border-blue-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                                        value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)}
                                    />
                                </div>
                                <div className="w-1/3 relative">
                                    <FiPhone className="absolute left-2.5 top-2.5 text-blue-400 text-xs"/>
                                    <input 
                                        type="text" placeholder="SĐT..." 
                                        className="w-full pl-7 pr-3 py-1.5 text-sm border border-blue-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                                        value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-blue-700">Phí Ship:</span>
                                <NumericFormat 
                                    className="w-24 text-right py-1 px-2 text-sm font-bold text-blue-700 bg-white border border-blue-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                                    value={shipFee} onValueChange={(v) => setShipFee(v.floatValue || 0)}
                                    thousandSeparator="," suffix=" ₫" placeholder="0 ₫"
                                />
                            </div>
                        </div>
                    )}

                    {/* Tổng tiền */}
                    <div className="flex justify-between items-end mb-3 border-b border-dashed border-slate-100 pb-2">
                        <div className="text-slate-500 text-sm font-medium flex flex-col">
                            <span>Tổng hàng: {formatCurrency(productTotal)}</span>
                            {isDelivery && <span className="text-blue-600 text-xs">+ Ship: {formatCurrency(shipFee)}</span>}
                        </div>
                        <div className="text-3xl font-black text-slate-800 tracking-tight">{formatCurrency(finalTotal)}</div>
                    </div>

                    {/* Phương thức thanh toán */}
                    <div className="flex gap-2 mb-3">
                        <PaymentMethodButton 
                            method="Tiền mặt" icon={FiDollarSign} label="Tiền mặt" 
                            currentMethod={paymentMethod} setMethod={setPaymentMethod} 
                        />
                        <PaymentMethodButton 
                            method="Chuyển khoản" icon={FiCreditCard} label="Chuyển khoản" 
                            currentMethod={paymentMethod} setMethod={setPaymentMethod} 
                        />
                    </div>

                    {/* Tiền khách trả */}
                    <div className="mb-3">
                        <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5 flex justify-between">
                            <span>Khách trả / Cọc</span>
                            {changeAmount < 0 && <span className="text-red-500">Thiếu {formatCurrency(Math.abs(changeAmount))}</span>}
                        </label>
                        <div className="relative">
                            <NumericFormat
                                value={amountPaid}
                                onValueChange={(values) => setAmountPaid(values.floatValue || 0)}
                                thousandSeparator=","
                                suffix=" ₫"
                                placeholder="0 ₫"
                                className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xl font-bold text-primary-700 focus:ring-2 focus:ring-primary-500 outline-none text-right shadow-inner"
                                allowNegative={false}
                            />
                        </div>
                        {paymentMethod === 'Tiền mặt' && (
                            <div className="flex gap-2 mt-2 overflow-x-auto pb-1 custom-scrollbar">
                                <button onClick={()=>setAmountPaid(finalTotal)} className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-xs font-bold border border-primary-100 whitespace-nowrap hover:bg-primary-100">Đủ tiền</button>
                                {[500000, 200000, 100000, 50000].map(val => (
                                    <QuickCashButton key={val} value={val} onClick={setAmountPaid} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tiền thừa / Ghi chú */}
                    <div className="flex items-center justify-between mb-3 min-h-[36px]">
                        {changeAmount > 0 ? (
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-500">Tiền thừa trả khách:</span>
                                <span className="text-xl font-bold text-green-600">{formatCurrency(changeAmount)}</span>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <button onClick={() => setIsPrintEnabled(!isPrintEnabled)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${isPrintEnabled ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                    <FiPrinter size={14}/> {isPrintEnabled ? 'Có in' : 'Không in'}
                                </button>
                                <button onClick={() => setShowNoteInput(!showNoteInput)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${orderNote ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                    <FiFileText size={14}/> Ghi chú
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {showNoteInput && (
                        <div className="mb-3 animate-fade-in">
                            <input type="text" placeholder="Ghi chú đơn hàng..." className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" value={orderNote} onChange={e => setOrderNote(e.target.value)} autoFocus />
                        </div>
                    )}

                    {/* Nút Thanh Toán */}
                    <Button 
                        fullWidth 
                        size="lg" 
                        variant="primary" 
                        icon={isDelivery ? <FiTruck size={24}/> : <FiCheckCircle size={24} />} 
                        onClick={handleCheckout} 
                        disabled={cart.length === 0 || createInvoiceMutation.isPending} 
                        isLoading={createInvoiceMutation.isPending} 
                        className="py-3.5 text-xl font-bold shadow-lg shadow-primary-600/30 hover:shadow-primary-600/50 hover:-translate-y-0.5 transition-all"
                    >
                        {isDelivery ? 'TẠO ĐƠN GIAO (F9)' : 'THANH TOÁN (F9)'}
                    </Button>
                </div>
            </div>

            {isCustomerModalOpen && (
                <QuickCustomerModal 
                    isOpen={isCustomerModalOpen} 
                    onClose={() => setIsCustomerModalOpen(false)}
                    onSuccess={(newCustomer: any) => {
                        setCustomerId(newCustomer.id || newCustomer._id);
                        setIsCustomerModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};

export default SalesPage;