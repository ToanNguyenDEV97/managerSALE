import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiSearch, FiCheckCircle, FiShoppingCart, FiUser, FiLoader } from 'react-icons/fi';
import type { InvoiceItem } from '../types';
import QuickCustomerModal from '../components/QuickCustomerModal';
import CurrencyInput from '../components/CurrencyInput';
import toast from 'react-hot-toast';

// Import Hooks
import { useProducts } from '../hooks/useProducts';
import { useAllCustomers, useSaveCustomer } from '../hooks/useCustomers';
import { useSaveInvoice } from '../hooks/useInvoices';

// [QUAN TRỌNG] Import Modal In (Hãy chắc chắn đường dẫn file này đúng)
import PrintInvoiceModal from '../components/business/PrintInvoiceModal';

type PaymentMethod = 'cash' | 'debt';

const SalesPage: React.FC = () => {
  // 1. DATA FETCHING
  const [productSearch, setProductSearch] = useState('');
  const { data: productsData, isLoading: isLoadingProducts } = useProducts(1, productSearch);
  const products = Array.isArray(productsData) ? productsData : (productsData?.data || []);

  const { data: customersData } = useAllCustomers();
  const customers = Array.isArray(customersData) ? customersData : (customersData?.data || []);

  const saveInvoiceMutation = useSaveInvoice();
  const saveCustomerMutation = useSaveCustomer();

  // 2. LOCAL STATE QUẢN LÝ BÁN HÀNG
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [isQuickCustomerModalOpen, setIsQuickCustomerModalOpen] = useState(false);
  
  // State thanh toán
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  
  // [QUAN TRỌNG] State dùng để bật/tắt Modal In Hóa Đơn
  const [invoiceIdToPrint, setInvoiceIdToPrint] = useState<string | null>(null);

  // 3. LOGIC TÍNH TOÁN
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Tự động điền tiền khi chọn loại thanh toán
  useEffect(() => {
     if (paymentMethod === 'cash') {
         setPaymentAmount(totalAmount.toString());
     } else {
         setPaymentAmount('0');
     }
  }, [totalAmount, paymentMethod]);

  // 4. CÁC HÀM XỬ LÝ (HANDLERS)
  const handleAddToCart = (product: any) => {
      if (product.stock <= 0) {
          toast.error(`Sản phẩm "${product.name}" tạm hết hàng!`);
          return;
      }
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
          console.error(error);
          toast.error("Lỗi thêm khách hàng");
      }
  };

  // --- HÀM THANH TOÁN (QUAN TRỌNG NHẤT) ---
  const handleCompleteSale = async () => {
      if (cart.length === 0) return toast.error('Giỏ hàng đang trống');

      // 2. [THÊM ĐOẠN NÀY] Kiểm tra Khách hàng
      if (!selectedCustomerId) {
          return toast.error('Vui lòng chọn khách hàng trước khi thanh toán!', { icon: '⚠️' });
      }
      
      const payAmountNumber = paymentMethod === 'cash' ? parseFloat(paymentAmount || '0') : 0;

      const saleData = {
          customerId: selectedCustomerId,
          items: cart,
          totalAmount: totalAmount,
          paymentAmount: payAmountNumber,
          saleType: paymentMethod 
      };

      try {
          // Gọi API lưu hóa đơn
          const result: any = await saveInvoiceMutation.mutateAsync(saleData);
          
          // [LOGIC MỚI] Lấy ID hóa đơn để in
          // Server trả về cấu trúc: { newInvoice: {...}, voucherId: ... }
          if (result && result.newInvoice) {
              const id = result.newInvoice._id || result.newInvoice.id;
              setInvoiceIdToPrint(id); // Set ID vào state -> Modal sẽ tự hiện ra
          } else if (result && (result.id || result._id)) {
              // Dự phòng trường hợp server trả về thẳng object invoice
              setInvoiceIdToPrint(result.id || result._id);
          }

          // Reset form để bán đơn mới
          setCart([]);
          setSelectedCustomerId('');
          setPaymentAmount('');
          
      } catch (error: any) {
          console.error(error);
          toast.error("Lỗi: " + (error.message || "Không thể thanh toán"));
      }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] gap-4 animate-fade-in relative">
      
      {/* --------------------------------------------------- */}
      {/* CỘT TRÁI: DANH SÁCH SẢN PHẨM */}
      {/* --------------------------------------------------- */}
      <div className="w-full lg:w-2/3 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
           <div className="relative">
             <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
                type="text" 
                placeholder="Tìm kiếm sản phẩm (Tên, Mã SKU)..." 
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
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
                            className="cursor-pointer group bg-white dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-primary-500 hover:shadow-md transition-all flex flex-col justify-between h-32"
                        >
                            <div>
                                <h3 className="font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 text-sm" title={product.name}>{product.name}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{product.sku}</p>
                            </div>
                            <div className="flex justify-between items-end mt-2">
                                <span className="font-bold text-primary-600 dark:text-primary-400">{product.price.toLocaleString()}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    Kho: {product.stock}
                                </span>
                            </div>
                        </div>
                    ))}
                    {products.length === 0 && (
                        <div className="col-span-full text-center text-slate-500 mt-10 italic">Không tìm thấy sản phẩm</div>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* --------------------------------------------------- */}
      {/* CỘT PHẢI: GIỎ HÀNG & THANH TOÁN */}
      {/* --------------------------------------------------- */}
      <div className="w-full lg:w-1/3 flex flex-col h-full space-y-4">
         {/* 1. Chọn khách hàng */}
         <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <select 
                        className="w-full pl-3 pr-8 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 appearance-none text-slate-900 dark:text-white"
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                    >
                        <option value="">-- Khách lẻ --</option>
                        {customers.map((c: any) => (
                            <option key={c.id || c._id} value={c.id || c._id}>{c.name} - {c.phone}</option>
                        ))}
                    </select>
                    <FiUser className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <button 
                    onClick={() => setIsQuickCustomerModalOpen(true)}
                    className="p-2.5 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors"
                >
                    <FiPlus />
                </button>
            </div>
         </div>

         {/* 2. List Giỏ hàng */}
         <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
            <div className="p-3 bg-slate-100 dark:bg-slate-700 font-semibold flex justify-between items-center text-slate-700 dark:text-slate-200">
                <span className="flex items-center gap-2"><FiShoppingCart /> Giỏ hàng ({cart.length})</span>
                <button onClick={() => setCart([])} className="text-xs text-red-500 hover:underline" hidden={cart.length === 0}>Xóa hết</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <FiShoppingCart className="w-12 h-12 mb-2 opacity-30"/>
                        <p>Chưa có sản phẩm</p>
                    </div>
                ) : (
                    cart.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-100 dark:border-slate-700 group">
                            <div className="flex-1 min-w-0 mr-2">
                                <p className="font-medium text-sm truncate text-slate-800 dark:text-slate-200" title={item.name}>{item.name}</p>
                                <p className="text-xs text-primary-600 font-semibold">{item.price.toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 h-8">
                                    <button onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)} className="px-2 text-slate-600 hover:bg-slate-100 h-full rounded-l">-</button>
                                    <input 
                                        type="number" 
                                        className="w-10 text-center text-sm border-x border-slate-300 dark:border-slate-600 h-full bg-transparent focus:outline-none" 
                                        value={item.quantity}
                                        onChange={(e) => handleUpdateQuantity(item.productId, parseInt(e.target.value) || 1)}
                                    />
                                    <button onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)} className="px-2 text-slate-600 hover:bg-slate-100 h-full rounded-r">+</button>
                                </div>
                                <button onClick={() => handleRemoveFromCart(item.productId)} className="text-slate-400 hover:text-red-500 p-1 transition-colors">
                                    <FiTrash2 />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            {/* Tổng tiền & Nút Thanh toán */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
                <div className="flex justify-between text-lg font-bold text-slate-800 dark:text-white mb-4">
                    <span>Tổng cộng:</span>
                    <span className="text-primary-600">{totalAmount.toLocaleString()} đ</span>
                </div>
                
                {/* Switch Tiền mặt / Ghi nợ */}
                <div className="flex gap-2 mb-4">
                    <button 
                        onClick={() => setPaymentMethod('cash')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${paymentMethod === 'cash' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'}`}
                    >
                        Tiền mặt
                    </button>
                    <button 
                        onClick={() => setPaymentMethod('debt')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${paymentMethod === 'debt' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'}`}
                    >
                        Ghi nợ
                    </button>
                </div>

                {paymentMethod === 'cash' && (
                     <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Khách đưa:</label>
                        <CurrencyInput 
                            value={paymentAmount}
                            onValueChange={(vals) => setPaymentAmount(vals.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            placeholder="Nhập số tiền..."
                        />
                        <div className="flex justify-between mt-2 text-sm text-slate-600 dark:text-slate-400">
                            <span>Tiền thừa:</span>
                            <span className="font-bold text-slate-800 dark:text-white">
                                {Math.max(0, parseFloat(paymentAmount || '0') - totalAmount).toLocaleString()} đ
                            </span>
                        </div>
                     </div>
                )}

                <button 
                    onClick={handleCompleteSale}
                    disabled={saveInvoiceMutation.isPending}
                    className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl font-bold text-lg shadow-lg transform active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {saveInvoiceMutation.isPending ? <FiLoader className="animate-spin" /> : <FiCheckCircle />}
                    {paymentMethod === 'cash' ? 'THANH TOÁN' : 'LƯU ĐƠN NỢ'}
                </button>
            </div>
         </div>
      </div>

      {/* --- CÁC MODAL --- */}

      {isQuickCustomerModalOpen && (
          <QuickCustomerModal 
             onClose={() => setIsQuickCustomerModalOpen(false)}
             onSave={handleSaveQuickCustomer}
          />
      )}

      {/* 👉 MODAL IN HÓA ĐƠN (Sẽ hiện lên khi invoiceIdToPrint có giá trị) */}
      {invoiceIdToPrint && (
          <PrintInvoiceModal 
             invoiceId={invoiceIdToPrint} 
             onClose={() => setInvoiceIdToPrint(null)} 
          />
      )}
    </div>
  );
};

export default SalesPage;