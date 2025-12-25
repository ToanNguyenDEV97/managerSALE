import React, { useState, useEffect } from 'react';
import { FiX, FiPackage, FiCheckCircle, FiFileText, FiDollarSign, FiShoppingBag } from 'react-icons/fi';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (paymentAmount: number) => void;
    orderNumber: string;
    totalAmount: number;
    items: any[]; // [MỚI] Nhận thêm danh sách hàng hóa
    isProcessing: boolean;
}

const ExportOrderModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, orderNumber, totalAmount, items, isProcessing }) => {
    const [amount, setAmount] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            setAmount(''); 
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        const value = parseInt(amount.replace(/[^0-9]/g, '')) || 0;
        onConfirm(value);
    };

    const fillFullAmount = () => {
        setAmount(totalAmount.toLocaleString());
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        if (!raw) setAmount('');
        else setAmount(parseInt(raw).toLocaleString());
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4">
            {/* Tăng độ rộng lên max-w-lg để chứa bảng hàng hóa */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden flex flex-col animate-zoom-in max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-blue-500 p-5 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                            <FiPackage size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Xuất kho & Hóa đơn</h3>
                            <p className="text-blue-100 text-xs">Mã đơn: <span className="font-mono font-bold bg-white/20 px-1.5 rounded">{orderNumber}</span></p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/20 rounded-full p-2 transition-colors"><FiX size={20}/></button>
                </div>

                {/* Body (Scrollable) */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    
                    {/* [MỚI] DANH SÁCH SẢN PHẨM */}
                    <div className="mb-6">
                        <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <FiShoppingBag className="text-primary-500"/> Chi tiết đơn hàng ({items.length} SP)
                        </h4>
                        <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-500 font-bold text-xs uppercase">
                                    <tr>
                                        <th className="px-3 py-2">Sản phẩm</th>
                                        <th className="px-3 py-2 text-center">SL</th>
                                        <th className="px-3 py-2 text-right">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {items.map((item: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-white transition-colors">
                                            <td className="px-3 py-2 text-slate-700 font-medium">
                                                <div className="line-clamp-1">{item.name}</div>
                                                <div className="text-xs text-slate-400 font-normal">{item.price?.toLocaleString()} ₫</div>
                                            </td>
                                            <td className="px-3 py-2 text-center text-slate-600">{item.quantity}</td>
                                            <td className="px-3 py-2 text-right font-bold text-slate-700">
                                                {(item.price * item.quantity).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-white border-t border-slate-200">
                                    <tr>
                                        <td colSpan={2} className="px-3 py-2 text-right font-bold text-slate-500">Tổng cộng:</td>
                                        <td className="px-3 py-2 text-right font-bold text-primary-600 text-base">{totalAmount.toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* INPUT THANH TOÁN */}
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                            <FiCheckCircle className="text-green-500"/> Xác nhận xuất kho và tạo công nợ.
                        </div>

                        <div>
                            <div className="flex justify-between mb-1.5">
                                <label className="text-sm font-bold text-slate-700">Khách trả ngay (VNĐ)</label>
                                <button 
                                    onClick={fillFullAmount}
                                    className="text-xs text-primary-600 font-bold hover:underline bg-white px-2 py-0.5 rounded border border-primary-100 shadow-sm"
                                >
                                    Thanh toán đủ
                                </button>
                            </div>
                            <div className="relative">
                                <input 
                                    type="text"
                                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold text-slate-800 text-lg shadow-sm"
                                    placeholder="0"
                                    value={amount}
                                    onChange={handleInputChange}
                                />
                                <FiDollarSign className="absolute left-3.5 top-4 text-slate-400"/>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors"
                    >
                        Hủy
                    </button>
                    <button 
                        onClick={handleConfirm}
                        disabled={isProcessing}
                        className="flex-[1.5] py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all active:scale-95 flex justify-center items-center gap-2"
                    >
                        {isProcessing ? 'Đang xử lý...' : 'Xác nhận Xuất'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportOrderModal;