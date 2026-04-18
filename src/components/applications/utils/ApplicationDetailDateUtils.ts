import type { CourseDetail, SchoolCourses } from '../../../data/applications';

export const parseDateForInput = (dateString: string | undefined): string => {
    if (!dateString || dateString === 'N/A') return '';
    try {
        const date = new Date(dateString.replace(/-/g, ' '));
        if (isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) { return ''; }
};

export const formatDateForDisplay = (dateString: string | undefined): string => {
    if (!dateString || !dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return 'N/A';
    try {
        const [year, month, day] = dateString.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
    } catch (e) { return 'N/A'; }
};

export const mapCoursesForInput = (schoolCourses: SchoolCourses[]): SchoolCourses[] =>
    schoolCourses.map((schoolCourse) => ({
        ...schoolCourse,
        courses: schoolCourse.courses.map((course) => ({
            ...course,
            intakeDate: parseDateForInput(course.intakeDate),
            courseEndDate: parseDateForInput(course.courseEndDate),
        })),
    }));

export const mapCoursesForDisplay = (schoolCourses: SchoolCourses[]): SchoolCourses[] =>
    schoolCourses.map((schoolCourse) => ({
        ...schoolCourse,
        courses: schoolCourse.courses.map((course) => ({
            ...course,
            intakeDate: formatDateForDisplay(course.intakeDate),
            courseEndDate: formatDateForDisplay(course.courseEndDate),
        })),
    }));

export const createEmptyCourse = (): CourseDetail => ({ programName: '', intakeDate: '', courseEndDate: '' });
