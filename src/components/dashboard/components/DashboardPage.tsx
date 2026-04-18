import React, { useEffect, useState } from 'react';
import type { Lead } from '../../leads/leads-page/LeadsPage';
import type { ApplicationInfo } from '../../../data/applications';
import type { PersonnelWithDetails } from '../../../data/personnel';
import { useTranslation } from '../../../contexts/LanguageContext';
import type { AssessmentSubmission, User } from '../../../types';
import { ClockIcon } from './icons';
import { AddReminderModal } from '../widgets/Reminders';
import DashboardHeader from './DashboardHeader';
import DashboardContent from './DashboardContent';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useDashboardDownloads } from '../hooks/useDashboardDownloads';
import type { Reminder } from '../types/types';
import { isAdministrativeStaffRole, isBranchManagerRole } from '../../../utils/roles';
import { ALL_MONTHS_VALUE, ALL_QUARTERS_VALUE } from '../utils/funnelFilters';
import { applyFunnelMonthChange, applyFunnelQuarterChange } from './funnelFilterState';

interface DashboardPageProps {
    user: User;
    role: string;
    isReady: boolean;
    theme: 'light' | 'dark';
    leads: Lead[];
    applications: ApplicationInfo[];
    allPersonnel: PersonnelWithDetails[];
    assessmentSubmissions: AssessmentSubmission[];
    genuineSubmissionIds: Set<string>;
}

