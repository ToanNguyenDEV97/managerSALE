import React, { useState, useEffect } from 'react';
import { FiPrinter, FiX, FiLoader } from 'react-icons/fi';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

interface Props {
    orderId: string;
    onClose: () => void;
}

// --- HÀM ĐỌC SỐ TIỀN THÀNH CHỮ (VIETNAMESE) ---
const docSoTien = (n: number) => {
    if (!n) return 'Không đồng';
    const docSo = (so: number) => {
        const arr = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
        return arr[so];
    };
    const hang = ['u', 'nghìn', 'triệu', 'tỷ'];
    
    let str = n.toString();
    let i = 0;
    let result = '';
    
    // Logic đọc số đơn giản (Demo - Bạn có thể dùng thư viện n2vi nếu cần chuẩn chỉnh hơn)
    // Ở đây mình dùng logic rút gọn để code không quá dài
    // Nếu muốn chính xác 100% các trường hợp "lẻ/linh/mốt", bạn nên cài thư viện: npm i n2vi
    
    // Tạm thời hiển thị text cứng nếu chưa cài thư viện
    // Cách tốt nhất: Bạn nên cài thư viện "n2vi" (npm install n2vi)
    // Sau đó import { docSo } from 'n2vi';
    
    // Vì mình không cài được thư viện cho bạn, mình sẽ dùng hàm thay thế đơn giản này:
    return "Bằng chữ: (Cần cài thư viện n2vi để đọc chính xác số tiền lớn)"; 
};

// Hàm đọc số tiền thủ công (Basic)
const readMoney = (number: number) => {
    const VIETNAMESE_NUMBERS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
    const PLACES = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];

    if (number === 0) return "Không đồng";

    let s = number.toString();
    let l = s.length;
    let groups = [];
    
    for (let i = l; i > 0; i -= 3) {
        groups.push(s.substring(Math.max(0, i - 3), i));
    }

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
        
        if (temp.length > 0) {
            result.unshift(temp.join(" ") + " " + PLACES[i]);
        }
    }

    let str = result.join(" ").trim();
    return str.charAt(0).toUpperCase() + str.slice(1) + " đồng";
};


