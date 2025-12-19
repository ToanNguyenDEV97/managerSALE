import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import type { Product } from '../types';
import toast from 'react-hot-toast';

export const useProducts = (page = 1, search = '', category = '') => {
  return useQuery({
    queryKey: ['products', page, search, category],
    queryFn: () => api(`/api/products?page=${page}&limit=10&search=${search}&category=${category !== 'all' ? category : ''}`),
    placeholderData: (previousData) => previousData,
  });
};

// Thêm hook này
export const useAllProducts = () => {
    return useQuery({
        queryKey: ['products', 'all'],
        queryFn: () => api('/api/products?limit=2000'), // Lấy nhiều để tính tồn kho
    });
};

// Hook lấy danh mục (để đổ vào dropdown phân loại)
export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: () => api('/api/categories'),
    });
};

export const useSaveProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (product: Product) => {
      if (product.id) {
        return api(`/api/products/${product.id}`, { method: 'PUT', body: JSON.stringify(product) });
      } else {
        return api('/api/products', { method: 'POST', body: JSON.stringify(product) });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Lưu sản phẩm thành công!');
    },
    onError: (err: any) => toast.error(err.message),
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api(`/api/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Đã xóa sản phẩm');
    },
    onError: (err: any) => toast.error(err.message),
  });
};