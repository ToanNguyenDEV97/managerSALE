import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';

// 1. Lấy danh sách Nhà cung cấp
export const useSuppliers = (page: number = 1, limit: number = 1000) => {
    return useQuery({
        queryKey: ['suppliers', page, limit],
        queryFn: () => api(`/api/suppliers?page=${page}&limit=${limit}`),
        keepPreviousData: true,
    } as any);
};

// 2. Lấy chi tiết 1 Nhà cung cấp
export const useSupplier = (id: string) => {
    return useQuery({
        queryKey: ['supplier', id],
        queryFn: () => api(`/api/suppliers/${id}`),
        enabled: !!id,
    });
};

// 3. Tạo mới (Quan trọng: Hàm này đang thiếu dẫn đến lỗi)
export const useCreateSupplier = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => {
            return api('/api/suppliers', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['suppliers'] as any);
        },
    });
};

// 4. Cập nhật
export const useUpdateSupplier = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => {
            return api(`/api/suppliers/${data.id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['suppliers'] as any);
        },
    });
};

// 5. Xóa
export const useDeleteSupplier = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => {
            return api(`/api/suppliers/${id}`, {
                method: 'DELETE',
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['suppliers'] as any);
        },
    });
};