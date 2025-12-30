import React from 'react';
import { FiLoader } from 'react-icons/fi';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'outline';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', isLoading, icon, className = '', ...props }) => {
    const baseStyles = "px-5 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed";
    
    const variants = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200",
        secondary: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50",
        danger: "bg-red-100 text-red-600 hover:bg-red-200",
        outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
    };

    return (
        <button className={`${baseStyles} ${variants[variant]} ${className}`} disabled={isLoading || props.disabled} {...props}>
            {isLoading ? <FiLoader className="animate-spin" /> : icon}
            {children}
        </button>
    );
};