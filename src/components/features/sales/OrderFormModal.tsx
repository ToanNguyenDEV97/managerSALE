import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiSearch, FiShoppingCart } from 'react-icons/fi';
import { api } from '../../../utils/api';
import toast from 'react-hot-toast';

// Components
import { BaseModal } from '../../common/BaseModal';
import { FormInput } from '../../common/FormInput';
import { Button } from '../../common/Button';

interface Props {
    onClose: () => void;
    onSuccess?: () => void;
}

const OrderFormModal: React.FC<Props> = ({ onClose, onSuccess }) => {
    // State dữ liệu
    const [products, setProducts] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [cart, setCart] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<string>('');
    
    // State form
    const [deposit, setDeposit] = useState<string>('');
    const [isDelivery, setIsDelivery] = useState(false);
    const [shipFee, setShipFee] = useState<string>('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Load data
    useEffect(() => {
        Promise.all([
            api('/api/products?limit=100'),
            api('/api/customers?limit=100')
        ]).then(([prodRes, custRes]) => {
            setProducts(prodRes.data || []);
            setCustomers(custRes.data || []);
        });
    }, []);

    // Logic giỏ hàng
    const addToCart = (product: any) => {
        setCart(prev => {
            const exist = prev.find(i => i._id === product._id);
            if (exist) return prev.map(i => i._id === product._id ? { ...i, qty: i.qty + 1 } : i);
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const totalAmount = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const finalTotal = totalAmount + (Number(shipFee) || 0);

    const handleSubmit = async () => {
        if (cart.length === 0) return toast.error('Giỏ hàng trống!');
        setLoading(true);
        try {
            await api('/api/orders', {
                method: 'POST',
                body: JSON.stringify({
                    customerId: selectedCustomer || null,
                    items: cart.map(i => ({ productId: i._id, quantity: i.qty, price: i.price })),
                    depositAmount: Number(deposit) || 0,
                    deliveryInfo: isDelivery ? { isDelivery: true, address, shipFee: Number(shipFee) } : null
                })
            });
            toast.success('Tạo đơn thành công!');
            if (onSuccess) onSuccess();
            onClose();
        } catch (e: any) { toast.error(e.message); }
        finally { setLoading(false); }
    };

    return (
        <BaseModal isOpen={true} onClose={onClose} title="Tạo Đơn Hàng Mới" width="max-w-6xl" icon={<FiShoppingCart/>}>
            <div className="flex flex-col lg:flex-row gap-6 h-[70vh]">
                
                {/* CỘT TRÁI: DANH SÁCH SẢN PHẨM */}
                <div className="flex-[2] flex flex-col bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                    <div className="p-3 border-b bg-white">
                        <FormInput 
                            placeholder="Tìm sản phẩm..." 
                            icon={<FiSearch/>} 
                            className="mb-0" // Override margin bottom của FormInput
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 md:grid-cols-3 gap-3 content-start">
                        {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                            <div key={p._id} onClick={() => addToCart(p)} 
                                className="bg-white p-3 rounded-lg border hover:border-primary-500 cursor-pointer shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-24"
                            >
                                <span className="font-bold text-sm text-slate-700 line-clamp-2">{p.name}</span>
                                <div className="flex justify-between items-end mt-1">
                                    <span className="text-primary-600 font-bold">{p.price.toLocaleString()}</span>
                                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">Kho: {p.stock}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CỘT PHẢI: GIỎ HÀNG & THANH TOÁN */}
                <div className="flex-1 flex flex-col bg-white h-full">
                    {/* Chọn khách */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Khách hàng</label>
                        <select className="w-full border rounded-lg p-2.5 bg-slate-50 text-sm outline-none focus:border-primary-500"
                            value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)}
                        >
                            <option value="">-- Khách lẻ (Không lưu tên) --</option>
                            {customers.map(c => <option key={c._id} value={c._id}>{c.name} - {c.phone}</option>)}
                        </select>
                    </div>

                    {/* List Cart */}
                    <div className="flex-1 overflow-y-auto border rounded-lg mb-4 bg-slate-50 p-2 space-y-2">
                        {cart.length === 0 && <p className="text-center text-slate-400 mt-10">Chưa chọn sản phẩm</p>}
                        {cart.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white p-2 rounded shadow-sm border">
                                <div className="flex-1">
                                    <div className="font-bold text-sm">{item.name}</div>
                                    <div className="text-xs text-slate-500">{item.price.toLocaleString()} x {item.qty}</div>
                                </div>
                                <div className="font-bold text-primary-600 text-sm">{(item.price * item.qty).toLocaleString()}</div>
                                <button onClick={() => setCart(cart.filter(x => x._id !== item._id))} className="ml-2 text-red-400 hover:text-red-600"><FiTrash2/></button>
                            </div>
                        ))}
                    </div>

                    {/* Footer Payment */}
                    <div className="space-y-3 pt-2 border-t">
                        <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                            <input type="checkbox" checked={isDelivery} onChange={e => setIsDelivery(e.target.checked)} className="rounded text-primary-600"/>
                            Giao hàng tận nơi
                        </label>
                        
                        {isDelivery && (
                            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded animate-fade-in">
                                <input placeholder="Địa chỉ giao" className="col-span-2 p-2 text-sm border rounded" value={address} onChange={e => setAddress(e.target.value)}/>
                                <input placeholder="Phí ship" type="number" className="col-span-1 p-2 text-sm border rounded text-right" value={shipFee} onChange={e => setShipFee(e.target.value)}/>
                            </div>
                        )}

                        <div className="flex justify-between font-bold text-lg">
                            <span>Tổng cộng:</span>
                            <span className="text-primary-700">{finalTotal.toLocaleString()} ₫</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold whitespace-nowrap">Khách trả trước:</span>
                            <FormInput 
                                className="mb-0 text-right font-bold text-green-700" 
                                placeholder="0" 
                                value={deposit} 
                                onChange={e => setDeposit(e.target.value)}
                            />
                        </div>

                        <Button onClick={handleSubmit} isLoading={loading} className="w-full py-3 text-lg shadow-xl">
                            HOÀN TẤT ĐƠN HÀNG
                        </Button>
                    </div>
                </div>
            </div>
        </BaseModal>
    );
};

export default OrderFormModal;