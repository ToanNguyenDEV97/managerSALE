import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';

// 1. Lấy danh sách sản phẩm
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

// 5. Lấy lịch sử tồn kho
export const useProductStockHistory = (productId: string | null, page = 1) => {
    return useQuery({
        queryKey: ['product-history', productId, page],
        queryFn: () => api(`/api/products/${productId}/stock-history?page=${page}&limit=10`),
        enabled: !!productId, // Chỉ chạy khi có productId
    });
};

// --- CÁC HÀM BẠN ĐANG THIẾU ---

// 6. Lấy danh sách Danh mục (Sửa để trả về mảng an toàn)
export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res: any = await api('/api/categories');
            // Kiểm tra: Nếu server trả về {data: [...]}, lấy .data. Nếu là mảng thì lấy luôn.
            return Array.isArray(res) ? res : (res?.data || []);
        },
        staleTime: 1000 * 60 * 10,
    });
};

// 7. Tạo Danh mục
export const useCreateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api('/api/categories', { method: 'POST', body: JSON.stringify(data) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        }
    });
};

// 8. Cập nhật Danh mục
export const useUpdateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) => 
            api(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        }
    });
};

// 9. Xóa Danh mục
export const useDeleteCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api(`/api/categories/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        }
    });
};

// 10. Lấy tất cả sản phẩm (Cho báo cáo)
export const useAllProducts = () => {
    return useQuery({
        queryKey: ['products', 'all'],
        queryFn: async () => await api('/api/products?limit=2000'), 
        staleTime: 1000 * 60 * 5, 
    });
};