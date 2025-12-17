import React, { useState, useEffect } from 'react';
import type { CashFlowTransaction } from '../types';
import { useAppContext } from '../context/DataContext';
import { useSaveTransaction } from '../hooks/useCashFlow'; // Import Hook
import { FiLoader } from 'react-icons/fi';

const CashFlowModal: React.FC = () => {
  const { editingTransaction, setEditingTransaction } = useAppContext();
  const saveMutation = useSaveTransaction();

  if (!editingTransaction) return null;

  const isEditing = typeof editingTransaction === 'object' && 'id' in editingTransaction;
  const type = isEditing ? editingTransaction.type : (editingTransaction === 'new-thu' ? 'thu' : 'chi');
  
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
      setFormData({ ...editingTransaction, inputVat: editingTransaction.inputVat || 0 });
    } else {
      setFormData(prev => ({ ...prev, type: type }));
    }
  }, [editingTransaction, type, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'amount' || name === 'inputVat' ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
        ...formData,
        id: isEditing ? editingTransaction.id : undefined
    };
    try {
        await saveMutation.mutateAsync(dataToSave);
        setEditingTransaction(null);
    } catch (error) {
        console.error(error);
    }
  };

  const labelStyles = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";
  const inputStyles = "w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500";

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className={`p-4 border-b ${type === 'thu' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <h3 className={`text-lg font-bold ${type === 'thu' ? 'text-green-800' : 'text-red-800'}`}>
            {isEditing ? 'Sửa' : 'Lập'} Phiếu {type === 'thu' ? 'Thu' : 'Chi'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelStyles}>Ngày lập</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} required className={inputStyles} />
                </div>
                <div>
                    <label className={labelStyles}>Số tiền <span className="text-red-500">*</span></label>
                    <input type="number" name="amount" value={formData.amount} onChange={handleChange} required min="0" className={`${inputStyles} font-bold text-lg`} />
                </div>
            </div>

            <div>
                <label className={labelStyles}>{type === 'thu' ? 'Người nộp' : 'Người nhận'}</label>
                <input type="text" name="payerReceiverName" value={formData.payerReceiverName} onChange={handleChange} className={inputStyles} placeholder="Họ tên người nộp/nhận..." />
            </div>

            <div>
                <label className={labelStyles}>Phân loại</label>
                <select name="category" value={formData.category} onChange={handleChange} className={inputStyles}>
                    {type === 'thu' ? (
                        <>
                            <option value="Thu nợ KH">Thu nợ Khách hàng</option>
                            <option value="Bán hàng">Bán hàng</option>
                            <option value="Khác">Thu khác</option>
                        </>
                    ) : (
                        <>
                            <option value="Chi phí hoạt động">Chi phí hoạt động</option>
                            <option value="Trả NCC">Trả Nhà cung cấp</option>
                            <option value="Lương">Lương nhân viên</option>
                            <option value="Khác">Chi khác</option>
                        </>
                    )}
                </select>
            </div>

            <div>
                <label className={labelStyles}>Nội dung / Diễn giải</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={3} required className={inputStyles} placeholder="Nhập lý do thu/chi..."></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditingTransaction(null)} className="px-4 py-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-white">Hủy</button>
                <button 
                    type="submit" 
                    disabled={saveMutation.isPending}
                    className={`flex items-center gap-2 px-6 py-2 text-white rounded-lg font-bold shadow-md ${type === 'thu' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                    {saveMutation.isPending ? <FiLoader className="animate-spin"/> : null}
                    Lưu Phiếu
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default CashFlowModal;