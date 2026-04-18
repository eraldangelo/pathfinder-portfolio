const {
  BACHELOR,
  COURSE_OPTIONS,
  MASTERS_COURSEWORK,
  MASTERS_RESEARCH,
  OTHERS,
  PHD,
  SECONDARY,
  VOCATIONAL,
} = require('./constants.cjs');
const { isGenericOtherValue, normalizeKey, normalizeLooseKey, normalizeSpace } = require('./textUtils.cjs');

const canonicalByKey = new Map(COURSE_OPTIONS.map((option) => [normalizeKey(option), option]));

const detectMappedCourses = (rawValue) => {
  const cleaned = normalizeSpace(rawValue);
  if (!cleaned) return { courses: [], otherText: null };

  const key = normalizeKey(cleaned);
  const looseKey = normalizeLooseKey(cleaned);
  const directMatch = canonicalByKey.get(key);
  if (directMatch) {
    return { courses: [directMatch], otherText: null };
  }

  if (looseKey === 'any teaching related field') {
    return { courses: [MASTERS_COURSEWORK], otherText: null };
  }

  if (looseKey === 'what is your recommendations' || looseKey === 'what is your recommendation') {
    return { courses: [OTHERS], otherText: 'What is your recommendations?' };
  }

  if (looseKey === 'or internship' || looseKey === 'internship') {
    return { courses: [OTHERS], otherText: 'Internship' };
  }

  if (looseKey === "i'm not sure" || looseKey === 'im not sure') {
    return { courses: [OTHERS], otherText: "I'm not sure" };
  }

  if (
    looseKey === 'converson'
    || looseKey === 'conversion'
    || looseKey === 'conversion program'
    || looseKey === 'bridging conversion for nursing'
  ) {
    return { courses: [BACHELOR], otherText: null };
  }

  if (looseKey === 'it course' || looseKey === 'information technology' || looseKey === 'electrical engineering') {
    return { courses: [BACHELOR], otherText: null };
  }

  if (looseKey === 'aged care') {
    return { courses: [VOCATIONAL], otherText: null };
  }

  if (isGenericOtherValue(cleaned)) {
    return { courses: [OTHERS], otherText: null };
  }

  const hasSecondary = /\bsecondary\b/.test(key) || /year\s*10/.test(key) || /year\s*11/.test(key) || /year\s*12/.test(key);
  const hasVocational =
    /\bvocational\b/.test(key)
    || /\bvet\b/.test(key)
    || /\bcertificate\b/.test(key)
    || /\bcertificates\b/.test(key)
    || /\badvanced diploma\b/.test(key)
    || /\bausbildung\b/.test(key)
    || /\bcookery\b/.test(key)
    || (/\bdiploma\b/.test(key) && !/\bgraduate diploma\b/.test(key) && !/\bmaster/.test(key));

  const hasBachelor =
    /\bbachelor/.test(key)
    || /\bundergraduate\b/.test(key)
    || /\blaw\b/.test(key)
    || /\bentrepreneurship\b/.test(key);

  const hasMasters = /\bmaster/.test(key) || /\bgraduate diploma\b/.test(key) || /\bpost[- ]?graduate\b/.test(key);
  const hasResearch = /\bresearch\b/.test(key) || /\bthesis\b/.test(key);
  const hasPhd = /\bphd\b/.test(key) || /\bdoctorate\b/.test(key);

  const courses = new Set();
  if (hasSecondary) courses.add(SECONDARY);
  if (hasVocational) courses.add(VOCATIONAL);
  if (hasBachelor) courses.add(BACHELOR);
  if (hasMasters && hasResearch) {
    courses.add(MASTERS_RESEARCH);
  } else if (hasMasters) {
    courses.add(MASTERS_COURSEWORK);
  }
  if (hasPhd) courses.add(PHD);

  if (courses.size > 0) {
    return { courses: Array.from(courses), otherText: null };
  }

  return { courses: [OTHERS], otherText: cleaned };
};

module.exports = {
  canonicalByKey,
  detectMappedCourses,
};
