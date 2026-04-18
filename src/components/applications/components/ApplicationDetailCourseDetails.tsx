import React from 'react';
import type { ApplicationInfo } from '../../../data/applications';
import SchoolLogo from '../../common/components/SchoolLogo';
import { useTranslation } from '../../../contexts/LanguageContext';

interface CourseSummaryProps {
    application: ApplicationInfo;
}

const CourseSummary: React.FC<CourseSummaryProps> = ({ application }) => {
    const { t } = useTranslation();

    return (
        <div className="space-y-3">
            {application.schoolCourses.map((schoolCourse, schoolIndex) => (
                <div key={schoolIndex} className="p-3 rounded-md bg-black/5 dark:bg-white/5">
                    <div className="flex items-center gap-3 mb-2">
                        <SchoolLogo schoolName={schoolCourse.schoolName} className="w-8 h-8 rounded-full object-contain bg-white p-1" />
                        <h4 className="font-bold text-gray-800 dark:text-white">{schoolCourse.schoolName}</h4>
                    </div>
                    <ul className="space-y-1 pl-5 text-sm">
                        {schoolCourse.courses.map((course, courseIndex) => (
                            <li key={courseIndex} className="list-disc list-outside marker:text-gray-400">
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{course.programName || 'N/A'}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({t('intakeDate')}: {course.intakeDate || 'N/A'})</span>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

interface CourseDetailsSectionProps {
    application: ApplicationInfo;
}

const CourseDetailsSection: React.FC<CourseDetailsSectionProps> = ({ application }) => {
    const { t } = useTranslation();

    return (
        <div className="p-4 rounded-2xl backdrop-blur-md bg-white/30 dark:bg-black/20 shadow-lg border border-white/40 dark:border-white/10">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[#004097] dark:text-blue-300">{t('courseDetails')}</h3>
            </div>
            <CourseSummary application={application} />
        </div>
    );
};

export default CourseDetailsSection;
