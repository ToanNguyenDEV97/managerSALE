vimport React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { FiPlus, FiTrash2, FiEdit, FiFolder, FiAlertTriangle, FiX, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';

// --- 1. MODAL BÁO LỖI (ALERT) ---
// Chỉ hiện khi xóa thất bại (VD: Có sản phẩm)
const AlertModal = ({ isOpen, onClose, title, message }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative animate-bounce-short">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><FiX size={24}/></button>
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                        <FiAlertTriangle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
                    <p className="text-slate-600 mb-6 font-medium">{message}</p>
                    <button onClick={onClose} className="bg-slate-800 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-slate-900 w-full transition-colors">
                        Đã hiểu, đóng lại
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- TRANG QUẢN LÝ ---
const CategoriesPage: React.FC = () => {
    const queryClient = useQueryClient();
    
    // State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [editingCat, setEditingCat] = useState<any>(null);
    const [errorModal, setErrorModal] = useState<{ open: boolean, msg: string }>({ open: false, msg: '' });

    // API Lấy danh mục
    const { data: categoriesData, isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: () => api('/api/categories'),
    });
    const categories = Array.isArray(categoriesData?.data) ? categoriesData.data : [];

    // API Xóa
    const deleteMutation = useMutation({
        mutationFn: (id: string) => api(`/api/categories/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Đã xóa danh mục');
        },
        onError: (err: any) => {
            // Khi lỗi -> Bật Modal Báo Lỗi lên
            setErrorModal({ 
                open: true, 
                msg: err.message || 'Lỗi khi xóa danh mục.' 
            });
        }
    });

    // API Tạo/Sửa
    const saveMutation = useMutation({
        mutationFn: (data: any) => {
            if (data._id) return api(`/api/categories/${data._id}`, { method: 'PUT', body: JSON.stringify({ name: data.name }) });
            return api('/api/categories', { method: 'POST', body: JSON.stringify(data) });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setIsCreateOpen(false);
            setEditingCat(null);
            setNewCatName('');
            toast.success('Lưu thành công');
        }
    });

    // Hàm xử lý khi bấm nút Xóa
    const handleDeleteClick = (id: string) => {
        // GỌI HÀM XÓA NGAY LẬP TỨC (Bỏ qua bước hỏi xác nhận)
        deleteMutation.mutate(id);
    };

    return (
        <div className="p-6 animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Quản lý Danh mục</h2>
                <button 
                    onClick={() => { setIsCreateOpen(true); setEditingCat(null); setNewCatName(''); }}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary-700 shadow-lg shadow-blue-500/30"
                >
                    <FiPlus /> Thêm mới
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {isLoading ? <div className="col-span-3 text-center py-10"><FiLoader className="animate-spin inline mr-2"/>Đang tải...</div> : categories.map((cat: any) => (
                    <div key={cat._id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center hover:border-blue-400 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-50 text-blue-600 p-2 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <FiFolder size={20}/>
                            </div>
                            <span className="font-bold text-slate-700">{cat.name}</span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingCat(cat); setNewCatName(cat.name); setIsCreateOpen(true); }} className="p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors"><FiEdit/></button>
                            
                            {/* Nút Xóa: Bấm là xóa ngay */}
                            <button 
                                onClick={() => handleDeleteClick(cat._id)} 
                                disabled={deleteMutation.isPending}
                                className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
                            >
                                {deleteMutation.isPending ? <FiLoader className="animate-spin"/> : <FiTrash2/>}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL NHẬP LIỆU */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-96 transform scale-100">
                        <h3 className="font-bold text-lg mb-4 text-slate-800">{editingCat ? 'Sửa tên danh mục' : 'Thêm danh mục mới'}</h3>
                        <input 
                            className="w-full border border-slate-300 p-3 rounded-lg mb-4 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" 
                            placeholder="Nhập tên danh mục..." 
                            value={newCatName} onChange={(e) => setNewCatName(e.target.value)} 
                            autoFocus
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Hủy bỏ</button>
                            <button onClick={() => saveMutation.mutate({ _id: editingCat?._id, name: newCatName })} className="px-4 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 shadow-md">
                                {saveMutation.isPending ? 'Đang lưu...' : 'Lưu lại'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL BÁO LỖI (ALERT) - Hiện lên khi Server từ chối xóa */}
            <AlertModal 
                isOpen={errorModal.open}
                onClose={() => setErrorModal({ ...errorModal, open: false })}
                title="Không thể xóa!"
                message={errorModal.msg}
            />
        </div>
    );
};

export default CategoriesPage;