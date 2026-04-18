const COURSE_OPTIONS = [
  'Secondary Education - Year 10, Year 11, or Year 12',
  'Vocational - Certificates, Diploma, Advanced Diploma',
  "Bachelor's Degree",
  "Master's Degree - Coursework",
  "Master's Degree - Research",
  'PhD',
  'Others',
];

const SECONDARY = COURSE_OPTIONS[0];
const VOCATIONAL = COURSE_OPTIONS[1];
const BACHELOR = COURSE_OPTIONS[2];
const MASTERS_COURSEWORK = COURSE_OPTIONS[3];
const MASTERS_RESEARCH = COURSE_OPTIONS[4];
const PHD = COURSE_OPTIONS[5];
const OTHERS = COURSE_OPTIONS[6];

const GENERIC_OTHER_TOKENS = new Set([
  'other',
  'others',
  'n/a',
  'na',
  'none',
  'unknown',
  'prefer not to say',
  '-',
]);

module.exports = {
  COURSE_OPTIONS,
  SECONDARY,
  VOCATIONAL,
  BACHELOR,
  MASTERS_COURSEWORK,
  MASTERS_RESEARCH,
  PHD,
  OTHERS,
  GENERIC_OTHER_TOKENS,
};
