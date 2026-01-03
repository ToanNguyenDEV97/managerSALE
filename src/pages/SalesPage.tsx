import React, { useState, useEffect } from 'react';
import { FiSearch, FiShoppingCart, FiTrash2, FiPlus, FiMinus, FiUser, FiSave, FiCheckCircle } from 'react-icons/fi';
import { Button } from '../components/common/Button';
import { FormInput } from '../components/common/FormInput';
import { useProducts } from '../hooks/useProducts';
import { useAllCustomers } from '../hooks/useCustomers'; // Đã fix ở bước trước
import { useCreateOrder } from '../hooks/useOrders';
import { useDebounce } from '../hooks/useDebounce';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/currency';
import QuickCustomerModal from '../components/features/partners/QuickCustomerModal'; // Đảm bảo file này tồn tại hoặc comment lại nếu chưa có

// Interface cho Item trong Giỏ hàng
interface CartItem {
    id: string;
    sku: string;
    name: string;
    price: number;
    quantity: number;
    stock: number;
}

const SalesPage: React.FC = () => {
    // 1. State Sản phẩm & Tìm kiếm
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [selectedCategory, setSelectedCategory] = useState('');
    
    // API Products
    const { data: productsData, isLoading: loadingProducts } = useProducts(1, 20, debouncedSearch, selectedCategory);
    const products = productsData?.data || [];

    // 2. State Giỏ hàng
    const [cart, setCart] = useState<CartItem[]>([]);
    
    // 3. State Khách hàng & Thanh toán
    const [customerId, setCustomerId] = useState('');
    const { data: customers } = useAllCustomers();
    const [amountPaid, setAmountPaid] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState('Tiền mặt');
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

    const createOrderMutation = useCreateOrder();

    // --- LOGIC GIỎ HÀNG ---
    const addToCart = (product: any) => {
        if (product.stock <= 0) {
            toast.error('Sản phẩm đã hết hàng!');
            return;
        }
        
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock) {
                    toast.error('Đã đạt giới hạn tồn kho!');
                    return prev;
                }
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { 
                id: product.id, sku: product.sku, name: product.name, 
                price: product.price, quantity: 1, stock: product.stock 
            }];
        });
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                if (newQty > item.stock) return item; // Không vượt quá kho
                if (newQty < 1) return item; // Không nhỏ hơn 1
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    // Tính tổng tiền
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Auto set tiền khách đưa = tổng tiền (mặc định)
    useEffect(() => {
        if (amountPaid === 0 && totalAmount > 0) setAmountPaid(totalAmount);
    }, [totalAmount]);

    // --- XỬ LÝ THANH TOÁN ---
    const handleCheckout = async () => {
        if (cart.length === 0) return toast.error('Giỏ hàng đang trống!');
        
        try {
            await createOrderMutation.mutateAsync({
                customerId: customerId || null, // Null nếu là khách lẻ
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    price: item.price
                })),
                totalAmount,
                amountPaid,
                paymentMethod,
                status: 'completed' // Đơn hàng hoàn thành ngay tại quầy
            });

            toast.success('Thanh toán thành công!');
            // Reset
            setCart([]);
            setAmountPaid(0);
            setCustomerId('');
        } catch (error: any) {
            toast.error('Lỗi thanh toán: ' + error.message);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-6rem)] gap-4 animate-fade-in overflow-hidden">
            
            {/* LEFT: DANH SÁCH SẢN PHẨM (65%) */}
            <div className="w-full md:w-[65%] flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Search Bar */}
                <div className="p-4 border-b border-slate-100 flex gap-3">
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            autoFocus
                            placeholder="Tìm tên sản phẩm, mã SKU..." 
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-400 outline-none font-medium"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                        className="w-40 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm font-medium outline-none"
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                    >
                        <option value="">Tất cả danh mục</option>
                        <option value="Điện tử">Điện tử</option>
                        <option value="Gia dụng">Gia dụng</option>
                        <option value="Thời trang">Thời trang</option>
                    </select>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50">
                    {loadingProducts ? (
                        <div className="flex justify-center items-center h-full text-slate-400">Đang tải sản phẩm...</div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <FiSearch size={40} className="mb-2 opacity-50"/>
                            <p>Không tìm thấy sản phẩm nào</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {products.map((p: any) => (
                                <div 
                                    key={p.id} 
                                    onClick={() => addToCart(p)}
                                    className={`bg-white p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md hover:border-primary-300 active:scale-95 flex flex-col justify-between ${
                                        p.stock <= 0 ? 'opacity-60 grayscale pointer-events-none border-slate-100' : 'border-slate-200'
                                    }`}
                                >
                                    <div>
                                        <div className="h-24 bg-slate-100 rounded-lg mb-2 flex items-center justify-center text-slate-400 text-xs">
                                            {p.image ? <img src={p.image} className="h-full w-full object-cover rounded-lg"/> : "No Image"}
                                        </div>
                                        <div className="font-bold text-slate-700 text-sm line-clamp-2 mb-1">{p.name}</div>
                                        <div className="text-xs text-slate-500 mb-2">{p.sku}</div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="text-primary-600 font-bold">{formatCurrency(p.price)}</div>
                                        <div className={`text-xs px-1.5 py-0.5 rounded ${p.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            Kho: {p.stock}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: GIỎ HÀNG & THANH TOÁN (35%) */}
            <div className="w-full md:w-[35%] flex flex-col bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                {/* Customer Info */}
                <div className="p-4 bg-primary-50 border-b border-primary-100 flex gap-2">
                    <div className="flex-1 relative">
                        <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500" />
                        <select 
                            className="w-full pl-9 pr-8 py-2.5 bg-white border border-primary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer appearance-none text-slate-700 font-medium"
                            value={customerId}
                            onChange={e => setCustomerId(e.target.value)}
                        >
                            <option value="">Khách lẻ (Không lưu tên)</option>
                            {customers?.data?.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                            ))}
                        </select>
                    </div>
                    <button 
                        onClick={() => setIsCustomerModalOpen(true)}
                        className="p-2.5 bg-white border border-primary-200 rounded-lg text-primary-600 hover:bg-primary-100 transition-colors" 
                        title="Thêm khách hàng mới"
                    >
                        <FiPlus size={20} />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <FiShoppingCart size={48} className="mb-3 opacity-20"/>
                            <p>Chưa có sản phẩm nào</p>
                            <p className="text-xs">Chọn sản phẩm bên trái để thêm</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {cart.map((item) => (
                                <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                                    <div className="flex-1">
                                        <div className="font-medium text-slate-800 text-sm line-clamp-1">{item.name}</div>
                                        <div className="text-xs text-slate-500">{formatCurrency(item.price)}</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center bg-white rounded-md border border-slate-200 h-8">
                                            <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-full flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-l-md"><FiMinus size={12}/></button>
                                            <span className="w-8 text-center text-sm font-bold text-slate-700">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-full flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-r-md"><FiPlus size={12}/></button>
                                        </div>
                                        <div className="font-bold text-primary-600 text-sm w-20 text-right">
                                            {formatCurrency(item.price * item.quantity)}
                                        </div>
                                        <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Payment Area */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>Số lượng:</span>
                        <span className="font-bold">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
                    </div>
                    <div className="flex justify-between items-end">
                        <span className="text-slate-800 font-bold text-lg">Tổng tiền:</span>
                        <span className="text-2xl font-black text-primary-600">{formatCurrency(totalAmount)}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Khách đưa</label>
                            <input 
                                type="number" 
                                className="w-full p-2 border border-slate-300 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-primary-400 outline-none"
                                value={amountPaid}
                                onChange={e => setAmountPaid(Number(e.target.value))}
                                onFocus={e => e.target.select()}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Phương thức</label>
                            <select 
                                className="w-full p-2 border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-primary-400 outline-none"
                                value={paymentMethod}
                                onChange={e => setPaymentMethod(e.target.value)}
                            >
                                <option value="Tiền mặt">Tiền mặt</option>
                                <option value="Chuyển khoản">Chuyển khoản</option>
                                <option value="Thẻ">Quẹt thẻ</option>
                                <option value="Nợ">Ghi nợ</option>
                            </select>
                        </div>
                    </div>

                    {amountPaid > totalAmount && (
                        <div className="flex justify-between text-sm text-green-600 bg-green-50 p-2 rounded border border-green-100">
                            <span>Tiền thừa trả khách:</span>
                            <span className="font-bold">{formatCurrency(amountPaid - totalAmount)}</span>
                        </div>
                    )}

                    <Button 
                        fullWidth 
                        size="lg" 
                        icon={<FiCheckCircle />} 
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || createOrderMutation.isPending}
                        isLoading={createOrderMutation.isPending}
                        className="mt-2 py-4 text-lg shadow-lg shadow-primary-600/30"
                    >
                        THANH TOÁN (F9)
                    </Button>
                </div>
            </div>

            {/* Quick Add Customer Modal */}
            {isCustomerModalOpen && (
                <QuickCustomerModal 
                    isOpen={isCustomerModalOpen} 
                    onClose={() => setIsCustomerModalOpen(false)}
                    onSuccess={(newCustomer) => {
                        setCustomerId(newCustomer.id);
                        setIsCustomerModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};

export default SalesPage;