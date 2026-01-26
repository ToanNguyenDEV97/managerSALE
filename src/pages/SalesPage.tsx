import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    FiSearch, FiShoppingCart, FiTrash2, FiPlus, FiMinus, 
    FiUser, FiCheckCircle, FiFilter, FiAlertCircle, FiCreditCard, FiDollarSign, FiPrinter, FiFileText,
    FiTruck, FiMapPin, FiPhone // Icon cho giao hàng
} from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query'; 
import { NumericFormat } from 'react-number-format';
import { Button } from '../components/common/Button';
import { useProducts } from '../hooks/useProducts';
import { useAllCustomers } from '../hooks/useCustomers'; 
import { useSaveInvoice } from '../hooks/useInvoices'; 
import { useDebounce } from '../hooks/useDebounce';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/currency';
import { api } from '../utils/api'; 
import QuickCustomerModal from '../components/features/partners/QuickCustomerModal';
import PrintInvoiceModal from '../components/print/PrintInvoiceModal';

// --- INTERFACES ---
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

interface Product {
    _id: string;
    name: string;
    sku: string;
    retailPrice: number;
    quantity: number; // Tồn kho
    category?: { _id: string; name: string };
    image?: string;
}

// --- HELPER COMPONENTS (Đưa ra ngoài để tối ưu hiệu năng) ---
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

