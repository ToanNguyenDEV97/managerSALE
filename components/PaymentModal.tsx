
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/DataContext';

const PaymentModal: React.FC = () => {
  const { payingInvoiceId, invoices, handleRecordPayment, setPayingInvoiceId } = useAppContext();
  const invoice = useMemo(() => invoices.find(inv => inv.id === payingInvoiceId), [invoices, payingInvoiceId]);
  
  const remainingAmount = useMemo(() => invoice ? invoice.totalAmount - invoice.paidAmount : 0, [invoice]);
  const [paymentAmount, setPaymentAmount] = useState<number>(remainingAmount);
  const [updateDebt, setUpdateDebt] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  React.useEffect(() => {
    setPaymentAmount(remainingAmount);
  }, [remainingAmount]);

  if (!invoice) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    if (value < 0) {
      setError('Số tiền thanh toán không được âm.');
    } else if (value > remainingAmount) {
      setError(`Số tiền không được lớn hơn số tiền còn nợ (${remainingAmount.toLocaleString('vi-VN')} đ).`);
    } else {
      setError('');
    }
    setPaymentAmount(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0 || paymentAmount > remainingAmount) {
      setError('Vui lòng nhập một số tiền hợp lệ.');
      return;
    }
    await handleRecordPayment(invoice.id, paymentAmount, updateDebt);
  };
  
  const baseInputStyles = "mt-1 block w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 sm:text-sm dark:bg-slate-700 dark:text-slate-200 dark:placeholder-slate-400";
  const normalInputStyles = `${baseInputStyles} border-slate-300 dark:border-slate-600 focus:ring-primary-300 focus:border-primary-500`;
  const errorInputStyles = `${baseInputStyles} border-red-500 focus:ring-red-300`;


  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Ghi nhận Thanh toán</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Hóa đơn: {invoice.invoiceNumber}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Khách hàng:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{invoice.customerName}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                    <span className="text-slate-600 dark:text-slate-400">Tổng tiền hóa đơn:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{invoice.totalAmount.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                    <span className="text-slate-600 dark:text-slate-400">Đã thanh toán:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{invoice.paidAmount.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between text-sm mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Còn lại:</span>
                    <span className="font-bold text-red-600">{remainingAmount.toLocaleString('vi-VN')} đ</span>
                </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Số tiền thanh toán</label>
              <input 
                type="number"
                value={paymentAmount}
                onChange={handleChange}
                required
                autoFocus
                className={error ? errorInputStyles : normalInputStyles} 
              />
              {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            </div>
            <div className="pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={updateDebt}
                        onChange={(e) => setUpdateDebt(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-500 text-primary-600 focus:ring-primary-500 bg-white dark:bg-slate-600"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Cập nhật công nợ tổng của khách hàng</span>
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-6">
                    Bỏ chọn nếu đây là khoản trả trước hoặc thanh toán không liên quan đến công nợ hiện tại.
                </p>
            </div>
          </div>
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl flex justify-end space-x-3">
            <button type="button" onClick={() => setPayingInvoiceId(null)} className="px-4 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 hover:border-slate-400 transition-colors duration-200 font-medium text-sm">Hủy</button>
            <button type="submit" disabled={!!error || paymentAmount <= 0} className="px-4 py-2 text-white rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-px font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              Ghi nhận
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
