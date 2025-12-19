import React, { useState } from 'react';
import { FiFileText, FiArrowRight, FiCheckCircle, FiLoader, FiX } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { useWorkflow } from '../hooks/useWorkflow'; // Import Hook vừa tạo
import Pagination from '../components/Pagination';

const OrdersPage: React.FC = () => {
    const [page, setPage] = useState(1);
    
    // State cho Modal chuyển đổi
    const [convertingOrder, setConvertingOrder] = useState<any>(null);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);

    // Lấy dữ liệu Đơn hàng
    const { data: ordersData, isLoading } = useQuery({
        queryKey: ['orders', page],
        queryFn: () => api(`/api/orders?page=${page}&limit=10`),
    });
    
    const { orderToInvoice } = useWorkflow();

    const orders = ordersData?.data || [];
    const totalPages = ordersData?.totalPages || 1;

    // Xử lý khi bấm nút "Xuất HĐ"
    const handleOpenConvertModal = (order: any) => {
        setConvertingOrder(order);
        setPaymentAmount(0); // Mặc định là 0 hoặc order.totalAmount tùy bạn
    };

    // Gọi API chuyển đổi
    const handleConfirmConvert = async () => {
        if (!convertingOrder) return;
        await orderToInvoice.mutateAsync({
            orderId: convertingOrder.id,
            paymentAmount: paymentAmount
        });
        setConvertingOrder(null); // Đóng modal
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FiFileText className="text-primary-600"/> Quản lý Đơn hàng
                </h2>
                {/* Nút thêm mới đơn hàng thủ công nếu cần */}
            </div>

            {/* Bảng danh sách */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {isLoading ? <div className="p-10 text-center"><FiLoader className="animate-spin inline w-8 h-8 text-primary-600"/></div> : (
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mã đơn</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Khách hàng</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Tổng tiền</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Trạng thái</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {orders.map((order: any) => (
                                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-6 py-4 font-medium dark:text-white">{order.orderNumber}</td>
                                    <td className="px-6 py-4 dark:text-slate-300">{order.customerName}</td>
                                    <td className="px-6 py-4 text-right font-bold text-primary-600">
                                        {order.totalAmount?.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                            ${order.status === 'Hoàn thành' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {/* Chỉ hiện nút chuyển đổi nếu đơn chưa hoàn thành */}
                                        {order.status !== 'Hoàn thành' && (
                                            <button 
                                                onClick={() => handleOpenConvertModal(order)}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors shadow-sm"
                                                title="Chuyển thành Hóa đơn & Trừ kho"
                                            >
                                                <FiArrowRight /> Xuất HĐ
                                            </button>
                                        )}
                                        {order.status === 'Hoàn thành' && (
                                            <span className="text-green-600 flex items-center justify-end gap-1 text-sm"><FiCheckCircle/> Đã xong</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {!isLoading && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={0} itemsPerPage={10} />}
            </div>

            {/* MODAL: Xác nhận chuyển đổi & Thanh toán */}
            {convertingOrder && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex justify-center items-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold dark:text-white">Xuất hóa đơn từ {convertingOrder.orderNumber}</h3>
                            <button onClick={() => setConvertingOrder(null)}><FiX className="w-6 h-6 text-slate-400"/></button>
                        </div>
                        
                        <div className="space-y-4">
                            <p className="text-slate-600 dark:text-slate-300 text-sm">
                                Hành động này sẽ <b>trừ tồn kho</b> các sản phẩm trong đơn hàng và tạo một hóa đơn mới.
                            </p>
                            
                            <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                <div className="flex justify-between text-sm mb-2 dark:text-slate-300">
                                    <span>Tổng tiền đơn hàng:</span>
                                    <span className="font-bold">{convertingOrder.totalAmount?.toLocaleString()}</span>
                                </div>
                                
                                <label className="block text-sm font-medium mb-1 dark:text-white">Khách trả ngay (VNĐ):</label>
                                <input 
                                    type="number" 
                                    className="w-full px-3 py-2 border rounded-lg font-bold text-green-600 focus:ring-2 focus:ring-green-500 dark:bg-slate-800"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                    placeholder="Nhập số tiền khách trả..."
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    {paymentAmount >= convertingOrder.totalAmount 
                                        ? 'Trạng thái: Đã thanh toán' 
                                        : (paymentAmount > 0 ? 'Trạng thái: Thanh toán 1 phần (Còn nợ)' : 'Trạng thái: Ghi nợ toàn bộ')}
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button 
                                    onClick={() => setConvertingOrder(null)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                    Hủy bỏ
                                </button>
                                <button 
                                    onClick={handleConfirmConvert}
                                    disabled={orderToInvoice.isPending}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                                >
                                    {orderToInvoice.isPending ? <FiLoader className="animate-spin"/> : <FiCheckCircle />} 
                                    Xác nhận Xuất kho
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersPage;