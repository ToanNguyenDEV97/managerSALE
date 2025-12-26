import React, { useState, useEffect } from 'react';
import { FiX, FiSearch, FiTrash2, FiSave, FiTruck, FiMapPin, FiPhone, FiUser, FiPackage, FiCheckCircle, FiPlus } from 'react-icons/fi';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

// --- COMPONENT ORDER FORM MODAL ---
interface Props {
    onClose: () => void;
    onSuccess?: () => void; 
    initialData?: any; 
}


const OrderFormModal: React.FC<Props> = ({ onClose, onSuccess, initialData }) => {
    // --- STATE ---
    const [cart, setCart] = useState<any[]>([]); 
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [paidAmount, setPaidAmount] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    
    const [products, setProducts] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    
    const [isProcessing, setIsProcessing] = useState(false);
    
    // State Giao hàng
    const [isDelivery, setIsDelivery] = useState(false);
    const [deliveryInfo, setDeliveryInfo] = useState({
        receiverName: '',
        phone: '',
        address: '',
        shipFee: 0
    });

    // 1. Tải dữ liệu (Có Log kiểm tra)
    useEffect(() => {
        const loadData = async () => {
            try {
                const [prodRes, custRes] = await Promise.all([
                    api('/api/products?limit=100'),
                    api('/api/customers?limit=100')
                ]);

                // Xử lý dữ liệu trả về an toàn
                const prodData = (prodRes && prodRes.data) ? prodRes.data : (Array.isArray(prodRes) ? prodRes : []);
                const custData = (custRes && custRes.data) ? custRes.data : (Array.isArray(custRes) ? custRes : []);

                console.log("Check Product Data:", prodData); // [DEBUG] Xem console để biết sản phẩm có _id hay không
                setProducts(prodData);
                setCustomers(custData);
            } catch (e) { 
                console.error("Lỗi tải dữ liệu:", e);
                toast.error("Không tải được danh sách sản phẩm/khách hàng");
            }
        };
        loadData();
    }, []);

    // 2. Tự động điền thông tin giao hàng khi chọn khách
    useEffect(() => {
        if (selectedCustomer && isDelivery) {
            setDeliveryInfo(prev => ({
                ...prev,
                receiverName: selectedCustomer.name || '',
                phone: selectedCustomer.phone || ''
            }));
        }
    }, [selectedCustomer, isDelivery]);

    // 3. Xử lý Giỏ hàng (Đã sửa lỗi ID)
    const addToCart = (product: any) => {
        if (!product) return;
        
        // [FIX] Lấy ID an toàn (chấp nhận cả _id và id)
        const proId = product._id || product.id;

        if (!proId) {
            toast.error("Sản phẩm lỗi: Không có ID!");
            console.error("Product missing ID:", product);
            return;
        }

        const exist = cart.find(i => i.productId === proId);
        if (exist) {
            setCart(cart.map(i => i.productId === proId ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setCart([...cart, { 
                productId: proId, 
                name: product.name, 
                price: Number(product.price) || 0, 
                quantity: 1, 
                stock: product.stock 
            }]);
        }
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.productId === productId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(i => i.productId !== productId));
    };

    // Tính toán tiền
    const totalAmount = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
    const shipFee = isDelivery ? (Number(deliveryInfo.shipFee) || 0) : 0;
    const finalTotal = totalAmount + shipFee;

    // 4. Xử lý Lưu Đơn
    const handleSubmit = async () => {
        if (cart.length === 0) return toast.error('Giỏ hàng đang trống!');
        
        // Kiểm tra khách hàng ID
        const custId = selectedCustomer?._id || selectedCustomer?.id;

        setIsProcessing(true);
        const loadingId = toast.loading('Đang xử lý...');
        
        try {
            const payload = {
                customerId: custId, // Có thể null nếu khách lẻ
                items: cart,
                totalAmount: totalAmount, 
                paymentAmount: Number(paidAmount) || 0,
                // Gửi thông tin giao hàng
                deliveryInfo: isDelivery ? {
                    isDelivery: true,
                    ...deliveryInfo
                } : null
            };

            console.log("Submitting payload:", payload); // [DEBUG] Kiểm tra dữ liệu gửi đi

            await api('/api/invoices', { method: 'POST', body: JSON.stringify(payload) });
            
            toast.success('Tạo hóa đơn thành công!', { id: loadingId });

            // Gọi hàm onSuccess nếu được cung cấp
            if (onSuccess) {
                onSuccess(); 
            }

            onClose();
            window.location.reload(); 
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Lỗi tạo đơn', { id: loadingId });
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-7xl h-[90vh] flex overflow-hidden shadow-2xl">
                
                {/* --- CỘT TRÁI: DANH SÁCH SẢN PHẨM (65%) --- */}
                <div className="flex-[1.8] flex flex-col border-r border-slate-200 bg-slate-50/50">
                    {/* Search Bar */}
                    <div className="p-5 bg-white border-b border-slate-100 shadow-sm flex gap-4">
                        <div className="relative flex-1">
                            <FiSearch className="absolute left-4 top-3.5 text-slate-400 text-lg"/>
                            <input 
                                type="text" 
                                placeholder="Tìm kiếm sản phẩm (Tên, Mã)..." 
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                                onChange={e => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 content-start">
                            {Array.isArray(products) && products.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase())).map((product, index) => {
                                // [FIX] Key an toàn
                                const safeKey = product._id || product.id || index;
                                return (
                                    <div key={safeKey} onClick={() => addToCart(product)} 
                                        className="group bg-white p-4 rounded-2xl border border-slate-100 hover:border-primary-500 cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col h-full relative overflow-hidden">
                                        <div className="absolute top-0 right-0 bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-bl-lg">Kho: {product.stock}</div>
                                        <div className="mb-3 p-3 bg-primary-50 rounded-xl w-12 h-12 flex items-center justify-center group-hover:bg-primary-600 transition-colors">
                                            <FiPackage className="text-primary-600 text-xl group-hover:text-white transition-colors"/>
                                        </div>
                                        <div className="font-bold text-slate-700 line-clamp-2 text-sm mb-auto group-hover:text-primary-700">{product.name}</div>
                                        <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-end">
                                            <span className="text-primary-600 font-extrabold text-base">{Number(product.price).toLocaleString()}</span>
                                            <FiPlus className="text-slate-300 group-hover:text-primary-500"/>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* --- CỘT PHẢI: GIỎ HÀNG & THANH TOÁN (35%) --- */}
                <div className="w-[450px] flex flex-col bg-white shadow-[-5px_0_20px_rgba(0,0,0,0.05)] z-10 relative">
                    {/* Header */}
                    <div className="p-5 border-b border-primary-100 bg-gradient-to-r from-primary-600 to-primary-700 text-white flex justify-between items-center shadow-md">
                        <h3 className="font-bold text-lg flex items-center gap-2"><FiCheckCircle/> Đơn hàng mới</h3>
                        <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors"><FiX size={20}/></button>
                    </div>

                    {/* 1. Chọn khách hàng */}
                    <div className="p-5 border-b border-slate-100 bg-white">
                        <div className="relative">
                            <FiUser className="absolute left-3.5 top-3.5 text-primary-500"/>
                            <select 
                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-slate-700 font-medium appearance-none bg-slate-50 focus:bg-white transition-all cursor-pointer"
                                onChange={e => {
                                    const val = e.target.value;
                                    const found = customers.find(c => (c._id || c.id) === val);
                                    setSelectedCustomer(found);
                                }}
                            >
                                <option value="">-- Khách lẻ (Tại quầy) --</option>
                                {Array.isArray(customers) && customers.map((c, index) => {
                                    // [FIX] Key & Value an toàn
                                    const cId = c._id || c.id;
                                    return <option key={cId || index} value={cId}>{c.name} - {c.phone}</option>;
                                })}
                            </select>
                            <div className="absolute right-3 top-3.5 text-slate-400 pointer-events-none text-xs">▼</div>
                        </div>
                    </div>

                    {/* 2. Danh sách hàng trong giỏ */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/50">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                                <FiPackage size={48} className="opacity-20"/>
                                <p className="text-sm">Chưa có sản phẩm nào</p>
                            </div>
                        ) : cart.map((item, idx) => (
                            <div key={item.productId || idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm group hover:border-primary-200 transition-colors">
                                <div className="flex-1 pr-2">
                                    <div className="font-bold text-slate-700 text-sm line-clamp-1">{item.name}</div>
                                    <div className="text-xs text-primary-600 font-medium mt-0.5">{item.price.toLocaleString()} ₫</div>
                                </div>
                                <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1">
                                    <button onClick={() => updateQuantity(item.productId, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded text-slate-500 hover:text-primary-600 shadow-sm transition-all font-bold">-</button>
                                    <span className="text-sm font-bold text-slate-700 w-4 text-center">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.productId, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded text-slate-500 hover:text-primary-600 shadow-sm transition-all font-bold">+</button>
                                </div>
                                <div className="font-bold text-slate-800 text-sm w-20 text-right">
                                    {(item.price * item.quantity).toLocaleString()}
                                </div>
                                <button onClick={() => removeFromCart(item.productId)} className="text-slate-300 hover:text-red-500 p-1.5 transition-colors">
                                    <FiTrash2 size={16}/>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* 3. Tùy chọn Giao hàng */}
                    <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-5px_15px_rgba(0,0,0,0.02)] z-20">
                        <div className="flex items-center justify-between mb-3">
                            <label className="flex items-center gap-3 cursor-pointer select-none group">
                                <div className={`relative w-11 h-6 rounded-full p-1 transition-colors duration-300 ${isDelivery ? 'bg-primary-600' : 'bg-slate-200'}`} onClick={() => setIsDelivery(!isDelivery)}>
                                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isDelivery ? 'translate-x-5' : ''}`}/>
                                </div>
                                <span className={`font-bold text-sm flex items-center gap-2 transition-colors ${isDelivery ? 'text-primary-700' : 'text-slate-500'}`}>
                                    <FiTruck/> Giao hàng tận nơi
                                </span>
                            </label>
                        </div>

                        {/* Form Giao hàng */}
                        {isDelivery && (
                            <div className="space-y-3 p-3 bg-primary-50/50 rounded-xl border border-primary-100 animate-fade-in mb-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <FiUser className="absolute left-3 top-3 text-primary-400 text-xs"/>
                                        <input type="text" placeholder="Tên người nhận" className="w-full pl-8 p-2 text-xs border border-primary-200 rounded-lg focus:ring-1 focus:ring-primary-500 outline-none bg-white"
                                            value={deliveryInfo.receiverName} onChange={e => setDeliveryInfo({...deliveryInfo, receiverName: e.target.value})}/>
                                    </div>
                                    <div className="relative">
                                        <FiPhone className="absolute left-3 top-3 text-primary-400 text-xs"/>
                                        <input type="text" placeholder="SĐT người nhận" className="w-full pl-8 p-2 text-xs border border-primary-200 rounded-lg focus:ring-1 focus:ring-primary-500 outline-none bg-white"
                                            value={deliveryInfo.phone} onChange={e => setDeliveryInfo({...deliveryInfo, phone: e.target.value})}/>
                                    </div>
                                </div>
                                <div className="relative">
                                    <FiMapPin className="absolute left-3 top-3 text-primary-400 text-xs"/>
                                    <input type="text" placeholder="Địa chỉ giao hàng (Số nhà, đường, quận...)" className="w-full pl-8 p-2 text-xs border border-primary-200 rounded-lg focus:ring-1 focus:ring-primary-500 outline-none bg-white"
                                        value={deliveryInfo.address} onChange={e => setDeliveryInfo({...deliveryInfo, address: e.target.value})}/>
                                </div>
                                <div className="flex justify-between items-center px-2">
                                    <span className="text-xs font-bold text-primary-700">Phí vận chuyển:</span>
                                    <input type="number" className="w-24 text-right p-1.5 border border-primary-200 rounded-lg text-sm font-bold text-primary-700 focus:ring-1 focus:ring-primary-500 outline-none"
                                        value={deliveryInfo.shipFee} onChange={e => setDeliveryInfo({...deliveryInfo, shipFee: Number(e.target.value)})}/>
                                </div>
                            </div>
                        )}

                        {/* Tổng kết tiền */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Tiền hàng:</span>
                                <span className="font-medium">{totalAmount.toLocaleString()}</span>
                            </div>
                            {isDelivery && (
                                <div className="flex justify-between text-sm text-primary-600">
                                    <span>+ Phí Ship:</span>
                                    <span className="font-bold">{shipFee.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xl font-extrabold text-slate-800 pt-2 border-t border-dashed border-slate-300">
                                <span>Tổng cộng:</span>
                                <span className="text-primary-700">{finalTotal.toLocaleString()} <span className="text-sm text-slate-400 font-normal">₫</span></span>
                            </div>
                        </div>
                        
                        {/* Nhập tiền khách đưa */}
                        <div className="mt-4 bg-slate-100 p-1.5 rounded-xl flex items-center justify-between pr-2 border border-slate-200">
                            <span className="text-xs font-bold text-slate-500 pl-3 uppercase">Khách trả:</span>
                            <input 
                                type="number" 
                                className="w-32 bg-white p-2 rounded-lg font-bold text-right text-slate-800 focus:ring-2 focus:ring-primary-500 outline-none shadow-sm"
                                placeholder="0"
                                value={paidAmount}
                                onChange={e => setPaidAmount(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end mt-1 text-xs">
                            <span className="text-slate-400 mr-2">Còn nợ:</span>
                            <span className="font-bold text-red-500">
                                {Math.max(0, finalTotal - (Number(paidAmount)||0)).toLocaleString()}
                            </span>
                        </div>

                        {/* Nút hành động */}
                        <button 
                            onClick={handleSubmit} 
                            disabled={isProcessing}
                            className="w-full mt-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {isProcessing ? <FiPackage className="animate-spin"/> : <FiSave/>} 
                            {isDelivery ? 'Lưu & Giao Hàng' : 'Thanh Toán & In HĐ'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderFormModal;