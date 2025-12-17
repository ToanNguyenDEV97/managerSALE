import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/DataContext';
import { useInvoices } from '../hooks/useInvoices'; // Import Hook
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const PaymentModal: React.FC = () => {
  const { payingInvoiceId, setPayingInvoiceId } = useAppContext();
  
  // Lấy dữ liệu invoice
  const { data: invoicesData } = useInvoices(1);
  const invoices = Array.isArray(invoicesData) ? invoicesData : (invoicesData?.data || []);
  
  const invoice = useMemo(() => invoices.find((inv: any) => inv.id === payingInvoiceId), [invoices, payingInvoiceId]);
  
  const remainingAmount = useMemo(() => invoice ? invoice.totalAmount - invoice.paidAmount : 0, [invoice]);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [updateDebt, setUpdateDebt] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  React.useEffect(() => {
    if(remainingAmount) setPaymentAmount(remainingAmount);
  }, [remainingAmount]);

  // Mutation thanh toán
  const queryClient = useQueryClient();
  const paymentMutation = useMutation({
      mutationFn: async (data: any) => {
          return api(`/api/invoices/${payingInvoiceId}/payment`, { method: 'POST', body: JSON.stringify(data) });
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['invoices'] });
          queryClient.invalidateQueries({ queryKey: ['customers'] });
          queryClient.invalidateQueries({ queryKey: ['cashflow'] });
          toast.success('Thanh toán thành công');
          setPayingInvoiceId(null);
      },
      onError: (err: any) => setError(err.message)
  });

  if (!payingInvoiceId || !invoice) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    if (value < 0) setError('Số tiền không được âm.');
    else if (value > remainingAmount) setError(`Không được lớn hơn nợ (${remainingAmount.toLocaleString()} đ).`);
    else setError('');
    setPaymentAmount(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0 || error) return;
    paymentMutation.mutate({ amount: paymentAmount, updateDebt });
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Thanh toán Hóa đơn {invoice.invoiceNumber}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Khách hàng</label>
                <p className="mt-1 text-slate-900 dark:text-white font-medium">{invoice.customerName}</p>
            </div>
            <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Số tiền còn nợ</label>
                 <p className="mt-1 text-red-600 font-bold text-lg">{remainingAmount.toLocaleString('vi-VN')} đ</p>
            </div>
            <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Thanh toán lần này</label>
                 <input 
                    type="number" 
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    value={paymentAmount}
                    onChange={handleChange}
                 />
                 {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>
            <div className="flex items-center">
                <input 
                    type="checkbox" 
                    id="updateDebt"
                    checked={updateDebt}
                    onChange={(e) => setUpdateDebt(e.target.checked)}
                    className="h-4 w-4 text-primary-600 rounded"
                />
                <label htmlFor="updateDebt" className="ml-2 text-sm text-slate-700 dark:text-slate-300">Cập nhật công nợ khách hàng</label>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setPayingInvoiceId(null)} className="px-4 py-2 border rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">Hủy</button>
                <button 
                    type="submit" 
                    disabled={paymentMutation.isPending || !!error || paymentAmount <= 0}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                    {paymentMutation.isPending ? 'Đang xử lý...' : 'Xác nhận Thanh toán'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;