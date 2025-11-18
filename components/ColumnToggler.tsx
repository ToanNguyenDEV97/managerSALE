import React, { useState, useRef, useEffect } from 'react';
import { FiSettings } from 'react-icons/fi';
import type { PageKey, ColumnVisibility } from '../types';

interface ColumnTogglerProps {
    pageKey: PageKey;
    columns: Record<string, string>;
    visibility: ColumnVisibility;
    onToggle: (pageKey: PageKey, columnKey: string, isVisible: boolean) => void;
}

const ColumnToggler: React.FC<ColumnTogglerProps> = ({ pageKey, columns, visibility, onToggle }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);
    
    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center w-full sm:w-auto px-4 py-2 text-slate-700 dark:text-slate-200 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300"
            >
                <FiSettings className="w-5 h-5" />
                <span className="ml-2 font-medium hidden sm:inline">Tùy chỉnh cột</span>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-700 rounded-md shadow-lg border border-slate-200 dark:border-slate-600 z-10">
                    <div className="p-2">
                        {Object.entries(columns).map(([key, label]) => (
                            <label key={key} className="flex items-center space-x-3 px-2 py-1.5 text-sm text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={visibility?.[key] ?? true}
                                    onChange={(e) => onToggle(pageKey, key, e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-500 text-primary-600 focus:ring-primary-500 bg-white dark:bg-slate-600"
                                />
                                <span>{label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ColumnToggler;
