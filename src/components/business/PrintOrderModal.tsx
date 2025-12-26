import React, { useState, useEffect } from 'react';
import { FiPrinter, FiX, FiLoader } from 'react-icons/fi';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

interface Props {
    orderId: string;
    onClose: () => void;
}

// Hàm đọc số tiền
const readMoney = (number: number) => {
    const VIETNAMESE_NUMBERS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
    const PLACES = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
    if (number === 0) return "Không đồng";
    let s = number.toString();
    let l = s.length;
    let groups = [];
    for (let i = l; i > 0; i -= 3) groups.push(s.substring(Math.max(0, i - 3), i));
    let result = [];
    for (let i = 0; i < groups.length; i++) {
        let group = parseInt(groups[i]);
        if (group === 0) continue;
        let temp = [];
        let tram = Math.floor(group / 100);
        let chuc = Math.floor((group % 100) / 10);
        let donvi = group % 10;
        if (tram > 0 || (i < groups.length - 1)) temp.push(VIETNAMESE_NUMBERS[tram] + " trăm");
        if (chuc === 0 && donvi > 0 && (tram > 0 || i < groups.length - 1)) temp.push("lẻ");
        else if (chuc === 1) temp.push("mười");
        else if (chuc > 1) temp.push(VIETNAMESE_NUMBERS[chuc] + " mươi");
        if (chuc > 0 && donvi === 1) temp.push("mốt");
        else if (chuc > 0 && donvi === 5) temp.push("lăm");
        else if (donvi > 0) temp.push(VIETNAMESE_NUMBERS[donvi]);
        if (temp.length > 0) result.unshift(temp.join(" ") + " " + PLACES[i]);
    }
    let str = result.join(" ").trim();
    return str.charAt(0).toUpperCase() + str.slice(1) + " đồng";
};

