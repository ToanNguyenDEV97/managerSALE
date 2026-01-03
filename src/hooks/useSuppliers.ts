import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; //
import { api } from '../utils/api'; //

// 1. Hook lấy danh sách NCC (Sử dụng React Query để cache và auto-fetch)
export const useSuppliers = (page: number, limit: number, search: string) => {
    return useQuery({
        queryKey: ['suppliers', page, limit, search],
        queryFn: async () => {
            const endpoint = `/api/suppliers?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
            return await api(endpoint);
        },
        staleTime: 5000, // Giữ data trong 5s không gọi lại
        retry: 1,        // Chỉ thử lại 1 lần nếu lỗi mạng
    });
};

// 2. Hook tạo mới NCC
export const useCreateSupplier = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api('/api/suppliers', { method: 'POST', body: JSON.stringify(data) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] }); // Làm mới danh sách ngay lập tức
        }
    });
};

// 3. Hook cập nhật NCC
export const useUpdateSupplier = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) => 
            api(`/api/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        }
    });
};

// 4. Hook xóa NCC
export const useDeleteSupplier = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api(`/api/suppliers/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        }
    });
};