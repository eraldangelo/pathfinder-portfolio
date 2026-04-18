export const buildDefaultDashboardTitles = ({
  isBranchScopedDefaultDashboard,
  isBranchManagerDashboard,
  branchScopedLocation,
  t,
}: {
  isBranchScopedDefaultDashboard: boolean;
  isBranchManagerDashboard: boolean;
  branchScopedLocation: string;
  t: (key: string, defaultValue?: string) => string;
}) => {
  const branchLabel = branchScopedLocation || t('myBranch', 'My Branch');
  const funnelHeadingLabel = isBranchManagerDashboard
    ? t('myBranchApplicationFunnel', 'My Branch Application Funnel')
    : t('applicationFunnel');
  const targetVsActualTitle = isBranchScopedDefaultDashboard
    ? `${branchLabel} ${t('targetVsActualData', 'Target vs Actual Data')}`
    : t('overallTargetVsActualData', 'Target vs Actual Data');
  const topCountryTitle = isBranchManagerDashboard
    ? t('myBranchTopCountryDestination', 'My Branch Top Country Destination')
    : t('topCountryDestination');
  const preferredCourseTitle = isBranchManagerDashboard
    ? t('myBranchPreferredCourseOfStudy', 'My Branch Preferred course of study')
    : t('preferredCourseOfStudy');
  const topLeadSourceTitle = isBranchManagerDashboard
    ? t('myBranchTopLeadSources', 'My Branch Top Lead Sources')
    : t('topLeadSources');
  const topStaffReferrersTitle = isBranchScopedDefaultDashboard
    ? t('topStaffReferrersGlobal', 'Top Staff Referrers (Global)')
    : t('topStaffReferrers', 'Top Staff Referrers');

  return {
    funnelHeadingLabel,
    targetVsActualTitle,
    topCountryTitle,
    preferredCourseTitle,
    topLeadSourceTitle,
    topStaffReferrersTitle,
  };
};
