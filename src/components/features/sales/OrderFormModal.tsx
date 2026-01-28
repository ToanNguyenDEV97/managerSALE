import React, { useState, useEffect, useMemo } from 'react';
import { 
    FiSearch, FiShoppingCart, FiUser, FiMapPin, FiTruck, 
    FiFileText, FiX, FiPlus, FiMinus, FiTrash2, FiBox, FiCheckCircle 
} from 'react-icons/fi';
import { api } from '../../../utils/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../../utils/currency';

// Import Component
import BaseModal from '../../common/BaseModal'; 
import { Button } from '../../common/Button';

interface Props {
    onClose: () => void;
    onSuccess?: () => void;
}

const OrderFormModal: React.FC<Props> = ({ onClose, onSuccess }) => {
    // --- Data State ---
    const [products, setProducts] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    
    // --- Form State ---
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [cart, setCart] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    
    // Thanh toán & Ghi chú
    const [paymentAmount, setPaymentAmount] = useState<string>('');
    const [note, setNote] = useState('');
    
    // Giao hàng
    const [isDelivery, setIsDelivery] = useState(false);
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [shipFee, setShipFee] = useState<string>('');

    const [loading, setLoading] = useState(false);

    // --- Load Data ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodRes, custRes] = await Promise.all([
                    api('/api/products?limit=1000'), 
                    api('/api/customers?limit=1000')
                ]);
                setProducts(prodRes.data || []);
                setCustomers(custRes.data || []);
            } catch (err) {
                console.error(err);
                toast.error('Lỗi tải dữ liệu');
            }
        };
        fetchData();
    }, []);

    // --- Logic Giỏ Hàng ---
    const addToCart = (product: any) => {
        // Kiểm tra ID sản phẩm (Quan trọng để fix lỗi productId required)
        const productId = product._id || product.id; 
        if (!productId) return toast.error('Sản phẩm lỗi: Không có ID');

        const price = product.retailPrice ?? product.price ?? 0;
        const stock = product.quantity ?? product.stock ?? 0;

        if (stock <= 0) return toast.error('Sản phẩm đã hết hàng!');
        
        setCart(prev => {
            const exist = prev.find(item => item.productId === productId);
            if (exist) {
                if (exist.qty >= stock) {
                    toast.error(`Kho chỉ còn ${stock} sản phẩm!`);
                    return prev;
                }
                return prev.map(item => item.productId === productId ? { ...item, qty: item.qty + 1 } : item);
            }
            // [FIX] Lưu productId rõ ràng ngay từ đây
            return [...prev, { 
                productId: productId, 
                name: product.name,
                sku: product.sku,
                qty: 1, 
                customPrice: price, 
                maxStock: stock 
            }];
        });
    };

    const updateQty = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.productId === id) {
                const newQty = Math.max(1, item.qty + delta);
                if (newQty > item.maxStock) {
                    toast.error('Vượt quá tồn kho!');
                    return item;
                }
                return { ...item, qty: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.productId !== id));
    };

    // --- Tính toán ---
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalAmount = cart.reduce((sum, item) => sum + (item.qty * (item.customPrice || 0)), 0);
    const shippingFeeVal = Number(shipFee) || 0;
    const finalTotal = totalAmount + (isDelivery ? shippingFeeVal : 0);

    // --- Submit ---
    const handleSubmit = async () => {
        if (cart.length === 0) return toast.error('Giỏ hàng đang trống!');
        
        setLoading(true);
        try {
            // Chuẩn bị thông tin giao hàng
            // [FIX] Nếu không giao hàng -> KHÔNG GỬI phone/shipFee/shipperName để tránh validate lỗi
            let deliveryInfo: any = {
                isDelivery: isDelivery,
                address: address || selectedCustomer?.address || 'Tại cửa hàng' // Bắt buộc có
            };

            if (isDelivery) {
                deliveryInfo.shipFee = shippingFeeVal;
                // Chỉ gửi phone nếu có dữ liệu
                const contactPhone = phone || selectedCustomer?.phone;
                if (contactPhone) {
                    deliveryInfo.phone = contactPhone;
                }
                // Backend báo shipperName not allowed -> Tạm thời không gửi
                // deliveryInfo.shipperName = shipperName; 
            }

            const payload = {
                customerId: selectedCustomer?._id, // Backend sẽ tự lookup ra customerName
                
                // [FIX] Map items chuẩn xác
                items: cart.map(i => ({
                    productId: i.productId, // Đảm bảo trường này luôn có giá trị
                    quantity: Number(i.qty),
                    price: Number(i.customPrice)
                })),
                
                // Các trường tính toán (totalAmount, discountAmount) backend sẽ tự tính -> Không gửi để tránh lỗi
                paymentAmount: Number(paymentAmount) || 0,
                note: note,
                deliveryInfo: deliveryInfo
            };

            console.log('Payload:', payload); // Debug xem console

            await api('/api/orders', { method: 'POST', body: JSON.stringify(payload) });

            toast.success('Tạo đơn hàng thành công!');
            if (onSuccess) onSuccess();
            onClose();
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || 'Lỗi khi tạo đơn');
        } finally {
            setLoading(false);
        }
    };

    // Filter
    const filteredProducts = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return products.filter(p => 
            (p.name && p.name.toLowerCase().includes(lowerSearch)) || 
            (p.sku && p.sku.toLowerCase().includes(lowerSearch))
        );
    }, [products, searchTerm]);

    const filteredCustomers = useMemo(() => {
        const lowerSearch = customerSearch.toLowerCase();
        return customers.filter(c =>
            (c.name && c.name.toLowerCase().includes(lowerSearch)) ||
            (c.phone && c.phone.includes(lowerSearch))
        );
    }, [customers, customerSearch]);

    return (
        <BaseModal isOpen={true} onClose={onClose} title="Tạo Đơn Đặt Hàng" size="xl">
            <div className="flex h-[85vh] bg-slate-100 -m-6 overflow-hidden"> 
                
                {/* LEFT: PRODUCTS (65%) */}
                <div className="w-[65%] flex flex-col border-r border-slate-200 bg-slate-50/50">
                    <div className="p-4 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                        <div className="relative group">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"/>
                            <input 
                                className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm font-medium"
                                placeholder="Tìm kiếm sản phẩm..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredProducts.map((product, index) => {
                                // [FIX KEY] Sử dụng ID hoặc index làm key duy nhất
                                const key = product._id || product.id || index;
                                const price = product.retailPrice ?? product.price ?? 0;
                                const stock = product.quantity ?? product.stock ?? 0;
                                const isOutOfStock = stock <= 0;

                                return (
                                    <div 
                                        key={key} 
                                        onClick={() => !isOutOfStock && addToCart(product)}
                                        className={`bg-white p-3 rounded-xl border shadow-sm transition-all flex flex-col justify-between h-full relative overflow-hidden select-none
                                            ${isOutOfStock 
                                                ? 'opacity-60 cursor-not-allowed border-slate-100 bg-slate-50' 
                                                : 'cursor-pointer hover:shadow-md hover:border-blue-400 border-slate-200'}`}
                                    >
                                        <div className={`absolute top-0 right-0 px-2 py-1 rounded-bl-lg text-[10px] font-bold z-10 
                                            ${isOutOfStock ? 'bg-slate-200 text-slate-500' : 
                                              stock < 10 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                            Kho: {stock}
                                        </div>

                                        <div className="mb-3 pt-4">
                                            <h4 className="font-semibold text-slate-700 line-clamp-2 text-sm leading-snug">
                                                {product.name}
                                            </h4>
                                            <p className="text-xs text-slate-400 mt-1 font-mono bg-slate-50 inline-block px-1 rounded border border-slate-100">
                                                {product.sku}
                                            </p>
                                        </div>
                                        
                                        <div className="flex justify-between items-end mt-auto">
                                            <span className="font-bold text-blue-700 text-base">
                                                {formatCurrency(price)}
                                            </span>
                                            {!isOutOfStock && (
                                                <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg">
                                                    <FiPlus size={18}/>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* RIGHT: CART & PAY (35%) */}
                <div className="w-[35%] flex flex-col bg-white shadow-xl z-20 h-full">
                    
                    {/* Customer Select */}
                    <div className="p-4 border-b border-slate-100 bg-white z-20 shrink-0">
                        <div className="relative">
                            {!selectedCustomer ? (
                                <div>
                                    <div className="relative">
                                        <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                        <input 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="Tìm khách hàng..."
                                            value={customerSearch}
                                            onChange={e => {
                                                setCustomerSearch(e.target.value);
                                                setShowCustomerDropdown(true);
                                            }}
                                            onFocus={() => setShowCustomerDropdown(true)}
                                        />
                                    </div>
                                    {showCustomerDropdown && customerSearch && (
                                        <div className="absolute top-full left-0 w-full bg-white shadow-xl border border-slate-100 rounded-lg mt-1 max-h-60 overflow-y-auto z-50 custom-scrollbar animate-fade-in">
                                            {filteredCustomers.length > 0 ? filteredCustomers.map((c, idx) => (
                                                <div 
                                                    key={c._id || idx}
                                                    className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0"
                                                    onClick={() => {
                                                        setSelectedCustomer(c);
                                                        setAddress(c.address || '');
                                                        setPhone(c.phone || '');
                                                        setShowCustomerDropdown(false);
                                                        setCustomerSearch('');
                                                    }}
                                                >
                                                    <div className="font-bold text-sm text-slate-700">{c.name}</div>
                                                    <div className="text-xs text-slate-500">{c.phone}</div>
                                                </div>
                                            )) : (
                                                <div className="p-3 text-center text-xs text-slate-400">Không tìm thấy khách hàng</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-between bg-blue-50 border border-blue-100 p-2.5 rounded-lg">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="bg-blue-200 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                                            <FiUser size={16}/>
                                        </div>
                                        <div className="truncate">
                                            <div className="font-bold text-sm text-blue-900 truncate">{selectedCustomer.name}</div>
                                            <div className="text-xs text-blue-600 font-mono">{selectedCustomer.phone}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-red-500 p-1">
                                        <FiX size={14}/>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cart List */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                                <FiShoppingCart size={64} className="mb-3 text-slate-300"/>
                                <p className="text-sm font-medium">Chưa có sản phẩm nào</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {cart.map((item, idx) => (
                                    <div key={item.productId || idx} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2 hover:border-blue-300 transition-colors">
                                        <div className="flex justify-between items-start gap-2">
                                            <span className="font-semibold text-sm text-slate-800 line-clamp-2 leading-tight">
                                                {item.name}
                                            </span>
                                            <button onClick={() => removeFromCart(item.productId)} className="text-slate-300 hover:text-red-500 transition-colors shrink-0">
                                                <FiTrash2 size={16}/>
                                            </button>
                                        </div>
                                        
                                        <div className="flex justify-between items-end">
                                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                                <span className="font-medium text-blue-600">{formatCurrency(item.customPrice)}</span>
                                                <span>x</span>
                                                <span>{item.qty}</span>
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                <div className="font-bold text-slate-700 text-sm">
                                                    {formatCurrency(item.customPrice * item.qty)}
                                                </div>
                                                <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                                                    <button onClick={() => updateQty(item.productId, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded text-slate-600"><FiMinus size={12}/></button>
                                                    <span className="w-8 text-center text-sm font-bold text-slate-800">{item.qty}</span>
                                                    <button onClick={() => updateQty(item.productId, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded text-blue-600"><FiPlus size={12}/></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer Payment */}
                    <div className="bg-white border-t border-slate-200 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.1)] p-4 space-y-3 z-30 shrink-0">
                        
                        {/* Delivery Toggle */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer select-none">
                                    <div className={`w-9 h-5 rounded-full p-1 transition-colors duration-300 flex items-center ${isDelivery ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'}`}>
                                        <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm"></div>
                                    </div>
                                    <input type="checkbox" className="hidden" checked={isDelivery} onChange={e => setIsDelivery(e.target.checked)}/>
                                    <span className="flex items-center gap-1"><FiTruck/> Giao hàng</span>
                                </label>
                                {isDelivery && <span className="text-xs text-blue-600 font-medium">+ Phí ship</span>}
                            </div>

                            {isDelivery && (
                                <div className="grid grid-cols-2 gap-2 animate-fade-in bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm mb-2">
                                    <input 
                                        className="col-span-2 bg-white border border-slate-300 rounded px-2 py-1.5 outline-none focus:border-blue-500"
                                        placeholder="Địa chỉ (Bắt buộc)"
                                        value={address} onChange={e => setAddress(e.target.value)}
                                    />
                                    <input 
                                        className="col-span-2 bg-white border border-slate-300 rounded px-2 py-1.5 outline-none focus:border-blue-500"
                                        placeholder="Phí ship (VNĐ)"
                                        type="number"
                                        value={shipFee} onChange={e => setShipFee(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Note */}
                        <div className="relative group">
                            <FiFileText className="absolute left-3 top-2.5 text-slate-400"/>
                            <textarea 
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 resize-none h-10 min-h-[40px] focus:h-16 transition-all"
                                placeholder="Ghi chú đơn hàng..."
                                value={note} onChange={e => setNote(e.target.value)}
                            />
                        </div>

                        {/* Totals */}
                        <div className="space-y-1 pt-2 border-t border-dashed border-slate-200">
                            <div className="flex justify-between text-sm text-slate-500">
                                <span>Tiền hàng ({totalItems} sp):</span>
                                <span className="font-medium text-slate-700">{formatCurrency(totalAmount)}</span>
                            </div>
                            {isDelivery && (
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>Phí vận chuyển:</span>
                                    <span className="font-medium text-slate-700">+ {formatCurrency(shippingFeeVal)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-xl font-black text-slate-800 mt-1">
                                <span>TỔNG CỘNG</span>
                                <span className="text-blue-700">{formatCurrency(finalTotal)}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 items-center pt-2">
                            <div className="relative flex-1 group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Khách trả</span>
                                <input 
                                    type="number" 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-20 pr-3 py-3 text-right font-bold text-green-600 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                                    placeholder="0"
                                    value={paymentAmount}
                                    onChange={e => setPaymentAmount(e.target.value)}
                                />
                            </div>
                            <Button 
                                variant="primary" 
                                className="flex-[1.5] py-3 text-base shadow-lg shadow-blue-500/25 rounded-xl font-bold tracking-wide"
                                onClick={handleSubmit}
                                isLoading={loading}
                                icon={<FiCheckCircle/>}
                            >
                                HOÀN TẤT
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </BaseModal>
    );
};

export default OrderFormModal;