import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api'; // Đảm bảo đường dẫn đúng tới file api.ts của bạn
import type { Purchase } from '../types'; // Đảm bảo bạn đã định nghĩa type Purchase

// 1. Hook lấy danh sách Phiếu nhập (Phân trang)
export const usePurchases = (page: number = 1, limit: number = 10) => {
    return useQuery({
        queryKey: ['purchases', page, limit],
        queryFn: () => api(`/api/purchases?page=${page}&limit=${limit}`),
        keepPreviousData: true,
    } as any);
};

// 2. Hook Lấy chi tiết 1 Phiếu nhập
export const usePurchase = (id: string) => {
    return useQuery({
        queryKey: ['purchase', id],
        queryFn: () => api(`/api/purchases/${id}`),
        enabled: !!id,
    });
};

// 3. Hook Tạo Phiếu nhập mới
// (Backend sẽ tự xử lý: Sinh mã PN, Tăng kho, Cộng nợ NCC)
export const useCreatePurchase = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newPurchase: Partial<Purchase>) => {
            return api('/api/purchases', {
                method: 'POST',
                body: JSON.stringify(newPurchase),
            });
        },
        onSuccess: () => {
            // Refresh lại danh sách phiếu nhập
            queryClient.invalidateQueries(['purchases'] as any);
            // Refresh lại danh sách sản phẩm (vì kho vừa tăng)
            queryClient.invalidateQueries(['products'] as any);
            // Refresh lại danh sách NCC (vì nợ vừa tăng)
            queryClient.invalidateQueries(['suppliers'] as any);
        },
    });
};

// 4. Hook Xóa Phiếu nhập
// (Backend sẽ tự xử lý: Trừ lại kho, Trừ lại nợ NCC)
export const useDeletePurchase = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => {
            return api(`/api/purchases/${id}`, {
                method: 'DELETE',
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['purchases'] as any);
            queryClient.invalidateQueries(['products'] as any);
            queryClient.invalidateQueries(['suppliers'] as any);
        },
    });
};