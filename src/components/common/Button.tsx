// src/components/common/Button.tsx
import React from 'react';

// Định nghĩa các kiểu nút dựa trên hệ màu mới
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    icon?: React.ReactNode;
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    icon,
    fullWidth = false,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]';
    
    // CẬP NHẬT MÀU SẮC TẠI ĐÂY DÙNG HỆ MÀU MỚI
    const variants = {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm shadow-primary-600/30',
        secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-500',
        danger: 'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500 shadow-sm shadow-danger-600/30',
        outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
        ghost: 'text-primary-600 hover:bg-primary-50 focus:ring-primary-500 bg-transparent',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-5 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    return (
        <button
            className={`
                ${baseStyles} 
                ${variants[variant]} 
                ${sizes[size]} 
                ${fullWidth ? 'w-full' : ''} 
                ${className}
            `}
            disabled={disabled || isLoading}
            {...props}
        >
             {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý...
                </>
            ) : (
                <>
                    {icon && <span className={`${children ? 'mr-2' : ''} text-[1.1em]`}>{icon}</span>}
                    {children}
                </>
            )}
        </button>
    );
};