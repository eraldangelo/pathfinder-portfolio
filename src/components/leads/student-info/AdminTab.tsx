import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import type { Lead } from '../leads-page/LeadsPage';
import { AcademicCapIcon, CakeIcon, CalendarIcon, FlagIcon, IdCardIcon } from './icons';
import { InfoField } from './fields';
import { MIN_ADMIN_NOTES_LENGTH } from '../student-info-modal/admin-actions/adminActionUtils';

interface AdminTabProps {
    editedLead: Lead;
    isEditing: boolean;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onSaveStatus: () => void;
    endorsementOptions: Array<{ uid: string; name: string }>;
    onEndorseCounsellor: (option: { uid: string; name: string } | null) => void;
    isAdminStatusLocked: boolean;
    isEndorsementLocked: boolean;
    isAdminStatusSaving: boolean;
    canEditAdminTab: boolean;
}

const AdminTab: React.FC<AdminTabProps> = ({
    editedLead,
    isEditing,
    onInputChange,
    onSaveStatus,
    endorsementOptions,
    onEndorseCounsellor,
    isAdminStatusLocked,
    isEndorsementLocked,
    isAdminStatusSaving,
    canEditAdminTab,
}) => {
    const { t } = useTranslation();

    const parseDob = (value?: string | null) => {
        const trimmed = (value ?? '').trim();
        if (!trimmed) return null;

        const ymdDash = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (ymdDash) {
            const [, year, month, day] = ymdDash;
            return new Date(Number(year), Number(month) - 1, Number(day));
        }

        const ymdSlash = trimmed.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
        if (ymdSlash) {
            const [, year, month, day] = ymdSlash;
            return new Date(Number(year), Number(month) - 1, Number(day));
        }

        const dmySlash = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (dmySlash) {
            const [, day, month, year] = dmySlash;
            return new Date(Number(year), Number(month) - 1, Number(day));
        }

        return null;
    };

    const computeAge = (dob: Date) => {
        const now = new Date();
        let age = now.getFullYear() - dob.getFullYear();
        const hasHadBirthdayThisYear =
            now.getMonth() > dob.getMonth() ||
            (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());

        if (!hasHadBirthdayThisYear) {
            age -= 1;
        }

        return age >= 0 ? age : null;
    };

    const age = (() => {
        const dob = parseDob(editedLead.dob);
        if (!dob) return null;
        return computeAge(dob);
    })();
    const statusValue = editedLead.adminStatus || 'New Lead';
    const isNewLeadLocked = Boolean(editedLead.adminStatus && editedLead.adminStatus !== 'New Lead');
    const isGenuine = statusValue === 'Genuine';
    const adminNotes = editedLead.adminNotes || '';
    const trimmedNotesLength = adminNotes.trim().length;
    const hasMinimumNotes = trimmedNotesLength >= MIN_ADMIN_NOTES_LENGTH;
    const canEditStatus = canEditAdminTab && !isAdminStatusLocked;
    const canEditEndorsement = canEditAdminTab && !isAdminStatusLocked && !isEndorsementLocked;
    const statusOptions = [
        'New Lead',
        'No Show',
        'No Response',
        'Undecided',
        'Genuine',
        'Non-Genuine',
        'Destination Not Offered',
        'Duplicate',
    ];
    const selectedEndorsementUid =
        editedLead.assignedCounsellorUid ||
        endorsementOptions.find((option) => option.name === editedLead.assignedCounsellor)?.uid ||
        '';
    const hasRequiredCounsellor = !isGenuine || Boolean(selectedEndorsementUid);
    const canSaveAdminUpdate = canEditStatus && hasMinimumNotes && hasRequiredCounsellor && !isAdminStatusSaving;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
            <h4 className="md:col-span-2 lg:col-span-4 text-lg font-semibold text-[#004097] dark:text-blue-400 border-b border-black/5 dark:border-white/5 pb-2">
                {t('adminScreening')}
            </h4>

            <InfoField
                icon={<FlagIcon />}
                label={t('preferredStudyDestination')}
                value={editedLead.studyDestinations || ''}
                isEditing={isEditing}
                name="studyDestinations"
                onChange={onInputChange}
            />
            <InfoField
                icon={<AcademicCapIcon />}
                label={t('preferredCoursesOfStudy')}
                value={editedLead.preferredCoursesOfStudy || ''}
                isEditing={isEditing}
                name="preferredCoursesOfStudy"
                onChange={onInputChange}
            />
            <InfoField
                icon={<CalendarIcon />}
                label={t('plannedIntakeDate')}
                value={editedLead.plannedStudyStart || ''}
                isEditing={isEditing}
                name="plannedStudyStart"
                onChange={onInputChange}
                type="month"
            />
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-blue-500 mt-1">
                    <CakeIcon />
                </div>
                <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('age', 'Age')}</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white mt-1">
                        {age == null ? '' : age}
                    </p>
                </div>
            </div>

            <div className="md:col-span-2 lg:col-span-4 h-px bg-black/5 dark:bg-white/5 my-1" />

            <div className="md:col-span-2 lg:col-span-4 grid grid-cols-1 lg:grid-cols-[1.5fr_2.5fr] gap-6 items-start">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 text-blue-500 mt-1">
                        <IdCardIcon />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('currentStatusLabel')}</p>
                        <select
                            name="adminStatus"
                            value={statusValue}
                            onChange={onInputChange}
                            disabled={!canEditStatus || isAdminStatusSaving}
                            className="w-full max-w-[260px] text-sm font-semibold bg-black/5 dark:bg-white/5 p-2 rounded-md mt-1 border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {statusOptions.map((status) => (
                                <option key={status} value={status} disabled={status === 'New Lead' && isNewLeadLocked}>
                                    {status}
                                </option>
                            ))}
                        </select>
                        {isGenuine && (
                            <div className="mt-4">
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t('endorsedTo', 'Endorsed to')}</p>
                                <select
                                    value={selectedEndorsementUid}
                                    onChange={(event) => {
                                        const selected = endorsementOptions.find((option) => option.uid === event.target.value) || null;
                                        onEndorseCounsellor(selected);
                                    }}
                                    disabled={!canEditEndorsement || isAdminStatusSaving}
                                    className="w-full max-w-[260px] text-sm font-semibold bg-black/5 dark:bg-white/5 p-2 rounded-md mt-1 border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    <option value="">{t('selectCounsellor', 'Select counsellor')}</option>
                                    {endorsementOptions.map((option) => (
                                        <option key={option.uid} value={option.uid}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="mt-4">
                            <button
                                type="button"
                                className="glass-btn pathfinder-green rounded-full h-11 w-11 p-0"
                                aria-label={t('save')}
                                title={t('save')}
                                onClick={onSaveStatus}
                                disabled={!canSaveAdminUpdate}
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-5 w-5"
                                >
                                    <path d="M20 6L9 17l-5-5" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('notes', 'Notes')}</p>
                    <textarea
                        name="adminNotes"
                        value={adminNotes}
                        onChange={onInputChange}
                        rows={6}
                        disabled={!canEditStatus || isAdminStatusSaving}
                        className="w-full text-sm bg-black/5 dark:bg-white/5 p-3 rounded-md mt-1 border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed resize-none"
                        placeholder={t('adminNotesPlaceholder', 'Enter at least 100 characters.')}
                    />
                    <p className={`mt-2 text-xs ${hasMinimumNotes ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                        {trimmedNotesLength}/{MIN_ADMIN_NOTES_LENGTH} {t('characters', 'characters')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminTab;
