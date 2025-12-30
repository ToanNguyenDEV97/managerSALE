import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const FormInput: React.FC<FormInputProps> = ({ label, error, icon, className = '', ...props }) => (
    <div className="mb-4">
        {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label} {props.required && <span className="text-red-500">*</span>}
        </label>}
        <div className="relative">
            {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
            <input 
                className={`
                    w-full bg-white border rounded-lg px-4 py-2.5 text-sm outline-none transition-all
                    ${icon ? 'pl-10' : ''}
                    ${error ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-200'}
                    disabled:bg-slate-50 disabled:text-slate-500 focus:ring-2
                    ${className}
                `}
                {...props} 
            />
        </div>
        {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
    </div>
);