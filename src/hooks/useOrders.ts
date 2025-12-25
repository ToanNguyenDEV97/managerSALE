import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

// 1. Lấy danh sách Đơn hàng (Đã nâng cấp để hỗ trợ lọc ngày)
export const useOrders = (
    page: number, 
    search: string, 
    status: string, 
    startDate?: string, // [MỚI] Thêm tham số ngày bắt đầu
    endDate?: string    // [MỚI] Thêm tham số ngày kết thúc
) => {
  return useQuery({
    // [QUAN TRỌNG] Thêm startDate, endDate vào key để khi chọn ngày nó tự động tải lại dữ liệu
    queryKey: ['orders', page, search, status, startDate, endDate],
    queryFn: () => {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '10',
            search,
            status: status !== 'all' ? status : ''
        });
        
        // [MỚI] Nếu có chọn ngày thì gửi lên Server
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        return api(`/api/orders?${params.toString()}`);
    },
  });
};

// 2. Tạo Đơn hàng mới
export const useSaveOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => {
            if (data.id || data._id) {
                return api(`/api/orders/${data.id || data._id}`, { method: 'PUT', body: JSON.stringify(data) });
            } else {
                return api('/api/orders', { method: 'POST', body: JSON.stringify(data) });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            toast.success('Lưu đơn hàng thành công!');
        },
        onError: (err: any) => toast.error(err.message),
    });
};

// 3. Chuyển Đơn hàng thành Hóa đơn (Xuất kho)
export const useConvertToInvoice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, paymentAmount }: { id: string, paymentAmount: number }) => 
            api(`/api/orders/${id}/to-invoice`, { 
                method: 'POST',
                body: JSON.stringify({ paymentAmount }) 
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['invoices'] }); // Cập nhật cả trang hóa đơn
            queryClient.invalidateQueries({ queryKey: ['products'] }); // Cập nhật kho
            // Toast đã được xử lý ở component gọi, hoặc có thể để ở đây
            // toast.success('Đã xuất kho và tạo hóa đơn thành công!');
        },
        onError: (err: any) => toast.error('Lỗi: ' + err.message),
    });
};

// 4. Xóa Đơn hàng
export const useDeleteOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api(`/api/orders/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            toast.success('Đã xóa đơn hàng');
        },
    });
};