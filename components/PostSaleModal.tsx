import React, { useMemo } from 'react'; // Sửa đổi: Đã import useMemo
import { useAppContext } from '../context/DataContext';
import { FiPrinter, FiCheckCircle } from 'react-icons/fi';

const PostSaleModal: React.FC = () => {
    // Sửa đổi: Lấy thêm các hàm context cần thiết
    const {
        postSaleInvoiceId,
        invoices,
        cashFlowTransactions, // <-- Thêm
        setPostSaleInvoiceId,
        setPrintingInvoiceId, // <-- Thêm
        setPrintingVoucherId, // <-- Thêm
    } = useAppContext();

    const invoice = useMemo(() => invoices.find(inv => inv.id === postSaleInvoiceId), [invoices, postSaleInvoiceId]);

    // Sửa đổi: Thêm logic tìm phiếu thu liên quan
    const relatedVoucher = useMemo(() => {
        if (!invoice) return null;
        // Tìm phiếu thu được tạo tự động từ server
        return cashFlowTransactions.find(t => 
            t.type === 'thu' && 
            t.description &&
            t.description.includes(invoice.invoiceNumber)
        );
    }, [cashFlowTransactions, invoice]);
    
    // Sửa đổi: Xóa các state cũ (paymentAmount, updateDebt, error)
    
    if (!invoice) return null;

    // Sửa đổi: Viết lại các hàm xử lý nút bấm
    const handlePrintInvoice = () => {
        setPrintingInvoiceId(invoice.id);
        setPostSaleInvoiceId(null); // Đóng modal này
    };

    const handlePrintVoucher = () => {
        if (relatedVoucher) {
            setPrintingVoucherId(relatedVoucher.id);
            setPostSaleInvoiceId(null); // Đóng modal này
        } else {
            alert("Không tìm thấy phiếu thu liên quan.");
        }
    };
    
    const handleClose = () => {
        setPostSaleInvoiceId(null);
    };

    return (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg"> {/* Đã sửa max-w-2xl thành max-w-lg */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 text-center">
                    <FiCheckCircle className="w-12 h-12 mx-auto text-primary-500" />
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mt-3">Tạo Hóa đơn Thành công!</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Hóa đơn <span className="font-semibold text-primary-600">{invoice.invoiceNumber}</span> đã được tạo.</p>
                </div>

                <div className="p-6 space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Khách hàng:</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{invoice.customerName}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                            <span className="text-slate-700 dark:text-slate-300">Tổng cộng:</span>
                            <span className="text-slate-800 dark:text-slate-200">{invoice.totalAmount.toLocaleString('vi-VN')} đ</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                            <span className="text-slate-600 dark:text-slate-400">Đã thanh toán:</span>
                            <span className="font-medium text-green-600">{invoice.paidAmount.toLocaleString('vi-VN')} đ</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                            <span className="text-slate-600 dark:text-slate-400">Còn nợ:</span>
                            <span className="font-medium text-red-600">{(invoice.totalAmount - invoice.paidAmount).toLocaleString('vi-VN')} đ</span>
                        </div>
                    </div>
                </div>

                {/* Sửa đổi: Khối nút bấm đã được viết lại hoàn toàn */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl flex flex-col sm:flex-row justify-end gap-3">
                    <button type="button" onClick={handleClose} className="px-4 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 hover:border-slate-400 transition-colors duration-200 font-medium text-sm">
                        Đóng
                    </button>
                    
                    {/* Chỉ hiện nút "In Phiếu Thu" nếu có thanh toán */}
                    {relatedVoucher && invoice.paidAmount > 0 && (
                        <button type="button" onClick={handlePrintVoucher} className="flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md font-semibold transition-all">
                            <FiPrinter className="w-4 h-4" />
                            In Phiếu Thu
                        </button>
                    )}

                    <button type="button" onClick={handlePrintInvoice} className="flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-md font-semibold transition-all">
                        <FiPrinter className="w-4 h-4" />
                        In Hóa Đơn
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PostSaleModal;