import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import type { Delivery } from '../types';
import toast from 'react-hot-toast';

// 1. Lấy danh sách phân trang (cho bảng)
export const useDeliveries = (page = 1) => {
  return useQuery({
    queryKey: ['deliveries', page],
    queryFn: () => api(`/api/deliveries?page=${page}&limit=10`),
  });
};

// 2. Lưu phiếu giao hàng (Thêm mới / Cập nhật)
export const useSaveDelivery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (delivery: any) => {
      if (delivery.id) {
        return api(`/api/deliveries/${delivery.id}`, { method: 'PUT', body: JSON.stringify(delivery) });
      } else {
        return api('/api/deliveries', { method: 'POST', body: JSON.stringify(delivery) });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Lưu phiếu giao hàng thành công!');
    },
    onError: (err: any) => toast.error(err.message),
  });
};

// 3. Xóa phiếu giao hàng
export const useDeleteDelivery = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => api(`/api/deliveries/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deliveries'] });
            toast.success('Đã xóa phiếu giao hàng');
        },
        onError: (err: any) => toast.error(err.message),
    });
};