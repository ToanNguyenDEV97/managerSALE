import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import type { Quote } from '../types';
import toast from 'react-hot-toast';

export const useQuotes = (page = 1) => {
  return useQuery({
    queryKey: ['quotes', page],
    queryFn: () => api(`/api/quotes?page=${page}&limit=100`), // Lấy nhiều để in ấn tìm cho dễ
  });
};

export const useSaveQuote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (quote: any) => {
      if (quote.id) return api(`/api/quotes/${quote.id}`, { method: 'PUT', body: JSON.stringify(quote) });
      return api('/api/quotes', { method: 'POST', body: JSON.stringify(quote) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Lưu báo giá thành công!');
    },
    onError: (err: any) => toast.error(err.message),
  });
};

export const useDeleteQuote = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => api(`/api/quotes/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            toast.success('Đã xóa báo giá');
        }
    });
};