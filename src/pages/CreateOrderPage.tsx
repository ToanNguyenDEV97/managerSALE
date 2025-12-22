import React, { useState } from 'react';
import { FiSearch, FiSave, FiShoppingCart, FiUser, FiLoader, FiPlus, FiCalendar } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import type { InvoiceItem } from '../types';
import toast from 'react-hot-toast';

// Imports
import { useProducts } from '../hooks/useProducts';
import { useAllCustomers, useSaveCustomer } from '../hooks/useCustomers';
import { useCreateOrder } from '../hooks/useOrders';
import QuickCustomerModal from '../components/QuickCustomerModal';
import { useAppContext } from '../context/DataContext';

const CreateOrderPage: React.FC = () => {
    const { setCurrentPage } = useAppContext();
    const navigate = useNavigate();
  
  // 1. Data Fetching
  const [productSearch, setProductSearch] = useState('');
  const { data: productsData, isLoading: isLoadingProducts } = useProducts(1, 10, productSearch); // Search limit 10
  const products = productsData?.data || [];

  const { data: customersData } = useAllCustomers();
  const customers = Array.isArray(customersData) ? customersData : (customersData?.data || []);

  const createOrderMutation = useCreateOrder();
  const saveCustomerMutation = useSaveCustomer();

  // 2. Local State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [isQuickCustomerModalOpen, setIsQuickCustomerModalOpen] = useState(false);
  
  // Thông tin thêm cho đơn hàng
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [note, setNote] = useState('');

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // --- Handlers ---
  const handleAddToCart = (product: any) => {
      // Đơn đặt hàng có thể đặt quá tồn kho (để nhập sau), nên không cần chặn stock <= 0
      setCart(prev => {
          const pId = product.id || product._id;
          const existing = prev.find(item => item.productId === pId);
          if (existing) {
              return prev.map(item => item.productId === pId ? { ...item, quantity: item.quantity + 1 } : item);
          }
          return [...prev, {
              productId: pId,
              name: product.name,
              quantity: 1,
              price: product.price,
              costPrice: product.costPrice,
              vat: product.vat
          }];
      });
      setProductSearch('');
  };

  const handleUpdateQuantity = (productId: string, newQty: number) => {
      if (newQty < 1) return;
      setCart(prev => prev.map(item => item.productId === productId ? { ...item, quantity: newQty } : item));
  };

  const handleRemoveFromCart = (productId: string) => {
      setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const handleSaveQuickCustomer = async (customerData: any) => {
      try {
          const newCustomer: any = await saveCustomerMutation.mutateAsync(customerData);
          const realCustomer = newCustomer.data || newCustomer;
          setSelectedCustomerId(realCustomer.id || realCustomer._id);
          setIsQuickCustomerModalOpen(false);
          toast.success("Đã thêm khách hàng mới");
      } catch (error) {
          toast.error("Lỗi thêm khách hàng");
      }
  };

  // --- LƯU ĐƠN HÀNG ---
  const handleSaveOrder = async () => {
      if (cart.length === 0) return toast.error('Giỏ hàng trống!');
      if (!selectedCustomerId) return toast.error('Vui lòng chọn khách đặt hàng!');

      const customerName = customers.find((c: any) => (c.id || c._id) === selectedCustomerId)?.name;

      const orderData = {
          customerId: selectedCustomerId,
          customerName: customerName,
          items: cart,
          totalAmount: totalAmount,
          deliveryDate: deliveryDate || null, // Ngày hẹn giao
          note: note,
          status: 'Mới' // Trạng thái ban đầu
      };

      try {
          await createOrderMutation.mutateAsync(orderData);
          // Sau khi lưu xong, quay về trang danh sách Orders
          setTimeout(() => {
              setCurrentPage('Orders'); // <--- SỬA: Quay về trang Orders
          }, 1000);
      } catch (error) {
          console.error(error);
      }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] gap-4 animate-fade-in">
      
      {/* CỘT TRÁI: DANH SÁCH SẢN PHẨM */}
      <div className="w-full lg:w-2/3 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
           <div className="relative">
             <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
                type="text" 
                placeholder="Tìm sản phẩm để đặt..." 
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                autoFocus
             />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {isLoadingProducts ? (
                <div className="flex justify-center mt-10"><FiLoader className="animate-spin text-2xl text-primary-600" /></div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((product: any) => (
                        <div 
                            key={product.id || product._id} 
                            onClick={() => handleAddToCart(product)}
                            className="cursor-pointer group bg-white p-3 rounded-lg border border-slate-200 hover:border-primary-500 hover:shadow-md transition-all flex flex-col justify-between h-32"
                        >
                            <div>
                                <h3 className="font-semibold text-slate-800 line-clamp-2 text-sm">{product.name}</h3>
                                <p className="text-xs text-slate-500 mt-1">{product.sku}</p>
                            </div>
                            <div className="flex justify-between items-end mt-2">
                                <span className="font-bold text-primary-600">{product.price.toLocaleString()}</span>
                                {/* Hiển thị tồn kho để tham khảo, nhưng vẫn cho đặt nếu hết */}
                                <span className={`text-xs px-1.5 py-0.5 rounded ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                    Kho: {product.stock}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* CỘT PHẢI: THÔNG TIN ĐƠN HÀNG */}
      <div className="w-full lg:w-1/3 flex flex-col h-full space-y-4">
         
         {/* 1. Chọn Khách */}
         <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Khách hàng đặt (*)</label>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <select 
                        className="w-full pl-3 pr-8 py-2.5 rounded-lg border border-slate-300 bg-white appearance-none"
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                    >
                        <option value="">-- Chọn khách hàng --</option>
                        {customers.map((c: any) => (
                            <option key={c.id || c._id} value={c.id || c._id}>{c.name} - {c.phone}</option>
                        ))}
                    </select>
                    <FiUser className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <button onClick={() => setIsQuickCustomerModalOpen(true)} className="p-2.5 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200">
                    <FiPlus />
                </button>
            </div>
         </div>

         {/* 2. Thông tin bổ sung (Ngày giao, Ghi chú) */}
         <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
             <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Ngày hẹn giao</label>
                <div className="relative">
                    <input 
                        type="date" 
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                    />
                    <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                </div>
             </div>
             <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Ghi chú đơn hàng</label>
                <textarea 
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm h-16 resize-none"
                    placeholder="Ví dụ: Giao giờ hành chính..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />
             </div>
         </div>

         {/* 3. Giỏ hàng & Tổng tiền */}
         <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-3 bg-slate-100 font-semibold flex justify-between items-center text-slate-700">
                <span className="flex items-center gap-2"><FiShoppingCart /> Sản phẩm ({cart.length})</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <p>Chưa chọn sản phẩm</p>
                    </div>
                ) : (
                    cart.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex-1 min-w-0 mr-2">
                                <p className="font-medium text-sm truncate">{item.name}</p>
                                <p className="text-xs text-primary-600 font-semibold">{item.price.toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)} className="px-2 bg-white border rounded">-</button>
                                <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                                <button onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)} className="px-2 bg-white border rounded">+</button>
                                <button onClick={() => handleRemoveFromCart(item.productId)} className="text-red-500 ml-1"><FiSave className="rotate-45" /></button> 
                                {/* Icon trên thực ra là nút xóa, mình dùng icon có sẵn để demo */}
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-slate-50">
                <div className="flex justify-between text-lg font-bold text-slate-800 mb-4">
                    <span>Tổng tiền:</span>
                    <span className="text-primary-600">{totalAmount.toLocaleString()} đ</span>
                </div>
                
                <button 
                    onClick={handleSaveOrder}
                    disabled={createOrderMutation.isPending}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg flex justify-center items-center gap-2 transition-all disabled:opacity-70"
                >
                    {createOrderMutation.isPending ? <FiLoader className="animate-spin" /> : <FiSave />}
                    LƯU ĐƠN HÀNG
                </button>
            </div>
         </div>
      </div>

      {isQuickCustomerModalOpen && (
          <QuickCustomerModal 
             onClose={() => setIsQuickCustomerModalOpen(false)}
             onSave={handleSaveQuickCustomer}
          />
      )}
    </div>
  );
};

export default CreateOrderPage;