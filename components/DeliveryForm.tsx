
import React, { useState, useEffect, useMemo } from 'react';
import type { Delivery, Invoice } from '../types';
import { useAppContext } from '../context/DataContext';

const DeliveryForm: React.FC = () => {
    const { 
        editingDelivery, 
        invoices,
        handleSaveDelivery, 
        setEditingDelivery,
        invoiceIdForNewDelivery,
        setInvoiceIdForNewDelivery
    } = useAppContext();

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

    const availableInvoices = useMemo(() => {
        return invoices.filter(inv => !inv.deliveryId || (delivery && inv.id === delivery.invoiceId));
    }, [invoices, delivery]);
    
    const selectedInvoice = useMemo(() => {
        return invoices.find(inv => inv.id === formData.invoiceId);
    }, [invoices, formData.invoiceId]);

    useEffect(() => {
        if (delivery) {
            const { id, deliveryNumber, ...data } = delivery;
            setFormData(data);
        } else if (invoiceIdForNewDelivery) {
            setFormData(prev => ({ ...prev, invoiceId: invoiceIdForNewDelivery }));
            setInvoiceIdForNewDelivery(null); // Clear after use
        }
    }, [delivery, invoiceIdForNewDelivery, setInvoiceIdForNewDelivery]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.invoiceId) {
            alert("Vui lòng chọn một hóa đơn.");
            return;
        }

        const invoice = invoices.find(inv => inv.id === formData.invoiceId);
        const customer = useAppContext().customers.find(c => c.id === invoice?.customerId);
        if (!invoice || !customer) {
            alert("Không tìm thấy thông tin hóa đơn hoặc khách hàng.");
            return;
        }

        const deliveryToSave: Delivery = {
            id: delivery?.id || '',
            deliveryNumber: delivery?.deliveryNumber || '',
            ...formData,
            customerId: customer.id,
            customerName: customer.name,
            customerAddress: customer.address,
            customerPhone: customer.phone,
        };
        handleSaveDelivery(deliveryToSave);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">{delivery ? 'Chỉnh sửa Phiếu Giao hàng' : 'Tạo Phiếu Giao hàng'}</h1>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Thông tin chung</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Hóa đơn gốc</label>
                        <select 
                            name="invoiceId"
                            value={formData.invoiceId} 
                            onChange={handleChange} 
                            required
                            className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 sm:text-sm"
                        >
                            <option value="" disabled>-- Chọn hóa đơn --</option>
                            {availableInvoices.map(inv => (
                                <option key={inv.id} value={inv.id}>
                                    {inv.invoiceNumber} - {inv.customerName}
                                </option>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ngày tạo phiếu</label>
                        <input 
                            type="date" 
                            name="issueDate"
                            value={formData.issueDate}
                            onChange={handleChange}
                            required 
                            className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 sm:text-sm" 
                        />
                    </div>
                </div>
                {selectedInvoice && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-700">
                        <p><strong>Khách hàng:</strong> {selectedInvoice.customerName}</p>
                        <p><strong>Địa chỉ giao:</strong> {useAppContext().customers.find(c=>c.id === selectedInvoice.customerId)?.address}</p>
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200">
                 <h2 className="text-lg font-semibold text-slate-800 mb-4">Chi tiết Giao hàng</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ngày giao dự kiến</label>
                        <input 
                            type="date"
                            name="deliveryDate" 
                            value={formData.deliveryDate}
                            onChange={handleChange}
                            required 
                            className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 sm:text-sm" 
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                         <select 
                            name="status"
                            value={formData.status} 
                            onChange={handleChange} 
                            required
                            className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 sm:text-sm"
                        >
                            <option value="Chờ giao">Chờ giao</option>
                            <option value="Đang giao">Đang giao</option>
                            <option value="Đã giao thành công">Đã giao thành công</option>
                            <option value="Giao thất bại">Giao thất bại</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tên tài xế</label>
                        <input 
                            type="text"
                            name="driverName" 
                            value={formData.driverName}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 sm:text-sm" 
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Biển số xe</label>
                        <input 
                            type="text"
                            name="vehicleNumber"
                            value={formData.vehicleNumber}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 sm:text-sm" 
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={3}
                            className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 sm:text-sm" 
                        ></textarea>
                    </div>
                 </div>
            </div>
            
            <div className="flex justify-end space-x-3">
                 <button type="button" onClick={() => setEditingDelivery(null)} className="px-6 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 hover:border-slate-400 transition-colors duration-200 font-medium text-sm">Hủy</button>
                 <button type="submit" className="px-6 py-2 text-white rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-px font-medium text-sm">{delivery ? 'Cập nhật' : 'Lưu'}</button>
            </div>
        </form>
    );
};

export default DeliveryForm;