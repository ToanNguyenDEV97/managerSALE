import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../utils/api'; 
import { readMoneyToText } from '../../utils/currency';
import { useAppContext } from '../../context/DataContext'; 
import { FiX, FiPrinter, FiLoader, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

interface Props {
    invoiceId: string;
    onClose: () => void;
}

// --- THUẬT TOÁN ĐỌC SỐ TIỀN THÀNH CHỮ TIẾNG VIỆT ---
const MANG_SO = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const MANG_HANG = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

function docBaSo(tr: number, ch: number, dv: number) {
    let ketQua = '';
    
    // Đọc hàng trăm
    if (tr === undefined) return ''; 
    ketQua += MANG_SO[tr] + ' trăm';

    // Đọc hàng chục và đơn vị
    if (ch === 0 && dv === 0) return ketQua; // Ví dụ: 100 -> một trăm
    
    if (ch === 0 && dv !== 0) {
        ketQua += ' linh ' + MANG_SO[dv]; // Ví dụ: 105 -> một trăm linh năm
        return ketQua;
    }

    if (ch === 1) {
        ketQua += ' mười'; // Ví dụ: 115 -> một trăm mười lăm
        if (dv === 1) ketQua += ' một';
        else if (dv === 5) ketQua += ' lăm';
        else if (dv !== 0) ketQua += ' ' + MANG_SO[dv];
        return ketQua;
    }

    // Hàng chục > 1
    ketQua += ' ' + MANG_SO[ch] + ' mươi';
    if (dv === 1) ketQua += ' mốt';
    else if (dv === 5) ketQua += ' lăm';
    else if (dv !== 0) ketQua += ' ' + MANG_SO[dv];

    return ketQua;
}

const docSoThanhChu = (so: number): string => {
    if (!so || so === 0) return 'Không đồng';
    
    // Xử lý số âm
    let prefix = "";
    if (so < 0) {
        so = Math.abs(so);
        prefix = "Âm ";
    }

    let str = so.toString();
    // Padding số 0 vào đầu cho đủ nhóm 3
    while (str.length % 3 !== 0) str = '0' + str;

    const groups = str.match(/.{1,3}/g);
    if (!groups) return 'Không đồng';

    let ketQua = '';
    const totalGroups = groups.length;

    for (let i = 0; i < totalGroups; i++) {
        const groupStr = groups[i];
        const tr = parseInt(groupStr[0]);
        const ch = parseInt(groupStr[1]);
        const dv = parseInt(groupStr[2]);

        // Bỏ qua nhóm 000 nếu không phải nhóm cuối cùng (trừ trường hợp số 0)
        if (tr === 0 && ch === 0 && dv === 0) continue;

        let strDoc = docBaSo(tr, ch, dv);

        // Xử lý trường hợp đặc biệt: không đọc "không trăm" ở nhóm đầu tiên
        if (i === 0 && totalGroups > 1 && tr === 0) {
             if (strDoc.startsWith('không trăm linh ')) strDoc = strDoc.replace('không trăm linh ', '');
             else if (strDoc.startsWith('không trăm ')) strDoc = strDoc.replace('không trăm ', '');
        }

        ketQua += ' ' + strDoc + ' ' + MANG_HANG[totalGroups - 1 - i];
    }

    // Chuẩn hóa chuỗi
    ketQua = ketQua.trim().replace(/\s+/g, ' ');
    
    // Viết hoa chữ cái đầu
    const final = prefix + ketQua.charAt(0).toUpperCase() + ketQua.slice(1);
    return final + ' đồng';
};
// -----------------------------------------------------

const PrintInvoiceModal: React.FC<Props> = ({ invoiceId, onClose }) => {
    const { settings } = useAppContext(); 
    
    // 1. Lấy thông tin CÔNG TY (Mới thêm)
    const { data: company } = useQuery({
        queryKey: ['organization'],
        queryFn: async () => {
            try {
                // Gọi API lấy thông tin công ty từ Database
                const res: any = await api('/api/organization');
                return res; 
            } catch (e) { return null; }
        },
        staleTime: 1000 * 60 * 5 // Cache 5 phút
    });
    
    // 2. Lấy thông tin HÓA ĐƠN
    const { data: invoice, isLoading, error } = useQuery({
        queryKey: ['invoice', invoiceId],
        queryFn: async () => {
            const res: any = await api(`/api/invoices/${invoiceId}`);
            return res.data ? res.data : res;
        },
        enabled: !!invoiceId,
        retry: 1
    });

    // 3. Lấy thông tin KHÁCH HÀNG (Logic thông minh)
    const { data: customerById } = useQuery({
        queryKey: ['customer', invoice?.customerId],
        queryFn: async () => {
            if (!invoice?.customerId) return null;
            try {
                const res: any = await api(`/api/customers/${invoice.customerId}`);
                return res.data ? res.data : res;
            } catch (e) { return null; }
        },
        enabled: !!invoice?.customerId,
    });

    const { data: allCustomers } = useQuery({
        queryKey: ['customers', 'all'],
        queryFn: async () => {
             if (invoice?.customerId) return null; 
             const res: any = await api('/api/customers');
             return res.data ? res.data : res;
        },
        enabled: !!invoice && !invoice.customerId 
    });

    // 4. TÍNH TOÁN DỮ LIỆU CUỐI CÙNG
    const finalCustomer = useMemo(() => {
        if (customerById) return customerById;
        if (allCustomers && Array.isArray(allCustomers) && invoice?.customerName) {
            const cleanName = (name: string) => name?.toLowerCase().trim() || '';
            const targetName = cleanName(invoice.customerName);
            const found = allCustomers.find((c: any) => cleanName(c.name) === targetName);
            if (found) return found;
        }
        return null;
    }, [customerById, allCustomers, invoice]);


    if (isLoading) return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 text-white font-bold gap-2">
            <FiLoader className="animate-spin"/> Đang tạo hóa đơn...
        </div>
    );
    
    if (error || !invoice) return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 text-white p-4">
            <p className="text-xl mb-2">⚠️ Không tìm thấy hóa đơn!</p>
            <button onClick={onClose} className="bg-red-600 px-4 py-2 rounded">Đóng</button>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm print:bg-white print:p-0 print:block overflow-hidden">
            
            {/* --- PREVIEW --- */}
            <div className="absolute inset-0 flex flex-col items-center justify-center print:hidden p-4">
                {(() => {
                    const debt = (invoice.totalAmount || 0) - (invoice.paidAmount || 0);
                    return (
                        <div className={`px-6 py-2 rounded-full font-bold mb-4 flex items-center gap-2 shadow-lg animate-bounce-short ${
                            debt > 0 ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                        }`}>
                            <FiCheckCircle size={20} /> 
                            {debt > 0 ? 'Đơn hàng ghi nợ' : 'Đơn hàng đã thanh toán'}
                        </div>
                    );
                })()}

                <div className="flex flex-col md:flex-row gap-6 h-[85vh] w-full max-w-6xl">
                    <div className="flex-1 bg-slate-200 rounded-xl shadow-2xl overflow-y-auto custom-scrollbar p-4 flex justify-center">
                        <div className="bg-white shadow-lg min-h-[297mm] w-[210mm] origin-top scale-75 md:scale-90 lg:scale-100 transition-transform">
                            {/* [QUAN TRỌNG] Truyền prop company vào component con */}
                            <InvoiceA4Content invoice={invoice} customer={finalCustomer} company={company} settings={settings} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 justify-center min-w-[200px]">
                        <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-5 rounded-xl font-bold flex flex-col items-center gap-2 shadow-xl hover:shadow-2xl transition-transform hover:-translate-y-1">
                            <FiPrinter size={40} /> <span className="text-lg">IN HÓA ĐƠN</span>
                        </button>
                        <button onClick={onClose} className="bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-300 px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2">
                            <FiX size={24} /> <span>Đóng lại</span>
                        </button>
                        
                        <div className="bg-white/90 p-4 rounded-lg text-sm text-slate-500 shadow-sm mt-4 border border-slate-200">
                            <p className="font-bold border-b pb-1 mb-2">Trạng thái dữ liệu:</p>
                            <p className="flex justify-between"><span>Tên trên HĐ:</span> <b className="text-slate-800">{invoice.customerName}</b></p>
                            <p className="flex justify-between items-center mt-1">
                                <span>Liên kết:</span> 
                                {finalCustomer ? <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-0.5 rounded">Đã tìm thấy ✓</span> : <span className="text-orange-500 font-bold text-xs bg-orange-50 px-2 py-0.5 rounded flex items-center gap-1"><FiAlertTriangle/> Chưa thấy</span>}
                            </p>
                            <p className="flex justify-between items-center mt-1">
                                <span>Thông tin Công ty:</span> 
                                {company ? <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-0.5 rounded">Đã lấy ✓</span> : <span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-0.5 rounded">Chưa có</span>}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- PRINT CONTENT --- */}
            <div className="hidden print:block w-full h-full bg-white text-black p-0 m-0">
                <InvoiceA4Content invoice={invoice} customer={finalCustomer} company={company} settings={settings} />
            </div>
        </div>
    );
};

