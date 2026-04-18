import { generalProgramsPartAM } from './school-programs.general.part-a-m';
import { generalProgramsPartNZ } from './school-programs.general.part-n-z';
import { popularProgramsPartAM } from './school-programs.popular.part-a-m';
import { popularProgramsPartNZ } from './school-programs.popular.part-n-z';

export const generalProgramsData: Record<string, string> = {
  ...generalProgramsPartAM,
  ...generalProgramsPartNZ,
};

export const popularProgramsData: Record<string, string> = {
  ...popularProgramsPartAM,
  ...popularProgramsPartNZ,
};

type ProgramDataMap = Record<string, string>;

const normalizeSchoolName = (value: string) =>
  value
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');

const buildNormalizedMap = (data: ProgramDataMap) => {
  const map = new Map<string, string>();
  Object.entries(data).forEach(([key, value]) => {
    map.set(normalizeSchoolName(key), value);
  });
  return map;
};

const normalizedGeneralPrograms = buildNormalizedMap(generalProgramsData);
const normalizedPopularPrograms = buildNormalizedMap(popularProgramsData);

export const getSchoolPrograms = (schoolName: string) => {
  const directGeneral = generalProgramsData[schoolName];
  const directPopular = popularProgramsData[schoolName];
  if (directGeneral || directPopular) {
    return { general: directGeneral, popular: directPopular };
  }
  const normalizedKey = normalizeSchoolName(schoolName);
  return {
    general: normalizedGeneralPrograms.get(normalizedKey),
    popular: normalizedPopularPrograms.get(normalizedKey),
  };
};
