
import React, { useState, useEffect } from 'react';
import { FiEdit, FiTrash2, FiPlus, FiX } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';
import type { Category } from '../types';
import ConfirmationModal from './ConfirmationModal';

interface CategoryManagementModalProps {
    onClose: () => void;
}

const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({ onClose }) => {
    const { categories, handleSaveCategory, handleDeleteCategory } = useAppContext();
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    const [categoryName, setCategoryName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (editingCategory) {
            setCategoryName(editingCategory.name);
        } else {
            setCategoryName('');
        }
    }, [editingCategory]);

    const validate = () => {
        if (!categoryName.trim()) {
            setError('Tên phân loại không được để trống.');
            return false;
        }
        const isDuplicate = categories.some(
            c => c.name.toLowerCase() === categoryName.trim().toLowerCase() && c.id !== editingCategory?.id
        );
        if (isDuplicate) {
            setError('Tên phân loại này đã tồn tại.');
            return false;
        }
        setError('');
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        const categoryToSave: Category = {
            id: editingCategory?.id || '',
            name: categoryName.trim(),
        };
        await handleSaveCategory(categoryToSave);
        setEditingCategory(null);
        setCategoryName('');
    };

    const handleEditClick = (category: Category) => {
        setEditingCategory(category);
    };

    const handleCancelEdit = () => {
        setEditingCategory(null);
        setError('');
    };
    
    const handleDeleteClick = (category: Category) => {
        setCategoryToDelete(category);
    }

    const handleConfirmDelete = async () => {
        if (categoryToDelete) {
            await handleDeleteCategory(categoryToDelete.id);
            setCategoryToDelete(null);
        }
    }

    return (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">Quản lý Phân loại</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-100"><FiX className="w-5 h-5"/></button>
                </div>
                
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <ul className="space-y-2">
                        {categories.map(cat => (
                            <li key={cat.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                                <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                                <div className="space-x-2">
                                    <button onClick={() => handleEditClick(cat)} className="text-primary-600 hover:text-primary-800 p-1"><FiEdit/></button>
                                    <button onClick={() => handleDeleteClick(cat)} className="text-red-500 hover:text-red-700 p-1"><FiTrash2/></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="p-6 bg-slate-50 rounded-b-xl border-t">
                    <form onSubmit={handleSubmit}>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {editingCategory ? `Chỉnh sửa: ${editingCategory.name}` : 'Thêm Phân loại mới'}
                        </label>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={categoryName}
                                onChange={e => setCategoryName(e.target.value)}
                                placeholder="Nhập tên phân loại"
                                className={`flex-grow mt-1 block w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 sm:text-sm ${error ? 'border-red-500 focus:ring-red-300' : 'border-slate-300 focus:ring-primary-300 focus:border-primary-500'}`}
                            />
                            <button type="submit" className="px-4 py-2 text-white rounded-lg bg-primary-600 hover:bg-primary-700 transition-colors">
                                {editingCategory ? 'Cập nhật' : 'Thêm'}
                            </button>
                            {editingCategory && (
                                <button type="button" onClick={handleCancelEdit} className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors">Hủy</button>
                            )}
                        </div>
                        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
                    </form>
                </div>
                {categoryToDelete && (
                    <ConfirmationModal
                        isOpen={!!categoryToDelete}
                        onClose={() => setCategoryToDelete(null)}
                        onConfirm={handleConfirmDelete}
                        title="Xác nhận Xóa Phân loại"
                    >
                        Bạn có chắc chắn muốn xóa phân loại "<strong>{categoryToDelete.name}</strong>"? 
                        Tất cả sản phẩm trong phân loại này sẽ được chuyển thành "Chưa phân loại".
                    </ConfirmationModal>
                )}
            </div>
        </div>
    );
};

export default CategoryManagementModal;
