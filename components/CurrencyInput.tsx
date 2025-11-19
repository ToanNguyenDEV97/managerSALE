import React from 'react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';

interface CurrencyInputProps extends NumericFormatProps {
  className?: string;
  placeholder?: string;
  onValueChange?: (values: { floatValue?: number; value: string; formattedValue: string }) => void;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({ className, ...props }) => {
  return (
    <NumericFormat
      thousandSeparator="."
      decimalSeparator=","
      suffix=" ₫" // Thêm chữ đ ở cuối
      allowNegative={false} // Không cho nhập số âm
      decimalScale={0} // Không lấy số lẻ thập phân
      className={className} // Cho phép tùy biến class CSS
      {...props}
    />
  );
};

export default CurrencyInput;