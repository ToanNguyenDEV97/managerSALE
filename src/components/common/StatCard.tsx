import React from 'react';

interface Props {
    title: string;
    value: string | number;
    subtext?: string;
    icon: any;
    colorClass: string;
    loading?: boolean;
}

const StatCard: React.FC<Props> = ({ title, value, subtext, icon: Icon, colorClass, loading }) => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between transition-transform hover:-translate-y-1">
        <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{title}</p>
            {loading ? (
                <div className="h-8 w-24 bg-slate-100 animate-pulse rounded mt-1"></div>
            ) : (
                <h4 className="text-2xl font-bold text-slate-800 mt-1">{value}</h4>
            )}
            {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClass}`}>
            <Icon size={24} className="text-white" />
        </div>
    </div>
);

export default StatCard;