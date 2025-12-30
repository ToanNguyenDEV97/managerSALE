import React from 'react';

interface BaseProps {
    label?: string;
    error?: string;
    className?: string;
}

// 1. Input thường (Text, Number, Email...)
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, BaseProps {}

export const InputGroup: React.FC<InputProps> = ({ label, error, className = '', ...props }) => (
    <div className={`space-y-1.5 ${className}`}>
        {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
        <input 
            className={`
                block w-full px-3 py-2.5 bg-white border rounded-lg text-sm shadow-sm placeholder-slate-400
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all
                disabled:bg-slate-100 disabled:text-slate-500
                ${error ? 'border-red-300 focus:ring-red-200 focus:border-red-500' : 'border-slate-300'}
            `}
            {...props}
        />
        {error && <p className="text-xs text-red-500 animate-pulse">{error}</p>}
    </div>
);

// 2. Select Box
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement>, BaseProps {
    options: { value: string | number; label: string }[];
}

export const SelectGroup: React.FC<SelectProps> = ({ label, error, options, className = '', ...props }) => (
    <div className={`space-y-1.5 ${className}`}>
        {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
        <select 
            className={`
                block w-full px-3 py-2.5 bg-white border rounded-lg text-sm shadow-sm
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                ${error ? 'border-red-300' : 'border-slate-300'}
            `}
            {...props}
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
        {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
);

// 3. Text Area (Ghi chú, địa chỉ dài)
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, BaseProps {}

export const TextAreaGroup: React.FC<TextAreaProps> = ({ label, error, className = '', ...props }) => (
    <div className={`space-y-1.5 ${className}`}>
        {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
        <textarea 
            className={`
                block w-full px-3 py-2.5 bg-white border rounded-lg text-sm shadow-sm
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                ${error ? 'border-red-300' : 'border-slate-300'}
            `}
            rows={3}
            {...props}
        />
    </div>
);