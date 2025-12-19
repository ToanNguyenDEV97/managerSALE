import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import { useAppContext } from '../context/DataContext'; // 1. Import Context

export const useWorkflow = () => {
    const queryClient = useQueryClient();
    
    // 2. Thay useNavigate bằng setCurrentPage từ Context
    const { setCurrentPage } = useAppContext(); 

    // 1. Chuyển Báo giá -> Đơn hàng
    const quoteToOrder = useMutation({
        mutationFn: (quoteId: string) => api(`/api/quotes/${quoteId}/to-order`, { method: 'POST' }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            toast.success('Đã tạo Đơn hàng thành công!');
            
            // 3. Chuyển trang bằng cách set State
            setCurrentPage('Orders'); 
        },
        onError: (err: any) => toast.error(err.message || 'Lỗi chuyển đổi')
    });

    // 2. Chuyển Đơn hàng -> Hóa đơn
    const orderToInvoice = useMutation({
        mutationFn: ({ orderId, paymentAmount }: { orderId: string, paymentAmount: number }) => 
            api(`/api/orders/${orderId}/to-invoice`, { 
                method: 'POST', 
                body: JSON.stringify({ paymentAmount }) 
            }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['products'] }); // Cập nhật lại kho
            
            toast.success('Đã xuất Hóa đơn & Trừ kho thành công!');
            
            // 3. Chuyển trang sang Hóa đơn
            setCurrentPage('Invoices'); 
        },
        onError: (err: any) => toast.error(err.message || 'Lỗi chuyển đổi')
    });

    return { quoteToOrder, orderToInvoice };
};