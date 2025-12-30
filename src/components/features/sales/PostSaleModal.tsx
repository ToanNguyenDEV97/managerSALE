import React, { useMemo } from 'react';
import { useAppContext } from '../context/DataContext';
import { FiPrinter, FiCheckCircle } from 'react-icons/fi';
import { useInvoices } from '../hooks/useInvoices'; // Cần import Hook này
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';

const PostSaleModal: React.FC = () => {
    const { 
        postSaleInvoiceId, 
        setPostSaleInvoiceId, 
        setPrintingInvoiceId, 
        setPrintingVoucherId 
    } = useAppContext();

    // 1. Dùng Hook để lấy data thay vì Context
    const { data: invoicesData } = useInvoices(1);
    const invoices = Array.isArray(invoicesData) ? invoicesData : (invoicesData?.data || []);

    const invoice = useMemo(() => {
        if (!postSaleInvoiceId) return null;
        return invoices.find((inv: any) => inv.id === postSaleInvoiceId);
    }, [invoices, postSaleInvoiceId]);

    // 2. Lấy phiếu thu liên quan
    const { data: transactionsData } = useQuery({
        queryKey: ['cashflow', 'recent'],
        queryFn: () => api('/api/cashflow-transactions?limit=20'),
        enabled: !!invoice
    });
    const transactions = Array.isArray(transactionsData) ? transactionsData : (transactionsData?.data || []);

    const relatedVoucher = useMemo(() => {
        if (!invoice) return null;
        return transactions.find((t: any) => 
            t.description && t.description.includes(invoice.invoiceNumber) && t.type === 'thu'
        );
    }, [transactions, invoice]);

    if (!postSaleInvoiceId) return null;
    if (!invoice) return null; 

    const handleClose = () => {
        setPostSaleInvoiceId(null);
    };

    const handlePrintInvoice = () => {
        setPrintingInvoiceId(invoice.id);
        handleClose();
    };

    const handlePrintVoucher = () => {
        if (relatedVoucher) {
            setPrintingVoucherId(relatedVoucher.id);
            handleClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                    <FiCheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Bán hàng thành công!
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                    Hóa đơn <span className="font-bold text-slate-800 dark:text-slate-200">{invoice.invoiceNumber}</span> đã được lưu.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Khách hàng</p>
                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{invoice.customerName}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Tổng tiền</p>
                        <p className="font-bold text-primary-600">{invoice.totalAmount.toLocaleString()} đ</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <button 
                        onClick={handlePrintInvoice}
                        className="w-full py-3 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold transition-all shadow-md"
                    >
                        <FiPrinter className="w-5 h-5" /> In Hóa Đơn
                    </button>
                    
                    {relatedVoucher && (
                        <button 
                            onClick={handlePrintVoucher}
                            className="w-full py-3 flex items-center justify-center gap-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg font-medium transition-all"
                        >
                            <FiPrinter className="w-5 h-5" /> In Phiếu Thu
                        </button>
                    )}

                    <button 
                        onClick={handleClose}
                        className="w-full py-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 font-medium"
                    >
                        Đóng và Bán tiếp
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PostSaleModal;