import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import type { Invoice } from '../types';
import toast from 'react-hot-toast';

// Hook phân trang (cho trang Danh sách)
export const useInvoices = (page = 1, status = 'all') => {
  return useQuery({
    queryKey: ['invoices', page, status],
    queryFn: () => {
        // Nếu cần filter status server-side thì thêm params vào đây
        return api(`/api/invoices?page=${page}&limit=10`);
    },
  });
};

// Hook lấy TẤT CẢ (cho Dashboard & Báo cáo) - Lấy 1000 bản ghi mới nhất
export const useAllInvoices = () => {
    return useQuery({
        queryKey: ['invoices', 'all'],
        queryFn: () => api('/api/invoices?limit=1000'), 
    });
};

export const useSaveInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoiceData: any) => {
       // Endpoint tạo hóa đơn bán hàng (POS)
       return api('/api/sales', { method: 'POST', body: JSON.stringify(invoiceData) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] }); // Update list hóa đơn
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Update tồn kho
      queryClient.invalidateQueries({ queryKey: ['customers'] }); // Update công nợ
      queryClient.invalidateQueries({ queryKey: ['cashflow'] });
      toast.success('Thanh toán thành công!');
    },
    onError: (err: any) => toast.error(err.message),
  });
};