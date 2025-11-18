
import React from 'react';
import type { InventoryCheck } from '../types';
import { FiX } from 'react-icons/fi';

interface InventoryCheckDetailsModalProps {
  check: InventoryCheck;
  onClose: () => void;
}

const InventoryCheckDetailsModal: React.FC<InventoryCheckDetailsModalProps> = ({ check, onClose }) => {
    const discrepancyItems = check.items.filter(item => item.difference !== 0);

    return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col h-[80vh]">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Chi tiết Phiếu Kiểm kho: {check.checkNumber}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Ngày kiểm: {check.checkDate} - Trạng thái: {check.status}</p>
            </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Sản phẩm có chênh lệch:</h3>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0">
              <tr>
                <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300">Sản phẩm</th>
                <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">Sổ sách</th>
                <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">Thực tế</th>
                <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">Chênh lệch</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800">
              {discrepancyItems.length > 0 ? discrepancyItems.map(item => (
                <tr key={item.productId} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                  <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{item.productName}</td>
                  <td className="p-3 text-center text-slate-500 dark:text-slate-400">{item.stockOnHand}</td>
                  <td className="p-3 text-center text-slate-500 dark:text-slate-400">{item.actualStock}</td>
                   <td className={`p-3 text-center font-bold ${item.difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.difference > 0 ? `+${item.difference}` : item.difference}
                   </td>
                </tr>
              )) : (
                <tr>
                    <td colSpan={4} className="text-center p-8 text-slate-500 dark:text-slate-400">Không có chênh lệch nào trong lần kiểm kho này.</td>
                </tr>
              )}
            </tbody>
          </table>
          {check.notes && (
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                <h4 className="font-semibold text-slate-700 dark:text-slate-300">Ghi chú:</h4>
                <p className="text-slate-600 dark:text-slate-400">{check.notes}</p>
            </div>
          )}
        </div>
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white text-slate-700 dark:bg-slate-600 dark:text-slate-200 border border-slate-300 dark:border-slate-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-500 font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
    );
};

export default InventoryCheckDetailsModal;
