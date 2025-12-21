import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api'; // Hoặc '../api' tùy cấu trúc folder của bạn
import type { Quote } from '../types';

// 1. Hook lấy danh sách Báo giá (Giữ nguyên cái cũ của bạn)
export const useQuotes = (page: number = 1, limit: number = 10) => {
    return useQuery({
        queryKey: ['quotes', page, limit],
        queryFn: () => api(`/api/quotes?page=${page}&limit=${limit}`),
        keepPreviousData: true, // Giúp UX mượt hơn khi chuyển trang
    } as any);
};

// 2. Hook Lấy chi tiết 1 Báo giá (Thêm cho đủ bộ)
export const useQuote = (id: string) => {
    return useQuery({
        queryKey: ['quote', id],
        queryFn: () => api(`/api/quotes/${id}`),
        enabled: !!id,
    });
};

// --- CÁC PHẦN BẠN ĐANG THIẾU ---

// 3. Hook Tạo mới Báo giá
export const useCreateQuote = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newQuote: Partial<Quote>) => {
            return api('/api/quotes', {
                method: 'POST',
                body: JSON.stringify(newQuote),
            });
        },
        onSuccess: () => {
            // Làm mới danh sách sau khi tạo xong
            queryClient.invalidateQueries(['quotes'] as any);
        },
    });
};

// 4. Hook Cập nhật Báo giá
export const useUpdateQuote = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (updatedQuote: Quote) => {
            return api(`/api/quotes/${updatedQuote.id}`, {
                method: 'PUT',
                body: JSON.stringify(updatedQuote),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['quotes'] as any);
        },
    });
};

// 5. Hook Xóa Báo giá (Giữ nguyên cái cũ nếu đã có)
export const useDeleteQuote = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => {
            return api(`/api/quotes/${id}`, {
                method: 'DELETE',
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['quotes'] as any);
        },
    });
};