import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import type { Customer } from '../types';
import toast from 'react-hot-toast';

export const useCustomers = (page = 1, search = '', limit = 10) => {
  return useQuery({
    queryKey: ['customers', page, search],
    queryFn: () => api(`/api/customers?page=${page}&limit=${limit}&search=${search}`),
    placeholderData: (previousData) => previousData,
  });
};

// Hook tìm kiếm nhanh (dùng cho dropdown chọn khách)
export const useAllCustomers = () => {
    return useQuery({
      queryKey: ['customers', 'all'],
      queryFn: () => api(`/api/customers?limit=1000`), // Lấy nhiều để search client-side cho nhanh
    });
};

export const useSaveCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (customer: Partial<Customer>) => {
      if (customer.id) {
        return api(`/api/customers/${customer.id}`, { method: 'PUT', body: JSON.stringify(customer) });
      } else {
        return api('/api/customers', { method: 'POST', body: JSON.stringify(customer) });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Lưu khách hàng thành công!');
    },
    onError: (err: any) => toast.error(err.message),
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api(`/api/customers/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Đã xóa khách hàng');
    },
    onError: (err: any) => toast.error(err.message),
  });
};