import React, { useState, useEffect } from 'react';
import { FiX, FiPackage, FiCheckCircle, FiDollarSign, FiShoppingBag, FiCreditCard, FiInfo, FiLayers } from 'react-icons/fi';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (paymentAmount: number) => void;
    orderNumber: string;
    totalAmount: number;
    items: any[];
    isProcessing: boolean;
}

const ExportOrderModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, orderNumber, totalAmount, items, isProcessing }) => {
    const [amount, setAmount] = useState<string>('');

    // Reset trạng thái khi mở modal
    useEffect(() => {
        if (isOpen) {
            setAmount(''); 
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // --- LOGIC XỬ LÝ ---
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

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm animate-fade-in p-4">
            
            {/* CONTAINER CHÍNH: Rộng hơn (max-w-5xl), Bo góc lớn (rounded-2xl) */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl relative overflow-hidden flex flex-col animate-zoom-in h-full max-h-[85vh]">
                
                {/* --- HEADER: Gradient Primary --- */}
                <div className="bg-gradient-to-r from-primary-700 to-primary-600 p-5 text-white flex justify-between items-center shrink-0 shadow-md z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
                            <FiPackage size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold leading-tight">Xuất kho & Hóa đơn</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-primary-100 text-sm">Mã đơn hàng:</span> 
                                <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded text-xs tracking-wide">{orderNumber}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/20 rounded-full p-2 transition-colors"><FiX size={24}/></button>
                </div>

                {/* --- BODY: LAYOUT 2 CỘT --- */}
                <div className="flex flex-1 overflow-hidden flex-col md:flex-row bg-slate-50">
                    
                    {/* === CỘT TRÁI (65%): DANH SÁCH SẢN PHẨM === */}
                    <div className="flex-[1.8] flex flex-col bg-white border-r border-slate-200 overflow-hidden order-2 md:order-1 h-1/2 md:h-auto shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-0">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
                            <h4 className="font-bold text-slate-700 flex items-center gap-2 text-base">
                                <FiLayers className="text-primary-500"/> Danh sách hàng hóa
                            </h4>
                            <span className="text-xs font-bold px-3 py-1 bg-primary-50 text-primary-700 rounded-full border border-primary-100">
                                {items.length} mã • {totalQuantity} sản phẩm
                            </span>
                        </div>
                        
                        {/* Scroll Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-6 py-3 border-b border-slate-200">Sản phẩm</th>
                                        <th className="px-4 py-3 text-center w-24 border-b border-slate-200">ĐVT</th>
                                        <th className="px-4 py-3 text-center w-24 border-b border-slate-200">SL</th>
                                        <th className="px-6 py-3 text-right border-b border-slate-200">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-primary-50/30 transition-colors group">
                                            <td className="px-6 py-3.5 text-slate-700">
                                                <div className="font-bold text-sm text-slate-800 line-clamp-1 group-hover:text-primary-700 transition-colors">{item.name}</div>
                                                {item.sku && <div className="text-xs text-slate-400 font-mono mt-0.5">{item.sku}</div>}
                                            </td>
                                            <td className="px-4 py-3.5 text-center text-slate-500 text-xs bg-slate-50/50">{item.unit || 'Cái'}</td>
                                            <td className="px-4 py-3.5 text-center">
                                                <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">{item.quantity}</span>
                                            </td>
                                            <td className="px-6 py-3.5 text-right font-bold text-slate-700">
                                                {(item.price * item.quantity).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* === CỘT PHẢI (35%): THANH TOÁN (FIXED) === */}
                    <div className="flex-1 flex flex-col bg-slate-50/80 p-6 z-10 order-1 md:order-2 h-1/2 md:h-auto border-b md:border-b-0 backdrop-blur-sm">
                        
                        <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-5 text-lg">
                            <FiCreditCard className="text-primary-600"/> Thanh toán
                        </h4>

                        {/* Tổng tiền Card */}
                        <div className="bg-white p-5 rounded-xl border border-primary-100 mb-6 shadow-sm ring-4 ring-primary-50/50">
                            <div className="flex justify-between items-center text-slate-500 text-sm mb-2 font-medium">
                                <span>Tổng cộng phải thu:</span>
                                <FiInfo size={14} className="text-primary-400"/>
                            </div>
                            <div className="text-4xl font-bold text-primary-600 tracking-tight flex items-baseline justify-end">
                                {totalAmount.toLocaleString()} <span className="text-lg font-semibold text-slate-400 ml-1">₫</span>
                            </div>
                        </div>

                        {/* Input Thanh toán */}
                        <div className="mb-6">
                             <div className="flex justify-between mb-2 items-center">
                                <label className="text-sm font-bold text-slate-700">Khách đưa / Chuyển khoản</label>
                                <button 
                                    onClick={fillFullAmount}
                                    className="text-xs text-primary-700 font-bold hover:bg-primary-100 px-2.5 py-1.5 rounded-lg border border-primary-200 transition-colors flex items-center gap-1 bg-white shadow-sm"
                                >
                                    <FiCheckCircle size={12}/> Thanh toán đủ
                                </button>
                            </div>
                            <div className="relative group">
                                <input 
                                    type="text"
                                    className="w-full pl-11 pr-4 py-3.5 border-2 border-slate-300 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none font-bold text-slate-800 text-xl shadow-sm transition-all bg-white"
                                    placeholder="0"
                                    value={amount}
                                    onChange={handleInputChange}
                                    autoFocus
                                />
                                <FiDollarSign className="absolute left-4 top-4 text-slate-400 text-xl group-focus-within:text-primary-500 transition-colors"/>
                            </div>

                            {/* Tính toán công nợ tự động */}
                            <div className="mt-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                <p className="text-xs text-slate-500 flex items-center justify-between font-medium">
                                    <span>Trạng thái:</span>
                                    {(!amount || parseInt(amount.replace(/[^0-9]/g, '')) === 0) ? (
                                        <span className="text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded">Ghi nợ toàn bộ</span>
                                    ) : (parseInt(amount.replace(/[^0-9]/g, '')) < totalAmount) ? (
                                        <span className="text-orange-500 font-bold bg-orange-50 px-2 py-0.5 rounded">
                                            Còn nợ: {(totalAmount - (parseInt(amount.replace(/[^0-9]/g, '')) || 0)).toLocaleString()} ₫
                                        </span>
                                    ) : (
                                        <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded flex items-center gap-1">
                                            <FiCheckCircle/> Đã thanh toán đủ
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="mt-auto pt-6 border-t border-slate-200">
                             <div className="flex gap-3">
                                <button 
                                    onClick={onClose}
                                    className="flex-1 py-3.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                                >
                                    Quay lại
                                </button>
                                <button 
                                    onClick={handleConfirm}
                                    disabled={isProcessing}
                                    className="flex-[2] py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/40 transition-all active:scale-[0.98] flex justify-center items-center gap-2 text-base"
                                >
                                    {isProcessing ? (
                                        <>
                                            <FiPackage className="animate-spin"/> Đang xử lý...
                                        </>
                                    ) : (
                                        <>Xác nhận Xuất kho <FiCheckCircle size={20}/></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExportOrderModal;