import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

// 1. Hook Lấy danh sách (Có tìm kiếm + Lọc ngày)
export const useInvoices = (page = 1, status = 'all', search = '', startDate = '', endDate = '') => {
  return useQuery({
    queryKey: ['invoices', page, status, search, startDate, endDate],
    queryFn: () => {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '10',
            status: status,
            search: search,
            startDate: startDate,
            endDate: endDate
        });
        return api(`/api/invoices?${params.toString()}`);
    },
    placeholderData: (previousData) => previousData,
  });
};

// 2. Hook Lấy TẤT CẢ hóa đơn (Cho dropdown chọn đơn)
export const useAllInvoices = () => {
  return useQuery({
    queryKey: ['invoices', 'all'],
    queryFn: () => api('/api/invoices?limit=1000'), 
  });
};

// 3. Hook Lưu/Tạo Hóa đơn (Cho POS)
export const useSaveInvoice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => {
            if (data.id || data._id) {
                const id = data.id || data._id;
                return api(`/api/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) });
            } else {
                return api('/api/invoices', { method: 'POST', body: JSON.stringify(data) });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['products'] }); 
            queryClient.invalidateQueries({ queryKey: ['customers'] }); 
            queryClient.invalidateQueries({ queryKey: ['cashflow'] }); 
            toast.success('Lưu đơn hàng thành công! ✅');
        },
        onError: (err: any) => toast.error(err.message),
    });
};

// 4. Hook Xóa hóa đơn
export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/invoices/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow'] });
      toast.success('Đã hủy hóa đơn thành công! 🗑️');
    },
    onError: (err: any) => toast.error(err.message),
  });
};

// 5. Hook Trả hàng
export const useReturnInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => 
        api(`/api/invoices/${id}/return`, { 
            method: 'POST',
            body: JSON.stringify({ reason }) 
        }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); 
      queryClient.invalidateQueries({ queryKey: ['customers'] }); 
      queryClient.invalidateQueries({ queryKey: ['cashflow'] });
      toast.success('Đã xử lý trả hàng thành công! ↩️');
    },
    onError: (err: any) => toast.error(err.message),
  });
};

// 6. Hook Thanh toán nợ (QUAN TRỌNG: Bạn đang thiếu cái này)
export const usePayInvoice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, amount }: { id: string; amount: number }) => 
            api(`/api/invoices/${id}/payment`, { 
                method: 'POST', 
                body: JSON.stringify({ amount }) 
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['cashflow'] });
            toast.success('Đã thu nợ thành công! 💰');
        },
        onError: (err: any) => toast.error(err.message),
    });
};

// 7. Hook Lấy lịch sử thanh toán của hóa đơn
export const useInvoiceHistory = (invoiceNumber: string | undefined) => {
  return useQuery({
    queryKey: ['invoice-history', invoiceNumber],
    queryFn: async () => {
        if (!invoiceNumber) return [];
        const res: any = await api(`/api/invoices/${invoiceNumber}/history`);
        
        // SỬA LỖI Ở ĐÂY: Trả về mảng lịch sử thực sự
        return res.data || res; 
    },
    enabled: !!invoiceNumber 
  });
};