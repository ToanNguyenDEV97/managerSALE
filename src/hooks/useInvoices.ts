import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

// 1. Hook Lấy danh sách (Có tìm kiếm + Lọc ngày + Phân trang)
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

// 2. Hook Lấy TẤT CẢ hóa đơn (Dùng cho dropdown chọn đơn để giao hàng)
// Lấy giới hạn 1000 đơn mới nhất để tránh nặng máy
export const useAllInvoices = () => {
  return useQuery({
    queryKey: ['invoices', 'all'],
    queryFn: () => api('/api/invoices?limit=1000'), 
  });
};

// 3. Hook Lưu/Tạo/Sửa hóa đơn (Quan trọng cho bán hàng)
export const useSaveInvoice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => {
            // Nếu có ID thì là Sửa (PUT), không có thì là Mới (POST)
            if (data.id || data._id) {
                const id = data.id || data._id;
                return api(`/api/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) });
            } else {
                return api('/api/invoices', { method: 'POST', body: JSON.stringify(data) });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] }); // Làm mới danh sách
            queryClient.invalidateQueries({ queryKey: ['products'] }); // Cập nhật kho
            queryClient.invalidateQueries({ queryKey: ['customers'] }); // Cập nhật nợ
            queryClient.invalidateQueries({ queryKey: ['cashflow'] }); // Cập nhật quỹ
            toast.success('Lưu hóa đơn thành công! ✅');
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

// 5. Hook Trả hàng (Return)
export const useReturnInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/invoices/${id}/return`, { method: 'POST' }),
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

// 6. Hook Thanh toán hóa đơn (MỚI)
export const usePayInvoice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, amount }: { id: string; amount: number }) => 
           api(`/api/invoices/${id}/payment`, { 
                method: 'POST', 
                body: JSON.stringify({ amount }) 
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] }); // Cập nhật lại list hóa đơn
            queryClient.invalidateQueries({ queryKey: ['customers'] }); // Cập nhật lại nợ khách
            queryClient.invalidateQueries({ queryKey: ['cashflow'] }); // Cập nhật lại quỹ tiền
            toast.success('Đã thu nợ thành công! 💰');
        },
        onError: (err: any) => toast.error(err.message),
    });
};