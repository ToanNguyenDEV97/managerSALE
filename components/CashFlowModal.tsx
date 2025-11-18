
import React, { useState, useEffect } from 'react';
import type { CashFlowTransaction } from '../types';
import { useAppContext } from '../context/DataContext';

const CashFlowModal: React.FC = () => {
  const { editingTransaction, handleSaveCashFlowTransaction, setEditingTransaction } = useAppContext();

  if (!editingTransaction) return null;

  const transactionOrType = editingTransaction;
  const isEditing = typeof transactionOrType === 'object';
  const type = isEditing ? transactionOrType.type : (transactionOrType === 'new-thu' ? 'thu' : 'chi');
  
  const [formData, setFormData] = useState<Omit<CashFlowTransaction, 'id' | 'transactionNumber'>>({
    type: type,
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    description: '',
    payerReceiverName: '',
    payerReceiverAddress: '',
    category: type === 'chi' ? 'Chi phí hoạt động' : 'Thu nợ KH',
    inputVat: 0,
  });

  useEffect(() => {
    if (isEditing) {
      setFormData({
        ...transactionOrType,
        inputVat: transactionOrType.inputVat || 0,
      });
    } else {
        // Reset form for new transactions
        setFormData({
            type: type,
            date: new Date().toISOString().split('T')[0],
            amount: 0,
            description: '',
            payerReceiverName: '',
            payerReceiverAddress: '',
            category: type === 'chi' ? 'Chi phí hoạt động' : 'Thu nợ KH',
            inputVat: 0,
        })
    }
  }, [transactionOrType, isEditing, type]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: name === 'amount' || name === 'inputVat' ? parseFloat(value) || 0 : value 
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) {
        alert("Số tiền phải lớn hơn 0.");
        return;
    }
    const id = isEditing ? transactionOrType.id : '';
    const transactionNumber = isEditing ? transactionOrType.transactionNumber : '';
    await handleSaveCashFlowTransaction({ ...formData, id, transactionNumber });
  };
  
  const title = type === 'thu' 
    ? (isEditing ? 'Chỉnh sửa Phiếu Thu' : 'Tạo Phiếu Thu mới') 
    : (isEditing ? 'Chỉnh sửa Phiếu Chi' : 'Tạo Phiếu Chi mới');
    
  const inputStyles = "mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400";
  const labelStyles = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{title}</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className={labelStyles}>Ngày</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} required className={inputStyles} />
                </div>
                <div>
                    <label className={labelStyles}>Tổng số tiền (gồm VAT)</label>
                    <input type="number" name="amount" value={formData.amount} onChange={handleChange} required min="1" className={inputStyles} />
                </div>
            </div>
             <div>
                <label className={labelStyles}>{type === 'thu' ? 'Người nộp tiền' : 'Người nhận tiền'}</label>
                <input type="text" name="payerReceiverName" value={formData.payerReceiverName} onChange={handleChange} className={inputStyles} />
            </div>
             <div>
                <label className={labelStyles}>Địa chỉ</label>
                <input type="text" name="payerReceiverAddress" value={formData.payerReceiverAddress} onChange={handleChange} className={inputStyles} />
            </div>
             {type === 'chi' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelStyles}>Loại chi phí</label>
                  <select name="category" value={formData.category} onChange={handleChange} required className={inputStyles}>
                      <option value="Chi phí hoạt động">Chi phí hoạt động</option>
                      <option value="Trả NCC">Trả nhà cung cấp</option>
                      <option value="Lương">Lương</option>
                      <option value="Khác">Khác</option>
                  </select>
                </div>
                 <div>
                    <label className={labelStyles}>Thuế GTGT đầu vào</label>
                    <input type="number" name="inputVat" value={formData.inputVat} onChange={handleChange} min="0" className={inputStyles} />
                </div>
              </div>
            )}
            <div>
              <label className={labelStyles}>Nội dung</label>
              <textarea name="description" value={formData.description} onChange={handleChange} required rows={3} className={inputStyles}></textarea>
            </div>
          </div>
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl flex justify-end space-x-3">
            <button type="button" onClick={() => setEditingTransaction(null)} className="px-4 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 hover:border-slate-400 transition-colors duration-200 font-medium text-sm">Hủy</button>
            <button type="submit" className="px-4 py-2 text-white rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-px font-medium text-sm">
                {isEditing ? 'Cập nhật & In' : 'Lưu & In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CashFlowModal;
