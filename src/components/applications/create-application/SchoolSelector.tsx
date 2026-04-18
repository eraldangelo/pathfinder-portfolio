import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';

const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
    </svg>
);

interface SchoolSelectorProps {
    title: string;
    searchTerm: string;
    onSearchTermChange: (term: string) => void;
    filteredSchools: string[];
    selectedSchools: string[];
    onSchoolSelect: (schoolName: string) => void;
}

const SchoolSelector: React.FC<SchoolSelectorProps> = ({
    title,
    searchTerm,
    onSearchTermChange,
    filteredSchools,
    selectedSchools,
    onSchoolSelect,
}) => {
    const { t } = useTranslation();

    return (
        <div className="animate-fade-in-fast">
            <p className="text-lg mb-4">{title}</p>
            <input
                type="search"
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                placeholder={t('search', 'Search...')}
                className="w-full mb-4 p-2 rounded-md bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10"
            />
            <div className="space-y-2 h-[45vh] overflow-y-auto custom-scrollbar -mr-2 pr-2">
                {filteredSchools.map((school) => (
                    <button
                        key={school}
                        onClick={() => onSchoolSelect(school)}
                        className={`w-full text-left p-3 rounded-md flex justify-between items-center transition-colors ${
                            selectedSchools.includes(school)
                                ? 'bg-blue-500/20'
                                : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'
                        }`}
                    >
                        <span>{school}</span>
                        {selectedSchools.includes(school) && <CheckIcon />}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SchoolSelector;
