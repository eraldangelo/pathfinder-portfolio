
import React from 'react';

// MoonIcon Component
const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
);

// SunIcon Component
const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
);


interface ThemeToggleProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
    return (
        <button
            onClick={toggleTheme}
            className="relative h-8 w-14 rounded-full border border-white/60 bg-white/40 p-1 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5),0_6px_16px_rgba(15,23,42,0.2)] backdrop-blur-md transition-all duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/70 dark:border-white/20 dark:bg-white/10"
        >
            <div
                className={`h-6 w-6 transform rounded-full border border-white/70 bg-white/85 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_6px_12px_rgba(15,23,42,0.25)] backdrop-blur-md transition-transform duration-300 ease-in-out dark:border-white/30 dark:bg-slate-900/70 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}
            >
                {theme === 'dark' ? (
                    <MoonIcon className="h-full w-full p-1 text-slate-100"/>
                ) : (
                    <SunIcon className="h-full w-full p-1 text-amber-500"/>
                )}
            </div>
        </button>
    );
};

export default ThemeToggle;
