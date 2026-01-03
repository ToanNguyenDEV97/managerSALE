import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';

// 1. Lấy danh sách sản phẩm (có lọc & tìm kiếm)
export const useProducts = (page: number, limit: number, search: string, category: string = '') => {
    return useQuery({
        queryKey: ['products', page, limit, search, category],
        queryFn: async () => {
            let url = `/api/products?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
            if (category) url += `&category=${encodeURIComponent(category)}`;
            return await api(url);
        },
        staleTime: 5000,
    });
};

// 2. Tạo sản phẩm
export const useCreateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api('/api/products', { method: 'POST', body: JSON.stringify(data) }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] })
    });
};

// 3. Cập nhật sản phẩm
export const useUpdateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) => 
            api(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] })
    });
};

// 4. Xóa sản phẩm
export const useDeleteProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api(`/api/products/${id}`, { method: 'DELETE' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] })
    });
};

// 5. [MỚI] Lấy lịch sử tồn kho (Thẻ kho)
export const useStockHistory = (productId: string) => {
    return useQuery({
        queryKey: ['stock-history', productId],
        queryFn: async () => await api(`/api/products/${productId}/history`),
        enabled: !!productId // Chỉ gọi khi có ID
    });
};