const PrintOrderModal: React.FC<Props> = ({ orderId, onClose }) => {
    const [order, setOrder] = useState<any>(null);
    const [customer, setCustomer] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [company, setCompany] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Lấy thông tin công ty
                try {
                    const orgData = await api('/api/organization');
                    setCompany(orgData);
                } catch (e) { console.error("Chưa có thông tin công ty"); }

                // 2. Lấy user hiện tại
                try {
                    const me = await api('/api/auth/me');
                    setCurrentUser(me);
                } catch (e) {}

                // 3. Lấy đơn hàng
                const orderData = await api(`/api/orders/${orderId}`);
                setOrder(orderData);

                // 4. Lấy chi tiết khách hàng
                if (orderData.customerId) {
                    try {
                        const custData = await api(`/api/customers/${orderData.customerId}`);
                        setCustomer(custData);
                    } catch (e) {}
                }
                setLoading(false);
            } catch (error) {
                toast.error('Lỗi tải dữ liệu');
                onClose();
            }
        };
        fetchData();
    }, [orderId, onClose]);

    const handlePrint = () => window.print();

    if (!orderId) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 flex flex-col h-screen animate-fade-in">
            <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center shadow-lg shrink-0 print:hidden z-50">
                <h3 className="font-bold text-lg">Xem trước Phiếu Giao Hàng</h3>
                <div className="flex gap-3">
                    <button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 px-5 py-2 rounded-lg font-bold text-sm"><FiX/> Đóng</button>
                    <button onClick={handlePrint} disabled={loading} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-bold text-sm flex gap-2 items-center"><FiPrinter/> IN PHIẾU</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-600 p-8 custom-scrollbar print:p-0 print:bg-white print:overflow-visible flex justify-center">
                {loading ? <div className="text-white mt-10"><FiLoader className="animate-spin"/> Đang tải...</div> : (
                    <div className="bg-white text-black shadow-2xl print:shadow-none relative print:w-full print:h-auto"
                        style={{ width: '210mm', minHeight: '297mm', padding: '15mm 20mm' }}>
                        
                        {/* HEADER CÔNG TY (Lấy từ DB) */}
                        <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-slate-800">
                            <div className="max-w-[65%]">
                                <h2 className="font-bold text-lg text-slate-800 uppercase mb-1">
                                    {company?.name || "CỬA HÀNG CỦA BẠN"}
                                </h2>
                                <div className="text-xs text-slate-500 leading-relaxed">
                                    <p><strong>Địa chỉ:</strong> {company?.address || "Chưa cập nhật"}</p>
                                    <p><strong>Hotline:</strong> {company?.phone || "..."}</p>
                                    {company?.email && <p><strong>Email:</strong> {company.email}</p>}
                                    {company?.taxCode && <p><strong>MST:</strong> {company.taxCode}</p>}
                                </div>
                            </div>
                            <div className="text-right">
                                <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">PHIẾU GIAO HÀNG</h1>
                                <p className="text-sm text-slate-500 mt-1">Số: <span className="font-mono font-bold text-slate-800">{order.orderNumber}</span></p>
                                <p className="text-sm text-slate-500">Ngày: {new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                            </div>
                        </div>

                        {/* THÔNG TIN KHÁCH */}
                        <div className="mb-6 bg-slate-50 p-4 rounded-md border border-slate-200 print:border-slate-300">
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr><td className="font-bold text-slate-700 w-24 align-top py-1">Khách hàng:</td><td className="text-slate-900 font-bold uppercase py-1">{order.customerName}</td></tr>
                                    {customer && (
                                        <>
                                            <tr><td className="font-bold text-slate-700 align-top py-1">Điện thoại:</td><td className="text-slate-800 py-1">{customer.phone}</td></tr>
                                            <tr><td className="font-bold text-slate-700 align-top py-1">Địa chỉ:</td><td className="text-slate-800 py-1">{customer.address}</td></tr>
                                        </>
                                    )}
                                    <tr><td className="font-bold text-slate-700 align-top py-1">Ghi chú:</td><td className="text-slate-600 italic py-1">{order.note || '...'}</td></tr>
                                </tbody>
                            </table>
                        </div>

                        {/* BẢNG HÀNG */}
                        <div className="mb-4 min-h-[300px]">
                            <table className="w-full text-sm border-collapse border border-slate-300">
                                <thead className="bg-slate-100 print:bg-slate-200 text-slate-800 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="border border-slate-300 px-2 py-2 text-center w-10">STT</th>
                                        <th className="border border-slate-300 px-2 py-2 text-left">Tên hàng hóa</th>
                                        <th className="border border-slate-300 px-2 py-2 text-center w-16">ĐVT</th>
                                        <th className="border border-slate-300 px-2 py-2 text-center w-16">SL</th>
                                        <th className="border border-slate-300 px-2 py-2 text-right w-28">Đơn giá</th>
                                        <th className="border border-slate-300 px-2 py-2 text-right w-32">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items?.map((item: any, idx: number) => (
                                        <tr key={idx}>
                                            <td className="border border-slate-300 px-2 py-2 text-center text-slate-500">{idx + 1}</td>
                                            <td className="border border-slate-300 px-2 py-2 font-medium text-slate-800">{item.name}</td>
                                            <td className="border border-slate-300 px-2 py-2 text-center text-slate-600">{item.unit || 'Cái'}</td>
                                            <td className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-800">{item.quantity}</td>
                                            <td className="border border-slate-300 px-2 py-2 text-right text-slate-600">{item.price?.toLocaleString()}</td>
                                            <td className="border border-slate-300 px-2 py-2 text-right font-bold text-slate-800">
                                                {(item.price * item.quantity).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-50 print:bg-white">
                                        <td colSpan={5} className="border border-slate-300 px-2 py-2 text-right font-bold uppercase text-xs">Tổng cộng:</td>
                                        <td className="border border-slate-300 px-2 py-2 text-right font-bold text-lg text-slate-900">
                                            {order.totalAmount?.toLocaleString()}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <div className="mt-3 text-right">
                                <p className="text-[11px] italic text-slate-600">
                                    (Bằng chữ: <span className="font-bold">{readMoney(order.totalAmount)}</span>)
                                </p>
                            </div>
                        </div>

                        {/* CHỮ KÝ */}
                        <div className="flex justify-between mt-8 text-center break-inside-avoid">
                            <div className="w-1/3">
                                <p className="font-bold text-sm uppercase mb-1">Người lập phiếu</p>
                                <p className="text-[10px] italic text-slate-400 mb-16">(Ký, họ tên)</p>
                                <p className="font-bold text-slate-800">{currentUser?.displayName || currentUser?.email?.split('@')[0]}</p>
                            </div>
                            <div className="w-1/3">
                                <p className="font-bold text-sm uppercase mb-1">Người giao hàng</p>
                                <p className="text-[10px] italic text-slate-400 mb-16">(Ký, họ tên)</p>
                            </div>
                            <div className="w-1/3">
                                <p className="font-bold text-sm uppercase mb-1">Khách hàng</p>
                                <p className="text-[10px] italic text-slate-400 mb-16">(Ký, nhận đủ hàng)</p>
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="absolute bottom-10 left-0 w-full text-center text-[10px] text-slate-400 italic">
                            {company?.bankAccount ? 
                                `TK: ${company.bankAccount} - ${company.bankName || ''} - Chủ TK: ${company.bankOwner || ''}` : 
                                "Cảm ơn quý khách đã tin tưởng và ủng hộ!"
                            }
                        </div>
                    </div>
                )}
            </div>
            <style>{`@media print { @page { margin: 0; size: A4; } body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white; } body > *:not(.fixed) { display: none; } .overflow-y-auto { overflow: visible !important; } }`}</style>
        </div>
    );
};

export default PrintOrderModal;