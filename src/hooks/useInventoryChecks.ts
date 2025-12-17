import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import type { InventoryCheck } from '../types';
import toast from 'react-hot-toast';

export const useInventoryChecks = (page = 1) => {
  return useQuery({
    queryKey: ['inventoryChecks', page],
    queryFn: () => api(`/api/inventory-checks?page=${page}&limit=10`),
  });
};

export const useSaveInventoryCheck = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (check: any) => {
      if (check.id) return api(`/api/inventory-checks/${check.id}`, { method: 'PUT', body: JSON.stringify(check) });
      return api('/api/inventory-checks', { method: 'POST', body: JSON.stringify(check) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryChecks'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Cập nhật lại kho
      queryClient.invalidateQueries({ queryKey: ['cashflow'] }); // Cập nhật sổ quỹ nếu có chênh lệch
      toast.success('Lưu phiếu kiểm kho thành công!');
    },
    onError: (err: any) => toast.error(err.message),
  });
};

export const useDeleteInventoryCheck = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => api(`/api/inventory-checks/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventoryChecks'] });
            toast.success('Đã xóa phiếu kiểm kho');
        },
        onError: (err: any) => toast.error(err.message),
    });
};