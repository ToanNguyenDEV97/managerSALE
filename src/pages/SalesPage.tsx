import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    FiSearch, FiShoppingCart, FiTrash2, FiPlus, FiMinus, 
    FiUser, FiCheckCircle, FiDollarSign, FiCreditCard, FiFileText, 
    FiTruck, FiMapPin, FiPhone, FiX, FiChevronDown, FiBox
} from 'react-icons/fi';
import { NumericFormat } from 'react-number-format';
import { Button } from '../components/common/Button';
import { useProducts, useCategories } from '../hooks/useProducts';
import { useAllCustomers } from '../hooks/useCustomers'; 
import { useSaveInvoice } from '../hooks/useInvoices'; 
import { useDebounce } from '../hooks/useDebounce';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/currency';
import QuickCustomerModal from '../components/features/partners/QuickCustomerModal';
import PrintInvoiceModal from '../components/print/PrintInvoiceModal';
import Pagination from '../components/common/Pagination'; // [MỚI] Import Pagination

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
    id?: string;
    _id?: string;
    name: string;
}

interface Product {
    id?: string;
    _id?: string;
    name: string;
    sku: string;
    price: number; 
    stock: number;
    category?: string;
    image?: string;
}

// --- HELPER COMPONENTS ---
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
        className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold border border-slate-200 transition-colors"
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
    
    // [MỚI] State phân trang
    const [page, setPage] = useState(1);

    // 2. State Khách hàng & Thanh toán
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [customerName, setCustomerName] = useState('Khách lẻ');
    
    // State tìm kiếm khách hàng
    const [customerSearchTerm, setCustomerSearchTerm] = useState(''); 
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const customerDropdownRef = useRef<HTMLDivElement>(null);

    const [paymentMethod, setPaymentMethod] = useState<string>('Tiền mặt');
    const [amountPaid, setAmountPaid] = useState<number>(0);
    const [discount, setDiscount] = useState<number>(0);
    const [orderNote, setOrderNote] = useState('');

    // 3. State Giao hàng
    const [isDelivery, setIsDelivery] = useState(false);
    const [shipFee, setShipFee] = useState<number>(0);
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [shipperName, setShipperName] = useState('');

    // 4. State Modal
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null);

    // --- HOOKS ---
    // [MỚI] Tự động reset về trang 1 khi tìm kiếm hoặc đổi danh mục
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, selectedCategory]);

    const { data: productsData, isLoading: isLoadingProducts } = useProducts(
        page, // [MỚI] Truyền page động
        24,   // [MỚI] Limit 24 (chia hết cho 2,3,4,6 cột) để đẹp grid
        debouncedSearch, 
        selectedCategory || ''
    );

    const { data: categories = [] } = useCategories();

    const productList: Product[] = useMemo(() => {
        if (!productsData) return [];
        if (productsData.data && Array.isArray(productsData.data)) return productsData.data;
        if (Array.isArray(productsData)) return productsData;
        return (productsData as any).products || [];
    }, [productsData]);

    // [MỚI] Lấy tổng số trang từ API
    const totalPages = useMemo(() => {
        if (productsData?.totalPages) return productsData.totalPages;
        return 1;
    }, [productsData]);

    const { data: customersData } = useAllCustomers();
    const customers = useMemo(() => customersData?.data || customersData || [], [customersData]);
    const createInvoiceMutation = useSaveInvoice();

    const filteredCustomers = useMemo(() => {
        if (!customerSearchTerm) return customers;
        const lowerTerm = customerSearchTerm.toLowerCase();
        return customers.filter((c: any) => 
            (c.name && c.name.toLowerCase().includes(lowerTerm)) || 
            (c.phone && c.phone.includes(lowerTerm))
        );
    }, [customers, customerSearchTerm]);

    // --- LOGIC TÍNH TOÁN ---
    const productTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
    const finalTotal = productTotal + (isDelivery ? shipFee : 0) - discount;
    const codAmount = Math.max(0, finalTotal - amountPaid);
    const changeAmount = Math.max(0, amountPaid - finalTotal);

    // Tự động điền số tiền khách đưa
    useEffect(() => {
        if (isDelivery || paymentMethod === 'Công nợ') {
            if(paymentMethod === 'Công nợ') setAmountPaid(0);
        } else {
            setAmountPaid(finalTotal);
        }
    }, [finalTotal, paymentMethod, isDelivery]);

    // --- HANDLERS ---
    useEffect(() => {
        function handleClickOutside(event: any) {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
                setShowCustomerDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const addToCart = (product: Product) => {
        const productId = product.id || product._id;
        if (!productId) {
            toast.error("Lỗi dữ liệu sản phẩm (Missing ID)");
            return;
        }

        setCart(prev => {
            const exist = prev.find(item => item.id === productId);
            if (exist) {
                return prev.map(item => item.id === productId 
                    ? { ...item, quantity: item.quantity + 1 } 
                    : item
                );
            }
            return [...prev, { 
                id: productId, 
                sku: product.sku,
                name: product.name, 
                price: product.price, 
                quantity: 1,
                stock: product.stock 
            }];
        });
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const handleSelectCustomer = (customer: any) => {
        setCustomerId(customer.id || customer._id);
        setCustomerName(customer.name);
        setDeliveryAddress(customer.address || '');
        setRecipientPhone(customer.phone || '');
        setCustomerSearchTerm(''); 
        setShowCustomerDropdown(false);
    };

    const handleClearCustomer = () => {
        setCustomerId(null);
        setCustomerName('Khách lẻ');
        setDeliveryAddress('');
        setRecipientPhone('');
        setCustomerSearchTerm('');
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        const payload = {
            customerId: customerId, 
            customerName: customerName,
            items: cart.map(item => ({
                productId: item.id,
                quantity: item.quantity,
                price: item.price
            })),
            discountAmount: discount,
            paymentMethod: paymentMethod,
            paymentAmount: amountPaid,
            note: orderNote,
            deliveryInfo: isDelivery ? {
                isDelivery: true,
                shipFee: shipFee,
                address: deliveryAddress,
                phone: recipientPhone,
                shipperName: shipperName,
                codAmount: codAmount,
                receiverName: customerName
            } : undefined
        };

        try {
            const res = await createInvoiceMutation.mutateAsync(payload);
            if (res && res.newInvoice) {
                toast.success('Thanh toán thành công!');
                const invoiceId = res.newInvoice.id || res.newInvoice._id;
                setCreatedInvoiceId(invoiceId);
                setShowPrintModal(true);
                
                // Reset form
                setCart([]);
                setAmountPaid(0);
                handleClearCustomer();
                setDiscount(0);
                setOrderNote('');
                setIsDelivery(false);
                setShipFee(0);
                setShipperName('');
                setPaymentMethod('Tiền mặt');
            }
        } catch (error: any) {
            console.error("Checkout Error:", error);
            const errorMsg = error.response?.data?.message || error.message || 'Lỗi thanh toán';
            toast.error(errorMsg);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F9') handleCheckout();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart, amountPaid, isDelivery, shipFee, customerId, paymentMethod]);

    return (
        <div className="flex h-[calc(100vh-80px)] gap-4 p-2 bg-slate-100 overflow-hidden">
            
            {/* --- CỘT TRÁI: DANH SÁCH SẢN PHẨM --- */}
            <div className="flex-1 flex flex-col gap-3 bg-white rounded-xl shadow-sm p-3 h-full overflow-hidden">
                {/* Search */}
                <div className="relative shrink-0">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        ref={searchInputRef}
                        type="text" 
                        placeholder="Tìm sản phẩm (F2)..." 
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto pb-2 shrink-0 scrollbar-hide">
                    <button 
                        onClick={() => setSelectedCategory(null)}
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                            ${!selectedCategory ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                        `}
                    >
                        Tất cả
                    </button>
                    {categories.map((cat: Category, index: number) => (
                        <button 
                            key={cat.id || cat._id || index}
                            onClick={() => setSelectedCategory(cat.id || cat._id || null)}
                            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                                ${selectedCategory === (cat.id || cat._id) ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                            `}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Grid Products */}
                <div className="flex-1 overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 content-start">
                        {isLoadingProducts ? (
                            <div className="col-span-full text-center py-10 text-slate-500">Đang tải sản phẩm...</div>
                        ) : productList.length === 0 ? (
                            <div className="col-span-full text-center py-10 text-slate-400 flex flex-col items-center">
                                <FiShoppingCart size={30} className="mb-2 opacity-50"/>
                                <p className="text-sm">Không tìm thấy SP</p>
                            </div>
                        ) : (
                            productList.map((product: Product) => (
                                <div 
                                    key={product.id || product._id}
                                    className="bg-white border border-slate-200 rounded-lg p-2 cursor-pointer hover:border-primary-500 hover:shadow-md transition-all flex flex-col justify-between min-h-[90px] group relative"
                                    onClick={() => addToCart(product)}
                                >
                                    <div>
                                        <h3 className="font-semibold text-xs text-slate-700 line-clamp-2 leading-tight mb-1" title={product.name}>
                                            {product.name}
                                        </h3>
                                        <div className="text-[10px] text-slate-500 mb-1">Available: {product.stock}</div>
                                    </div>
                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="font-bold text-sm text-primary-600">{formatCurrency(product.price)}</span>
                                        <div className="bg-primary-50 text-primary-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            <FiPlus size={12}/>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* [MỚI] Footer Pagination */}
                {totalPages > 1 && (
                    <div className="pt-2 border-t border-slate-100 shrink-0">
                        <Pagination 
                            currentPage={page} 
                            totalPages={totalPages} 
                            onPageChange={setPage} 
                        />
                    </div>
                )}
            </div>

            {/* --- CỘT PHẢI: GIỎ HÀNG & THANH TOÁN --- */}
            <div className="w-[400px] flex flex-col gap-3 h-full shrink-0">
                
                {/* 1. Thông tin khách hàng */}
                <div className="bg-white p-3 rounded-xl shadow-sm shrink-0 relative z-20" ref={customerDropdownRef}>
                    <div className="relative">
                        {customerId ? (
                            <div className="flex items-center justify-between bg-primary-50 border border-primary-200 text-primary-800 px-3 py-2 rounded-lg">
                                <div>
                                    <div className="font-bold text-sm text-primary-900">{customerName}</div>
                                    <div className="text-xs text-primary-600/80">{recipientPhone || 'Chưa có SĐT'}</div>
                                </div>
                                <button onClick={handleClearCustomer} className="p-1 hover:bg-white rounded text-primary-600">
                                    <FiX size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Tìm khách hàng (Tên/SĐT)..."
                                    className="w-full pl-8 pr-8 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:bg-white outline-none"
                                    value={customerSearchTerm}
                                    onChange={(e) => {
                                        setCustomerSearchTerm(e.target.value);
                                        setShowCustomerDropdown(true);
                                    }}
                                    onFocus={() => setShowCustomerDropdown(true)}
                                />
                                <FiUser className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 p-1" onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}>
                                    <FiChevronDown size={14}/>
                                </button>
                            </div>
                        )}

                        {showCustomerDropdown && !customerId && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-slate-200 max-h-[300px] overflow-hidden flex flex-col z-50">
                                <div className="flex-1 overflow-y-auto">
                                    {filteredCustomers.length === 0 ? (
                                        <div className="p-3 text-center text-slate-500 text-xs">Không tìm thấy.</div>
                                    ) : (
                                        filteredCustomers.map((c: any) => (
                                            <div key={c.id || c._id} className="px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0" onClick={() => handleSelectCustomer(c)}>
                                                <div className="font-bold text-sm text-slate-700">{c.name}</div>
                                                <div className="text-xs text-slate-500">{c.phone || '---'}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="p-2 bg-slate-50 border-t border-slate-100 shrink-0">
                                    <Button fullWidth size="sm" variant="outline" icon={<FiPlus />} onClick={() => { setIsCustomerModalOpen(true); setShowCustomerDropdown(false); }}>
                                        Thêm mới
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Danh sách giỏ hàng */}
                <div className="bg-white flex-1 rounded-xl shadow-sm flex flex-col overflow-hidden z-0">
                    <div className="p-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <span className="font-bold text-sm text-slate-700">Giỏ hàng ({cart.length})</span>
                        {cart.length > 0 && (
                             <button onClick={() => setCart([])} className="text-xs text-red-500 hover:text-red-700 font-medium">Xóa hết</button>
                        )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                                <FiBox size={32} className="mb-1" />
                                <p className="text-xs">Chưa có sản phẩm</p>
                            </div>
                        ) : cart.map((item) => (
                            <div key={item.id} className="flex gap-2 p-2 rounded border border-slate-100 hover:border-primary-100 bg-white group">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm text-slate-700 truncate">{item.name}</h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-slate-500">{formatCurrency(item.price)}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="font-bold text-sm text-primary-600">{formatCurrency(item.price * item.quantity)}</span>
                                    <div className="flex items-center gap-1 bg-slate-50 rounded px-1 border border-slate-200">
                                        <button onClick={() => updateQuantity(item.id, -1)} className="p-0.5 hover:text-red-500"><FiMinus size={10}/></button>
                                        <span className="text-xs font-bold w-5 text-center select-none">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, 1)} className="p-0.5 hover:text-green-500"><FiPlus size={10}/></button>
                                    </div>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} className="self-center p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                                    <FiTrash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Phần Thanh Toán & Giao Hàng */}
                <div className="bg-white p-3 rounded-xl shadow-sm shrink-0 flex flex-col gap-2">
                    {/* Toggle Giao hàng */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                            <input 
                                type="checkbox" 
                                className="w-3.5 h-3.5 rounded text-primary-600 focus:ring-primary-500"
                                checked={isDelivery}
                                onChange={(e) => setIsDelivery(e.target.checked)}
                            />
                            Giao hàng tận nơi
                        </label>
                        {isDelivery && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 rounded font-bold animate-pulse">ON</span>}
                    </div>

                    {/* Form Giao hàng */}
                    {isDelivery && (
                        <div className="space-y-1.5 bg-blue-50/50 p-2 rounded border border-blue-100 animate-fade-in">
                            <div className="flex gap-1.5">
                                <input 
                                    type="text" placeholder="Địa chỉ giao..." 
                                    className="flex-1 px-2 py-1 text-xs border border-blue-200 rounded outline-none focus:border-blue-500 bg-white"
                                    value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)}
                                />
                                <input 
                                    type="text" placeholder="SĐT..." 
                                    className="w-1/3 px-2 py-1 text-xs border border-blue-200 rounded outline-none focus:border-blue-500 bg-white"
                                    value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-1.5">
                                <input 
                                    type="text" placeholder="Shipper..." 
                                    className="flex-1 px-2 py-1 text-xs border border-blue-200 rounded outline-none focus:border-blue-500 bg-white"
                                    value={shipperName} onChange={e => setShipperName(e.target.value)}
                                />
                                <div className="w-1/3 flex items-center bg-white border border-blue-200 rounded px-2">
                                    <span className="text-[10px] text-blue-500 mr-1">Ship:</span>
                                    <NumericFormat 
                                        className="w-full text-right text-xs font-bold text-blue-700 outline-none"
                                        value={shipFee} onValueChange={(v) => setShipFee(v.floatValue || 0)}
                                        thousandSeparator="," placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tính tiền */}
                    <div className="pt-1 border-t border-slate-100 space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Tổng hàng:</span>
                            <span className="font-medium">{formatCurrency(productTotal)}</span>
                        </div>
                        {isDelivery && (
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Phí ship:</span>
                                <span className="font-medium text-blue-600">+{formatCurrency(shipFee)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xs items-center">
                            <span className="text-slate-500">Giảm giá:</span>
                            <NumericFormat 
                                className="w-20 text-right font-medium text-red-500 outline-none border-b border-dashed border-red-200 focus:border-red-500 bg-transparent py-0"
                                value={discount} 
                                onValueChange={(v) => setDiscount(v.floatValue || 0)}
                                thousandSeparator="," prefix="-" placeholder="0" allowNegative={false} 
                            />
                        </div>
                        <div className="flex justify-between items-center pt-1 mt-1 border-t border-slate-100">
                            <span className="font-bold text-slate-700 text-sm">Phải trả:</span>
                            <span className="font-black text-lg text-primary-600">{formatCurrency(finalTotal)}</span>
                        </div>
                    </div>

                    {/* Phương thức thanh toán */}
                    <div className="flex gap-1.5">
                        <PaymentMethodButton method="Tiền mặt" icon={FiDollarSign} label="Tiền mặt" currentMethod={paymentMethod} setMethod={setPaymentMethod} />
                        <PaymentMethodButton method="Chuyển khoản" icon={FiCreditCard} label="Chuyển khoản" currentMethod={paymentMethod} setMethod={setPaymentMethod} />
                        <PaymentMethodButton method="Công nợ" icon={FiFileText} label="Công nợ" currentMethod={paymentMethod} setMethod={setPaymentMethod} />
                    </div>

                    {/* Khách đưa */}
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-slate-600 uppercase">Khách đưa:</span>
                            <NumericFormat 
                                className="w-32 text-right font-bold text-lg text-slate-800 bg-transparent outline-none border-b border-slate-300 focus:border-primary-500"
                                value={amountPaid} onValueChange={(v) => setAmountPaid(v.floatValue || 0)}
                                thousandSeparator="," placeholder="0"
                            />
                        </div>

                        {/* Gợi ý tiền mặt */}
                        <div className="flex gap-1 justify-end mb-1 flex-wrap">
                            {[500000, 200000, 100000, 50000].map(val => (
                                <QuickCashButton key={val} value={val} onClick={setAmountPaid} />
                            ))}
                        </div>

                        <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                            {isDelivery && codAmount > 0 ? (
                                <>
                                    <span className="text-xs font-bold text-red-600 uppercase">Thu hộ (COD):</span>
                                    <span className="font-black text-base text-red-600">{formatCurrency(codAmount)}</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-xs font-bold text-green-600 uppercase">Tiền thừa:</span>
                                    <span className="font-black text-base text-green-600">{formatCurrency(changeAmount)}</span>
                                </>
                            )}
                        </div>
                    </div>

                    <Button 
                        fullWidth 
                        size="lg" 
                        variant="primary" 
                        icon={isDelivery ? <FiTruck size={20}/> : <FiCheckCircle size={20} />} 
                        onClick={handleCheckout} 
                        disabled={cart.length === 0 || createInvoiceMutation.isPending} 
                        isLoading={createInvoiceMutation.isPending} 
                        className="py-2.5 text-base font-bold shadow-lg shadow-primary-600/30 hover:shadow-primary-600/50 transition-all"
                    >
                        {isDelivery ? 'TẠO ĐƠN (F9)' : 'THANH TOÁN (F9)'}
                    </Button>
                </div>
            </div>

            {/* MODALS */}
            {isCustomerModalOpen && (
                <QuickCustomerModal 
                    isOpen={isCustomerModalOpen} 
                    onClose={() => setIsCustomerModalOpen(false)}
                    onSuccess={(newCustomer: any) => {
                        setCustomerId(newCustomer.id || newCustomer._id);
                        setCustomerName(newCustomer.name);
                        setDeliveryAddress(newCustomer.address || '');
                        setRecipientPhone(newCustomer.phone || '');
                        setIsCustomerModalOpen(false);
                        setCustomerSearchTerm('');
                    }}
                />
            )}
            
            {showPrintModal && createdInvoiceId && (
                <PrintInvoiceModal
                    invoiceId={createdInvoiceId} 
                    onClose={() => {
                        setShowPrintModal(false);
                        setCreatedInvoiceId(null);
                        searchInputRef.current?.focus();
                    }}
                />
            )}
        </div>
    );
};

export default SalesPage;