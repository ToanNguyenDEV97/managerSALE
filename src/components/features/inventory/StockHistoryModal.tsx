import React from 'react';
import { FiX, FiArrowUp, FiArrowDown, FiRotateCcw } from 'react-icons/fi';
import { useStockHistory } from '../../../hooks/useProducts';

interface StockHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
}

const StockHistoryModal: React.FC<StockHistoryModalProps> = ({ isOpen, onClose, product }) => {
    const { data: history, isLoading } = useStockHistory(product?.id || product?._id);

    if (!isOpen || !product) return null;

    // Hàm chọn màu và icon dựa theo loại giao dịch
    const getTransactionStyle = (type: string, amount: number) => {
        if (amount > 0) return { color: 'text-green-600', icon: <FiArrowUp />, bg: 'bg-green-50' };
        if (amount < 0) return { color: 'text-red-600', icon: <FiArrowDown />, bg: 'bg-red-50' };
        return { color: 'text-slate-600', icon: <FiRotateCcw />, bg: 'bg-slate-50' };
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                
                {/* Header */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700/50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Thẻ Kho: {product.name}</h3>
                        <p className="text-sm text-slate-500">Mã SKU: {product.sku} | Tồn hiện tại: <span className="font-bold text-blue-600">{product.stock} {product.unit}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full transition-colors"><FiX size={20} /></button>
                </div>

                {/* Body - Table */}
                <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-slate-100 dark:bg-slate-700 sticky top-0 shadow-sm z-10">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Thời gian</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Loại giao dịch</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Chứng từ</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Thay đổi</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Tồn sau</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Ghi chú</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                            {isLoading ? (
                                <tr><td colSpan={6} className="p-10 text-center">Đang tải dữ liệu...</td></tr>
                            ) : history?.length > 0 ? (
                                history.map((item: any, index: number) => {
                                    const style = getTransactionStyle(item.type, item.changeAmount);
                                    return (
                                        <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="p-4 text-slate-500">
                                                {new Date(item.date).toLocaleDateString('vi-VN')} <br/>
                                                <span className="text-xs">{new Date(item.date).toLocaleTimeString('vi-VN')}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${style.bg} ${style.color}`}>
                                                    {style.icon} {item.type}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center text-blue-600 font-medium cursor-pointer hover:underline">
                                                {item.referenceNumber || '-'}
                                            </td>
                                            <td className={`p-4 text-right font-bold ${style.color}`}>
                                                {item.changeAmount > 0 ? '+' : ''}{item.changeAmount}
                                            </td>
                                            <td className="p-4 text-right font-bold text-slate-800 dark:text-white">
                                                {item.balanceAfter}
                                            </td>
                                            <td className="p-4 text-slate-500 max-w-[200px] truncate" title={item.note}>
                                                {item.note || '-'}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan={6} className="p-10 text-center text-slate-400 italic">Chưa có lịch sử giao dịch nào.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StockHistoryModal;