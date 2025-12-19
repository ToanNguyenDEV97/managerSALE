import React, { useState } from 'react';
import { FiX, FiTrash2, FiPlus, FiLoader } from 'react-icons/fi';
import { useCategories } from '../hooks/useProducts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

interface Props {
    onClose: () => void;
}

const CategoryManager: React.FC<Props> = ({ onClose }) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const { data: categoriesData, isLoading } = useCategories();
    const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data || []);
    
    const queryClient = useQueryClient();

    // API Thêm danh mục
    const addMutation = useMutation({
        mutationFn: (name: string) => api('/api/categories', { method: 'POST', body: JSON.stringify({ name }) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setNewCategoryName('');
            toast.success('Đã thêm danh mục');
        }
    });

    // API Xóa danh mục
    const deleteMutation = useMutation({
        mutationFn: (id: string) => api(`/api/categories/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Đã xóa danh mục');
        },
        onError: (error: any) => {
            // Hiển thị lỗi từ Server (dòng 602 server.js) trả về
            const msg = error.message || 'Không thể xóa danh mục này';
            toast.error(msg);
        }
    });

    const handleAdd = () => {
        if (!newCategoryName.trim()) return;
        addMutation.mutate(newCategoryName);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg dark:text-white">Quản lý Danh mục</h3>
                    <button onClick={onClose}><FiX className="w-6 h-6 text-slate-500" /></button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Form thêm mới */}
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Tên danh mục mới..." 
                            className="flex-1 px-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-white"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <button 
                            onClick={handleAdd}
                            disabled={addMutation.isPending}
                            className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                        >
                            <FiPlus />
                        </button>
                    </div>

                    {/* Danh sách */}
                    <div className="max-h-60 overflow-y-auto border rounded-lg dark:border-slate-700">
                        {isLoading ? <div className="p-4 text-center"><FiLoader className="animate-spin inline"/></div> : (
                            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                                {categories.map((cat: any) => (
                                    <li key={cat.id} className="p-3 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <span className="dark:text-slate-200">{cat.name}</span>
                                        <button 
                                            onClick={() => deleteMutation.mutate(cat.id)}
                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                            title="Xóa"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryManager;