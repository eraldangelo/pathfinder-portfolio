import { allSchools } from '@/data/schools/schools';
const SCHOOL_LOGO_PLACEHOLDER = '/assets/avatar.svg';
export const SCHOOL_IMAGE_LINKS: Record<string, string> = Object.freeze(
  Object.fromEntries(
    allSchools.map((school) => [school.name, SCHOOL_LOGO_PLACEHOLDER]),
  ),
);
export const getSchoolImageLink = (schoolName: string) => SCHOOL_IMAGE_LINKS[schoolName];