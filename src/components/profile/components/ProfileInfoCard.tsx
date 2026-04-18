import React from 'react';

interface ProfileInfoCardProps {
    title: string;
    icon: React.ReactNode;
    onClick: () => void;
    children: React.ReactNode;
}

export const ProfileInfoCard: React.FC<ProfileInfoCardProps> = ({ title, icon, onClick, children }) => (
    <button
        onClick={onClick}
        className="backdrop-blur-md bg-white/30 dark:bg-black/20 shadow-lg border border-white/40 dark:border-white/10 rounded-xl p-4 relative text-left hover:bg-white/50 dark:hover:bg-black/30 transition-colors w-full"
    >
        <div className="absolute top-4 right-4 text-blue-500 dark:text-blue-400">
            {icon}
        </div>
        <p className="font-bold text-[#004097] dark:text-blue-300">{title}</p>
        <div className="text-gray-600 dark:text-gray-300 mt-1 text-sm space-y-1">
            {children}
        </div>
    </button>
);
