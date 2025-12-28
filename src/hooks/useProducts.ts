import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';

// --- PRODUCT HOOKS ---

export const useProducts = (page: number = 1, limit: number = 10, search: string = '') => {
    return useQuery({
        queryKey: ['products', page, limit, search],
        queryFn: () => api(`/api/products?page=${page}&limit=${limit}&search=${search}`),
        keepPreviousData: true,
    } as any);
};

export const useAllProducts = () => {
    return useQuery({
        queryKey: ['products', 'all'],
        queryFn: () => api(`/api/products?page=1&limit=10000`),
    } as any);
};

export const useProduct = (id: string) => {
    return useQuery({
        queryKey: ['product', id],
        queryFn: () => api(`/api/products/${id}`),
        enabled: !!id,
    });
};

export const useCreateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api('/api/products', { method: 'POST', body: JSON.stringify(data) }),
        onSuccess: () => queryClient.invalidateQueries(['products'] as any),
    });
};

export const useUpdateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api(`/api/products/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }),
        onSuccess: () => queryClient.invalidateQueries(['products'] as any),
    });
};

export const useDeleteProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api(`/api/products/${id}`, { method: 'DELETE' }),
        onSuccess: () => queryClient.invalidateQueries(['products'] as any),
    });
};

// --- CATEGORY HOOKS (MỚI CẬP NHẬT) ---

// 1. Lấy danh sách danh mục từ Server
export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await api('/api/categories?limit=100'); // Lấy tối đa 100 danh mục
            return res.data || []; // API trả về { data: [], ... }
        }
    } as any);
};

// 2. Tạo danh mục mới
export const useCreateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (name: string) => api('/api/categories', { method: 'POST', body: JSON.stringify({ name }) }),
        onSuccess: () => queryClient.invalidateQueries(['categories'] as any),
    });
};

// 3. Sửa danh mục (Backend sẽ tự cập nhật tên danh mục trong các Sản phẩm liên quan)
export const useUpdateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, name }: { id: string, name: string }) => 
            api(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
        onSuccess: () => {
            queryClient.invalidateQueries(['categories'] as any);
            queryClient.invalidateQueries(['products'] as any); // Reload cả sản phẩm vì tên danh mục thay đổi
        },
    });
};

// 4. Xóa danh mục (Sẽ báo lỗi nếu còn sản phẩm)
export const useDeleteCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api(`/api/categories/${id}`, { method: 'DELETE' }),
        onSuccess: () => queryClient.invalidateQueries(['categories'] as any),
    });
};

// --- STOCK HISTORY HOOK ---
export const useStockHistory = (productId: string) => {
    return useQuery({
        queryKey: ['stock-history', productId],
        queryFn: () => api(`/api/products/history/:id${productId}`),
        enabled: !!productId, // Chỉ gọi khi có ID sản phẩm
    } as any);
};