const PrintOrderModal: React.FC<Props> = ({ orderId, onClose }) => {
    const [order, setOrder] = useState<any>(null);
    const [customer, setCustomer] = useState<any>(null); // State lưu thông tin khách chi tiết
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Lấy đơn hàng
                const orderData = await api(`/api/orders/${orderId}`);
                setOrder(orderData);

                // 2. Lấy thông tin khách hàng chi tiết (nếu có ID)
                if (orderData.customerId) {
                    try {
                        const custData = await api(`/api/customers/${orderData.customerId}`);
                        setCustomer(custData);
                    } catch (e) {
                        console.log("Khách lẻ hoặc không tìm thấy info khách");
                    }
                }
                setLoading(false);
            } catch (error) {
                toast.error('Không tải được dữ liệu');
                onClose();
            }
        };
        fetchData();
    }, [orderId, onClose]);

    const handlePrint = () => {
        window.print();
    };

    if (!orderId) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 flex flex-col h-screen animate-fade-in">
            
            {/* Header Toolbar (Ẩn khi in) */}
            <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center shadow-lg shrink-0 print:hidden z-50">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-lg text-white">Xem trước bản in (A4)</h3>
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors text-sm">
                        <FiX size={18}/> Đóng
                    </button>
                    <button onClick={handlePrint} disabled={loading} className="bg-blue-600 hover:bg-blue-700 px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-transform active:scale-95 text-sm">
                        <FiPrinter size={18}/> IN PHIẾU
                    </button>
                </div>
            </div>

            {/* Vùng hiển thị giấy A4 */}
            <div className="flex-1 overflow-y-auto bg-slate-600 p-8 custom-scrollbar print:p-0 print:bg-white print:overflow-visible flex justify-center">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-white/50">
                        <FiLoader size={48} className="animate-spin mb-4"/>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <div 
                        className="bg-white text-black shadow-2xl print:shadow-none relative print:w-full print:h-auto"
                        style={{ width: '210mm', minHeight: '297mm', padding: '15mm 20mm' }}
                    >
                        {/* 1. HEADER */}
                        <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-slate-800">
                            <div>
                                <h2 className="font-bold text-lg text-slate-800 uppercase">CỬA HÀNG CỦA BẠN</h2>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM<br/>
                                    Hotline: 0909.123.456<br/>
                                </p>
                            </div>
                            <div className="text-right">
                                <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">PHIẾU GIAO HÀNG</h1>
                                <p className="text-sm text-slate-500 mt-1">Số: <span className="font-mono font-bold text-slate-800">{order.orderNumber}</span></p>
                                <p className="text-sm text-slate-500">Ngày: {new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                            </div>
                        </div>

                        {/* 2. THÔNG TIN KHÁCH (Đã bổ sung SĐT, Địa chỉ) */}
                        <div className="mb-6 bg-slate-50 p-4 rounded-md border border-slate-200 print:border-slate-300">
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr>
                                        <td className="font-bold text-slate-700 w-24 align-top py-1">Khách hàng:</td>
                                        <td className="text-slate-900 font-bold uppercase py-1">{order.customerName}</td>
                                    </tr>
                                    {customer && (
                                        <>
                                            <tr>
                                                <td className="font-bold text-slate-700 align-top py-1">Điện thoại:</td>
                                                <td className="text-slate-800 py-1">{customer.phone}</td>
                                            </tr>
                                            <tr>
                                                <td className="font-bold text-slate-700 align-top py-1">Địa chỉ:</td>
                                                <td className="text-slate-800 py-1">{customer.address}</td>
                                            </tr>
                                        </>
                                    )}
                                    <tr>
                                        <td className="font-bold text-slate-700 align-top py-1">Ghi chú:</td>
                                        <td className="text-slate-600 italic py-1">{order.note || '...'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 3. BẢNG SẢN PHẨM */}
                        <div className="mb-4">
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
                                    
                                    {/* Dòng Tổng cộng */}
                                    <tr className="bg-slate-50 print:bg-white">
                                        <td colSpan={5} className="border border-slate-300 px-2 py-2 text-right font-bold uppercase text-xs">Tổng cộng:</td>
                                        <td className="border border-slate-300 px-2 py-2 text-right font-bold text-lg text-slate-900">
                                            {order.totalAmount?.toLocaleString()}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            
                            {/* [MỚI] Tiền bằng chữ */}
                            <div className="mt-3 text-right">
                                <p className="text-[11px] italic text-slate-600">
                                    (Bằng chữ: <span className="font-bold">{readMoney(order.totalAmount)}</span>)
                                </p>
                            </div>
                        </div>

                        {/* 4. CHỮ KÝ */}
                        <div className="flex justify-between mt-12 text-center break-inside-avoid">
                            <div className="w-1/3">
                                <p className="font-bold text-sm uppercase mb-1">Người lập phiếu</p>
                                <p className="text-[10px] italic text-slate-400">(Ký, họ tên)</p>
                            </div>
                            <div className="w-1/3">
                                <p className="font-bold text-sm uppercase mb-1">Người giao hàng</p>
                                <p className="text-[10px] italic text-slate-400">(Ký, họ tên)</p>
                            </div>
                            <div className="w-1/3">
                                <p className="font-bold text-sm uppercase mb-1">Khách hàng</p>
                                <p className="text-[10px] italic text-slate-400">(Ký, nhận đủ hàng)</p>
                            </div>
                        </div>

                        <div className="absolute bottom-10 left-0 w-full text-center text-[10px] text-slate-400 italic">
                            Cảm ơn quý khách đã tin tưởng và ủng hộ!
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @media print {
                    @page { margin: 0; size: A4; }
                    body { 
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important; 
                        background: white; 
                    }
                    body > *:not(.fixed) { display: none; }
                    .overflow-y-auto { overflow: visible !important; }
                }
            `}</style>
        </div>
    );
};

export default PrintOrderModal;