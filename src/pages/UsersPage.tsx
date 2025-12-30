import React, { useMemo } from 'react';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import type { User } from '../types';
import { useAppContext } from '../context/DataContext';
import ConfirmationModal from '../components/common/ConfirmationModal';

const UsersPage: React.FC = () => {
    const { users, setEditingUser, handleDeleteUser, currentUser } = useAppContext();
    const [userToDelete, setUserToDelete] = React.useState<User | null>(null);

    const sortedUsers = useMemo(() => {
        return [...users].sort((a, b) => (a.createdAt && b.createdAt) ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : 0);
    }, [users]);
    
    const handleDeleteClick = (user: User) => {
        if (currentUser?.id === user.id) {
            alert("Bạn không thể xóa chính mình.");
            return;
        }
        setUserToDelete(user);
    };

    const handleConfirmDelete = async () => {
        if (userToDelete) {
            await handleDeleteUser(userToDelete.id);
            setUserToDelete(null);
        }
    };
    
    const getRoleText = (role: User['role']) => {
        return role === 'admin' ? 'Quản trị viên' : 'Nhân viên';
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="hidden lg:block">
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-200">Quản lý Người dùng</h1>
                    <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400 mt-1">Quản lý tài khoản và phân quyền.</p>
                </div>
                <button
                    onClick={() => setEditingUser('new')}
                    className="flex items-center justify-center w-full md:w-auto px-4 py-2 text-white rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-px"
                >
                    <FiPlus />
                    <span className="ml-2 font-medium">Thêm Người dùng</span>
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-primary-50 dark:bg-slate-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Vai trò</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Ngày tạo</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800">
                            {sortedUsers.map(user => (
                                <tr key={user.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-600 dark:text-slate-200'}`}>
                                            {getRoleText(user.role)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => setEditingUser(user)} className="text-primary-600 hover:text-primary-800 p-1" title="Sửa">
                                            <FiEdit className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => handleDeleteClick(user)} className="text-red-500 hover:text-red-700 p-1" title="Xóa">
                                            <FiTrash2 className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {userToDelete && (
                <ConfirmationModal
                    isOpen={!!userToDelete}
                    onClose={() => setUserToDelete(null)}
                    onConfirm={handleConfirmDelete}
                    title="Xác nhận Xóa Người dùng"
                >
                    Bạn có chắc chắn muốn xóa người dùng "<strong>{userToDelete.email}</strong>"? Hành động này không thể hoàn tác.
                </ConfirmationModal>
            )}
        </div>
    );
};

export default UsersPage;
