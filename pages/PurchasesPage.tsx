
import React, { useState, useMemo } from 'react';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import type { Purchase } from '../types';
import { useAppContext } from '../context/DataContext';
import Pagination from '../components/Pagination';
import ConfirmationModal from '../components/ConfirmationModal';

const PurchasesPage: React.FC = () => {
    const { purchases, setEditingPurchase, handleDeletePurchase } = useAppContext();
    const [currentPage, setCurrentPage] = useState(1);
    const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);
    const ITEMS_PER_PAGE = 10;
    
    const sortedPurchases = useMemo(() => {
        return [...purchases].sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
    }, [purchases]);
    
    const paginatedPurchases = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedPurchases.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedPurchases, currentPage]);

    const totalPages = Math.ceil(sortedPurchases.length / ITEMS_PER_PAGE);
    
    const handleDeleteClick = (purchase: Purchase) => {
        setPurchaseToDelete(purchase);
    };
    
    const handleConfirmDelete = async () => {
        if (purchaseToDelete) {
            await handleDeletePurchase(purchaseToDelete.id);
            setPurchaseToDelete(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="hidden lg:block">
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-200">Quản lý Nhập kho</h1>
                    <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400 mt-1">Tạo và theo dõi các phiếu nhập hàng từ nhà cung cấp.</p>
                </div>
                <button
                    onClick={() => setEditingPurchase('new')}
                    className="flex items-center justify-center w-full md:w-auto px-4 py-2 text-white rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-px"
                >
                    <FiPlus />
                    <span className="ml-2 font-medium">Tạo Phiếu nhập</span>
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Table View */}
                <div className="overflow-x-auto hidden lg:block">
                    <table className="min-w-full">
                        <thead className="bg-primary-50 dark:bg-slate-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Số Phiếu</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Nhà cung cấp</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Ngày nhập</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Tổng tiền</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800">
                            {paginatedPurchases.map(purchase => (
                                <tr key={purchase.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600 dark:text-primary-400">{purchase.purchaseNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 dark:text-slate-200">{purchase.supplierName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{purchase.issueDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">{purchase.totalAmount.toLocaleString('vi-VN')} đ</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => setEditingPurchase(purchase)} className="text-primary-600 hover:text-primary-800 inline-flex items-center gap-1 transition-transform hover:scale-110 p-1 rounded-full hover:bg-primary-100 dark:hover:bg-primary-500/20" title="Sửa">
                                            <FiEdit className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => handleDeleteClick(purchase)} className="text-red-500 hover:text-red-700 inline-flex items-center gap-1 transition-transform hover:scale-110 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20" title="Xóa">
                                            <FiTrash2 className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {/* Card View */}
                <div className="lg:hidden">
                    {paginatedPurchases.length > 0 ? paginatedPurchases.map(purchase => (
                        <div key={purchase.id} className="p-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                             <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-primary-600 dark:text-primary-400">{purchase.purchaseNumber}</p>
                                    <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">{purchase.supplierName}</p>
                                </div>
                                 <div className="flex items-center space-x-2">
                                    <button onClick={() => setEditingPurchase(purchase)} className="text-primary-600 p-1">
                                        <FiEdit className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handleDeleteClick(purchase)} className="text-red-500 p-1">
                                        <FiTrash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="mt-2 flex justify-between items-center text-sm">
                                <span className="text-slate-500 dark:text-slate-400">{purchase.issueDate}</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{purchase.totalAmount.toLocaleString('vi-VN')} đ</span>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-10 text-slate-500 dark:text-slate-400">Chưa có phiếu nhập kho nào.</div>
                    )}
                </div>
                 <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={sortedPurchases.length} itemsPerPage={ITEMS_PER_PAGE} />
            </div>
            
            {purchaseToDelete && (
                <ConfirmationModal
                    isOpen={!!purchaseToDelete}
                    onClose={() => setPurchaseToDelete(null)}
                    onConfirm={handleConfirmDelete}
                    title="Xác nhận Xóa Phiếu Nhập"
                >
                    Bạn có chắc chắn muốn xóa phiếu nhập "<strong>{purchaseToDelete.purchaseNumber}</strong>"? Hành động này sẽ cập nhật lại tồn kho và công nợ nhà cung cấp.
                </ConfirmationModal>
            )}
        </div>
    );
};

export default PurchasesPage;
