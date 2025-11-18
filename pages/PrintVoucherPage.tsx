
import React, { useEffect, useMemo } from 'react';
import { FiBox } from 'react-icons/fi';
import { useAppContext } from '../context/DataContext';

// --- Helper function to convert number to Vietnamese words ---
const defaultNumbers = ' hai ba bốn năm sáu bảy tám chín';
const chuHangDonVi = ('1 một' + defaultNumbers).split(' ');
const chuHangChuc = ('lẻ mười' + defaultNumbers).split(' ');
const chuHangTram = ('không một' + defaultNumbers).split(' ');

function convert_block_three(number: number) {
    if (number == 0) return '';
    const tram = Math.floor(number / 100);
    number = number % 100;
    const chuc = Math.floor(number / 10);
    const donvi = number % 10;
    let B3 = '';

    if (tram > 0) {
        B3 += chuHangTram[tram] + ' trăm';
    }

    if (chuc > 0 || donvi > 0) {
        if (tram > 0) B3 += ' '; // Thêm " " (ví dụ: "Ba trăm ")

        if (chuc > 1) { // 20 -> 99
            B3 += chuHangChuc[chuc] + ' mươi'; // <-- SỬA 1: Thêm "mươi" (ví dụ: "bốn mươi")
            if (donvi === 1) B3 += ' mốt';
            else if (donvi === 5) B3 += ' lăm'; // <-- SỬA 2: Thêm "lăm" cho 45, 55...
            else if (donvi > 1) B3 += ' ' + chuHangDonVi[donvi];
        } else if (chuc === 1) { // 10 -> 19
            B3 += 'mười';
            if (donvi === 5) B3 += ' lăm';
            else if (donvi > 0) B3 += ' ' + chuHangDonVi[donvi];
        } else { // 0 -> 9
            // SỬA 3: Thêm "lẻ" nếu có hàng trăm (ví dụ: 304 -> Ba trăm lẻ bốn)
            if (tram > 0 && donvi > 0) B3 += 'lẻ '; 
            if (donvi > 0) B3 += chuHangDonVi[donvi];
        }
    }
    return B3;
}

function to_vietnamese_string(number: number) {
    if (number === 0) return 'Không đồng';
    
    // Sửa lỗi 1: Dùng Math.round thay vì parseInt để xử lý số lẻ
    let str = Math.round(number).toString();
    
    let i = 0;
    let arr = [];
    let index = str.length;
    
    // Sửa lỗi 2 (logic): Đảo ngược mảng 'hang' để dễ xử lý
    let hang = ['', ' Nghìn', ' Triệu', ' Tỷ'];
    
    // Sửa lỗi 2 (logic): Đổi `index >= 0` thành `index > 0`
    while (index > 0) {
        arr.push(str.substring(Math.max(index - 3, 0), index));
        index -= 3;
    }
    
    let result = '';
    
    // Sửa lỗi 2 (logic): Lặp từ 0 và dùng mảng 'hang' đã đảo ngược
    for (i = 0; i < arr.length; i++) {
        let blockText = convert_block_three(parseInt(arr[i], 10));
        
        if (blockText !== '') {
            // Ghép từ phải sang trái
            result = blockText + (hang[i] || '') + ' ' + result;
        }
    }
    
    result = result.trim();
    return result.charAt(0).toUpperCase() + result.slice(1) + ' đồng';
}
// --- End Helper Function ---


const PrintVoucherPage: React.FC = () => {
    const { printingVoucherId, cashFlowTransactions, setPrintingVoucherId, settings } = useAppContext();
    const transaction = useMemo(() => cashFlowTransactions.find(t => t.id === printingVoucherId), [cashFlowTransactions, printingVoucherId]);

    useEffect(() => {
        const handleAfterPrint = () => {
            setPrintingVoucherId(null);
        };

        window.addEventListener('afterprint', handleAfterPrint);

        return () => {
            // 2. Thêm dòng này để dọn dẹp timer
            // clearTimeout(printTimer);
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, [setPrintingVoucherId]);

    if (!transaction) {
        return <div className="p-10">Đang tải phiếu...</div>;
    }
    
    const isReceipt = transaction.type === 'thu';
    const title = isReceipt ? 'PHIẾU THU' : 'PHIẾU CHI';

    return (
        <div className="bg-white p-8 md:p-12 font-sans text-slate-900 text-sm">
             <style>
                {`
                    @media print {
                        body {
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        .no-print {
                            display: none;
                        }
                    }
                `}
            </style>
            <div className="max-w-2xl mx-auto border border-slate-400 p-8">
                {/* Header */}
                <div className="flex justify-between items-start pb-4">
                    <div className="text-xs">
                        <p className="font-bold">{settings.companyName.toUpperCase()}</p>
                        <p>Địa chỉ: {settings.address}</p>
                        <p>SĐT: {settings.phone}</p>
                    </div>
                     <div className="text-center">
                        <p className="font-bold">Mẫu số 01 - TT</p>
                        <p className="text-xs">(Ban hành theo Thông tư số 200/2014/TT-BTC ngày 22/12/2014 của Bộ Tài chính)</p>
                    </div>
                </div>

                {/* Title */}
                <div className="text-center my-6">
                    <h1 className="text-2xl font-bold">{title}</h1>
                    <p className="font-medium">Ngày {new Date(transaction.date).getDate()} tháng {new Date(transaction.date).getMonth() + 1} năm {new Date(transaction.date).getFullYear()}</p>
                    <p className="font-bold">Số: {transaction.transactionNumber}</p>
                </div>

                {/* Details */}
                <div className="space-y-2">
                    <p>Họ và tên người {isReceipt ? 'nộp' : 'nhận'} tiền: <span className="font-medium">{transaction.payerReceiverName || '...........................................................................'}</span></p>
                    <p>Địa chỉ: <span className="font-medium">{transaction.payerReceiverAddress || '.......................................................................................................'}</span></p>
                    <p>Lý do {isReceipt ? 'nộp' : 'chi'}: <span className="font-medium">{transaction.description}</span></p>
                    <p>Số tiền: <span className="font-bold">{transaction.amount.toLocaleString('vi-VN')} đ</span></p>
                    <p>Viết bằng chữ: <span className="font-bold italic">{to_vietnamese_string(transaction.amount)}</span></p>
                    <p>Kèm theo: ......................................................................... Chứng từ gốc.</p>
                </div>

                {/* Signatures */}
                <div className="mt-8 grid grid-cols-5 gap-4 text-center font-bold">
                    <div className="col-span-1">
                        <p>Giám đốc</p>
                        <p className="font-normal text-xs">(Ký, họ tên, đóng dấu)</p>
                    </div>
                     <div className="col-span-1">
                        <p>Kế toán trưởng</p>
                        <p className="font-normal text-xs">(Ký, họ tên)</p>
                    </div>
                     <div className="col-span-1">
                        <p>Người lập phiếu</p>
                        <p className="font-normal text-xs">(Ký, họ tên)</p>
                    </div>
                     <div className="col-span-1">
                        <p>Người {isReceipt ? 'nộp' : 'nhận'} tiền</p>
                        <p className="font-normal text-xs">(Ký, họ tên)</p>
                    </div>
                    <div className="col-span-1">
                        <p>Thủ quỹ</p>
                        <p className="font-normal text-xs">(Ký, họ tên)</p>
                    </div>
                </div>
                 <div className="mt-8 text-center no-print">
                    <button onClick={() => setPrintingVoucherId(null)} className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700">
                        Quay lại
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrintVoucherPage;