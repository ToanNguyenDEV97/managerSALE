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

export const useConvertToOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        // [SỬA ĐỔI QUAN TRỌNG TẠI ĐÂY]
        // Cũ: /api/quotes/${quoteId}/convert-to-order
        // Mới: /api/orders/convert-quote/${quoteId}
        mutationFn: (quoteId: string) => api(`/api/orders/convert-quote/${quoteId}`, { method: 'POST' }),
        
        onSuccess: () => {
            // Cập nhật lại danh sách Báo giá (để thấy trạng thái mới 'Đã chuyển đổi')
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            
            // Cập nhật lại danh sách Đơn hàng (để thấy đơn hàng mới vừa sinh ra)
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            
            // Lấy Dashboard mới nhất (vì doanh thu/đơn hàng thay đổi)
            queryClient.invalidateQueries({ queryKey: ['dashboard'] }); 
            
            toast.success('Đã chuyển thành Đơn hàng thành công! 🚀');
        },
        onError: (err: any) => toast.error(err.message || 'Lỗi chuyển đổi'),
    });
};