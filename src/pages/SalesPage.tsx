import React, { useState, useEffect, useRef } from 'react';
import { 
    FiSearch, FiShoppingCart, FiTrash2, FiPlus, FiMinus, 
    FiUser, FiCheckCircle, FiFilter, FiAlertCircle, FiCreditCard, FiDollarSign, FiPrinter, FiFileText
} from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query'; 
import { NumericFormat } from 'react-number-format';
import { Button } from '../components/common/Button';
import { useProducts } from '../hooks/useProducts';
import { useAllCustomers } from '../hooks/useCustomers'; 
import { useCreateOrder } from '../hooks/useOrders';
import { useDebounce } from '../hooks/useDebounce';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/currency';
import { api } from '../utils/api'; 
import QuickCustomerModal from '../components/features/partners/QuickCustomerModal';

// --- TYPE DEFINITIONS ---
interface CartItem {
    id: string; // Đây sẽ lưu _id của sản phẩm
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
            const res = await api('/api/categories');
            return Array.isArray(res) ? res : (res.data || []);
        },
        staleTime: 5 * 60 * 1000, 
    });

    const { data: productsData, isLoading: loadingProducts } = useProducts(1, 60, debouncedSearch, selectedCategory);
    const products = productsData?.data || [];

    const { data: customersData } = useAllCustomers();
    const customers = customersData?.data || [];

    // State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerId, setCustomerId] = useState('');
    
    // Thanh toán
    const [amountPaid, setAmountPaid] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState('Tiền mặt');
    const [isPrintEnabled, setIsPrintEnabled] = useState(true); 
    const [orderNote, setOrderNote] = useState('');
    const [showNoteInput, setShowNoteInput] = useState(false);

    // Helpers
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const createOrderMutation = useCreateOrder();
    const searchInputRef = useRef<HTMLInputElement>(null);

    // --- 2. LOGIC ---
    
    // Thêm vào giỏ
    const addToCart = (product: any) => {
        // Ưu tiên dùng _id nếu có, không thì id
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

    // [MỚI] Sửa số lượng trực tiếp (input)
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

    // Tăng giảm bằng nút
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

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const changeAmount = amountPaid - totalAmount;

    useEffect(() => {
        if (totalAmount > 0 && amountPaid === 0) setAmountPaid(totalAmount);
    }, [totalAmount]);

    // [QUAN TRỌNG] Xử lý Thanh Toán chuẩn Payload
    const handleCheckout = async () => {
        if (cart.length === 0) return toast.error('Giỏ hàng trống!');
        
        try {
            // Mapping đúng cấu trúc Backend yêu cầu
            const payload = {
                customerId: customerId || null,
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    price: item.price
                })),
                paymentAmount: amountPaid, // Đổi tên amountPaid -> paymentAmount
                paymentMethod: paymentMethod, // Backend đã hỗ trợ
                note: orderNote,
                // Không gửi status, totalAmount (Backend tự tính)
            };

            await createOrderMutation.mutateAsync(payload);

            toast.success('Thanh toán thành công!');
            
            // Reset
            setCart([]);
            setAmountPaid(0);
            setCustomerId('');
            setSearchTerm('');
            setOrderNote('');
            setShowNoteInput(false);
            searchInputRef.current?.focus();
        } catch (error: any) {
            console.error(error);
            toast.error('Lỗi: ' + (error.response?.data?.message || error.message));
        }
    };

    // Helper Components
    const PaymentMethodButton = ({ method, icon: Icon, label }: any) => (
        <button
            onClick={() => setPaymentMethod(method)}
            className={`flex-1 flex flex-col items-center justify-center py-2 rounded-lg border transition-all duration-200 gap-1
                ${paymentMethod === method 
                    ? 'bg-primary-600 border-primary-600 text-white shadow-md' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-primary-50 hover:border-primary-200'
                }
            `}
        >
            <Icon size={18} />
            <span className="text-[11px] font-bold">{label}</span>
        </button>
    );

    const QuickCashButton = ({ value }: { value: number }) => (
        <button
            onClick={() => setAmountPaid(value)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition-colors"
        >
            {value.toLocaleString('vi-VN')}
        </button>
    );

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] gap-4 animate-fade-in pb-2">
            
            {/* === CỘT TRÁI === */}
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
                            // [FIX] Dùng cat._id làm key để tránh warning
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
                                // [FIX] Dùng _id nếu có
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

            {/* === CỘT PHẢI === */}
            <div className="w-full lg:w-[35%] flex flex-col bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden h-full">
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
                                    
                                    {/* [MỚI] Input chỉnh số lượng */}
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

                <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
                    <div className="flex justify-between items-end mb-3 border-b border-dashed border-slate-100 pb-2">
                        <div className="text-slate-500 text-sm font-medium">Tổng tiền ({cart.reduce((s,i)=>s+i.quantity,0)}):</div>
                        <div className="text-3xl font-black text-slate-800 tracking-tight">{formatCurrency(totalAmount)}</div>
                    </div>

                    <div className="flex gap-2 mb-3">
                        <PaymentMethodButton method="Tiền mặt" icon={FiDollarSign} label="Tiền mặt" />
                        <PaymentMethodButton method="Chuyển khoản" icon={FiCreditCard} label="Chuyển khoản" />
                    </div>

                    <div className="mb-3">
                        <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5 flex justify-between">
                            <span>Khách thanh toán</span>
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
                                isAllowed={(values) => (values.floatValue || 0) <= 100000000000}
                            />
                        </div>
                        {paymentMethod === 'Tiền mặt' && (
                            <div className="flex gap-2 mt-2 overflow-x-auto pb-1 custom-scrollbar">
                                <button onClick={()=>setAmountPaid(totalAmount)} className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-xs font-bold border border-primary-100 whitespace-nowrap hover:bg-primary-100">Đủ tiền</button>
                                {[500000, 200000, 100000, 50000].map(val => (
                                    <QuickCashButton key={val} value={val} />
                                ))}
                            </div>
                        )}
                    </div>

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

                    <Button fullWidth size="lg" variant="primary" icon={<FiCheckCircle size={24} />} onClick={handleCheckout} disabled={cart.length === 0 || createOrderMutation.isPending} isLoading={createOrderMutation.isPending} className="py-3.5 text-xl font-bold shadow-lg shadow-primary-600/30 hover:shadow-primary-600/50 hover:-translate-y-0.5 transition-all">
                        THANH TOÁN (F9)
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