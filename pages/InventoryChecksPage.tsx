
import React, { useState, useMemo } from 'react';
import { FiPlus, FiEye, FiTrash2, FiEdit } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
import type { InventoryCheck } from '../types';
import Pagination from '../components/Pagination';
import ConfirmationModal from '../components/ConfirmationModal';
import InventoryCheckDetailsModal from '../components/InventoryCheckDetailsModal';

const InventoryChecksPage: React.FC = () => {
    const { inventoryChecks, setEditingInventoryCheck, handleDeleteInventoryCheck } = useAppContext();
    const [currentPage, setCurrentPage] = useState(1);
    const [checkToDelete, setCheckToDelete] = useState<InventoryCheck | null>(null);
    const [viewingCheck, setViewingCheck] = useState<InventoryCheck | null>(null);
    const ITEMS_PER_PAGE = 10;
    
    const sortedChecks = useMemo(() => {
        return [...inventoryChecks].sort((a, b) => new Date(b.checkDate).getTime() - new Date(a.checkDate).getTime());
    }, [inventoryChecks]);
    
    const paginatedChecks = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedChecks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedChecks, currentPage]);

    const totalPages = Math.ceil(sortedChecks.length / ITEMS_PER_PAGE);

    const getStatusClass = (status: InventoryCheck['status']) => {
        switch (status) {
            case 'Nháp': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300';
            case 'Hoàn thành': return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-600 dark:text-slate-200';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="hidden lg:block">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Quản lý Kiểm kho</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Đối chiếu tồn kho sổ sách và thực tế.</p>
                </div>
                <button
                    onClick={() => setEditingInventoryCheck('new')}
                    className="flex items-center justify-center w-full md:w-auto px-4 py-2 text-white rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-px"
                >
                    <FiPlus />
                    <span className="ml-2 font-medium">Tạo Phiếu Kiểm kho</span>
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-primary-50 dark:bg-slate-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Số Phiếu</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Ngày kiểm</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Trạng thái</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800">
                            {paginatedChecks.map(check => (
                                <tr key={check.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">{check.checkNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{check.checkDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(check.status)}`}>
                                            {check.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => setViewingCheck(check)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600" title="Xem chi tiết">
                                            <FiEye className="h-5 w-5" />
                                        </button>
                                        {check.status === 'Nháp' && (
                                            <>
                                                <button onClick={() => setEditingInventoryCheck(check)} className="text-primary-600 hover:text-primary-800 p-1 rounded-full hover:bg-primary-100 dark:hover:bg-primary-500/20" title="Sửa">
                                                    <FiEdit className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => setCheckToDelete(check)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20" title="Xóa">
                                                    <FiTrash2 className="h-5 w-5" />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={sortedChecks.length} itemsPerPage={ITEMS_PER_PAGE} />
            </div>
            
            {checkToDelete && (
                <ConfirmationModal
                    isOpen={!!checkToDelete}
                    onClose={() => setCheckToDelete(null)}
                    onConfirm={() => {
                        handleDeleteInventoryCheck(checkToDelete.id);
                        setCheckToDelete(null);
                    }}
                    title="Xác nhận Xóa Phiếu Kiểm kho"
                >
                    Bạn có chắc chắn muốn xóa phiếu kiểm kho nháp "<strong>{checkToDelete.checkNumber}</strong>"?
                </ConfirmationModal>
            )}

            {viewingCheck && (
                <InventoryCheckDetailsModal
                    check={viewingCheck}
                    onClose={() => setViewingCheck(null)}
                />
            )}
        </div>
    );
};

export default InventoryChecksPage;
