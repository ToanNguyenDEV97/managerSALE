import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

export const useCashFlow = (page = 1, filter = 'all') => {
  return useQuery({
    queryKey: ['cashflow', page, filter],
    queryFn: () => api(`/api/cashflow-transactions?page=${page}&limit=10`), // API cần hỗ trợ filter nếu muốn
  });
};

// Hook lấy tất cả
export const useAllCashFlow = () => {
    return useQuery({
        queryKey: ['cashflow', 'all'],
        queryFn: () => api('/api/cashflow-transactions?limit=1000'),
    });
};

export const useSaveTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => api('/api/cashflow-transactions', { method: 'POST', body: JSON.stringify(data) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cashflow'] });
            toast.success('Đã lưu giao dịch');
        }
    });
};

export const useDeleteTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => api(`/api/cashflow-transactions/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cashflow'] });
            toast.success('Đã xóa giao dịch');
        }
    });
};