import React, { useState, useEffect } from 'react';
import { FiX, FiSearch, FiTrash2, FiCheckCircle, FiLoader } from 'react-icons/fi';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

interface Props {
    onClose: () => void;
    onSuccess?: () => void;
    initialData?: any; 
}

const OrderFormModal: React.FC<Props> = ({ onClose, onSuccess }) => {
    // State
    const [cart, setCart] = useState<any[]>([]); 
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [depositAmount, setDepositAmount] = useState<string>(''); // Tiền cọc
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Delivery Info
    const [isDelivery, setIsDelivery] = useState(false);
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [shipFee, setShipFee] = useState<string>('');

    // Load Data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [prodRes, custRes] = await Promise.all([
                    api('/api/products?limit=100'),
                    api('/api/customers?limit=100')
                ]);
                setProducts(prodRes.data || []);
                setCustomers(custRes.data || []);
            } catch (e) { console.error(e); }
        };
        loadData();
    }, []);

    // Logic Giỏ hàng
    const addToCart = (product: any) => {
        const exist = cart.find(i => i.productId === product._id);
        if (exist) {
            setCart(cart.map(i => i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setCart([...cart, { 
                productId: product._id, 
                name: product.name, 
                price: product.price, 
                quantity: 1, 
                stock: product.stock // Để hiển thị tồn kho tham khảo
            }]);
        }
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => item.productId === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
    };

    const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.productId !== id));

    // Tính toán
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const finalTotal = totalAmount + (isDelivery ? Number(shipFee) || 0 : 0);

    const handleSubmit = async () => {
        if (cart.length === 0) return toast.error('Vui lòng chọn sản phẩm');
        
        setIsProcessing(true);
        try {
            const payload = {
                customerId: selectedCustomer?._id,
                items: cart.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
                paymentAmount: Number(depositAmount) || 0, // Tiền khách đưa trước (Cọc)
                deliveryInfo: isDelivery ? { 
                    isDelivery: true, 
                    address: deliveryAddress, 
                    shipFee: Number(shipFee) || 0 
                } : null
            };

            await api('/api/orders', { method: 'POST', body: JSON.stringify(payload) });
            
            toast.success('Tạo đơn hàng thành công!');
            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Lỗi tạo đơn');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] flex overflow-hidden shadow-2xl">
                
                {/* CỘT TRÁI: DANH SÁCH SẢN PHẨM */}
                <div className="flex-[2] flex flex-col border-r border-slate-200 bg-slate-50">
                    <div className="p-4 bg-white border-b border-slate-200">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-3 text-slate-400"/>
                            <input 
                                type="text" placeholder="Tìm sản phẩm..." 
                                className="w-full pl-10 p-2.5 rounded-lg border border-slate-200 focus:border-primary-500 outline-none"
                                onChange={e => setSearchTerm(e.target.value)} 
                                autoFocus 
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                            {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                                <div key={p._id} onClick={() => addToCart(p)} className="bg-white p-3 rounded-xl border hover:border-primary-500 cursor-pointer shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-28 group">
                                    <div className="font-bold text-sm text-slate-700 line-clamp-2 group-hover:text-primary-700">{p.name}</div>
                                    <div className="flex justify-between items-end mt-2">
                                        <span className="text-primary-600 font-bold">{p.price.toLocaleString()}</span>
                                        <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500">Kho: {p.stock}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: GIỎ HÀNG & THANH TOÁN */}
                <div className="flex-1 flex flex-col bg-white w-full max-w-md shadow-xl z-10">
                    <div className="p-4 border-b bg-primary-600 text-white flex justify-between items-center">
                        <h3 className="font-bold flex items-center gap-2"><FiCheckCircle/> Đơn Đặt Hàng Mới</h3>
                        <button onClick={onClose} className="hover:bg-white/20 p-1 rounded"><FiX size={20}/></button>
                    </div>

                    <div className="p-4 border-b">
                        <select 
                            className="w-full p-2.5 border rounded-lg bg-slate-50 focus:ring-2 focus:ring-primary-500 outline-none" 
                            onChange={e => setSelectedCustomer(customers.find(c => c._id === e.target.value))}
                        >
                            <option value="">-- Chọn Khách Hàng (Tùy chọn) --</option>
                            {customers.map(c => <option key={c._id} value={c._id}>{c.name} - {c.phone}</option>)}
                        </select>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/30">
                        {cart.length === 0 ? (
                            <div className="text-center text-slate-400 mt-10 flex flex-col items-center">
                                <span className="text-4xl mb-2">🛒</span>
                                <p>Chưa có sản phẩm nào</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.productId} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                    <div className="flex-1">
                                        <div className="font-bold text-sm text-slate-800">{item.name}</div>
                                        <div className="text-xs text-primary-600">{item.price.toLocaleString()}</div>
                                    </div>
                                    <div className="flex items-center gap-2 mx-2">
                                        <button onClick={() => updateQuantity(item.productId, -1)} className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded hover:bg-slate-200">-</button>
                                        <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.productId, 1)} className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded hover:bg-slate-200">+</button>
                                    </div>
                                    <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600"><FiTrash2/></button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer tính tiền */}
                    <div className="p-4 border-t bg-white space-y-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        {/* Option Giao Hàng */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold cursor-pointer text-slate-700">
                                <input type="checkbox" checked={isDelivery} onChange={e => setIsDelivery(e.target.checked)} className="rounded text-primary-600 focus:ring-primary-500"/>
                                Giao hàng tận nơi
                            </label>
                            {isDelivery && (
                                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-lg animate-fade-in">
                                    <input placeholder="Địa chỉ giao" className="col-span-2 p-1.5 border rounded text-xs outline-none" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)}/>
                                    <input type="number" placeholder="Phí ship" className="col-span-1 p-1.5 border rounded text-xs outline-none text-right" value={shipFee} onChange={e => setShipFee(e.target.value)}/>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between text-lg font-bold text-slate-800 pt-2 border-t border-dashed">
                            <span>Tổng cộng:</span>
                            <span className="text-primary-700">{finalTotal.toLocaleString()} ₫</span>
                        </div>
                        
                        <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-100">
                            <span className="text-sm font-bold text-green-800">Khách đặt cọc:</span>
                            <input 
                                type="number" 
                                className="bg-white border border-green-200 rounded px-2 py-1 text-right outline-none font-bold w-32 text-green-700 focus:ring-2 focus:ring-green-500" 
                                placeholder="0" 
                                value={depositAmount} 
                                onChange={e => setDepositAmount(e.target.value)}
                            />
                        </div>

                        <button onClick={handleSubmit} disabled={isProcessing} className="w-full py-3.5 bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 hover:shadow-xl hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed">
                            {isProcessing ? <FiLoader className="animate-spin"/> : <FiCheckCircle/>} 
                            {isProcessing ? 'Đang xử lý...' : 'LƯU ĐƠN HÀNG'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderFormModal;