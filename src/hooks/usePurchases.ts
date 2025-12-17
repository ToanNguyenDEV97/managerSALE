import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

export const usePurchases = (page = 1) => {
  return useQuery({
    queryKey: ['purchases', page],
    queryFn: () => api(`/api/purchases?page=${page}&limit=10`),
  });
};

export const useSavePurchase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (purchase: any) => {
      if (purchase.id) return api(`/api/purchases/${purchase.id}`, { method: 'PUT', body: JSON.stringify(purchase) });
      return api('/api/purchases', { method: 'POST', body: JSON.stringify(purchase) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Cập nhật lại kho
      toast.success('Lưu phiếu nhập thành công!');
    },
    onError: (err: any) => toast.error(err.message),
  });
};

export const useDeletePurchase = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => api(`/api/purchases/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Đã xóa phiếu nhập');
        }
    });
};