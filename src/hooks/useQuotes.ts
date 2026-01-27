import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

export const useQuotes = (page = 1, search = '', status = '') => {
    return useQuery({
        queryKey: ['quotes', page, search, status],
        queryFn: () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                search,
                status: status === 'Tất cả' ? '' : status
            });
            return api(`/api/quotes?${params.toString()}`);
        },
        placeholderData: (prev) => prev
    });
};

export const useCreateQuote = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api('/api/quotes', { method: 'POST', body: JSON.stringify(data) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            toast.success('Tạo báo giá thành công');
        },
        onError: (err: any) => toast.error(err.message)
    });
};

export const useUpdateQuote = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => 
            api(`/api/quotes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            toast.success('Cập nhật thành công');
        },
        onError: (err: any) => toast.error(err.message)
    });
};

export const useDeleteQuote = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api(`/api/quotes/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            toast.success('Xóa báo giá thành công');
        },
        onError: (err: any) => toast.error(err.message)
    });
};