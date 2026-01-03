import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';

// 1. Hook lấy danh sách khách hàng có phân trang & tìm kiếm (Dùng cho trang Quản lý)
export const useCustomers = (page: number, limit: number, search: string) => {
    return useQuery({
        queryKey: ['customers', page, limit, search], 
        queryFn: async () => {
            const endpoint = `/api/customers?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
            return await api(endpoint);
        },
        staleTime: 5000, 
        retry: 1, 
    });
};

// 2. [MỚI THÊM] Hook lấy TẤT CẢ khách hàng (Dùng cho Dropdown ở trang Bán Hàng)
export const useAllCustomers = () => {
    return useQuery({
        queryKey: ['all-customers'],
        queryFn: async () => {
            // Gọi API lấy số lượng lớn (hoặc API riêng nếu backend có)
            // Tạm thời lấy 1000 khách hàng để đổ vào dropdown
            return await api('/api/customers?page=1&limit=1000');
        },
        staleTime: 10 * 60 * 1000, // Cache lâu hơn (10 phút) vì danh sách này ít thay đổi
    });
};

// 3. Hook tạo khách hàng
export const useCreateCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api('/api/customers', { method: 'POST', body: JSON.stringify(data) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] }); // Làm mới list quản lý
            queryClient.invalidateQueries({ queryKey: ['all-customers'] }); // Làm mới dropdown bán hàng
        }
    });
};

// 4. Hook cập nhật khách hàng
export const useUpdateCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) => 
            api(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['all-customers'] });
        }
    });
};

// 5. Hook xóa khách hàng
export const useDeleteCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api(`/api/customers/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['all-customers'] });
        }
    });
};