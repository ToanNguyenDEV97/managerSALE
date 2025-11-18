import React, { useState, useMemo, useEffect } from 'react';
import { FiPlus, FiTrash2, FiSearch, FiXCircle, FiCheckCircle, FiShoppingCart, FiCreditCard, FiUser, FiAlertCircle } from 'react-icons/fi';
import type { Customer, Product, InvoiceItem } from '../types';
import QuickCustomerModal from '../components/QuickCustomerModal';
import { useAppContext } from '../context/DataContext';

type PaymentMethod = 'cash' | 'debt';

const SalesPage: React.FC = () => {
  const { customers, products, categories, handleCompleteSale, handleSaveCustomer } = useAppContext();
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const selectedCustomer = useMemo(() => customers.find(c => c.id === selectedCustomerId), [customers, selectedCustomerId]);
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [isQuickCustomerModalOpen, setIsQuickCustomerModalOpen] = useState(false);
  
  // State mới cho phương thức thanh toán
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Reset lỗi
  useEffect(() => {
    if (error && (selectedCustomerId && cart.length > 0)) {
      setError('');
    }
  }, [selectedCustomerId, cart.length, error]);

  // Tính tổng tiền
  const totals = useMemo(() => {
    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const vatAmount = cart.reduce((acc, item) => {
        const itemTotal = item.price * item.quantity;
        const basePrice = itemTotal / (1 + item.vat / 100);
        return acc + (itemTotal - basePrice);
    }, 0);
    const subtotal = total - vatAmount;
    return { subtotal, vatAmount, total };
  }, [cart]);

  // Tự động điền số tiền khi đổi phương thức hoặc tổng tiền thay đổi
  useEffect(() => {
    if (paymentMethod === 'debt') {
        setPaymentAmount('0');
    } else {
        setPaymentAmount(totals.total.toString());
    }
  }, [paymentMethod, totals.total]);

  // Lọc sản phẩm
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
        const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
        const matchesSearch = !productSearchTerm || 
            p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(productSearchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });
  }, [products, productSearchTerm, activeCategory]);

  // Thao tác giỏ hàng
  const handleAddItem = (product: Product) => {
    if (!product) return;
    const existingItem = cart.find(item => item.productId === product.id);
    const quantityInCart = existingItem?.quantity || 0;
    
    if (quantityInCart >= product.stock) {
        alert(`Đã hết hàng tồn kho cho sản phẩm "${product.name}".`);
        return;
    }

    if (existingItem) {
        setCart(cart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
        setCart([...cart, {
          productId: product.id,
          name: product.name,
          quantity: 1,
          price: product.price,
          costPrice: product.costPrice,
          vat: product.vat,
        }]);
    }
  };

  const handleUpdateCartItem = (productId: string, newQuantity?: number, newPrice?: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setCart(prevCart => {
        const newCart = prevCart.map(item => {
            if (item.productId === productId) {
                let quantity = newQuantity ?? item.quantity;
                let price = newPrice ?? item.price;
                
                // 1. Chặn giá âm
                if (price < 0) price = 0;

                // 2. Chặn số lượng âm (Nếu < 1 thì giữ nguyên 1 hoặc hỏi xóa)
                // Ở đây logic là: Nếu nhập < 0 thì coi như là 1 (tránh lỗi tính toán)
                // Việc xóa sản phẩm đã có nút "Thùng rác" riêng xử lý
                if (quantity < 0) quantity = 1;

                if (quantity > product.stock) {
                    alert(`Số lượng tồn kho không đủ. Tối đa: ${product.stock}`);
                    quantity = product.stock;
                }
                
                // Chỉ giữ lại item nếu số lượng > 0
                if (quantity > 0) {
                    return { ...item, quantity, price };
                }
                return null; 
            }
            return item;
        });
        return newCart.filter(item => item !== null) as InvoiceItem[];
    });
  };

  // Gợi ý mệnh giá tiền
  const paymentSuggestions = useMemo(() => {
    const total = totals.total;
    if (total <= 0 || paymentMethod === 'debt') return [];
    const suggestions = new Set([total]); 
    const denominations = [10000, 20000, 50000, 100000, 200000, 500000];

    denominations.forEach(den => {
        if (total < den) suggestions.add(den);
        else {
             const next = Math.ceil(total / den) * den;
             if (next > total) suggestions.add(next);
        }
    });
    return Array.from(suggestions).sort((a, b) => a - b).slice(0, 4);
  }, [totals.total, paymentMethod]);

  const paymentValue = parseFloat(paymentAmount) || 0;
  const changeDue = paymentValue > totals.total ? paymentValue - totals.total : 0;

  const clearSale = () => {
    setSelectedCustomerId('');
    setCart([]);
    setPaymentAmount('');
    setPaymentMethod('cash'); 
    setError('');
  }
  
  const handleMainAction = async () => {
      if (!selectedCustomerId) {
          setError('Vui lòng chọn khách hàng.');
          return;
      }
      if (cart.length === 0) {
          setError('Giỏ hàng trống.');
          return;
      }
      
      let saleType: 'debit' | 'full_payment';
      
      if (paymentMethod === 'debt') {
          saleType = 'debit'; 
      } else {
          if (paymentValue >= totals.total) {
              saleType = 'full_payment';
          } else {
              saleType = 'debit'; 
          }
      }

      setIsSubmitting(true);
      setError('');
      setSuccessMessage('');

      try {
          const savedInvoice = await handleCompleteSale({
              customerId: selectedCustomerId,
              items: cart,
              totalAmount: totals.total,
              paymentAmount: paymentMethod === 'debt' ? 0 : paymentValue,
              saleType: saleType,
          });
          clearSale();
          setSuccessMessage(`Đã hoàn thành đơn hàng ${savedInvoice.invoiceNumber}.`);
          setTimeout(() => setSuccessMessage(''), 5000);
      } catch (e: any) {
          setError(e.message || "Đã xảy ra lỗi khi xử lý bán hàng.");
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleQuickSaveCustomer = async (customerData: Omit<Customer, 'id' | 'debt'>) => {
      const newCustomer = await handleSaveCustomer({ ...customerData, id: '', debt: 0 });
      setSelectedCustomerId(newCustomer.id);
      setIsQuickCustomerModalOpen(false);
  }

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-4.5rem)] lg:flex-row gap-6">
        {/* Left Side: Product Selection */}
        <div className="lg:w-2/3 flex flex-col gap-6">
            {/* 1. Chọn Khách hàng */}
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4">
                    <div className="flex-grow">
                         <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Khách hàng</label>
                         <select 
                            value={selectedCustomerId} 
                            onChange={e => setSelectedCustomerId(e.target.value)}
                            className="block w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 sm:text-sm"
                        >
                            <option value="" disabled>-- Tìm hoặc chọn khách hàng --</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                        </select>
                        <div className="flex-grow">

                        {/* === BẮT ĐẦU PHẦN HIỂN THỊ NỢ CŨ === */}
                        {selectedCustomer && selectedCustomer.debt > 0 && (
                            <div className="mt-2 flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 animate-pulse">
                                <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                                <p className="text-xs font-bold">
                                    Nợ cũ: {selectedCustomer.debt.toLocaleString('vi-VN')} đ
                                </p>
                            </div>
                        )}
                        {/* === KẾT THÚC === */}
                    </div>
                    </div>
                    <div className="mt-6">
                        <button onClick={() => setIsQuickCustomerModalOpen(true)} className="flex items-center px-4 py-2 text-white rounded-lg bg-primary-600 hover:bg-primary-700 transition-colors text-sm h-[38px]">
                            <FiPlus />
                            <span className="ml-2 font-medium hidden sm:inline">Thêm mới</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Chọn Sản phẩm */}
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex-1 flex flex-col">
                 <div className="border-b border-slate-200 dark:border-slate-700 mb-4">
                    <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                        <button onClick={() => setActiveCategory('all')} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeCategory === 'all' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                            Tất cả
                        </button>
                        {categories.map(cat => (
                             <button key={cat.id} onClick={() => setActiveCategory(cat.name)} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeCategory === cat.name ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                                {cat.name}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="relative mb-4">
                    <input type="text" placeholder="Tìm sản phẩm..." value={productSearchTerm} onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg shadow-sm py-2 px-3 pl-10 focus:outline-none focus:ring-2 focus:ring-primary-300 sm:text-sm"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiSearch className="h-5 w-5 text-slate-400" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {filteredProducts.map(p => (
                            <button key={p.id} onClick={() => handleAddItem(p)} disabled={p.stock <= 0} className="text-left p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-primary-50 dark:hover:bg-slate-700/50 hover:border-primary-300 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-slate-800">
                                <p className="font-semibold text-slate-800 dark:text-slate-200 leading-tight text-sm">{p.name}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{p.sku}</p>
                                <div className="flex justify-between items-end mt-2">
                                    <p className="text-sm font-bold text-primary-600 dark:text-primary-400">{p.price.toLocaleString('vi-VN')}đ</p>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.stock > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>Kho: {p.stock}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
          
        {/* Right Side: Cart & Payment */}
        <div className="lg:w-1/3 flex flex-col">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex-1 flex flex-col shadow-lg overflow-hidden">
                {/* Header Giỏ hàng */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <FiShoppingCart/> Giỏ hàng ({cart.length})
                    </h2>
                    {cart.length > 0 && (
                        <button onClick={clearSale} className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 transition-colors">
                            <FiXCircle/> Xóa hết
                        </button>
                    )}
                </div>

                {/* Danh sách sản phẩm (Đã được thiết kế lại) */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {cart.length > 0 ? cart.map(item => (
                        <div key={item.productId} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg group transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                            {/* Tên và Giá */}
                            <div className="flex-grow min-w-0">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate" title={item.name}>{item.name}</p>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <div className="relative group/input">
                                        <input 
                                            type="number" 
                                            value={item.price}
                                            onChange={e => handleUpdateCartItem(item.productId, undefined, parseFloat(e.target.value) || 0)}
                                            className="w-20 text-xs font-medium text-slate-600 dark:text-slate-400 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-primary-500 focus:ring-0 p-0 pb-0.5 transition-colors text-right"
                                        />
                                        <span className="text-[10px] text-slate-400 ml-1">đ</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bộ điều khiển số lượng (Rộng hơn, dễ bấm hơn) */}
                            <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden bg-white dark:bg-slate-700 h-8 shadow-sm">
                                    <button 
                                        onClick={() => handleUpdateCartItem(item.productId, item.quantity - 1)} 
                                        className="w-8 h-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 transition-colors active:bg-slate-200 text-lg leading-none pb-1"
                                    >
                                        -
                                    </button>
                                    <input 
                                        type="number" 
                                        value={item.quantity}
                                        min="1"
                                        onChange={e => handleUpdateCartItem(item.productId, parseInt(e.target.value) || 0)}
                                        className="w-14 h-full text-center border-x border-slate-200 dark:border-slate-600 border-y-0 focus:ring-0 p-0 text-sm font-bold text-primary-600 dark:text-primary-400 bg-transparent [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button 
                                        onClick={() => handleUpdateCartItem(item.productId, item.quantity + 1)} 
                                        className="w-8 h-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 transition-colors active:bg-slate-200 text-lg leading-none pb-1"
                                    >
                                        +
                                    </button>
                                </div>
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</p>
                            </div>

                            {/* Nút xóa */}
                            <button 
                                onClick={() => handleUpdateCartItem(item.productId, 0)} 
                                className="text-slate-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Xóa sản phẩm"
                            >
                                <FiTrash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 opacity-50">
                          <FiShoppingCart className="w-12 h-12 mb-2"/>
                          <p className="text-sm">Chưa có sản phẩm nào</p>
                        </div>
                    )}
                </div>
                
                {/* Khu vực Thanh toán */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 rounded-b-xl shadow-inner">
                    {/* Tổng tiền */}
                    <div className="flex justify-between items-baseline mb-4">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Tổng thanh toán:</span>
                        <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{totals.total.toLocaleString('vi-VN')} đ</span>
                    </div>

                    {/* 1. Chọn Phương thức (Tabs) */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4">
                        <button 
                            onClick={() => setPaymentMethod('cash')}
                            className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${paymentMethod === 'cash' ? 'bg-white dark:bg-slate-600 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            <FiCheckCircle className={paymentMethod === 'cash' ? "text-primary-500" : ""} /> Tiền mặt / CK
                        </button>
                        <button 
                            onClick={() => setPaymentMethod('debt')}
                            className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${paymentMethod === 'debt' ? 'bg-white dark:bg-slate-600 text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            <FiUser className={paymentMethod === 'debt' ? "text-red-500" : ""} /> Ghi nợ
                        </button>
                    </div>

                    {/* 2. Ô nhập tiền (Chỉ hiện khi chọn Tiền mặt) */}
                    {paymentMethod === 'cash' && (
                        <div className="mb-4 animate-fade-in">
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400">₫</span>
                                <input 
                                    type="number" 
                                    value={paymentAmount} 
                                    onChange={e => setPaymentAmount(e.target.value)}
                                    className="block w-full pl-8 pr-3 py-2.5 text-right font-bold text-lg border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                                    placeholder="0"
                                />
                            </div>
                            
                            {/* Gợi ý tiền mặt */}
                            <div className="grid grid-cols-4 gap-2 mt-2">
                                {paymentSuggestions.map(amount => (
                                    <button
                                        key={amount}
                                        onClick={() => setPaymentAmount(amount.toString())}
                                        className="px-1 py-1.5 text-xs font-medium bg-white border border-slate-200 hover:border-primary-300 hover:text-primary-600 rounded shadow-sm transition-colors truncate"
                                    >
                                        {amount >= 1000 ? (amount/1000) + 'k' : amount}
                                    </button>
                                ))}
                            </div>
                            
                            {changeDue > 0 && (
                                <div className="mt-2 flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-100 dark:border-blue-800">
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Tiền thừa trả khách:</span>
                                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{changeDue.toLocaleString('vi-VN')} đ</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Thông báo nợ (Chỉ hiện khi Ghi nợ) */}
                    {paymentMethod === 'debt' && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-center">
                            <p className="text-sm text-red-600 dark:text-red-400 font-medium">Đơn hàng này sẽ được ghi vào công nợ khách hàng.</p>
                        </div>
                    )}

                    {/* Thông báo lỗi/thành công */}
                    {error && <p className="text-sm text-red-600 mb-3 text-center font-medium bg-red-50 p-2 rounded">{error}</p>}
                    {successMessage && <p className="text-sm text-green-600 mb-3 text-center flex items-center justify-center gap-1 font-medium bg-green-50 p-2 rounded"><FiCheckCircle/> {successMessage}</p>}

                    {/* 3. Nút Hành động Duy nhất */}
                     <button 
                        onClick={handleMainAction} 
                        disabled={isSubmitting}
                        className={`w-full py-3.5 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl transform active:scale-[0.98] transition-all flex items-center justify-center gap-2
                            ${paymentMethod === 'cash' 
                                ? 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400' 
                                : 'bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500'
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                        `}
                    >
                        {isSubmitting ? 'Đang xử lý...' : paymentMethod === 'cash' ? 'HOÀN THÀNH & IN' : 'LƯU ĐƠN NỢ'}
                    </button>
                </div>
            </div>
        </div>
      </div>
      
      {isQuickCustomerModalOpen && (
        <QuickCustomerModal 
            onClose={() => setIsQuickCustomerModalOpen(false)}
            onSave={handleQuickSaveCustomer}
        />
      )}
    </>
  );
};

export default SalesPage;