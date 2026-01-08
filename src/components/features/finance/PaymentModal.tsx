import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../../context/DataContext';
// [SỬA 1] Import usePayInvoice và useQuery
import { usePayInvoice } from '../../../hooks/useInvoices';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../utils/api';
import { FiX, FiCheckCircle, FiLoader } from 'react-icons/fi';

const PaymentModal: React.FC = () => {
  const { payingInvoiceId, setPayingInvoiceId } = useAppContext();
  
  // [SỬA 2] Fetch chi tiết hóa đơn trực tiếp theo ID (Thay vì tìm trong danh sách trang 1)
  const { data: invoice, isLoading } = useQuery({
      queryKey: ['invoice', payingInvoiceId],
      queryFn: () => api(`/api/invoices/${payingInvoiceId}`),
      enabled: !!payingInvoiceId // Chỉ chạy khi có ID
  });

  // [SỬA 3] Dùng hook usePayInvoice chuẩn (đã có logic toast và reload data)
  const payMutation = usePayInvoice();
  
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [error, setError] = useState<string>('');

  // Tính số tiền còn nợ
  const remainingAmount = invoice ? (invoice.totalAmount - (invoice.paidAmount || 0)) : 0;

  // Tự động điền số tiền còn thiếu khi mở modal
  useEffect(() => {
    if (remainingAmount > 0) setPaymentAmount(remainingAmount);
  }, [remainingAmount]);

  // Xử lý logic nhập tiền
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    if (value < 0) setError('Số tiền không được âm.');
    else if (value > remainingAmount) setError(`Không được lớn hơn nợ (${remainingAmount.toLocaleString()} đ).`);
    else setError('');
    setPaymentAmount(value);
  };

  // Submit thanh toán
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0 || error || !payingInvoiceId) return;
    
    try {
        await payMutation.mutateAsync({ id: payingInvoiceId, amount: paymentAmount });
        setPayingInvoiceId(null); // Đóng modal sau khi thành công
    } catch (err) {
        // Lỗi đã được usePayInvoice xử lý hiển thị toast
    }
  };

  // Nếu không có ID thì không render
  if (!payingInvoiceId) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex justify-center items-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700/50">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <FiCheckCircle className="text-green-500"/> 
                Thanh toán công nợ
            </h3>
            <button onClick={() => setPayingInvoiceId(null)} className="text-slate-400 hover:text-red-500 transition-colors">
                <FiX size={24} />
            </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
            <div className="p-10 flex flex-col items-center justify-center text-slate-500">
                <FiLoader className="animate-spin text-3xl text-primary-600 mb-3" />
                <p>Đang tải thông tin hóa đơn...</p>
            </div>
        ) : invoice ? (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Thông tin hóa đơn */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                    <div className="flex justify-between mb-2">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Mã hóa đơn:</span>
                        <span className="font-bold text-slate-700 dark:text-blue-100">{invoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Khách hàng:</span>
                        <span className="font-bold text-slate-700 dark:text-blue-100">{invoice.customerName}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-blue-100 dark:border-blue-800 mt-2">
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Còn nợ:</span>
                        <span className="text-xl font-black text-red-500">{remainingAmount.toLocaleString('vi-VN')} đ</span>
                    </div>
                </div>

                {/* Input tiền */}
                <div>
                     <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Số tiền thanh toán</label>
                     <div className="relative">
                        <input 
                            type="number" 
                            autoFocus
                            className={`block w-full pl-4 pr-12 py-3 text-lg font-bold border rounded-xl focus:ring-2 outline-none transition-all ${error ? 'border-red-500 focus:ring-red-200 text-red-600' : 'border-slate-300 focus:ring-primary-500 focus:border-primary-500 text-slate-800'}`}
                            value={paymentAmount}
                            onChange={handleChange}
                            onFocus={(e) => e.target.select()}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">đ</span>
                     </div>
                     {error && <p className="text-red-500 text-sm mt-1 font-medium flex items-center gap-1"><FiX /> {error}</p>}
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                    <button 
                        type="button" 
                        onClick={() => setPayingInvoiceId(null)} 
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all"
                    >
                        Đóng
                    </button>
                    <button 
                        type="submit" 
                        disabled={payMutation.isPending || !!error || paymentAmount <= 0}
                        className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-600/30 transition-all flex items-center gap-2"
                    >
                        {payMutation.isPending ? <FiLoader className="animate-spin"/> : <FiCheckCircle />}
                        {payMutation.isPending ? 'Đang xử lý...' : 'Xác nhận thu tiền'}
                    </button>
                </div>
            </form>
        ) : (
            <div className="p-6 text-center text-red-500">Không tìm thấy thông tin hóa đơn</div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;