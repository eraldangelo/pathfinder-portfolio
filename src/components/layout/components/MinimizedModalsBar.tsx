import React from 'react';
import type { Lead } from '../../leads/leads-page/LeadsPage';

const CloseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

interface MinimizedModalsBarProps {
    modals: (Lead | undefined)[];
    onRestore: (leadId: string) => void;
    onClose: (leadId: string) => void;
    isSidebarCollapsed: boolean;
}

const MinimizedModalsBar: React.FC<MinimizedModalsBarProps> = ({ modals, onRestore, onClose, isSidebarCollapsed }) => {
    if (modals.length === 0) {
        return null;
    }

    const sidebarWidth = isSidebarCollapsed ? '6rem' : '18rem';

    return (
        <div 
            className="fixed bottom-0 right-0 z-[49] transition-all duration-300 pointer-events-auto"
            style={{ left: sidebarWidth }}
        >
            <div className="overflow-x-auto custom-scrollbar">
                <div className="h-10 flex flex-row justify-end items-end gap-1 px-2">
                    {[...modals].reverse().map(lead => {
                        if (!lead) return null;
                        return (
                            <div
                                key={lead.id}
                                className="flex items-center h-full max-w-xs bg-white/60 dark:bg-black/40 backdrop-blur-md border-t border-x border-black/10 dark:border-white/10 rounded-t-lg shadow-lg pointer-events-auto flex-shrink-0"
                            >
                                <button
                                    onClick={() => onRestore(lead.id)}
                                    className="px-4 py-2 h-full text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 truncate transition-colors rounded-tl-lg"
                                    title={lead.fullName}
                                >
                                    <span className="truncate block">{lead.fullName}</span>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onClose(lead.id);
                                    }}
                                    className="mr-2 ml-1 p-1 rounded-full text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex-shrink-0"
                                    aria-label={`Close ${lead.fullName}`}
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MinimizedModalsBar;

