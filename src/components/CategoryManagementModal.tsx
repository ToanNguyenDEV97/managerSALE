import React, { useState } from 'react';
import { FiX, FiEdit2, FiTrash2, FiSave, FiPlus } from 'react-icons/fi';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useProducts';
import toast from 'react-hot-toast';

interface CategoryManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ isOpen, onClose }) => {
    const { data: categories, isLoading } = useCategories();
    const createMutation = useCreateCategory();
    const updateMutation = useUpdateCategory();
    const deleteMutation = useDeleteCategory();

    const [newCatName, setNewCatName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    if (!isOpen) return null;

    // Xử lý thêm mới
    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCatName.trim()) return;
        try {
            await createMutation.mutateAsync(newCatName);
            toast.success('Đã thêm danh mục!');
            setNewCatName('');
        } catch (error: any) {
            toast.error('Lỗi: ' + error.message);
        }
    };

    // Xử lý xóa
    const handleDelete = async (id: string) => {
        if (!window.confirm('Bạn có chắc muốn xóa danh mục này?')) return;
        try {
            await deleteMutation.mutateAsync(id);
            toast.success('Đã xóa thành công!');
        } catch (error: any) {
            // Backend trả về lỗi 400 nếu còn sản phẩm
            toast.error(error.message || 'Không thể xóa danh mục này.');
        }
    };

    // Bắt đầu sửa
    const startEdit = (cat: any) => {
        setEditingId(cat.id || cat._id);
        setEditName(cat.name);
    };

    // Lưu sửa
    const handleUpdate = async () => {
        if (!editingId || !editName.trim()) return;
        try {
            await updateMutation.mutateAsync({ id: editingId, name: editName });
            toast.success('Cập nhật thành công!');
            setEditingId(null);
        } catch (error: any) {
            toast.error('Lỗi: ' + error.message);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                
                {/* Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700/50">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Quản lý Danh mục</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full"><FiX /></button>
                </div>

                {/* Body - List */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
                    {isLoading ? <div className="text-center p-4">Đang tải...</div> : 
                    categories?.length === 0 ? <div className="text-center text-slate-500 p-4">Chưa có danh mục nào.</div> :
                    categories?.map((cat: any) => (
                        <div key={cat.id || cat._id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-100 dark:border-slate-700 group hover:border-primary-300 transition-all">
                            {editingId === (cat.id || cat._id) ? (
                                <div className="flex w-full gap-2">
                                    <input 
                                        autoFocus
                                        className="flex-1 px-2 py-1 border rounded text-sm"
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleUpdate()}
                                    />
                                    <button onClick={handleUpdate} className="text-green-600 p-1 hover:bg-green-50 rounded"><FiSave /></button>
                                    <button onClick={() => setEditingId(null)} className="text-slate-500 p-1 hover:bg-slate-100 rounded"><FiX /></button>
                                </div>
                            ) : (
                                <>
                                    <span className="font-medium text-slate-700 dark:text-slate-200">{cat.name}</span>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => startEdit(cat)} className="text-blue-500 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded"><FiEdit2 size={14} /></button>
                                        <button onClick={() => handleDelete(cat.id || cat._id)} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded"><FiTrash2 size={14} /></button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer - Add New */}
                <form onSubmit={handleAdd} className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <div className="flex gap-2">
                        <input 
                            className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="Nhập tên danh mục mới..."
                            value={newCatName}
                            onChange={e => setNewCatName(e.target.value)}
                        />
                        <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-1 font-medium text-sm">
                            <FiPlus /> Thêm
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryManagerModal;