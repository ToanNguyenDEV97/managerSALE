import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';

export const useOrders = (page: number, limit: number, search: string) => {
    return useQuery({
        queryKey: ['orders', page, limit, search],
        queryFn: async () => await api(`/api/orders?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`),
        staleTime: 5000,
    });
};

export const useOrder = (id: string) => {
    return useQuery({
        queryKey: ['order', id],
        queryFn: async () => await api(`/api/orders/${id}`),
        enabled: !!id
    });
};

export const useCreateOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api('/api/orders', { method: 'POST', body: JSON.stringify(data) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['products'] }); // Cập nhật lại kho sau khi bán
            queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Cập nhật báo cáo
        }
    });
};

export const useUpdateOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) => 
            api(`/api/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] })
    });
};