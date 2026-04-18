import React from 'react';

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string;
    color: string;
    actionButton?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color, actionButton }) => (
    <div className="backdrop-blur-md bg-white/30 dark:bg-black/20 shadow-lg border border-white/40 dark:border-white/10 rounded-xl p-4 flex flex-col">
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-xl font-bold text-[#004097] dark:text-blue-300">{value}</p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{title}</p>
            </div>
        </div>
        {actionButton && <div className="mt-auto pt-3 w-full">{actionButton}</div>}
    </div>
);