const DashboardPage: React.FC<DashboardPageProps> = ({
    user,
    role,
    isReady,
    theme,
    leads,
    applications,
    allPersonnel,
    assessmentSubmissions,
    genuineSubmissionIds,
}) => {
    const { t } = useTranslation();
    const currentYear = String(new Date().getFullYear());
    const titleAnimationClasses = `transition-all duration-700 ease-out ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`;
    const widgetAnimationClasses = `transition-all duration-500 ease-out ${isReady ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`;

    const [selectedLocation, setSelectedLocation] = useState('Overall');
    const [selectedFunnelLocation, setSelectedFunnelLocation] = useState('Philippines Overall');
    const [selectedFunnelMonth, setSelectedFunnelMonth] = useState(ALL_MONTHS_VALUE);
    const [selectedFunnelYear, setSelectedFunnelYear] = useState(currentYear);
    const [selectedFunnelStaffRole, setSelectedFunnelStaffRole] = useState('all');
    const [selectedQuarter, setSelectedQuarter] = useState(ALL_QUARTERS_VALUE);
    const [selectedPerfCountry, setSelectedPerfCountry] = useState('All Countries');

    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [isAddReminderModalOpen, setIsAddReminderModalOpen] = useState(false);
    const isBranchScopedDefaultDashboard = isAdministrativeStaffRole(role) || isBranchManagerRole(role);

    useEffect(() => {
        if (!isBranchScopedDefaultDashboard) return;
        const branch = String(user.branch ?? '').trim();
        if (!branch) return;
        setSelectedFunnelLocation((prev) => (prev === branch ? prev : branch));
        setSelectedLocation((prev) => (prev === branch ? prev : branch));
    }, [isBranchScopedDefaultDashboard, user.branch]);

    const {
        managerBranch,
        managerCountry,
        managerCountryOverallKey,
        managerMapConfig,
        adminLeadsByCounsellorData,
        adminFunnelData,
        consultantFunnelData,
        managerFunnelData,
        yieldData,
        performanceData,
        trendData,
        topDestinationsData,
        counsellorsData,
        leadsByBranchData,
        topLeadSourcesData,
        preferredCoursesData,
        leadsByCounsellorData,
    } = useDashboardMetrics({
        role,
        user,
        leads,
        applications,
        assessmentSubmissions,
        genuineSubmissionIds,
        selectedFunnelMonth,
        selectedFunnelYear,
        selectedQuarter,
    });

    const { handleDownloadExcel, handleDownloadPDF } = useDashboardDownloads({
        user,
        leads,
        applications,
        assessmentSubmissions,
        genuineSubmissionIds,
        selectedFunnelLocation,
        selectedFunnelMonth,
        selectedFunnelYear,
        selectedLocation,
        selectedQuarter,
        trendData,
    });

    const handleAddReminder = (text: string, due: string) => {
        const newReminder: Reminder = {
            assigned: user.displayName || 'User',
            text,
            due,
            icon: <ClockIcon />,
            color: 'text-yellow-500',
        };
        setReminders((prev) => [...prev, newReminder]);
    };

    const handleFunnelMonthChange = (month: string) => {
        const nextState = applyFunnelMonthChange(
            {
                selectedFunnelMonth,
                selectedQuarter,
            },
            month,
        );
        setSelectedFunnelMonth(nextState.selectedFunnelMonth);
        setSelectedQuarter(nextState.selectedQuarter);
    };

    const handleFunnelQuarterChange = (quarter: string) => {
        const nextState = applyFunnelQuarterChange(
            {
                selectedFunnelMonth,
                selectedQuarter,
            },
            quarter,
        );
        setSelectedFunnelMonth(nextState.selectedFunnelMonth);
        setSelectedQuarter(nextState.selectedQuarter);
    };

    return (
        <div className="relative w-full h-full max-w-[1920px] mx-auto">
            <div className="flex h-full w-full flex-col px-3 pb-16 pt-24 sm:px-4 lg:px-8">
                <DashboardHeader
                    titleAnimationClasses={titleAnimationClasses}
                    role={role}
                    onDownloadPDF={handleDownloadPDF}
                    onDownloadExcel={handleDownloadExcel}
                />

                <main className="flex-grow space-y-6">
                    <DashboardContent
                        role={role}
                        user={user}
                        leads={leads}
                        applications={applications}
                        allPersonnel={allPersonnel}
                        assessmentSubmissions={assessmentSubmissions}
                        genuineSubmissionIds={genuineSubmissionIds}
                        theme={theme}
                        widgetAnimationClasses={widgetAnimationClasses}
                        selectedFunnelLocation={selectedFunnelLocation}
                        onFunnelLocationChange={setSelectedFunnelLocation}
                        selectedFunnelMonth={selectedFunnelMonth}
                        onFunnelMonthChange={handleFunnelMonthChange}
                        selectedFunnelYear={selectedFunnelYear}
                        onFunnelYearChange={setSelectedFunnelYear}
                        selectedFunnelStaffRole={selectedFunnelStaffRole}
                        onFunnelStaffRoleChange={setSelectedFunnelStaffRole}
                        selectedLocation={selectedLocation}
                        onLocationChange={setSelectedLocation}
                        selectedQuarter={selectedQuarter}
                        onQuarterChange={handleFunnelQuarterChange}
                        selectedPerfCountry={selectedPerfCountry}
                        onPerfCountryChange={setSelectedPerfCountry}
                        adminFunnelData={adminFunnelData}
                        managerFunnelData={managerFunnelData}
                        consultantFunnelData={consultantFunnelData}
                        adminLeadsByCounsellorData={adminLeadsByCounsellorData}
                        leadsByCounsellorData={leadsByCounsellorData}
                        topLeadSourcesData={topLeadSourcesData}
                        topDestinationsData={topDestinationsData}
                        counsellorsData={counsellorsData}
                        leadsByBranchData={leadsByBranchData}
                        preferredCoursesData={preferredCoursesData}
                        performanceData={performanceData}
                        yieldData={yieldData}
                        trendData={trendData}
                        managerBranch={managerBranch}
                        managerCountryOverallKey={managerCountryOverallKey}
                        managerMapConfig={managerMapConfig}
                        managerCountry={managerCountry}
                        reminders={reminders}
                        onOpenAddReminder={() => setIsAddReminderModalOpen(true)}
                    />
                </main>
            </div>
            <AddReminderModal
                isOpen={isAddReminderModalOpen}
                onClose={() => setIsAddReminderModalOpen(false)}
                onAddReminder={handleAddReminder}
            />
            <style>{`
                @keyframes fade-in-fast {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in-fast {
                    animation: fade-in-fast 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default DashboardPage;

