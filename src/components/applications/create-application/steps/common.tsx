import React from 'react';

const selectionButtonClasses = (isSelected: boolean) =>
    `p-4 rounded-lg font-semibold border-2 transition-all ${
        isSelected
            ? 'bg-blue-500 border-blue-500 text-white'
            : 'bg-black/5 dark:bg-neutral-900 border-transparent dark:border-neutral-700 hover:border-blue-400 dark:hover:bg-neutral-800'
    }`;

export const SelectionButton: React.FC<{
    isSelected: boolean;
    onClick: () => void;
    className?: string;
    children: React.ReactNode;
}> = ({ isSelected, onClick, className, children }) => (
    <button type="button" onClick={onClick} className={`${selectionButtonClasses(isSelected)} ${className ?? ''}`}>
        {children}
    </button>
);

export const StepSection: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="animate-fade-in-fast">{children}</div>
);