// COMPONENT NỘI DUNG A4
// [QUAN TRỌNG] Thêm prop company vào đây
const InvoiceA4Content = ({ invoice, customer, company, settings }: { invoice: any, customer: any, company: any, settings: any }) => {
    const debt = (invoice.totalAmount || 0) - (invoice.paidAmount || 0);

    const displayName = customer?.name || invoice.customerName || 'Khách lẻ';
    const displayPhone = customer?.phone || invoice.customerPhone || '...';
    const displayAddress = customer?.address || invoice.customerAddress || '...'; 

    return (
        <div className="p-[10mm] font-sans text-sm h-full relative leading-relaxed">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b-2 border-slate-800 pb-6">
                <div className="w-[65%]">
                    {/* Hiển thị Tên Công Ty To Rõ */}
                    <h2 className="font-bold text-lg text-slate-800 uppercase mb-1">
                        {company?.name || "TÊN CỬA HÀNG (Cần cài đặt)"}
                    </h2>
                    {/* Thông tin liên hệ */}
                    <div className="text-xs text-slate-500 leading-relaxed">
                        <p><strong>Địa chỉ:</strong> {company?.address || "Chưa cập nhật địa chỉ"}</p>
                        <p><strong>Hotline:</strong> {company?.phone || "..."}</p>
                        {company?.email && <p><strong>Email:</strong> {company.email}</p>}
                        {company?.taxCode && <p><strong>MST:</strong> {company.taxCode}</p>}
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold text-red-600 uppercase tracking-wide">HÓA ĐƠN</h2>
                    <h3 className="text-lg font-bold text-slate-800 uppercase">BÁN HÀNG</h3>
                    <div className="mt-2 text-sm text-slate-600">
                        <p>Số: <b className="text-black text-base">{invoice.invoiceNumber}</b></p>
                        <p>Ngày: {new Date(invoice.issueDate || invoice.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                </div>
            </div>

            {/* Customer Info */}
            <div className="mb-6">
                <table className="w-full">
                    <tbody>
                        <tr>
                            <td className="w-24 font-bold text-slate-700 align-top pb-1">Khách hàng:</td>
                            <td className="uppercase font-semibold pb-1">{displayName}</td>
                        </tr>
                        <tr>
                            <td className="w-24 font-bold text-slate-700 align-top pb-1">Điện thoại:</td>
                            <td className="pb-1">{displayPhone}</td>
                        </tr>
                        <tr>
                            <td className="w-24 font-bold text-slate-700 align-top pb-1">Địa chỉ:</td>
                            <td className="pb-1">{displayAddress}</td>
                        </tr>
                        <tr>
                            <td className="w-24 font-bold text-slate-700 align-top">Ghi chú:</td>
                            <td className="italic text-slate-500">{invoice.note || 'Không có'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Products Table */}
            <table className="w-full border-collapse border border-slate-300 mb-6">
                <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold uppercase text-xs">
                        <th className="border border-slate-300 py-2 px-2 w-10 text-center">STT</th>
                        <th className="border border-slate-300 py-2 px-2 text-left">Tên hàng hóa / Dịch vụ</th>
                        <th className="border border-slate-300 py-2 px-2 w-16 text-center">ĐVT</th>
                        <th className="border border-slate-300 py-2 px-2 w-16 text-center">SL</th>
                        <th className="border border-slate-300 py-2 px-2 w-28 text-right">Đơn giá</th>
                        <th className="border border-slate-300 py-2 px-2 w-32 text-right">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.items?.map((item: any, index: number) => (
                        <tr key={index} className="text-sm">
                            <td className="border border-slate-300 py-2 px-2 text-center">{index + 1}</td>
                            <td className="border border-slate-300 py-2 px-2 font-medium">{item.name}</td>
                            <td className="border border-slate-300 py-2 px-2 text-center">{item.unit || 'Cái'}</td>
                            <td className="border border-slate-300 py-2 px-2 text-center font-bold">{item.quantity}</td>
                            <td className="border border-slate-300 py-2 px-2 text-right">{item.price?.toLocaleString()}</td>
                            <td className="border border-slate-300 py-2 px-2 text-right font-bold">{ ((item.price || 0) * (item.quantity || 0)).toLocaleString() }</td>
                        </tr>
                    ))}
                    
                    {/* Totals */}
                    <tr className="font-bold text-slate-800 bg-slate-50">
                        <td colSpan={5} className="border border-slate-300 py-2 px-4 text-right uppercase text-xs">Tổng tiền hàng:</td>
                        <td className="border border-slate-300 py-2 px-2 text-right text-base">{invoice.totalAmount?.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td colSpan={5} className="border border-slate-300 py-2 px-4 text-right font-bold text-slate-600 text-xs">Đã thanh toán:</td>
                        <td className="border border-slate-300 py-2 px-2 text-right font-bold text-green-600">{invoice.paidAmount?.toLocaleString()}</td>
                    </tr>
                    {debt > 0 && (
                        <tr>
                            <td colSpan={5} className="border border-slate-300 py-2 px-4 text-right font-bold text-slate-600 text-xs">Còn nợ:</td>
                            <td className="border border-slate-300 py-2 px-2 text-right font-bold text-red-600">{debt.toLocaleString()}</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Footer Text */}
            <p className="font-bold">Bằng chữ: <span className="italic font-normal text-slate-800">
                {readMoneyToText(invoice.totalAmount)}
            </span>.</p>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-10 mt-6 text-center break-inside-avoid">
                <div>
                    <p className="font-bold uppercase text-sm mb-16">Người mua hàng</p>
                    <p className="font-bold">{displayName !== 'Khách lẻ' ? displayName : ''}</p>
                </div>
                <div>
                    <p className="font-bold uppercase text-sm mb-16">Người bán hàng</p>
                </div>
            </div>
            
            {/* Footer Bank Info */}
            <div className="text-center text-xs text-slate-400 mt-12 italic border-t pt-2 w-full">
                {company?.bankAccount ? 
                    `TK: ${company.bankAccount} - ${company.bankName || ''} - Chủ TK: ${company.bankOwner || ''}` : 
                    "(Cần kiểm tra đối chiếu khi lập, giao, nhận hóa đơn)"
                }
            </div>
        </div>
    );
};

export default PrintInvoiceModal;