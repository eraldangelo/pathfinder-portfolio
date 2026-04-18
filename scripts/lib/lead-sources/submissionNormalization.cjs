const { DISCOVERY_OPTIONS, Pathfinder_STAFF_SOURCE, OTHERS_SOURCE } = require('./constants.cjs');
const { normalizeKey, normalizeSpace, splitOtherValues } = require('./textUtils.cjs');
const { mapDiscoverySource } = require('./sourceMapping.cjs');

const hasStaffReferralDetails = (data) =>
  Boolean(normalizeSpace(data?.referredStaffBranch) && normalizeSpace(data?.referredStaffName));

const normalizeSubmissionLeadSources = (rawSources, rawOther, data) => {
  const mappedSources = new Set();
  const otherValues = [];
  const otherSeen = new Set();
  let hasExplicitOthers = false;

  const addOther = (value) => {
    const cleaned = normalizeSpace(value);
    const key = normalizeKey(cleaned);
    if (!cleaned || otherSeen.has(key)) return;
    otherSeen.add(key);
    otherValues.push(cleaned);
  };

  (Array.isArray(rawSources) ? rawSources : []).forEach((source) => {
    const mapped = mapDiscoverySource(source);
    if (!mapped.source) return;

    if (mapped.source === OTHERS_SOURCE) {
      hasExplicitOthers = true;
      if (mapped.otherText) addOther(mapped.otherText);
      return;
    }
    mappedSources.add(mapped.source);
  });

  splitOtherValues(rawOther).forEach((source) => {
    const mapped = mapDiscoverySource(source);
    if (!mapped.source) return;

    if (mapped.source === OTHERS_SOURCE) {
      hasExplicitOthers = true;
      if (mapped.otherText) addOther(mapped.otherText);
      return;
    }
    mappedSources.add(mapped.source);
  });

  if (hasStaffReferralDetails(data)) {
    mappedSources.add(Pathfinder_STAFF_SOURCE);
  }

  if (otherValues.length > 0 || (hasExplicitOthers && mappedSources.size === 0)) {
    mappedSources.add(OTHERS_SOURCE);
  }

  const normalizedSources = DISCOVERY_OPTIONS.filter((option) => mappedSources.has(option));
  const normalizedOther = otherValues.length > 0 ? otherValues.join('; ') : null;

  return {
    normalizedSources,
    normalizedOther,
  };
};

const isAssessmentSubmissionDoc = (data) =>
  Object.prototype.hasOwnProperty.call(data, 'emailAddress')
  || Object.prototype.hasOwnProperty.call(data, 'mobileNumber')
  || Object.prototype.hasOwnProperty.call(data, 'referredStaffBranch')
  || Object.prototype.hasOwnProperty.call(data, 'studyDestinations');

module.exports = {
  normalizeSubmissionLeadSources,
  isAssessmentSubmissionDoc,
};