// --- MAIN COMPONENT ---
const SalesPage: React.FC = () => {
    // 1. State Giỏ hàng & Sản phẩm
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // 2. State Khách hàng & Thanh toán
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [customerName, setCustomerName] = useState('Khách lẻ');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'debt'>('cash');
    const [amountPaid, setAmountPaid] = useState<number>(0);
    const [discount, setDiscount] = useState<number>(0);
    const [orderNote, setOrderNote] = useState('');

    // 3. State Giao hàng (Delivery)
    const [isDelivery, setIsDelivery] = useState(false);
    const [shipFee, setShipFee] = useState<number>(0);
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [shipperName, setShipperName] = useState('');

    // 4. State Modal (Khách hàng & In ấn)
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [createdInvoice, setCreatedInvoice] = useState<any>(null);

    // --- HOOKS ---
    const { data: productsData, isLoading: isLoadingProducts } = useProducts({ 
        page: 1, 
        limit: 20, 
        search: debouncedSearch,
        category: selectedCategory || undefined
    });
    
    // Lấy danh mục (Giả lập hoặc gọi API danh mục nếu có hook riêng)
    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await api.get('/categories');
            return res.data?.data || res.data || []; // Handle structure trả về
        },
        initialData: []
    });

    const { data: customersData } = useAllCustomers();
    const customers = customersData?.data || [];
    const createInvoiceMutation = useSaveInvoice();

    // --- LOGIC TÍNH TOÁN ---
    const productTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
    const finalTotal = productTotal + (isDelivery ? shipFee : 0) - discount;
    
    // Logic COD: Nếu khách trả chưa đủ -> phần còn lại là COD. Nếu trả đủ/dư -> COD = 0
    const codAmount = Math.max(0, finalTotal - amountPaid);
    // Tiền thừa: Chỉ tính khi khách đưa dư
    const changeAmount = Math.max(0, amountPaid - finalTotal);

    // --- HANDLERS ---
    
    // Thêm vào giỏ
    const addToCart = (product: Product) => {
        setCart(prev => {
            const exist = prev.find(item => item.id === product._id);
            if (exist) {
                return prev.map(item => item.id === product._id 
                    ? { ...item, quantity: item.quantity + 1 } 
                    : item
                );
            }
            return [...prev, { 
                id: product._id, 
                sku: product.sku,
                name: product.name, 
                price: product.retailPrice, 
                quantity: 1,
                stock: product.quantity 
            }];
        });
        toast.success(`Đã thêm: ${product.name}`);
    };

    // Xóa/Sửa số lượng
    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                // Check tồn kho nếu cần (item.stock)
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    // THANH TOÁN (CHECKOUT)
    const handleCheckout = async () => {
        if (cart.length === 0) return;

        // Chuẩn bị dữ liệu gửi lên Server
        const payload = {
            customerId: customerId, 
            customerName: customerName, // Backend có thể dùng tên này nếu id null
            items: cart.map(item => ({
                productId: item.id,
                quantity: item.quantity,
                price: item.price
            })),
            discountAmount: discount,
            paymentMethod: paymentMethod,
            amountPaid: amountPaid, // Số tiền khách thực đưa
            note: orderNote,
            
            // Thông tin giao hàng
            isDelivery: isDelivery,
            delivery: isDelivery ? {
                shipFee: shipFee,
                address: deliveryAddress,
                phone: recipientPhone,
                shipperName: shipperName,
                // Server sẽ tự tính codAmount dựa trên finalTotal - amountPaid, 
                // nhưng gửi lên để lưu log cũng tốt
                codAmount: codAmount,
                receiverName: customerName // Mặc định người nhận là khách hàng
            } : undefined
        };

        try {
            // Gọi API
            const res = await createInvoiceMutation.mutateAsync(payload);

            // Xử lý thành công
            if (res) {
                toast.success('Thanh toán thành công! Đang mở in hóa đơn...');
                
                // 1. Lưu hóa đơn vừa tạo & Mở Modal In
                setCreatedInvoice(res);
                setShowPrintModal(true);

                // 2. Reset Form bán hàng về mặc định
                setCart([]);
                setAmountPaid(0);
                setCustomerName('Khách lẻ');
                setCustomerId(null);
                setDiscount(0);
                setOrderNote('');
                // Reset delivery
                setIsDelivery(false);
                setDeliveryAddress('');
                setRecipientPhone('');
                setShipFee(0);
                setShipperName('');
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Lỗi thanh toán');
        }
    };

    // Phím tắt F9
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F9') handleCheckout();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart, amountPaid, isDelivery, shipFee, customerId]); // Dependencies quan trọng

    return (
        <div className="flex h-[calc(100vh-80px)] gap-4 p-2 bg-slate-100 overflow-hidden">
            
            {/* --- CỘT TRÁI: DANH SÁCH SẢN PHẨM --- */}
            <div className="flex-1 flex flex-col gap-3 bg-white rounded-xl shadow-sm p-3 h-full overflow-hidden">
                {/* Thanh tìm kiếm */}
                <div className="relative shrink-0">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        ref={searchInputRef}
                        type="text" 
                        placeholder="Tìm sản phẩm (F2)..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* Danh mục (Sửa lỗi key) */}
                <div className="flex gap-2 overflow-x-auto pb-2 shrink-0 scrollbar-hide">
                    <button 
                        onClick={() => setSelectedCategory(null)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                            ${!selectedCategory ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                        `}
                    >
                        Tất cả
                    </button>
                    {categories.map((cat: Category, index: number) => (
                        <button 
                            key={cat._id || index} // Fix lỗi key
                            onClick={() => setSelectedCategory(cat._id)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                                ${selectedCategory === cat._id ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                            `}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Grid Sản phẩm */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto pr-1">
                    {isLoadingProducts ? (
                        <div className="col-span-full text-center py-10 text-slate-500">Đang tải sản phẩm...</div>
                    ) : productsData?.data?.products?.map((product: Product) => (
                        <div 
                            key={product._id} 
                            className="bg-white border border-slate-100 rounded-xl p-3 cursor-pointer hover:shadow-md hover:border-primary-200 transition-all flex flex-col h-[180px]"
                            onClick={() => addToCart(product)}
                        >
                            <div className="h-24 bg-slate-50 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                                {product.image ? (
                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-bold text-slate-300 select-none">{product.name.charAt(0)}</span>
                                )}
                            </div>
                            <h3 className="font-medium text-sm text-slate-700 line-clamp-2 mb-auto">{product.name}</h3>
                            <div className="flex justify-between items-end mt-2">
                                <span className="text-xs text-slate-500">Kho: {product.quantity}</span>
                                <span className="font-bold text-primary-600">{formatCurrency(product.retailPrice)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- CỘT PHẢI: GIỎ HÀNG & THANH TOÁN --- */}
            <div className="w-[420px] flex flex-col gap-3 h-full shrink-0">
                
                {/* 1. Thông tin khách hàng */}
                <div className="bg-white p-3 rounded-xl shadow-sm flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
                            <FiUser size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-slate-700 truncate">{customerName}</p>
                            <p className="text-xs text-slate-500">Khách hàng</p>
                        </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                        {/* Select khách hàng có sẵn */}
                        <select 
                            className="text-xs border border-slate-200 rounded px-2 py-1 outline-none max-w-[100px]"
                            onChange={(e) => {
                                const cust = customers.find((c:any) => c._id === e.target.value);
                                if (cust) {
                                    setCustomerId(cust._id);
                                    setCustomerName(cust.name);
                                    setDeliveryAddress(cust.address || ''); // Auto điền địa chỉ
                                    setRecipientPhone(cust.phone || '');
                                } else {
                                    setCustomerId(null);
                                    setCustomerName('Khách lẻ');
                                }
                            }}
                            value={customerId || ''}
                        >
                            <option value="">Khách lẻ</option>
                            {customers.map((c: any) => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                        {/* Nút thêm nhanh khách */}
                        <Button size="sm" variant="outline" onClick={() => setIsCustomerModalOpen(true)}>
                            <FiPlus />
                        </Button>
                    </div>
                </div>

                {/* 2. Danh sách giỏ hàng */}
                <div className="bg-white flex-1 rounded-xl shadow-sm flex flex-col overflow-hidden">
                    <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <span className="font-bold text-slate-700">Giỏ hàng ({cart.length})</span>
                        <button onClick={() => setCart([])} className="text-xs text-red-500 hover:text-red-700 font-medium">Xóa tất cả</button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                                <FiShoppingCart size={48} className="mb-2" />
                                <p>Chưa có sản phẩm</p>
                            </div>
                        ) : cart.map((item) => (
                            <div key={item.id} className="flex gap-2 p-2 rounded-lg border border-slate-100 hover:border-primary-100 bg-white group">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm text-slate-700 truncate">{item.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-slate-500">{formatCurrency(item.price)}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="font-bold text-sm text-primary-600">{formatCurrency(item.price * item.quantity)}</span>
                                    <div className="flex items-center gap-2 bg-slate-50 rounded px-1">
                                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-red-500"><FiMinus size={12}/></button>
                                        <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-green-500"><FiPlus size={12}/></button>
                                    </div>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} className="self-center p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <FiTrash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Phần Thanh Toán & Giao Hàng */}
                <div className="bg-white p-3 rounded-xl shadow-sm shrink-0 flex flex-col gap-3">
                    
                    {/* Toggle Giao hàng */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer select-none">
                            <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                                checked={isDelivery}
                                onChange={(e) => setIsDelivery(e.target.checked)}
                            />
                            Giao hàng tận nơi
                        </label>
                        {isDelivery && <span className="text-xs text-blue-600 font-medium animate-pulse">Đang bật chế độ giao hàng</span>}
                    </div>

                    {/* Form Giao hàng (Chỉ hiện khi bật) */}
                    {isDelivery && (
                        <div className="space-y-2 animate-fade-in bg-blue-50 p-3 rounded-lg border border-blue-100">
                            {/* Dòng 1: Địa chỉ & SĐT */}
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <FiMapPin className="absolute left-2.5 top-2.5 text-blue-400 text-xs"/>
                                    <input 
                                        type="text" placeholder="Địa chỉ giao..." 
                                        className="w-full pl-7 pr-3 py-1.5 text-xs border border-blue-200 rounded outline-none focus:border-blue-500"
                                        value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)}
                                    />
                                </div>
                                <div className="w-1/3 relative">
                                    <FiPhone className="absolute left-2.5 top-2.5 text-blue-400 text-xs"/>
                                    <input 
                                        type="text" placeholder="SĐT..." 
                                        className="w-full pl-7 pr-3 py-1.5 text-xs border border-blue-200 rounded outline-none focus:border-blue-500"
                                        value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)}
                                    />
                                </div>
                            </div>
                            {/* Dòng 2: Shipper & Phí Ship */}
                            <div className="flex gap-2 items-center">
                                <div className="flex-1 relative">
                                    <FiTruck className="absolute left-2.5 top-2.5 text-blue-400 text-xs"/>
                                    <input 
                                        type="text" placeholder="Tên Shipper / Đơn vị VC" 
                                        className="w-full pl-7 pr-3 py-1.5 text-xs border border-blue-200 rounded outline-none focus:border-blue-500"
                                        value={shipperName} onChange={e => setShipperName(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-blue-200">
                                    <span className="text-xs font-bold text-blue-700 whitespace-nowrap">Ship:</span>
                                    <NumericFormat 
                                        className="w-16 text-right text-xs font-bold text-blue-700 outline-none"
                                        value={shipFee} onValueChange={(v) => setShipFee(v.floatValue || 0)}
                                        thousandSeparator="," placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tính tiền */}
                    <div className="space-y-1 pt-2 border-t border-slate-100">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Tổng tiền hàng:</span>
                            <span className="font-medium">{formatCurrency(productTotal)}</span>
                        </div>
                        {isDelivery && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Phí vận chuyển:</span>
                                <span className="font-medium text-blue-600">+{formatCurrency(shipFee)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Giảm giá:</span>
                            <NumericFormat 
                                className="w-20 text-right font-medium text-red-500 outline-none border-b border-dashed border-red-200 focus:border-red-500"
                                value={discount} onValueChange={(v) => setDiscount(v.floatValue || 0)}
                                thousandSeparator="," prefix="-"
                            />
                        </div>
                        <div className="flex justify-between items-center pt-1">
                            <span className="font-bold text-slate-700 text-base">Khách phải trả:</span>
                            <span className="font-black text-xl text-primary-600">{formatCurrency(finalTotal)}</span>
                        </div>
                    </div>

                    {/* Hình thức thanh toán */}
                    <div className="flex gap-2">
                        <PaymentMethodButton method="cash" icon={FiDollarSign} label="Tiền mặt" currentMethod={paymentMethod} setMethod={setPaymentMethod} />
                        <PaymentMethodButton method="transfer" icon={FiCreditCard} label="Chuyển khoản" currentMethod={paymentMethod} setMethod={setPaymentMethod} />
                        <PaymentMethodButton method="debt" icon={FiFileText} label="Công nợ" currentMethod={paymentMethod} setMethod={setPaymentMethod} />
                    </div>

                    {/* Khách đưa tiền & Tiền thừa/COD */}
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-600 uppercase">Khách đưa:</span>
                            <NumericFormat 
                                className="w-32 text-right font-bold text-lg text-slate-800 bg-transparent outline-none border-b border-slate-300 focus:border-primary-500"
                                value={amountPaid} onValueChange={(v) => setAmountPaid(v.floatValue || 0)}
                                thousandSeparator="," placeholder="0"
                            />
                        </div>

                        {/* Tiền mặt nhanh */}
                        <div className="flex gap-1 justify-end mb-2">
                            {[500000, 200000, 100000, 50000].map(val => (
                                <QuickCashButton key={val} value={val} onClick={setAmountPaid} />
                            ))}
                        </div>

                        {/* Hiển thị kết quả: Tiền thừa hoặc COD */}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                            {isDelivery && codAmount > 0 ? (
                                <>
                                    <span className="text-xs font-bold text-red-600 uppercase">Thu hộ (COD):</span>
                                    <span className="font-black text-lg text-red-600">{formatCurrency(codAmount)}</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-xs font-bold text-green-600 uppercase">Tiền thừa:</span>
                                    <span className="font-black text-lg text-green-600">{formatCurrency(changeAmount)}</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Nút Thanh Toán */}
                    <Button 
                        fullWidth 
                        size="lg" 
                        variant="primary" 
                        icon={isDelivery ? <FiTruck size={24}/> : <FiCheckCircle size={24} />} 
                        onClick={handleCheckout} 
                        disabled={cart.length === 0 || createInvoiceMutation.isPending} 
                        isLoading={createInvoiceMutation.isPending} 
                        className="py-3 text-lg font-bold shadow-lg shadow-primary-600/30 hover:shadow-primary-600/50 transition-all"
                    >
                        {isDelivery ? 'TẠO ĐƠN GIAO (F9)' : 'THANH TOÁN (F9)'}
                    </Button>
                </div>
            </div>

            {/* --- MODALS --- */}
            
            {/* Modal thêm khách nhanh */}
            {isCustomerModalOpen && (
                <QuickCustomerModal 
                    isOpen={isCustomerModalOpen} 
                    onClose={() => setIsCustomerModalOpen(false)}
                    onSuccess={(newCustomer: any) => {
                        setCustomerId(newCustomer.id || newCustomer._id);
                        setCustomerName(newCustomer.name);
                        setIsCustomerModalOpen(false);
                    }}
                />
            )}

            {/* Modal In hóa đơn (Tự động mở sau khi thanh toán) */}
            {showPrintModal && createdInvoice && (
                <PrintInvoiceModal
                    isOpen={showPrintModal}
                    onClose={() => {
                        setShowPrintModal(false);
                        setCreatedInvoice(null);
                        // Focus lại vào ô tìm kiếm để bán đơn tiếp theo
                        searchInputRef.current?.focus();
                    }}
                    invoice={createdInvoice}
                />
            )}
        </div>
    );
};

export default SalesPage;