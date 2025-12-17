import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

export const useOrders = (page = 1) => {
  return useQuery({
    queryKey: ['orders', page],
    queryFn: () => api(`/api/orders?page=${page}&limit=10`),
  });
};

export const useSaveOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (order: any) => {
      if (order.id) return api(`/api/orders/${order.id}`, { method: 'PUT', body: JSON.stringify(order) });
      return api('/api/orders', { method: 'POST', body: JSON.stringify(order) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Lưu đơn hàng thành công!');
    },
    onError: (err: any) => toast.error(err.message),
  });
};

export const useDeleteOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => api(`/api/orders/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            toast.success('Đã xóa đơn hàng');
        }
    });
};