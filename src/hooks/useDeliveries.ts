import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

export const useDeliveries = (page = 1, search = '', status = '') => {
  return useQuery({
    queryKey: ['deliveries', page, search, status], // Thêm page vào key để trigger refetch khi đổi trang
    queryFn: () => {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '10', // Số lượng bản ghi mỗi trang
            search,
            status: status === 'Tất cả' ? '' : status
        });
        return api(`/api/deliveries?${params.toString()}`);
    },
    placeholderData: (previousData) => previousData, // Giữ dữ liệu cũ khi đang tải trang mới (UX mượt hơn)
  });
};

export const useUpdateDeliveryStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, driverName }: { id: string, status: string, driverName?: string }) => 
        api(`/api/deliveries/${id}/status`, { 
            method: 'PUT', 
            body: JSON.stringify({ status, driverName }) 
        }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    },
  });
};

export const useDeleteDelivery = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => api(`/api/deliveries/${id}`, { method: 'DELETE' }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      },
    });
};