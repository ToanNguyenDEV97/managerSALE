import React, { useState } from 'react';
import { FiX, FiEdit2, FiTrash2, FiSave, FiPlus, FiAlertTriangle, FiPackage, FiInfo } from 'react-icons/fi';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../../../hooks/useProducts';
import toast from 'react-hot-toast';
// [THÊM 1] Import Context để lấy thông tin User
import { useAppContext } from '../../../context/DataContext';

// --- 1. MODAL CẢNH BÁO ---
const BlockDeleteModal = ({ isOpen, onClose, productName, countMessage }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative animate-bounce-short border-t-4 border-orange-400">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"><FiX size={24}/></button>
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-5 shadow-sm">
                        <FiPackage size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Chưa thể xóa!</h3>
                    <div className="text-slate-600 mb-6 text-sm bg-orange-50 p-3 rounded-lg border border-orange-100 w-full">
                        <p className="font-medium text-orange-800 flex items-start gap-2 text-left">
                            <FiInfo className="mt-0.5 shrink-0"/> {countMessage}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all shadow-lg hover:shadow-slate-500/30">
                        Đã hiểu, tôi sẽ kiểm tra lại
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- 2. MODAL XÁC NHẬN XÓA ---
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, categoryName }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative animate-zoom-in">
                <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                        <FiTrash2 size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Xóa danh mục này?</h3>
                    <p className="text-slate-500 text-sm mt-2 mb-6 px-4">
                        Bạn có chắc chắn muốn xóa danh mục <span className="font-bold text-slate-800">"{categoryName}"</span> không?
                        <br/>Hành động này không thể hoàn tác.
                    </p>
                    <div className="flex gap-3 w-full">
                        <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Không xóa</button>
                        <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-500/30 transition-colors">Đồng ý xóa</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface CategoryManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ isOpen, onClose }) => {
    // [THÊM 2] Lấy user từ Context
    const { user } = useAppContext();
    
    const { data: categories, isLoading } = useCategories();
    const createMutation = useCreateCategory();
    const updateMutation = useUpdateCategory();
    const deleteMutation = useDeleteCategory();

    const [newCatName, setNewCatName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null);
    const [blockInfo, setBlockInfo] = useState<{ open: boolean, msg: string }>({ open: false, msg: '' });

    if (!isOpen) return null;

    // --- LOGIC XỬ LÝ ---
    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCatName.trim()) return;
        
        // Kiểm tra xem User có organizationId không
        const orgId = user?.organizationId || user?._id; // Fallback tạm thời nếu user chưa có orgId riêng

        try {
            // [SỬA QUAN TRỌNG] Gửi object chứa name VÀ organizationId
            await createMutation.mutateAsync({ 
                name: newCatName,
                organizationId: orgId
            });
            
            toast.success('Đã thêm danh mục!');
            setNewCatName('');
        } catch (error: any) {
            toast.error('Lỗi: ' + error.message);
        }
    };

    const requestDelete = (cat: any) => {
        setDeleteTarget({ id: cat.id || cat._id, name: cat.name });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            toast.success('Đã xóa thành công!');
            setDeleteTarget(null);
        } catch (error: any) {
            setDeleteTarget(null);
            const serverMsg = error.message || 'Danh mục này đang chứa sản phẩm.';
            setBlockInfo({ open: true, msg: serverMsg });
        }
    };

    const handleUpdate = async () => {
        if (!editingId || !editName.trim()) return;
        try {
            await updateMutation.mutateAsync({ id: editingId, name: editName });
            toast.success('Đã cập nhật!');
            setEditingId(null);
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
                        <div>
                            <h3 className="font-bold text-xl text-slate-800 dark:text-white">Danh mục</h3>
                            <p className="text-xs text-slate-400 font-medium">Quản lý nhóm sản phẩm</p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors text-slate-400"><FiX size={20}/></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/50">
                        {isLoading ? <div className="text-center p-6 text-slate-400">Đang tải dữ liệu...</div> : 
                        (!categories || categories.length === 0) ? <div className="text-center text-slate-400 p-8 italic">Chưa có danh mục nào.<br/>Hãy thêm mới bên dưới.</div> :
                        categories.map((cat: any) => (
                            <div key={cat.id || cat._id} className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group">
                                {editingId === (cat.id || cat._id) ? (
                                    <div className="flex w-full gap-2 animate-fade-in">
                                        <input 
                                            autoFocus
                                            className="flex-1 px-3 py-1.5 border-2 border-blue-500 rounded-lg text-sm font-medium outline-none"
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleUpdate()}
                                        />
                                        <button onClick={handleUpdate} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"><FiSave size={16}/></button>
                                        <button onClick={() => setEditingId(null)} className="bg-slate-100 text-slate-500 p-2 rounded-lg hover:bg-slate-200"><FiX size={16}/></button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{cat.name}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingId(cat.id || cat._id); setEditName(cat.name); }} className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa tên"><FiEdit2 size={16} /></button>
                                            <button onClick={() => requestDelete(cat)} className="text-slate-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors" title="Xóa danh mục"><FiTrash2 size={16} /></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleAdd} className="p-4 border-t border-slate-100 bg-white">
                        <div className="relative">
                            <input 
                                className="w-full pl-4 pr-24 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                placeholder="Tên danh mục mới..."
                                value={newCatName}
                                onChange={e => setNewCatName(e.target.value)}
                            />
                            <button 
                                type="submit" 
                                disabled={!newCatName.trim()}
                                className="absolute right-1.5 top-1.5 bottom-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 rounded-lg flex items-center gap-1 font-bold text-xs uppercase transition-all shadow-md hover:shadow-blue-500/30"
                            >
                                <FiPlus size={16}/> Thêm
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <DeleteConfirmModal 
                isOpen={!!deleteTarget} 
                onClose={() => setDeleteTarget(null)} 
                onConfirm={confirmDelete}
                categoryName={deleteTarget?.name} 
            />

            <BlockDeleteModal 
                isOpen={blockInfo.open}
                onClose={() => setBlockInfo({ ...blockInfo, open: false })}
                countMessage={blockInfo.msg}
            />
        </>
    );
};

export default CategoryManagerModal;