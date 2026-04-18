import React from 'react';
import { isAdminLikeRole, isConsultantLikeRole } from '../../../utils/roles';
import { useTranslation } from '../../../contexts/LanguageContext';
import { CalendarIcon, ChevronDownIcon, OfficeBuildingIcon, SearchIcon, UserCircleIcon } from '../components/icons';

interface LeadsPageFiltersProps {
    role: string;
    selectedBranch: string;
    onBranchChange: (value: string) => void;
    branchOptions: string[];
    selectedMonth: string;
    onMonthChange: (value: string) => void;
    monthOptions: string[];
    selectedCounsellor: string;
    onCounsellorChange: (value: string) => void;
    counsellorOptions: string[];
    searchTerm: string;
    onSearchChange: (value: string) => void;
}

export const LeadsPageFilters: React.FC<LeadsPageFiltersProps> = ({
    role,
    selectedBranch,
    onBranchChange,
    branchOptions,
    selectedMonth,
    onMonthChange,
    monthOptions,
    selectedCounsellor,
    onCounsellorChange,
    counsellorOptions,
    searchTerm,
    onSearchChange,
}) => {
    const { t } = useTranslation();
    const isAdminLike = isAdminLikeRole(role);
    const showBranch = !isAdminLike;
    const showCounsellor = !isAdminLike && !isConsultantLikeRole(role);

    const responsiveGridClass = isAdminLike ? 'sm:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-4';

    return (
        <div className={`grid grid-cols-1 ${responsiveGridClass} gap-4 items-end mb-6 backdrop-blur-md bg-white/30 dark:bg-black/20 shadow-md border border-white/40 dark:border-white/10 rounded-2xl p-4`}>
            {showBranch && (
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('branch')}</label>
                    <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 dark:text-gray-400"><OfficeBuildingIcon /></div>
                        <select
                            value={selectedBranch}
                            onChange={(e) => onBranchChange(e.target.value)}
                            className="w-full pl-10 pr-8 py-2 text-sm bg-white/60 dark:bg-black/40 border border-gray-400/50 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        >
                            {branchOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt === 'All Branches' ? t('allBranches') : t(opt.toLowerCase().replace(/[\s()]/g, ''), opt)}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400"><ChevronDownIcon /></div>
                    </div>
                </div>
            )}
            {showCounsellor && (
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('counsellor')}</label>
                    <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 dark:text-gray-400"><UserCircleIcon /></div>
                        <select
                            value={selectedCounsellor}
                            onChange={(e) => onCounsellorChange(e.target.value)}
                            className="w-full pl-10 pr-8 py-2 text-sm bg-white/60 dark:bg-black/40 border border-gray-400/50 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        >
                            {counsellorOptions.map((opt) => (
                                <option key={opt} value={opt}>{opt === 'All Counsellors' ? t('allCounsellors') : opt}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400"><ChevronDownIcon /></div>
                    </div>
                </div>
            )}
            <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('month')}</label>
                <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 dark:text-gray-400">
                        <CalendarIcon />
                    </div>
                    <select
                        value={selectedMonth}
                        onChange={(e) => onMonthChange(e.target.value)}
                        className="w-full pl-10 pr-8 py-2 text-sm bg-white/60 dark:bg-black/40 border border-gray-400/50 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    >
                        {monthOptions.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt === 'All Months' ? t('allMonths') : opt}
                            </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400"><ChevronDownIcon /></div>
                </div>
            </div>
            <div className="col-span-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('keywords')}</label>
                <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 dark:text-gray-400"><SearchIcon /></div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={t('searchByNameCaseIdCounsellor')}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-white/60 dark:bg-black/40 border border-gray-400/50 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
        </div>
    );
};

