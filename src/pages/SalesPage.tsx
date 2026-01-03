import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiShoppingCart, FiTrash2, FiPlus, FiMinus, FiUser, FiCheckCircle, FiPackage, FiFilter } from 'react-icons/fi';
import { Button } from '../components/common/Button';
import { useProducts } from '../hooks/useProducts';
import { useAllCustomers } from '../hooks/useCustomers'; 
import { useCreateOrder } from '../hooks/useOrders';
import { useDebounce } from '../hooks/useDebounce';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/currency';
import QuickCustomerModal from '../components/features/partners/QuickCustomerModal';

// Định nghĩa kiểu dữ liệu cho sản phẩm trong giỏ
interface CartItem {
    id: string;
    sku: string;
    name: string;
    price: number;
    quantity: number;
    stock: number;
    image?: string;
}

const SalesPage: React.FC = () => {
    // --- 1. STATE & HOOKS ---
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300); // Tìm kiếm mượt mà
    const [selectedCategory, setSelectedCategory] = useState('');
    
    // API lấy sản phẩm (luôn lấy 20 sp mới nhất để hiện)
    const { data: productsData, isLoading: loadingProducts } = useProducts(1, 50, debouncedSearch, selectedCategory);
    const products = productsData?.data || [];

    // API lấy khách hàng (cho dropdown)
    const { data: customersData } = useAllCustomers();
    const customers = customersData?.data || [];

    // State Giỏ hàng & Thanh toán
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerId, setCustomerId] = useState('');
    const [amountPaid, setAmountPaid] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState('Tiền mặt');
    
    // Modal & Loading
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const createOrderMutation = useCreateOrder();
    
    // Ref để auto-focus vào ô tìm kiếm sau khi thao tác
    const searchInputRef = useRef<HTMLInputElement>(null);

    // --- 2. LOGIC NGHIỆP VỤ ---

    // Thêm vào giỏ
    const addToCart = (product: any) => {
        if (product.stock <= 0) return toast.error('Sản phẩm đã hết hàng!');
        
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock) {
                    toast.error('Không đủ tồn kho!');
                    return prev;
                }
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { 
                id: product.id, sku: product.sku, name: product.name, 
                price: product.price, quantity: 1, stock: product.stock, image: product.image 
            }];
        });
        toast.success(`Đã thêm: ${product.name}`);
        searchInputRef.current?.focus(); // Focus lại ô tìm kiếm để bán tiếp
    };

    // Chỉnh số lượng
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

    // Xóa khỏi giỏ
    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    // Tính toán tiền
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const changeAmount = amountPaid - totalAmount;

    // Tự động điền tiền khách đưa = tổng tiền (để thao tác nhanh)
    useEffect(() => {
        if (totalAmount > 0 && amountPaid === 0) setAmountPaid(totalAmount);
    }, [totalAmount]);

    // Xử lý thanh toán
    const handleCheckout = async () => {
        if (cart.length === 0) return toast.error('Giỏ hàng trống!');
        
        try {
            await createOrderMutation.mutateAsync({
                customerId: customerId || null,
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    price: item.price
                })),
                totalAmount,
                amountPaid,
                paymentMethod,
                status: 'completed'
            });

            toast.success('Thanh toán thành công!');
            // Reset form bán hàng
            setCart([]);
            setAmountPaid(0);
            setCustomerId('');
            setSearchTerm('');
            searchInputRef.current?.focus();
        } catch (error: any) {
            toast.error('Lỗi: ' + error.message);
        }
    };

    // --- 3. GIAO DIỆN (JSX) ---
    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] gap-4 animate-fade-in pb-2">
            
            {/* --- CỘT TRÁI: DANH SÁCH SẢN PHẨM (65%) --- */}
            <div className="w-full lg:w-[65%] flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header Tìm kiếm */}
                <div className="p-4 border-b border-slate-100 flex gap-3 bg-white z-10">
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                        <input 
                            ref={searchInputRef}
                            type="text" 
                            autoFocus
                            placeholder="Quét mã vạch hoặc tìm tên sản phẩm..." 
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-medium text-slate-700"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* Bộ lọc danh mục */}
                    <div className="relative min-w-[160px]">
                        <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <select 
                            className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-medium text-slate-600 appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value)}
                        >
                            <option value="">Tất cả danh mục</option>
                            <option value="Điện tử">Điện tử</option>
                            <option value="Gia dụng">Gia dụng</option>
                            <option value="Thời trang">Thời trang</option>
                            <option value="Mỹ phẩm">Mỹ phẩm</option>
                        </select>
                    </div>
                </div>

                {/* Grid Sản phẩm */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/30">
                    {loadingProducts ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
                            <p>Đang tải dữ liệu...</p>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                            <FiPackage size={48} className="mb-2"/>
                            <p>Không tìm thấy sản phẩm nào</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 content-start">
                            {products.map((product: any) => (
                                <div 
                                    key={product.id} 
                                    onClick={() => addToCart(product)}
                                    className={`
                                        group relative bg-white rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col
                                        ${product.stock <= 0 
                                            ? 'border-slate-100 opacity-60 grayscale pointer-events-none' 
                                            : 'border-slate-200 hover:border-primary-400 hover:shadow-md hover:-translate-y-1'
                                        }
                                    `}
                                >
                                    {/* Ảnh thumbnail */}
                                    <div className="aspect-[4/3] bg-slate-100 w-full relative overflow-hidden">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <FiPackage size={32} />
                                            </div>
                                        )}
                                        {/* Nhãn hết hàng */}
                                        {product.stock <= 0 && (
                                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">HẾT HÀNG</span>
                                            </div>
                                        )}
                                        {/* Tồn kho badge */}
                                        {product.stock > 0 && (
                                            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                SL: {product.stock}
                                            </div>
                                        )}
                                    </div>

                                    {/* Thông tin */}
                                    <div className="p-3 flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-semibold text-slate-700 text-sm line-clamp-2 leading-tight mb-1 group-hover:text-primary-700 transition-colors">
                                                {product.name}
                                            </h3>
                                            <p className="text-[11px] text-slate-500 font-mono">{product.sku}</p>
                                        </div>
                                        <div className="mt-2 text-primary-600 font-bold text-base">
                                            {formatCurrency(product.price)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* --- CỘT PHẢI: GIỎ HÀNG & THANH TOÁN (35%) --- */}
            <div className="w-full lg:w-[35%] flex flex-col bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden h-full">
                
                {/* 1. Chọn Khách Hàng */}
                <div className="p-4 bg-primary-50 border-b border-primary-100 flex gap-2 shrink-0">
                    <div className="relative flex-1">
                        <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-600" />
                        <select 
                            className="w-full pl-9 pr-3 py-2.5 bg-white border border-primary-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                            value={customerId}
                            onChange={e => setCustomerId(e.target.value)}
                        >
                            <option value="">Khách lẻ (Không lưu tên)</option>
                            {customers.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                            ))}
                        </select>
                    </div>
                    <button 
                        onClick={() => setIsCustomerModalOpen(true)}
                        className="bg-white p-2.5 rounded-lg border border-primary-200 text-primary-600 hover:bg-primary-600 hover:text-white transition-all shadow-sm"
                        title="Thêm khách hàng mới"
                    >
                        <FiPlus size={20} />
                    </button>
                </div>

                {/* 2. Danh sách hàng trong giỏ */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar bg-slate-50">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-70">
                            <FiShoppingCart size={64} className="mb-4 text-slate-300"/>
                            <p className="font-medium">Chưa có sản phẩm nào</p>
                            <p className="text-sm">Vui lòng chọn sản phẩm bên trái</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-primary-200 transition-colors">
                                <div className="flex-1 mr-2 overflow-hidden">
                                    <div className="font-semibold text-slate-800 text-sm truncate">{item.name}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">{formatCurrency(item.price)}</div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    {/* Bộ chỉnh số lượng */}
                                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                                        <button 
                                            onClick={() => updateQuantity(item.id, -1)}
                                            className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-600 hover:text-red-600 active:scale-95 transition-all"
                                        >
                                            <FiMinus size={12}/>
                                        </button>
                                        <span className="w-8 text-center text-sm font-bold text-slate-800">{item.quantity}</span>
                                        <button 
                                            onClick={() => updateQuantity(item.id, 1)}
                                            className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-600 hover:text-green-600 active:scale-95 transition-all"
                                        >
                                            <FiPlus size={12}/>
                                        </button>
                                    </div>
                                    
                                    {/* Thành tiền */}
                                    <div className="text-sm font-bold text-primary-700 w-20 text-right">
                                        {formatCurrency(item.price * item.quantity)}
                                    </div>
                                    
                                    {/* Nút xóa */}
                                    <button 
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                    >
                                        <FiTrash2 size={16}/>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* 3. Khu vực Thanh toán (Footer) */}
                <div className="p-5 bg-white border-t border-slate-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20">
                    <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center text-slate-600">
                            <span className="text-sm">Tổng số lượng:</span>
                            <span className="font-bold">{cart.reduce((sum, i) => sum + i.quantity, 0)}</span>
                        </div>
                        <div className="flex justify-between items-end pb-2 border-b border-dashed border-slate-200">
                            <span className="text-base font-bold text-slate-800">Tổng tiền phải trả:</span>
                            <span className="text-2xl font-black text-primary-600 tracking-tight">
                                {formatCurrency(totalAmount)}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Khách đưa</label>
                                <input 
                                    type="number" 
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={amountPaid}
                                    onChange={e => setAmountPaid(Number(e.target.value))}
                                    onFocus={e => e.target.select()}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Phương thức</label>
                                <select 
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer"
                                    value={paymentMethod}
                                    onChange={e => setPaymentMethod(e.target.value)}
                                >
                                    <option value="Tiền mặt">Tiền mặt</option>
                                    <option value="Chuyển khoản">Chuyển khoản</option>
                                    <option value="Thẻ">Quẹt thẻ</option>
                                </select>
                            </div>
                        </div>

                        {changeAmount > 0 && (
                            <div className="flex justify-between items-center bg-green-50 px-3 py-2 rounded-lg border border-green-100 text-green-700">
                                <span className="text-sm font-medium">Tiền thừa trả khách:</span>
                                <span className="font-bold">{formatCurrency(changeAmount)}</span>
                            </div>
                        )}
                    </div>

                    <Button 
                        fullWidth 
                        size="lg" 
                        variant="primary"
                        icon={<FiCheckCircle size={20} />} 
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || createOrderMutation.isPending}
                        isLoading={createOrderMutation.isPending}
                        className="py-4 text-lg font-bold shadow-lg shadow-primary-600/20 hover:shadow-primary-600/40"
                    >
                        THANH TOÁN (F9)
                    </Button>
                </div>
            </div>

            {/* Modal Thêm nhanh khách hàng */}
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