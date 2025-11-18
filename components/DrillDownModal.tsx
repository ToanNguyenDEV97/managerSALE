
import React from 'react';
import type { Invoice } from '../types';
import { FiX } from 'react-icons/fi';

interface DrillDownModalProps {
  data: {
    title: string;
    invoices: Invoice[];
  } | null;
  onClose: () => void;
}

const DrillDownModal: React.FC<DrillDownModalProps> = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col h-[80vh]">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">{data.title}</h2>
          <button onClick={onClose} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-slate-600 dark:text-slate-300">Số HĐ</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-600 dark:text-slate-300">Khách hàng</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-600 dark:text-slate-300">Ngày xuất</th>
                <th className="px-4 py-2 text-right font-semibold text-slate-600 dark:text-slate-300">Tổng tiền</th>
                <th className="px-4 py-2 text-right font-semibold text-slate-600 dark:text-slate-300">Đã trả</th>
                <th className="px-4 py-2 text-center font-semibold text-slate-600 dark:text-slate-300">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800">
              {data.invoices.map(invoice => (
                <tr key={invoice.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-primary-600">{invoice.invoiceNumber}</td>
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{invoice.customerName}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{invoice.issueDate}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-slate-200">{invoice.totalAmount.toLocaleString('vi-VN')} đ</td>
                  <td className="px-4 py-3 text-right text-green-600">{invoice.paidAmount.toLocaleString('vi-VN')} đ</td>
                  <td className="px-4 py-3 text-center">{invoice.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrillDownModal;
