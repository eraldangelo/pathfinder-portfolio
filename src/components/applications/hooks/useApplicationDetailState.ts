import { useEffect, useMemo, useState } from 'react';
import type { ApplicationInfo, ApplicationStatus, ApplicationStatusHistory, SchoolCourses } from '../../../data/applications';
import type { Lead } from '../../leads/leads-page/LeadsPage';
import { formatReadableDate } from '../../../utils/date';
import { Timestamp } from '../../../services/firebase';
import type { FirebaseTimestamp } from '../../../types';
import type { ActionGuard, ApplicationDetailUser } from '../types/ApplicationDetailTypes';
import { createEmptyCourse, mapCoursesForDisplay, mapCoursesForInput } from '../utils/ApplicationDetailDateUtils';
import { resolveApplicationActionAllowed } from './useApplicationDetailActionGuard';

type TranslationFn = (key: string, options?: { [key: string]: string | number } | string) => string;

interface UseApplicationDetailStateParams {
    application: ApplicationInfo;
    lead: Lead;
    user: ApplicationDetailUser;
    userRole: string;
    locale: string;
    t: TranslationFn;
    onUpdateApplication: (updatedApplication: ApplicationInfo) => void;
    onStatusUpdateWithNote: (studentId: string, newStatus: string, providerName: string, noteContent: string) => void;
    onAddLogEntry: (studentId: string, logMessage: string) => void;
}

