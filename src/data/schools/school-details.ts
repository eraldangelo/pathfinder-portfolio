import type { SchoolDetail, SchoolDetailsMap } from './school-details.types';
import { schoolDetailsPartAM } from './school-details.part-a-m';
import { schoolDetailsPartNZ } from './school-details.part-n-z';

export const schoolDetails: SchoolDetailsMap = {
  ...schoolDetailsPartAM,
  ...schoolDetailsPartNZ,
};

const normalizeSchoolName = (value: string) =>
  value
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');

const buildNormalizedMap = (data: SchoolDetailsMap) => {
  const map = new Map<string, SchoolDetail>();
  Object.entries(data).forEach(([key, value]) => {
    map.set(normalizeSchoolName(key), value);
  });
  return map;
};

const normalizedSchoolDetails = buildNormalizedMap(schoolDetails);

export const getSchoolDetails = (schoolName: string) => {
  const direct = schoolDetails[schoolName];
  if (direct) return direct;
  const normalizedKey = normalizeSchoolName(schoolName);
  return normalizedSchoolDetails.get(normalizedKey) || {};
};
