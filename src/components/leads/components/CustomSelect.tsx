import React, { useEffect, useRef, useState } from 'react';
import { dropdownPanel, inputField } from '../../common/styles/ui';

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);

interface CustomSelectProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    disabled?: boolean;
    translateFunc: (key: string, defaultValue?: string) => string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
    options,
    value,
    onChange,
    placeholder,
    disabled = false,
    translateFunc,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleOptionClick = (option: string) => {
        onChange(option);
        setIsOpen(false);
    };

    const translateOption = (option: string) => {
        const key = option.toLowerCase().replace(/[\s()]/g, '');
        return translateFunc(key, option);
    };

    return (
        <div ref={selectRef} className="relative">
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`${inputField} text-left flex justify-between items-center disabled:opacity-50`}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className={value ? 'text-gray-700 dark:text-gray-200' : 'text-gray-500 dark:text-white/70'}>
                    {value ? translateOption(value) : placeholder}
                </span>
                <ChevronDownIcon className={`w-4 h-4 text-gray-500 dark:text-white/70 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className={`${dropdownPanel} absolute z-10 w-full mt-2 overflow-hidden animate-fade-in-fast`}>
                    <ul className="max-h-48 overflow-y-auto custom-scrollbar" role="listbox">
                        {options.map((option) => (
                            <li
                                key={option}
                                onClick={() => handleOptionClick(option)}
                                onMouseDown={(event) => event.preventDefault()}
                                className="px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-500 hover:text-white dark:hover:bg-white/20 cursor-pointer"
                                role="option"
                                aria-selected={value === option}
                            >
                                {translateOption(option)}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
