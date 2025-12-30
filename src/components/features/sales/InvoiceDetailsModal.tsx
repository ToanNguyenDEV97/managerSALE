import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { 
    FiX, FiPrinter, FiList, FiClock, FiUser, FiCalendar, 
    FiCreditCard, FiFileText, FiMapPin, FiPhone, FiPackage 
} from 'react-icons/fi';

interface Props {
    invoiceId: string | null;
    onClose: () => void;
    onPrint: (id: string) => void;
}

const InvoiceDetailsModal: React.FC<Props> = ({ invoiceId, onClose, onPrint }) => {
    const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

    // 1. Lấy thông tin HÓA ĐƠN
    const { data: invoice, isLoading } = useQuery({
        queryKey: ['invoice', invoiceId],
        queryFn: async () => {
            if (!invoiceId) return null;
            const res: any = await api(`/api/invoices/${invoiceId}`);
            return res.data ? res.data : res;
        },
        enabled: !!invoiceId,
    });

    // 2. [MỚI] Lấy thông tin chi tiết KHÁCH HÀNG (để hiện SĐT, Địa chỉ)
    const { data: customer } = useQuery({
        queryKey: ['customer', invoice?.customerId],
        queryFn: async () => {
            // Nếu hóa đơn không có ID khách hoặc là khách lẻ thì bỏ qua
            if (!invoice?.customerId) return null;
            try {
                const res: any = await api(`/api/customers/${invoice.customerId}`);
                return res.data ? res.data : res;
            } catch (e) {
                return null; // Không tìm thấy khách thì thôi
            }
        },
        enabled: !!invoice?.customerId, // Chỉ chạy khi đã lấy được thông tin hóa đơn
    });

    // 3. Lấy lịch sử thanh toán
    const { data: history } = useQuery({
        queryKey: ['invoice-history', invoice?.invoiceNumber],
        queryFn: async () => {
            if (!invoice?.invoiceNumber) return [];
            const res: any = await api(`/api/invoices/${invoice.invoiceNumber}/history`);
            return res.data ? res.data : res;
        },
        enabled: !!invoice?.invoiceNumber 
    });

    if (!invoiceId) return null;

    // Badge trạng thái
    const renderStatusBadge = (status: string) => {
        let styles = "bg-slate-100 text-slate-600 ring-slate-200";
        let dotColor = "bg-slate-400";

        if (status === 'Đã thanh toán') {
            styles = "bg-emerald-50 text-emerald-700 ring-emerald-200";
            dotColor = "bg-emerald-500";
        } else if (status === 'Chưa thanh toán') {
            styles = "bg-rose-50 text-rose-700 ring-rose-200";
            dotColor = "bg-rose-500";
        } else if (status === 'Thanh toán một phần') {
            styles = "bg-amber-50 text-amber-700 ring-amber-200";
            dotColor = "bg-amber-500";
        } else if (status === 'Đã hoàn trả') {
            styles = "bg-indigo-50 text-indigo-700 ring-indigo-200";
            dotColor = "bg-indigo-500";
        }

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${styles}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                {status}
            </span>
        );
    };

    // [LOGIC MỚI] Ưu tiên lấy thông tin từ bảng Customer mới fetch về
    // Nếu không có (ví dụ khách lẻ) thì lấy từ hóa đơn, hoặc hiện mặc định
    const displayPhone = customer?.phone || invoice?.customerPhone || '---';
    const displayAddress = customer?.address || invoice?.address || 'Tại quầy';
    const displayName = customer?.name || invoice?.customerName || 'Khách lẻ';

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            ></div>

            <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in transform transition-all">
                
                {/* HEADER */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-slate-100 bg-white z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                                {isLoading ? 'Đang tải...' : (invoice ? `Hóa đơn ${invoice.invoiceNumber}` : 'Chi tiết')}
                            </h2>
                            {!isLoading && invoice && renderStatusBadge(invoice.status)}
                        </div>
                        <p className="text-sm text-slate-500 flex items-center gap-2">
                            <FiClock className="text-slate-400"/> 
                            Tạo ngày {invoice ? new Date(invoice.issueDate || invoice.createdAt).toLocaleDateString('vi-VN', {year: 'numeric', month: 'long', day: 'numeric'}) : '...'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 mt-4 sm:mt-0">
                        {invoice && (
                            <button 
                                onClick={() => onPrint(invoiceId)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900 transition-all text-sm font-medium shadow-sm"
                            >
                                <FiPrinter size={16}/> In hóa đơn
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-rose-100 hover:text-rose-600 transition-colors">
                            <FiX size={20}/>
                        </button>
                    </div>
                </div>

                {/* TABS */}
                {!isLoading && invoice && (
                    <div className="px-6 border-b border-slate-100 flex gap-8 bg-slate-50/50">
                        <button 
                            onClick={() => setActiveTab('details')}
                            className={`py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${activeTab === 'details' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            <FiList size={16}/> Chi tiết đơn hàng
                        </button>
                        <button 
                            onClick={() => setActiveTab('history')}
                            className={`py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${activeTab === 'history' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            <FiClock size={16}/> Lịch sử thanh toán
                        </button>
                    </div>
                )}

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : !invoice ? (
                        <div className="text-center py-20 text-slate-400">Không có dữ liệu</div>
                    ) : (
                        <>
                            {activeTab === 'details' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Card Khách Hàng (Đã sửa để hiện đúng thông tin) */}
                                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/60 hover:border-blue-300 transition-colors group">
                                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-50">
                                                <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    <FiUser size={18} />
                                                </div>
                                                <h4 className="font-semibold text-slate-800">Thông tin Khách hàng</h4>
                                            </div>
                                            <div className="space-y-3 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Tên khách:</span>
                                                    <span className="font-medium text-slate-900">{displayName}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 flex items-center gap-1"><FiPhone size={14}/> SĐT:</span>
                                                    <span className="font-medium text-slate-900">{displayPhone}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 flex items-center gap-1"><FiMapPin size={14}/> Địa chỉ:</span>
                                                    <span className="font-medium text-slate-900 max-w-[200px] text-right truncate" title={displayAddress}>
                                                        {displayAddress}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Thông Tin Đơn */}
                                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/60 hover:border-purple-300 transition-colors group">
                                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-50">
                                                <div className="bg-purple-100 text-purple-600 p-1.5 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                                    <FiFileText size={18} />
                                                </div>
                                                <h4 className="font-semibold text-slate-800">Thông tin bổ sung</h4>
                                            </div>
                                            <div className="space-y-3 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 flex items-center gap-1"><FiUser size={14}/> Người bán:</span>
                                                    <span className="font-medium text-slate-900">Admin</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 flex items-center gap-1"><FiCreditCard size={14}/> Hình thức:</span>
                                                    <span className="font-medium text-slate-900 capitalize">Tiền mặt / Chuyển khoản</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Ghi chú:</span>
                                                    <span className="font-medium text-slate-700 italic">{invoice.note || 'Không có'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bảng sản phẩm */}
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50/80 border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider text-xs w-12 text-center">#</th>
                                                        <th className="px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider text-xs">Sản phẩm</th>
                                                        <th className="px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider text-xs text-center">SL</th>
                                                        <th className="px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider text-xs text-right">Đơn giá</th>
                                                        <th className="px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider text-xs text-right">Tổng</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {invoice.items?.map((item: any, idx: number) => (
                                                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                                            <td className="px-5 py-4 text-center text-slate-400">{idx + 1}</td>
                                                            <td className="px-5 py-4">
                                                                <div className="font-medium text-slate-900 flex items-center gap-2">
                                                                    <FiPackage className="text-slate-300"/> {item.name}
                                                                </div>
                                                                {item.sku && <div className="text-xs text-slate-400 mt-0.5 ml-6">{item.sku}</div>}
                                                            </td>
                                                            <td className="px-5 py-4 text-center">
                                                                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold">{item.quantity}</span>
                                                            </td>
                                                            <td className="px-5 py-4 text-right text-slate-600">{item.price?.toLocaleString()}</td>
                                                            <td className="px-5 py-4 text-right font-bold text-slate-800">
                                                                {((item.price || 0) * (item.quantity || 0)).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        
                                        <div className="bg-slate-50/80 border-t border-slate-200 p-5 flex flex-col items-end gap-2">
                                            <div className="flex justify-between w-full max-w-xs text-sm">
                                                <span className="text-slate-500">Tổng tiền hàng:</span>
                                                <span className="font-semibold text-slate-800">{invoice.totalAmount?.toLocaleString()} đ</span>
                                            </div>
                                            <div className="flex justify-between w-full max-w-xs text-sm">
                                                <span className="text-slate-500">Chiết khấu:</span>
                                                <span className="font-semibold text-slate-800">0 đ</span>
                                            </div>
                                            <div className="w-full max-w-xs border-t border-slate-200 my-1"></div>
                                            
                                            <div className="flex justify-between w-full max-w-xs items-center">
                                                <span className="font-bold text-slate-700 text-lg">Khách phải trả:</span>
                                                <span className="font-bold text-blue-600 text-2xl">{invoice.totalAmount?.toLocaleString()} đ</span>
                                            </div>

                                            <div className="w-full max-w-xs bg-white p-3 rounded-lg border border-slate-200 mt-2 space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-600">Đã thanh toán:</span>
                                                    <span className="font-bold text-emerald-600">{invoice.paidAmount?.toLocaleString()} đ</span>
                                                </div>
                                                {(invoice.totalAmount - (invoice.paidAmount || 0)) > 0 && (
                                                    <div className="flex justify-between text-sm pt-2 border-t border-dashed border-slate-200">
                                                        <span className="text-rose-600 font-medium">Còn nợ:</span>
                                                        <span className="font-bold text-rose-600">{(invoice.totalAmount - (invoice.paidAmount || 0)).toLocaleString()} đ</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div className="space-y-4">
                                    {!history || history.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                                            <FiClock size={40} className="mb-3 opacity-20"/>
                                            <p>Chưa có lịch sử giao dịch nào.</p>
                                        </div>
                                    ) : (
                                        <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 py-2">
                                            {history.map((h: any, i: number) => (
                                                <div key={i} className="relative pl-8">
                                                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${h.type === 'thu' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-start hover:shadow-md transition-shadow">
                                                        <div>
                                                            <p className={`font-bold text-sm mb-1 ${h.type === 'thu' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                                {h.type === 'thu' ? 'THU TIỀN KHÁCH HÀNG' : 'HOÀN TIỀN / TRẢ HÀNG'}
                                                            </p>
                                                            <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                                                                <FiCalendar size={12}/> {new Date(h.createdAt).toLocaleString('vi-VN')}
                                                            </p>
                                                            <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 inline-block">
                                                                {h.description || 'Không có nội dung'}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className={`block text-lg font-bold ${h.type === 'thu' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                {h.type === 'thu' ? '+' : '-'}{h.amount?.toLocaleString()} đ
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetailsModal;