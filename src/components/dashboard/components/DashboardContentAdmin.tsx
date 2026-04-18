import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import { Widget } from './common';
import { Reminders } from '../widgets/Reminders';
import RoleBasedWelcomeWidget from '../widgets/RoleBasedWelcomeWidget';
import StatsCardsRow from '../widgets/StatsCardsRow';
import { AdminDashboard } from '../widgets/TeamWidgets';
import { LeadsByCounsellorWidget, TopLeadSource } from '../widgets/LeadsWidgets';
import type { DashboardContentProps } from '../types/DashboardContentTypes';

const DashboardContentAdmin: React.FC<DashboardContentProps> = ({
    user,
    role,
    leads,
    applications,
    widgetAnimationClasses,
    adminFunnelData,
    topLeadSourcesData,
    adminLeadsByCounsellorData,
    reminders,
    onOpenAddReminder,
}) => {
    const { t } = useTranslation();

    return (
        <div className="space-y-6">
            <div className={widgetAnimationClasses}>
                <RoleBasedWelcomeWidget user={user} role={role} leads={leads} applications={applications} />
            </div>
            <div className={widgetAnimationClasses} style={{ transitionDelay: '100ms' }}>
                <AdminDashboard leads={leads.filter((lead) => lead.branch === user.branch)} />
            </div>
            <div className={widgetAnimationClasses} style={{ transitionDelay: '200ms' }}>
                <Widget title={t('myBranchApplicationFunnel')} className="liquid-glass">
                    <StatsCardsRow data={adminFunnelData} />
                </Widget>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                <div className={widgetAnimationClasses} style={{ transitionDelay: '300ms' }}>
                    <TopLeadSource title={t('myBranchTopLeadSources')} leadSources={topLeadSourcesData} />
                </div>
                <div className={widgetAnimationClasses} style={{ transitionDelay: '400ms' }}>
                    <LeadsByCounsellorWidget data={adminLeadsByCounsellorData} title={t('leadsEndorsedToCounsellors')} />
                </div>
                <div className={widgetAnimationClasses} style={{ transitionDelay: '500ms' }}>
                    <Reminders user={user} reminders={reminders} onOpenAddModal={onOpenAddReminder} />
                </div>
            </div>
        </div>
    );
};

export default DashboardContentAdmin;
