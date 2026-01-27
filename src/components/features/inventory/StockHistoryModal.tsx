import React, { useState } from 'react';
import { FiX, FiActivity, FiArrowUpCircle, FiArrowDownCircle, FiAlertCircle, FiRotateCcw } from 'react-icons/fi';
import moment from 'moment';
import { useProductStockHistory } from '../../../hooks/useProducts';
import Pagination from '../../common/Pagination';

interface Props {
    product: any;
    onClose: () => void;
}

const StockHistoryModal: React.FC<Props> = ({ product, onClose }) => {
    const [page, setPage] = useState(1);
    const { data, isLoading } = useProductStockHistory(product._id || product.id, page);

    const renderType = (type: string) => {
        switch (type) {
            case 'import':
                return <span className="flex items-center gap-1 text-green-600 font-bold"><FiArrowUpCircle/> Nhập hàng</span>;
            case 'export':
                return <span className="flex items-center gap-1 text-blue-600 font-bold"><FiArrowDownCircle/> Xuất kho</span>;
            case 'return':
                return <span className="flex items-center gap-1 text-orange-600 font-bold"><FiRotateCcw/> Khách trả</span>;
            default:
                return <span className="flex items-center gap-1 text-slate-500 font-bold"><FiActivity/> Điều chỉnh</span>;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                            <FiActivity className="text-blue-600"/> Thẻ Kho: {product.name}
                        </h3>
                        <p className="text-xs text-slate-500">Mã SKU: {product.sku}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded-full transition-colors">
                        <FiX size={24}/>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                    {isLoading ? (
                        <div className="text-center py-10 text-slate-400">Đang tải dữ liệu...</div>
                    ) : !data?.data || data.data.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 flex flex-col items-center gap-2">
                            <FiAlertCircle size={32}/>
                            <p>Chưa có lịch sử giao dịch nào.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-xs sticky top-0 z-10">
                                <tr>
                                    <th className="p-3 border-b">Thời gian</th>
                                    <th className="p-3 border-b">Loại giao dịch</th>
                                    <th className="p-3 border-b">Chứng từ</th>
                                    <th className="p-3 border-b text-right">SL Đổi</th>
                                    <th className="p-3 border-b text-right">Tồn cuối</th>
                                    <th className="p-3 border-b">Người thực hiện</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.data.map((item: any) => (
                                    <tr key={item._id} className="hover:bg-slate-50">
                                        <td className="p-3 text-slate-500">
                                            {moment(item.createdAt).format('DD/MM/YYYY HH:mm')}
                                        </td>
                                        <td className="p-3">{renderType(item.type)}</td>
                                        <td className="p-3 font-medium text-slate-700">
                                            {item.reference || '---'}
                                        </td>
                                        <td className={`p-3 text-right font-bold ${item.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {item.quantity > 0 ? '+' : ''}{item.quantity}
                                        </td>
                                        <td className="p-3 text-right font-bold text-slate-800">
                                            {item.newStock}
                                        </td>
                                        <td className="p-3 text-slate-500 text-xs">
                                            {item.createdBy?.fullName || 'Hệ thống'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer Pagination */}
                {data?.totalPages > 1 && (
                    <div className="p-4 border-t bg-slate-50">
                        <Pagination 
                            currentPage={page} 
                            totalPages={data.totalPages} 
                            onPageChange={setPage} 
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockHistoryModal;