import React, { useState, useEffect, useMemo } from 'react';
import type { Delivery } from '../types';
import { useAppContext } from '../context/DataContext';
import { useSaveDelivery } from '../hooks/useDeliveries'; 
import { useAllInvoices } from '../hooks/useInvoices'; // Cần Hook này từ useInvoices.ts
import { FiLoader, FiSave } from 'react-icons/fi';

const DeliveryForm: React.FC = () => {
    const { editingDelivery, setEditingDelivery, invoiceIdForNewDelivery, setInvoiceIdForNewDelivery } = useAppContext();

    const saveMutation = useSaveDelivery();
    const { data: invoicesData, isLoading: isLoadingInvoices } = useAllInvoices(); // Lấy hóa đơn để chọn
    const invoices = Array.isArray(invoicesData) ? invoicesData : (invoicesData?.data || []);

    const delivery = editingDelivery === 'new' ? null : editingDelivery;

    const [formData, setFormData] = useState<Omit<Delivery, 'id' | 'deliveryNumber' | 'customerId' | 'customerName' | 'customerAddress' | 'customerPhone'>>({
        invoiceId: '',
        issueDate: new Date().toISOString().split('T')[0],
        deliveryDate: new Date().toISOString().split('T')[0],
        driverName: '',
        vehicleNumber: '',
        status: 'Chờ giao',
        notes: '',
    });

    // Lọc hóa đơn: Chỉ hiện hóa đơn chưa giao HOẶC hóa đơn đang được sửa
    const availableInvoices = useMemo(() => {
        return invoices.filter((inv: any) => 
            !inv.deliveryId || (delivery && inv.id === delivery.invoiceId) || (invoiceIdForNewDelivery && inv.id === invoiceIdForNewDelivery)
        );
    }, [invoices, delivery, invoiceIdForNewDelivery]);
    
    const selectedInvoice = useMemo(() => invoices.find((inv: any) => inv.id === formData.invoiceId), [invoices, formData.invoiceId]);

    useEffect(() => {
        if (delivery) {
            const { id, deliveryNumber, customerId, customerName, customerAddress, customerPhone, ...rest } = delivery;
            setFormData(rest);
        } else {
            setFormData(prev => ({
                ...prev,
                invoiceId: invoiceIdForNewDelivery || '',
                issueDate: new Date().toISOString().split('T')[0],
                deliveryDate: new Date().toISOString().split('T')[0],
            }));
        }
    }, [delivery, invoiceIdForNewDelivery]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.invoiceId || !selectedInvoice) return alert("Vui lòng chọn hóa đơn hợp lệ");

        const deliveryData = {
            ...formData,
            id: delivery?.id,
            customerId: selectedInvoice.customerId,
            customerName: selectedInvoice.customerName,
            customerAddress: selectedInvoice.customerAddress || 'Đang cập nhật', 
            customerPhone: selectedInvoice.customerPhone || 'Đang cập nhật'
        };

        try {
            await saveMutation.mutateAsync(deliveryData);
            handleClose();
        } catch (error) {
            console.error(error);
        }
    };

    const handleClose = () => {
        setEditingDelivery(null);
        setInvoiceIdForNewDelivery(null);
    }

    return (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {delivery ? 'Cập nhật Phiếu Giao Hàng' : 'Tạo Phiếu Giao Hàng Mới'}
                    </h3>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Chọn Hóa đơn cần giao <span className="text-red-500">*</span>
                            </label>
                            {isLoadingInvoices ? (
                                <div className="text-sm text-slate-500">Đang tải danh sách hóa đơn...</div>
                            ) : (
                                <select 
                                    name="invoiceId" 
                                    value={formData.invoiceId} 
                                    onChange={handleChange} 
                                    required 
                                    disabled={!!delivery}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                >
                                    <option value="">-- Chọn hóa đơn --</option>
                                    {availableInvoices.map((inv: any) => (
                                        <option key={inv.id} value={inv.id}>
                                            {inv.invoiceNumber} - {inv.customerName} ({new Date(inv.issueDate).toLocaleDateString('vi-VN')})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {selectedInvoice && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 text-sm">
                                <p><span className="font-semibold">Khách hàng:</span> {selectedInvoice.customerName}</p>
                                <p><span className="font-semibold">Địa chỉ:</span> {selectedInvoice.customerAddress || '---'}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tài xế / Người giao</label>
                                <input type="text" name="driverName" value={formData.driverName} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white" placeholder="Tên tài xế..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Biển số xe / SĐT</label>
                                <input type="text" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white" placeholder="Biển số xe..." />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ghi chú</label>
                            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white" placeholder="Ghi chú thêm..."></textarea>
                        </div>
                    </div>
                    
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3">
                        <button type="button" onClick={handleClose} className="px-4 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600">Hủy</button>
                        <button 
                            type="submit" 
                            disabled={saveMutation.isPending}
                            className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-md font-medium disabled:opacity-50"
                        >
                            {saveMutation.isPending ? <FiLoader className="animate-spin" /> : <FiSave />}
                            {delivery ? 'Cập nhật' : 'Tạo phiếu giao'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeliveryForm;