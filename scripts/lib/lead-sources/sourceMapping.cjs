const {
  DISCOVERY_OPTIONS,
  Pathfinder_STAFF_SOURCE,
  OTHERS_SOURCE,
  referredByFamilySource,
  billboardSource,
} = require('./constants.cjs');
const { normalizeKey, normalizeLooseKey, normalizeSpace, matchesAny } = require('./textUtils.cjs');

const canonicalSourceByKey = new Map(DISCOVERY_OPTIONS.map((item) => [normalizeKey(item), item]));
const genericOtherKeys = new Set(['other', 'others', 'n/a', 'na', 'none', 'unknown', '-']);
const approvedManualOverridePairs = [
  ['pathfinder page ads', 'Pathfinder Facebook Page'],
  ['cebu pathfinder page ads', 'Pathfinder Facebook Page'],
  ['cebu pathfinder page chat armand', 'Pathfinder Facebook Page'],
  ['chat with pathfinder armand', 'Pathfinder Facebook Page'],
  ['christine jean lacang', 'Pathfinder Facebook Page'],
  ['facebook', 'Pathfinder Facebook Page'],
  ['.facebook', 'Pathfinder Facebook Page'],
  ['pathfinder cebu ads', 'Pathfinder Facebook Page'],
  ['pathfinder page chat', 'Pathfinder Facebook Page'],
  ['pathfinder page chat armand', 'Pathfinder Facebook Page'],
  ['angeles city science high school', 'University/School Website'],
  ['college expo in my school', 'University/School Website'],
  ['direct inquiry via email', 'Billboards, Flyers, Brochures, Advertisment'],
  ['direct phone call', 'Billboards, Flyers, Brochures, Advertisment'],
  ['direct phone call to cebu branch', 'Billboards, Flyers, Brochures, Advertisment'],
  ['just saw the branch', 'Billboards, Flyers, Brochures, Advertisment'],
  ['office visit', 'Billboards, Flyers, Brochures, Advertisment'],
  ['walk in', 'Billboards, Flyers, Brochures, Advertisment'],
  ['walk-in', 'Billboards, Flyers, Brochures, Advertisment'],
  ['friend', 'Referred by Family, Relatives, Partners or Friend'],
  ['from cousin', 'Referred by Family, Relatives, Partners or Friend'],
  ['i used this agent before for my undergrad', 'Referred by Family, Relatives, Partners or Friend'],
  ['i was made aware by a senior', 'Referred by Family, Relatives, Partners or Friend'],
  ['my brother applied his student visa also here.', 'Referred by Family, Relatives, Partners or Friend'],
  ['referral', 'Referred by Family, Relatives, Partners or Friend'],
  ['referred by a friend', 'Referred by Family, Relatives, Partners or Friend'],
  ['referred by my sister in belgium', 'Referred by Family, Relatives, Partners or Friend'],
  ['sister', 'Referred by Family, Relatives, Partners or Friend'],
  ['i was referred by a pathfinder staff', 'Pathfinder Staff'],
  ['armand- direct call ( personal lead )', 'Pathfinder Staff'],
  ['friends referral - nerissa student', 'Pathfinder Staff'],
  ['mavi - personal lead', 'Pathfinder Staff'],
  ['mavi parra', 'Pathfinder Staff'],
  ['ms en student', 'Pathfinder Staff'],
  ['personal leads- mandy', 'Pathfinder Staff'],
  ['referral- nerissa', 'Pathfinder Staff'],
  ['referred by education counsellor bea ( personal leads )', 'Pathfinder Staff'],
  ["i watched yvonne's ticktock video", 'TikTok Influencers'],
  ['yvonne', 'TikTok Influencers'],
  ['website / email', 'Pathfinder Website'],
];

const approvedManualOverrides = new Map(
  approvedManualOverridePairs.map(([key, value]) => [normalizeLooseKey(key), value]),
);

const mapDiscoverySource = (rawValue) => {
  const cleaned = normalizeSpace(rawValue);
  if (!cleaned) return { source: null, otherText: null };

  const key = normalizeKey(cleaned);
  const loose = normalizeLooseKey(cleaned);
  const manualOverride = approvedManualOverrides.get(loose);
  if (manualOverride) {
    return { source: manualOverride, otherText: null };
  }
  const direct = canonicalSourceByKey.get(key);
  if (direct) {
    return { source: direct, otherText: null };
  }

  if (genericOtherKeys.has(loose)) {
    return { source: OTHERS_SOURCE, otherText: null };
  }

  if (
    matchesAny(loose, [
      /referred by family/,
      /partners or friend/,
      /^referred by friend$/,
      /^family$/,
      /^families$/,
      /^relative$/,
      /^relatives$/,
      /^friend$/,
      /^friends$/,
    ])
  ) {
    return { source: referredByFamilySource, otherText: null };
  }

  if (matchesAny(loose, [/billboard/, /flyers?/, /brochures?/, /advertis(e|ement|ment|ing)/])) {
    return { source: billboardSource, otherText: null };
  }

  if (matchesAny(loose, [/pathfinder staff/, /referred by (a )?staff/])) {
    return { source: Pathfinder_STAFF_SOURCE, otherText: null };
  }

  if (matchesAny(loose, [/facebook/, /fb/])) {
    if (matchesAny(loose, [/groups?/, /blogs?/, /reddit/])) {
      return { source: 'Facebook Groups / Blogs (Reddit etc.)', otherText: null };
    }
    return { source: 'Pathfinder Facebook Page', otherText: null };
  }

  if (matchesAny(loose, [/instagram/, /\big\b/])) {
    return { source: 'Pathfinder Instagram Page', otherText: null };
  }

  if (matchesAny(loose, [/tiktok/, /tik tok/, /\btt\b/])) {
    if (matchesAny(loose, [/influencers?/, /creator/])) {
      return { source: 'TikTok Influencers', otherText: null };
    }
    return { source: 'Pathfinder TikTok Page', otherText: null };
  }

  if (matchesAny(loose, [/youtube/, /\byt\b/])) {
    return { source: 'YouTube Influencers', otherText: null };
  }

  if (matchesAny(loose, [/webinars?/, /infosession/, /info session/])) {
    return { source: 'Pathfinder Webinars/Infosession', otherText: null };
  }

  if (matchesAny(loose, [/coffee table talk/])) {
    return { source: 'Pathfinder Coffee Table Talk', otherText: null };
  }

  if (matchesAny(loose, [/study abroad festa/, /\bfesta\b/, /\broadshow\b/])) {
    return { source: 'Pathfinder Study Abroad Festa', otherText: null };
  }

  if (matchesAny(loose, [/linkedin/])) {
    return { source: 'LinkedIn', otherText: null };
  }

  if (matchesAny(loose, [/google/])) {
    return { source: 'Google', otherText: null };
  }

  if (matchesAny(loose, [/british council/])) {
    return { source: 'British Council', otherText: null };
  }

  if (matchesAny(loose, [/9 0 niner/, /90 niner/, /nine niner/, /9\.0 niner/])) {
    return { source: '9.0 Niner', otherText: null };
  }

  if (matchesAny(loose, [/university\/school website/, /university website/, /school website/])) {
    return { source: 'University/School Website', otherText: null };
  }

  if (matchesAny(loose, [/pathfinder website/, /^website$/, /^pathfinder$/])) {
    return { source: 'Pathfinder Website', otherText: null };
  }

  return { source: OTHERS_SOURCE, otherText: cleaned };
};

module.exports = {
  mapDiscoverySource,
};
