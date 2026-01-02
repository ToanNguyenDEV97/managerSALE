import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiSearch, FiShoppingCart, FiUser, FiMapPin, FiTruck, FiFileText, FiPhone } from 'react-icons/fi';
import { api } from '../../../utils/api';
import toast from 'react-hot-toast';

// UI System
import { BaseModal } from '../../common/BaseModal';
import { FormInput } from '../../common/FormInput';
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
    const [selectedCustomer, setSelectedCustomer] = useState<string>('');
    const [cart, setCart] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Thanh toán & Ghi chú
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [note, setNote] = useState('');
    
    // Giao hàng (Delivery Info)
    const [isDelivery, setIsDelivery] = useState(false);
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState(''); // [MỚI] State lưu SĐT nhận hàng
    const [shipFee, setShipFee] = useState<number>(0);

    const [loading, setLoading] = useState(false);

    // --- Helpers ---
    // Hàm lấy ID an toàn (chấp nhận cả _id và id) để tránh lỗi undefined
    const getProductId = (item: any) => item._id || item.id;

    // Load dữ liệu ban đầu
    useEffect(() => {
        Promise.all([
            api('/api/products?limit=100'),
            api('/api/customers?limit=100')
        ]).then(([prodRes, custRes]) => {
            setProducts(prodRes.data || []);
            setCustomers(custRes.data || []);
        }).catch(err => toast.error("Lỗi tải dữ liệu: " + err.message));
    }, []);

    // --- Logic Giỏ hàng ---
    const addToCart = (product: any) => {
        const pId = getProductId(product);
        if (!pId) {
            toast.error("Sản phẩm lỗi: Không tìm thấy ID");
            return;
        }

        setCart(prev => {
            const exist = prev.find(i => getProductId(i) === pId);
            if (exist) {
                return prev.map(i => getProductId(i) === pId ? { ...i, qty: i.qty + 1 } : i);
            }
            // Luôn đảm bảo item trong giỏ có _id chuẩn
            return [...prev, { ...product, _id: pId, qty: 1, customPrice: product.price }];
        });
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (getProductId(item) === id) {
                const newQty = Math.max(1, item.qty + delta);
                return { ...item, qty: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => getProductId(item) !== id));
    };

    // --- Tính toán tổng tiền ---
    const totalGoods = cart.reduce((sum, item) => sum + (item.customPrice * item.qty), 0);
    const finalTotal = totalGoods + (isDelivery ? shipFee : 0);
    const debt = finalTotal - paymentAmount;

    // --- Submit Đơn Hàng ---
    const handleSubmit = async () => {
        if (cart.length === 0) return toast.error('Vui lòng chọn ít nhất 1 sản phẩm!');
        
        const invalidItems = cart.filter(i => !i._id && !i.id);
        if (invalidItems.length > 0) return toast.error('Có sản phẩm lỗi trong giỏ hàng (thiếu ID)');

        setLoading(true);
        try {
            const payload = {
                customerId: selectedCustomer || null,
                items: cart.map(i => ({
                    productId: getProductId(i),
                    quantity: i.qty,
                    price: i.customPrice
                })),
                paymentAmount: paymentAmount, // Tiền khách trả trước (Cọc)
                note: note,
                
                // [QUAN TRỌNG] Gửi thông tin giao hàng gồm cả SĐT
                deliveryInfo: isDelivery ? {
                    isDelivery: true,
                    address: address,
                    phone: phone, // Gửi SĐT người nhận
                    shipFee: shipFee
                } : null
            };

            await api('/api/orders', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            toast.success('Tạo đơn hàng thành công!');
            if (onSuccess) onSuccess();
            onClose();
        } catch (e: any) {
            toast.error(e.message || 'Lỗi khi tạo đơn');
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseModal 
            isOpen={true} 
            onClose={onClose} 
            title="Tạo Đơn Đặt Hàng Mới" 
            width="max-w-7xl"
            icon={<FiShoppingCart size={24}/>}
        >
            <div className="flex flex-col lg:flex-row gap-6 h-[80vh] overflow-hidden">
                
                {/* --- CỘT TRÁI: DANH SÁCH SẢN PHẨM (POS MINI) --- */}
                <div className="w-full lg:w-5/12 flex flex-col bg-white border-r border-slate-200 pr-2">
                    {/* Ô Tìm kiếm */}
                    <div className="mb-4">
                        <FormInput 
                            placeholder="Tìm sản phẩm (Tên, Mã SKU)..." 
                            icon={<FiSearch/>} 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            autoFocus
                            className="bg-slate-50"
                        />
                    </div>

                    {/* Lưới sản phẩm */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        <div className="grid grid-cols-2 gap-3">
                            {products
                                .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map(product => (
                                    <div 
                                        key={getProductId(product)} 
                                        onClick={() => addToCart(product)}
                                        className="group p-3 border border-slate-200 rounded-xl cursor-pointer hover:border-primary-500 hover:shadow-md transition-all bg-white flex flex-col justify-between h-24"
                                    >
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm line-clamp-2 mb-1">{product.name}</div>
                                            <div className="text-xs text-slate-500">Mã: {product.sku || '---'}</div>
                                        </div>
                                        <div className="mt-1 flex justify-between items-end">
                                            <span className="font-bold text-primary-600">
                                                {product.price?.toLocaleString()}
                                            </span>
                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                                                Kho: {product.stock}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>

                {/* --- CỘT PHẢI: THÔNG TIN KHÁCH & THANH TOÁN --- */}
                <div className="w-full lg:w-7/12 flex flex-col pl-2">
                    
                    {/* 1. Chọn Khách hàng & Ghi chú */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1"><FiUser/> Khách hàng</label>
                            <select 
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-primary-500"
                                value={selectedCustomer}
                                onChange={e => {
                                    setSelectedCustomer(e.target.value);
                                    // [MỚI] Tự động điền SĐT và Địa chỉ khi chọn khách
                                    const cust = customers.find(c => getProductId(c) === e.target.value);
                                    if (cust) {
                                        if (cust.address) setAddress(cust.address);
                                        if (cust.phone) setPhone(cust.phone); // Auto fill phone
                                    }
                                }}
                            >
                                <option value="">-- Khách lẻ --</option>
                                {customers.map(c => (
                                    <option key={getProductId(c)} value={getProductId(c)}>{c.name} - {c.phone}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <FormInput 
                                label="Ghi chú đơn hàng"
                                icon={<FiFileText/>}
                                placeholder="VD: Giao giờ hành chính..."
                                value={note}
                                onChange={e => setNote(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* 2. Bảng Giỏ hàng (Cart Table) */}
                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex flex-col mb-4">
                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-700 font-bold text-xs sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-3 py-2">Sản phẩm</th>
                                        <th className="px-3 py-2 text-center w-24">SL</th>
                                        <th className="px-3 py-2 text-right w-28">Đơn giá</th>
                                        <th className="px-3 py-2 text-right w-28">Thành tiền</th>
                                        <th className="px-2 py-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {cart.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-10 text-slate-400">Chưa có sản phẩm nào</td></tr>
                                    ) : cart.map((item, idx) => (
                                        <tr key={idx} className="bg-white hover:bg-slate-50">
                                            <td className="px-3 py-2">
                                                <div className="font-medium text-slate-800">{item.name}</div>
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <div className="flex items-center justify-center border rounded-lg bg-white">
                                                    <button onClick={() => updateQuantity(getProductId(item), -1)} className="px-2 py-1 hover:bg-slate-100 font-bold text-slate-500">-</button>
                                                    <span className="w-8 text-center font-bold text-xs">{item.qty}</span>
                                                    <button onClick={() => updateQuantity(getProductId(item), 1)} className="px-2 py-1 hover:bg-slate-100 font-bold text-slate-500">+</button>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-right text-slate-600">
                                                {item.customPrice?.toLocaleString()}
                                            </td>
                                            <td className="px-3 py-2 text-right font-bold text-slate-800">
                                                {(item.customPrice * item.qty).toLocaleString()}
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                                <button onClick={() => removeFromCart(getProductId(item))} className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors"><FiTrash2/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Footer Cart: Tổng số lượng & Tiền hàng */}
                        <div className="bg-white border-t p-3 flex justify-between items-center text-sm">
                            <span className="text-slate-500">Tổng số lượng: <b className="text-slate-800">{cart.reduce((s, i) => s + i.qty, 0)}</b></span>
                            <span className="font-bold text-slate-800">Tiền hàng: {totalGoods.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* 3. Thông tin Giao hàng & Thanh toán */}
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 shadow-inner">
                        
                        {/* Toggle Giao hàng */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" checked={isDelivery} onChange={e => setIsDelivery(e.target.checked)} className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"/>
                                <span className="font-bold text-sm text-slate-700 flex items-center gap-1"><FiTruck/> Giao hàng tận nơi</span>
                            </label>
                        </div>

                        {/* Form Giao hàng (Hiện khi tick) */}
                        {isDelivery && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-fade-in-down bg-white p-3 rounded-lg border border-slate-200">
                                <div className="md:col-span-3">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FiMapPin className="text-slate-400"/>
                                        </div>
                                        <input 
                                            placeholder="Địa chỉ giao hàng chi tiết..." 
                                            className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                            value={address}
                                            onChange={e => setAddress(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FiPhone className="text-slate-400"/>
                                        </div>
                                        <input 
                                            placeholder="Số điện thoại người nhận..." 
                                            className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-1">
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            placeholder="Phí ship"
                                            className="w-full pl-3 pr-8 py-2 text-sm border border-slate-300 rounded-lg outline-none text-right font-bold focus:ring-2 focus:ring-primary-500"
                                            value={shipFee || ''}
                                            onChange={e => setShipFee(Number(e.target.value))}
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">đ</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="border-t border-slate-200 my-2"></div>

                        {/* Tổng thanh toán */}
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-slate-700">TỔNG CỘNG:</span>
                            <span className="text-2xl font-bold text-primary-700">{finalTotal.toLocaleString()} ₫</span>
                        </div>

                        {/* Khách trả / Cọc */}
                        <div className="flex items-center gap-4 justify-end">
                            <span className="text-sm font-semibold text-slate-600">Khách trả trước / Cọc:</span>
                            <div className="w-40 relative">
                                <input 
                                    type="number"
                                    className="w-full bg-white border border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 rounded-lg px-3 py-2 text-right font-bold text-green-600 outline-none"
                                    value={paymentAmount || ''}
                                    onChange={e => setPaymentAmount(Number(e.target.value))}
                                    placeholder="0"
                                />
                                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 text-xs hidden">đ</span>
                            </div>
                        </div>
                        {debt > 0 && (
                            <div className="text-right text-xs text-red-500 font-medium">
                                Còn nợ lại: {debt.toLocaleString()} ₫
                            </div>
                        )}

                        <Button 
                            onClick={handleSubmit} 
                            isLoading={loading} 
                            className="w-full py-3 mt-2 text-lg uppercase tracking-wide shadow-lg hover:shadow-xl transition-shadow"
                        >
                            Hoàn Tất Đơn Hàng
                        </Button>
                    </div>
                </div>
            </div>
        </BaseModal>
    );
};

export default OrderFormModal;