import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

// 1. Lấy danh sách đơn hàng
export const useOrders = (page = 1) => {
  return useQuery({
    queryKey: ['orders', page],
    queryFn: () => api(`/api/orders?page=${page}&limit=10`),
  });
};

// 2. Lấy chi tiết 1 đơn hàng
export const useOrder = (id: string) => {
    return useQuery({
        queryKey: ['order', id],
        queryFn: () => api(`/api/orders/${id}`),
        enabled: !!id
    });
};

// 3. Tạo đơn hàng mới
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api('/api/orders', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Đã tạo đơn đặt hàng thành công! 📄');
    },
    onError: (err: any) => toast.error(err.message),
  });
};

// 4. Cập nhật trạng thái đơn (Duyệt, Giao, Hủy...)
export const useUpdateOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: any }) => 
          api(`/api/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        toast.success('Cập nhật đơn hàng thành công!');
      },
      onError: (err: any) => toast.error(err.message),
    });
};