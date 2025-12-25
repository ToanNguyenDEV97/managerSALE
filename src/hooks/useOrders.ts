import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

// 1. Lấy danh sách Đơn hàng
export const useOrders = (page = 1, search = '', status = 'all') => {
  return useQuery({
    queryKey: ['orders', page, search, status],
    queryFn: () => {
        // Backend bạn chưa có filter orders chi tiết trong code gửi, 
        // nhưng mình giả định dùng chung logic filter cơ bản
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '10',
            search,
            status: status !== 'all' ? status : ''
        });
        return api(`/api/orders?${params.toString()}`);
    },
  });
};

// 2. Tạo Đơn hàng mới
export const useSaveOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => {
            if (data.id || data._id) {
                return api(`/api/orders/${data.id || data._id}`, { method: 'PUT', body: JSON.stringify(data) });
            } else {
                return api('/api/orders', { method: 'POST', body: JSON.stringify(data) });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            toast.success('Lưu đơn hàng thành công!');
        },
        onError: (err: any) => toast.error(err.message),
    });
};

// 3. [QUAN TRỌNG] Chuyển Đơn hàng thành Hóa đơn (Xuất kho)
// API này gọi endpoint: /api/orders/:id/to-invoice trong server.js của bạn
export const useConvertToInvoice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, paymentAmount }: { id: string, paymentAmount: number }) => 
            api(`/api/orders/${id}/to-invoice`, { 
                method: 'POST',
                body: JSON.stringify({ paymentAmount }) 
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['invoices'] }); // Cập nhật cả trang hóa đơn
            queryClient.invalidateQueries({ queryKey: ['products'] }); // Cập nhật kho
            toast.success('Đã xuất kho và tạo hóa đơn thành công! 🚀');
        },
        onError: (err: any) => toast.error('Lỗi: ' + err.message),
    });
};

// 4. Xóa Đơn hàng
export const useDeleteOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api(`/api/orders/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            toast.success('Đã xóa đơn hàng');
        },
    });
};