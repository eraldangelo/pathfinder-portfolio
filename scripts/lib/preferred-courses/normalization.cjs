const { COURSE_OPTIONS, OTHERS } = require('./constants.cjs');
const { detectMappedCourses } = require('./courseMapping.cjs');
const {
  isGenericOtherValue,
  normalizeKey,
  toOptionalString,
  toStringArray,
  uniquePush,
  normalizeSpace,
} = require('./textUtils.cjs');

const splitOtherValues = (value) => {
  if (!value) return [];
  return String(value)
    .split(/[;|]/)
    .map((part) => normalizeSpace(part))
    .filter(Boolean);
};

const normalizePreferredCourses = ({
  preferredCoursesOfStudy,
  otherPreferredCourseOfStudy,
}) => {
  const incomingCourses = toStringArray(preferredCoursesOfStudy);
  const incomingOther = toOptionalString(otherPreferredCourseOfStudy);

  const mappedCourseSet = new Set();
  const otherValues = [];
  const otherSeen = new Set();
  let sawOthersToken = false;

  const ingestValue = (rawValue) => {
    const { courses, otherText } = detectMappedCourses(rawValue);
    courses.forEach((course) => {
      if (course === OTHERS) {
        sawOthersToken = true;
        return;
      }
      mappedCourseSet.add(course);
    });
    if (otherText && !isGenericOtherValue(otherText)) {
      uniquePush(otherValues, otherSeen, otherText);
    }
  };

  incomingCourses.forEach((value) => {
    const valueKey = normalizeKey(value);
    if (valueKey === normalizeKey(OTHERS) || isGenericOtherValue(value)) {
      sawOthersToken = true;
      return;
    }
    ingestValue(value);
  });
  splitOtherValues(incomingOther).forEach((value) => ingestValue(value));

  if (otherValues.length > 0 || (sawOthersToken && mappedCourseSet.size === 0)) {
    mappedCourseSet.add(OTHERS);
  }

  const normalizedCourses = COURSE_OPTIONS.filter((course) => mappedCourseSet.has(course));
  const normalizedOther = mappedCourseSet.has(OTHERS) && otherValues.length > 0 ? otherValues.join('; ') : null;

  return {
    currentCourses: incomingCourses,
    currentOther: incomingOther,
    normalizedCourses,
    normalizedOther,
  };
};

const isAssessmentSubmissionDoc = (data) =>
  Object.prototype.hasOwnProperty.call(data, 'emailAddress')
  || Object.prototype.hasOwnProperty.call(data, 'mobileNumber')
  || Object.prototype.hasOwnProperty.call(data, 'referredStaffBranch')
  || Object.prototype.hasOwnProperty.call(data, 'studyDestinations');

module.exports = {
  normalizePreferredCourses,
  isAssessmentSubmissionDoc,
};
