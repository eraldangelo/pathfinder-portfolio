import React, { useMemo } from 'react';
import type { ApplicationInfo } from '../../../data/applications';
import { applicationStatuses } from '../../../data/applications';
import type { Lead } from '../../leads/leads-page/LeadsPage';
import type { StudentInfoTab } from '../../leads/types/studentInfoTab';
import { useTranslation } from '../../../contexts/LanguageContext';
import type { ApplicationDetailUser } from '../types/ApplicationDetailTypes';
import { useApplicationDetailState } from '../hooks/useApplicationDetailState';
import UpdateStatusModal from './UpdateStatusModal';
import ApplicationStatusBar from './ApplicationStatusBar';
import ApplicantSnapshot from './ApplicationDetailApplicantSnapshot';
import CourseDetailsSection from './ApplicationDetailCourseDetails';
import HeaderSection from './ApplicationDetailHeader';
import QuickActionsSection from './ApplicationDetailQuickActions';
import TimelineSection from './ApplicationDetailTimeline';

interface ApplicationDetailPageProps {
    user: ApplicationDetailUser;
    userRole: string;
    application: ApplicationInfo;
    lead: Lead;
    isReady: boolean;
    onNavigateBack: () => void;
    onOpenStudentProfile: (studentId: string, targetTab?: StudentInfoTab, leadDocPath?: string) => void;
    onUpdateApplication: (updatedApplication: ApplicationInfo) => void;
    onStatusUpdateWithNote: (studentId: string, newStatus: string, providerName: string, noteContent: string) => void;
    onAddLogEntry: (studentId: string, logMessage: string) => void;
    onAddNote: (studentId: string, subject: string, content: string) => void;
}

const ApplicationDetailPage: React.FC<ApplicationDetailPageProps> = ({
    application,
    lead,
    isReady,
    onNavigateBack,
    onOpenStudentProfile,
    onUpdateApplication,
    onStatusUpdateWithNote,
    user,
    userRole,
    onAddLogEntry,
    onAddNote,
}) => {
    const { t, locale } = useTranslation();
    const animationClasses = `transition-all duration-700 ease-out ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`;
    const generalNoteSubject = useMemo(
        () => t('noteSubjectGeneralNotes', 'General Notes'),
        [t]
    );

    const {
        actionGuard,
        providerDisplayName,
        isUpdateModalOpen,
        setIsUpdateModalOpen,
        handleStatusUpdate,
        formatTimelineDate,
    } = useApplicationDetailState({
        application,
        lead,
        user,
        userRole,
        locale,
        t,
        onUpdateApplication,
        onStatusUpdateWithNote,
        onAddLogEntry,
    });

    return (
        <div className={`relative w-full min-h-full max-w-[1920px] mx-auto ${animationClasses}`}>
            <div className="w-full min-h-full px-3 pt-24 sm:px-4 lg:px-8 pb-16 flex flex-col gap-6 text-gray-700 dark:text-gray-300">
                <HeaderSection
                    application={application}
                    lead={lead}
                    providerDisplayName={providerDisplayName}
                    onNavigateBack={onNavigateBack}
                />

                <ApplicationStatusBar application={application} />

                <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="min-w-0 lg:col-span-2 space-y-6">
                        <TimelineSection history={application.history} formatTimelineDate={formatTimelineDate} />
                    </div>

                    <div className="min-w-0 lg:col-span-1 space-y-6">
                        <ApplicantSnapshot
                            application={application}
                            lead={lead}
                            onOpenStudentProfile={onOpenStudentProfile}
                        />
                        <CourseDetailsSection
                            application={application}
                        />
                        <QuickActionsSection
                            actionGuard={actionGuard}
                            onOpenStatusModal={() => setIsUpdateModalOpen(true)}
                            onAddGeneralNote={(noteContent) =>
                                onAddNote(application.studentId, generalNoteSubject, noteContent)
                            }
                        />
                    </div>
                </main>
            </div>
            <UpdateStatusModal
                isOpen={isUpdateModalOpen}
                onClose={() => setIsUpdateModalOpen(false)}
                currentStatus={application.status}
                onUpdate={handleStatusUpdate}
                statuses={applicationStatuses}
                applicationHistory={application.history}
            />
        </div>
    );
};

export default ApplicationDetailPage;