export const useApplicationDetailState = ({
    application,
    lead,
    user,
    userRole,
    locale,
    t,
    onUpdateApplication,
    onStatusUpdateWithNote,
    onAddLogEntry,
}: UseApplicationDetailStateParams) => {
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isEditingCourses, setIsEditingCourses] = useState(false);
    const [editedSchoolCourses, setEditedSchoolCourses] = useState<SchoolCourses[]>(application.schoolCourses);
    const [editedStudentId, setEditedStudentId] = useState<string | undefined>(application.schoolStudentId);

    useEffect(() => {
        setEditedSchoolCourses(application.schoolCourses);
        setEditedStudentId(application.schoolStudentId);
    }, [application]);

    const providerDisplayName = useMemo(
        () => application.schoolCourses.map((schoolCourse) => schoolCourse.schoolName).join(' / '),
        [application.schoolCourses]
    );

    const isActionAllowed = useMemo(() => {
        return resolveApplicationActionAllowed({
            userRole,
            user,
            lead,
            application,
        });
    }, [
        userRole,
        user,
        lead,
        application,
    ]);

    const actionGuard: ActionGuard = useMemo(
        () => ({
            isActionAllowed,
            disabledTitle: 'Actions are restricted to the assigned counsellor or branch manager, or Developer.',
            disabledClasses: 'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black/5 dark:disabled:hover:bg-white/5',
        }),
        [isActionAllowed]
    );

    const handleEditClick = () => {
        setEditedSchoolCourses(mapCoursesForInput(application.schoolCourses));
        setEditedStudentId(application.schoolStudentId);
        setIsEditingCourses(true);
    };

    const handleCancelClick = () => {
        setEditedSchoolCourses(application.schoolCourses);
        setEditedStudentId(application.schoolStudentId);
        setIsEditingCourses(false);
    };

    const handleSaveClick = () => {
        const updatedApplication: ApplicationInfo = {
            ...application,
            schoolCourses: mapCoursesForDisplay(editedSchoolCourses),
            schoolStudentId: editedStudentId,
        };
        onUpdateApplication(updatedApplication);

        let logMessage = t('logCourseDetailsUpdated');
        if (editedStudentId !== application.schoolStudentId) {
            logMessage = t('logStudentIdAndCourseUpdated', { studentId: editedStudentId || 'none' });
        }

        onAddLogEntry(application.studentId, logMessage);
        setIsEditingCourses(false);
    };

    const handleCourseDetailChange = (
        schoolIndex: number,
        courseIndex: number,
        field: 'programName' | 'intakeDate' | 'courseEndDate',
        value: string
    ) => {
        setEditedSchoolCourses((prev) =>
            prev.map((schoolCourse, currentSchoolIndex) => {
                if (currentSchoolIndex !== schoolIndex) {
                    return schoolCourse;
                }
                const updatedCourses = schoolCourse.courses.map((course, currentCourseIndex) => {
                    if (currentCourseIndex !== courseIndex) {
                        return course;
                    }
                    return { ...course, [field]: value };
                });
                return { ...schoolCourse, courses: updatedCourses };
            })
        );
    };

    const handleAddCourse = (schoolIndex: number) => {
        setEditedSchoolCourses((prev) =>
            prev.map((schoolCourse, currentSchoolIndex) => {
                if (currentSchoolIndex !== schoolIndex) {
                    return schoolCourse;
                }
                return {
                    ...schoolCourse,
                    courses: [...schoolCourse.courses, createEmptyCourse()],
                };
            })
        );
    };

    const handleRemoveCourse = (schoolIndex: number, courseIndex: number) => {
        setEditedSchoolCourses((prev) =>
            prev.map((schoolCourse, currentSchoolIndex) => {
                if (currentSchoolIndex !== schoolIndex) {
                    return schoolCourse;
                }
                if (schoolCourse.courses.length <= 1) {
                    return schoolCourse;
                }
                return {
                    ...schoolCourse,
                    courses: schoolCourse.courses.filter((_, currentCourseIndex) => currentCourseIndex !== courseIndex),
                };
            })
        );
    };

    const handleStatusUpdate = (newStatus: ApplicationStatus, notes: string) => {
        const now = Timestamp.now();
        const newHistoryEntry: ApplicationStatusHistory = {
            status: newStatus,
            date: now,
            notes: notes,
        };

        let updatedHistory: ApplicationStatusHistory[] = [newHistoryEntry, ...application.history];
        let finalStatus: ApplicationStatus = newStatus;
        let finalStatusChangedDate = newHistoryEntry.date;
        const autoEndStatuses: ApplicationStatus[] = ['Withdrawn', 'Application Rejected', 'Pre-Departure Orientation'];
        const shouldAutoEnd = autoEndStatuses.includes(newStatus);

        if (shouldAutoEnd) {
            const autoEndNote =
                newStatus === 'Pre-Departure Orientation'
                    ? 'Application completed after Pre-Departure Orientation.'
                    : `Application closed following status: ${newStatus}.`;
            const endHistoryEntry: ApplicationStatusHistory = {
                status: 'Application Ended',
                date: new Timestamp(now.seconds + 1, now.nanoseconds),
                notes: autoEndNote,
            };
            updatedHistory.unshift(endHistoryEntry);
            finalStatus = 'Application Ended';
            finalStatusChangedDate = endHistoryEntry.date;
        }

        const updatedApplication: ApplicationInfo = {
            ...application,
            status: finalStatus,
            statusChanged: finalStatusChangedDate,
            history: updatedHistory.sort((a, b) => b.date.toMillis() - a.date.toMillis()),
        };

        onUpdateApplication(updatedApplication);

        onStatusUpdateWithNote(application.studentId, newStatus, providerDisplayName, notes);

        if (shouldAutoEnd) {
            const autoEndNote =
                newStatus === 'Pre-Departure Orientation'
                    ? 'Application completed after Pre-Departure Orientation.'
                    : `Application closed following status: ${newStatus}.`;
            onStatusUpdateWithNote(
                application.studentId,
                'Application Ended',
                providerDisplayName,
                autoEndNote
            );
        }

        setIsUpdateModalOpen(false);
    };

    const formatTimelineDate = (date: FirebaseTimestamp) => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        };
        return formatReadableDate(date, options, locale);
    };

    return {
        actionGuard,
        providerDisplayName,
        isUpdateModalOpen,
        setIsUpdateModalOpen,
        isEditingCourses,
        editedSchoolCourses,
        editedStudentId,
        setEditedStudentId,
        handleEditClick,
        handleCancelClick,
        handleSaveClick,
        handleCourseDetailChange,
        handleAddCourse,
        handleRemoveCourse,
        handleStatusUpdate,
        formatTimelineDate,
    };
};

