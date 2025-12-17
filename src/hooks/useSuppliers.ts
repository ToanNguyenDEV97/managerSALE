import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import type { Supplier } from '../types';
import toast from 'react-hot-toast';

export const useSuppliers = (page = 1, search = '', limit = 10) => {
  return useQuery({
    queryKey: ['suppliers', page, search],
    queryFn: () => api(`/api/suppliers?page=${page}&limit=${limit}&search=${search}`),
  });
};

// Dùng cho dropdown chọn nhà cung cấp (lấy tất cả)
export const useAllSuppliers = () => {
    return useQuery({
        queryKey: ['suppliers', 'all'],
        queryFn: () => api('/api/suppliers?limit=1000'),
    });
};

export const useSaveSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (supplier: Partial<Supplier>) => {
      if (supplier.id) return api(`/api/suppliers/${supplier.id}`, { method: 'PUT', body: JSON.stringify(supplier) });
      return api('/api/suppliers', { method: 'POST', body: JSON.stringify(supplier) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Lưu nhà cung cấp thành công!');
    },
    onError: (err: any) => toast.error(err.message),
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api(`/api/suppliers/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Đã xóa nhà cung cấp');
    },
    onError: (err: any) => toast.error(err.message),
  });
};