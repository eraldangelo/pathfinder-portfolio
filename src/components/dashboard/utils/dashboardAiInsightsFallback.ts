import type { DashboardDownloadSnapshot } from './dashboardDownloadSnapshot';
import type { DashboardAiInsights } from './dashboardAiInsights';
import { resolveFilterLabel } from './dashboardReportPeriod';

const MAX_FINDINGS = 12;
const MAX_ACTIONS = 3;

const toCount = (value: string) => Number(String(value ?? '').replace(/,/g, '')) || 0;
const toRateValue = (numerator: number, denominator: number) =>
  denominator > 0 ? (numerator / denominator) * 100 : 0;
const toPercentage = (numerator: number, denominator: number) =>
  `${toRateValue(numerator, denominator).toFixed(1)}%`;
const toPercentageOrNoData = (numerator: number, denominator: number) =>
  denominator > 0 ? toPercentage(numerator, denominator) : 'No data available';
const toGap = (actual: number, target: number) => Number((actual - target).toFixed(1));
const formatSignedGap = (value: number) => (value >= 0 ? `+${value.toFixed(1)}` : value.toFixed(1));
const formatStage = (value: number) => value.toLocaleString();

export const buildDashboardAiInsightsFallback = (
  snapshot: DashboardDownloadSnapshot
): DashboardAiInsights => {
  const applications = toCount(snapshot.funnelData.applications);
  const offers = toCount(snapshot.funnelData.offers);
  const coe = toCount(snapshot.funnelData.coe);
  const lodged = toCount(snapshot.funnelData.lodged);
  const granted = toCount(snapshot.funnelData.granted);
  const refused = toCount(snapshot.funnelData.refused);
  const totalLeads = toCount(snapshot.funnelData.totalLeads);
  const topDestination = snapshot.topDestinations[0];
  const topSource = snapshot.topLeadSources[0];
  const topCounsellor = snapshot.topVisaGrantCounsellors[0];
  const topReferrer = snapshot.topStaffReferrers[0];
  const lowestTarget = [...snapshot.targetVsActual].sort((a, b) => a.achievement - b.achievement)[0];
  const totalDecisions = granted + refused;
  const grantDecisionShare = toPercentageOrNoData(granted, totalDecisions);
  const refusalDecisionShare = toPercentageOrNoData(refused, totalDecisions);
  const pendingDecisions = Math.max(lodged - totalDecisions, 0);
  const leadsToApplicationsRate = toPercentageOrNoData(applications, totalLeads);
  const offerRate = toPercentageOrNoData(offers, applications);
  const coeRate = toPercentageOrNoData(coe, offers);
  const lodgedRate = toPercentageOrNoData(lodged, coe);
  const decisionsExceedLodged = lodged > 0 && totalDecisions > lodged;
  const decisionsWithoutLodgedBase = lodged === 0 && totalDecisions > 0;
  const grantVsApplicationsRate = toPercentageOrNoData(granted, applications);
  const leadSourceShare = topSource ? toPercentageOrNoData(topSource.count, totalLeads) : 'No data available';
  const periodLabel = resolveFilterLabel(
    snapshot.selectedFunnelMonth,
    snapshot.selectedQuarter,
    snapshot.selectedFunnelYear,
  );
  const summary =
    `${snapshot.selectedFunnelLocation} performance for ${periodLabel} shows ${formatStage(applications)} applications, ${formatStage(offers)} offers, ${formatStage(coe)} CoE/LoA, ${formatStage(lodged)} lodged cases, and ${formatStage(granted)} visa grants.` +
    ` Visa decision mix in this window is ${grantDecisionShare} granted and ${refusalDecisionShare} refused when measured against all decisions made (${formatStage(totalDecisions)} total decisions).`;

  const targetPerformanceFindings = snapshot.targetVsActual.map((row) => {
    const gap = toGap(row.actual, row.target);
    const gapDirection =
      gap >= 0
        ? `above target by ${Math.abs(gap).toFixed(1)}`
        : `below target by ${Math.abs(gap).toFixed(1)}`;
    const implication =
      gap >= 0
        ? 'This means this metric is keeping up with plan for the selected period.'
        : 'This shortfall means this metric needs focused follow-up to catch up with plan.';
    return `${row.label}: We recorded ${row.actual.toLocaleString()} against a target of ${row.target.toLocaleString()}, so achievement is ${row.achievement.toFixed(1)}%. The result is ${gapDirection}. ${implication}`;
  });

  const trendTotals = snapshot.trendData.reduce(
    (acc, point) => {
      acc.granted += Number(point.granted || 0);
      acc.refused += Number(point.refused || 0);
      acc.lodged += Number(point.lodged || 0);
      return acc;
    },
    { granted: 0, refused: 0, lodged: 0 },
  );

  const stageConversionCandidates = [
    { label: 'Lead -> Application', from: totalLeads, to: applications },
    { label: 'Application -> Offer', from: applications, to: offers },
    { label: 'Offer -> CoE/LoA', from: offers, to: coe },
    { label: 'CoE/LoA -> Lodged', from: coe, to: lodged },
    { label: 'Lodged -> Granted', from: lodged, to: granted },
  ];
  const lowestConversion = stageConversionCandidates
    .filter((stage) => stage.from > 0)
    .map((stage) => ({
      ...stage,
      rate: toRateValue(stage.to, stage.from),
    }))
    .sort((left, right) => left.rate - right.rate)[0] ?? null;

  const keyFindings = [
    `The funnel moved from ${formatStage(applications)} applications to ${formatStage(granted)} granted visas after passing through offers, CoE/LoA, and lodged stages. Compared with applications submitted in this window, grant volume is ${grantVsApplicationsRate}. This comparison is directional because grant decisions can include cases submitted or lodged in earlier periods.`,
    `Lead-to-application conversion is ${leadsToApplicationsRate}, application-to-offer is ${offerRate}, offer-to-CoE is ${coeRate}, and CoE-to-lodged is ${lodgedRate}. These rates show how many students continue at each step of the journey. ${lowestConversion ? `The weakest measurable stage right now is ${lowestConversion.label} at ${lowestConversion.rate.toFixed(1)}%, so that stage should get first attention.` : 'Some stage rates are not measurable because the starting count is zero, so the team should first validate source lead capture for this period.'}`,
    `In this period, there are ${formatStage(granted)} granted and ${formatStage(refused)} refused decisions (${formatStage(totalDecisions)} total decisions). ${decisionsWithoutLodgedBase ? 'There are no newly lodged cases in this period, so lodged-based approval and refusal rates are not meaningful.' : `There are ${formatStage(pendingDecisions)} newly lodged cases still waiting for a final decision.`} ${decisionsExceedLodged ? 'Decision counts are higher than newly lodged counts because some decisions came from cases lodged before this period.' : ''}`.trim(),
    ...targetPerformanceFindings,
    topDestination
      ? `Top country destination is ${topDestination.name} with ${topDestination.apps} applications. This is ${toPercentage(topDestination.apps, Math.max(applications, 1))} of all applications in this report. It shows this destination is currently the strongest demand driver for the selected scope.`
      : 'Top country destination: No data available. The selected scope has no country destination records in this period.',
    snapshot.preferredCourses[0]
      ? `Top preferred course is ${snapshot.preferredCourses[0].name} with ${snapshot.preferredCourses[0].apps} selections. This means most student interest is currently concentrated in this study path. It is useful for planning school partnerships and counsellor guidance focus.`
      : 'Top preferred course: No data available. The selected scope has no course preference records in this period.',
    topSource
      ? `Top lead source is ${topSource.source} with ${topSource.count} leads. This contributes ${leadSourceShare} of all leads in scope. Keeping quality checks on this source can help protect conversion performance.`
      : 'Top lead source: No data available. The selected scope has no lead source records in this period.',
    topCounsellor
      ? `Top visa grant counsellor is ${topCounsellor.name} with ${topCounsellor.grants} grants. This is ${toPercentage(topCounsellor.grants, Math.max(granted, 1))} of total grants in the selected view. Their case handling pattern can be reviewed and shared with the wider team as a practical playbook.`
      : 'Top visa grant counsellor: No data available. The selected scope has no counsellor-level grant records in this period.',
    topReferrer
      ? `Top staff referrer is ${topReferrer.name} with ${topReferrer.referrals} referrals. This shows internal referrals are being generated and can support pipeline growth beyond paid channels. Replicating this staff behavior can help add more qualified leads.`
      : 'Top staff referrer: No data available. The selected scope has no staff referral records in this period.',
    snapshot.trendData.length
      ? `In this filtered window, visa trend totals are ${trendTotals.granted} granted, ${trendTotals.refused} refused, and ${trendTotals.lodged} lodged cases. This gives a clear view of workload versus final outcomes over time. Tracking these three numbers together helps explain whether approvals are growing with lodged volume.`
      : 'Visa trend data: No data available in the selected period. No monthly trend records were found for this filter.',
  ]
    .filter(Boolean)
    .slice(0, MAX_FINDINGS);

  const recommendedActions = [
    lowestTarget
      ? `Prioritize ${lowestTarget.label}; current attainment is ${lowestTarget.achievement.toFixed(1)}%. Close the ${formatSignedGap(toGap(lowestTarget.actual, lowestTarget.target))} gap by weekly pipeline reviews in ${snapshot.selectedFunnelLocation}.`
      : 'Improve the weakest metric in Target vs Actual by reviewing branch-level conversion blockers.',
    lowestConversion
      ? `Address the weakest stage conversion (${lowestConversion.label}) at ${lowestConversion.rate.toFixed(1)}% by enforcing follow-up SLAs and stage-aging controls for this reporting period.`
      : 'Fix lead capture quality first, then address the weakest measurable funnel stage with tighter follow-up and case progression controls.',
    topSource
      ? `Scale high-performing source playbooks from ${topSource.source}, then track offer and grant lift versus baseline over the next monthly cycle.`
      : 'Capture and categorize all lead sources to identify channels with the highest conversion.',
  ].slice(0, MAX_ACTIONS);

  return { executiveSummary: summary, keyFindings, recommendedActions };
};
