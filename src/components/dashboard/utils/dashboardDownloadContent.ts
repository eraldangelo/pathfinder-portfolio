import type { DashboardDownloadSnapshot } from './dashboardDownloadSnapshot';
import type { DashboardAiInsights } from './dashboardAiInsights';
import { resolveFilterLabel } from './dashboardReportPeriod';

const toCsvSection = (headers: string[], data: any[], accessor: (item: any) => any[]) => {
  let csv = headers.join(',') + '\n';
  csv += data.map((item) => accessor(item).map((value) => `"${value}"`).join(',')).join('\n');
  return csv;
};

const toHtmlTable = (title: string, headers: string[], data: any[], accessor: (item: any) => any[]) => {
  let html = `<h2>${title}</h2><table border="1"><thead><tr>${headers
    .map((header) => `<th>${header}</th>`)
    .join('')}</tr></thead><tbody>`;
  html += data.map((item) => `<tr>${accessor(item).map((value) => `<td>${value}</td>`).join('')}</tr>`).join('');
  html += '</tbody></table><br/>';
  return html;
};

const escapeCsvValue = (value: string) => value.replace(/"/g, '""');

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderAiInsightsHtml = (aiInsights: DashboardAiInsights) => {
  const findings = aiInsights.keyFindings.length ? aiInsights.keyFindings : ['No data available.'];
  const actions = aiInsights.recommendedActions.length ? aiInsights.recommendedActions : ['No data available.'];

  return `
    <h2>AI Insights</h2>
    <h3>Executive Summary</h3>
    <p>${escapeHtml(aiInsights.executiveSummary || 'No data available.')}</p>
    <h3>Key Findings</h3>
    <ul>${findings.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    <h3>Recommended Actions</h3>
    <ol>${actions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>
  `;
};

export const buildCsvContent = (snapshot: DashboardDownloadSnapshot, aiInsights: DashboardAiInsights) => {
  let csvContent = '';
  csvContent += `Dashboard Intelligence Report,${snapshot.reportDate}\n`;
  csvContent += `Prepared For,${snapshot.userName}\n`;
  csvContent += `Scope,${snapshot.selectedFunnelLocation}\n`;
  csvContent += `Filter by,${resolveFilterLabel(snapshot.selectedFunnelMonth, snapshot.selectedQuarter, snapshot.selectedFunnelYear)}\n\n`;

  csvContent += 'AI Insights,\n';
  csvContent += `"Executive Summary","${escapeCsvValue(aiInsights.executiveSummary || 'No data available.')}"\n`;
  csvContent += 'Key Findings,\n';
  if (aiInsights.keyFindings.length) {
    aiInsights.keyFindings.forEach((finding, index) => {
      csvContent += `"Finding ${index + 1}","${escapeCsvValue(finding)}"\n`;
    });
  } else {
    csvContent += '"Finding 1","No data available."\n';
  }
  csvContent += 'Recommended Actions,\n';
  if (aiInsights.recommendedActions.length) {
    aiInsights.recommendedActions.forEach((action, index) => {
      csvContent += `"Action ${index + 1}","${escapeCsvValue(action)}"\n`;
    });
  } else {
    csvContent += '"Action 1","No data available."\n';
  }
  csvContent += '\n';

  csvContent += 'Application Funnel,,,,,,,\n';
  csvContent += toCsvSection(Object.keys(snapshot.funnelData), [snapshot.funnelData], (item) => Object.values(item)) + '\n\n';

  csvContent += 'Target vs Actual Data,,,\n';
  csvContent += toCsvSection(['Metric', 'Actual', 'Target', 'Achievement (%)'], snapshot.targetVsActual, (item) => [
    item.label,
    item.actual,
    item.target,
    item.achievement.toFixed(1),
  ]) + '\n\n';

  csvContent += 'Top Country Destinations,,\n';
  csvContent += toCsvSection(['Country', 'Applications'], snapshot.topDestinations, (item) => [item.name, item.apps]) + '\n\n';

  csvContent += 'Preferred Course of Study,,\n';
  csvContent += toCsvSection(['Course', 'Applications'], snapshot.preferredCourses, (item) => [item.name, item.apps]) + '\n\n';

  csvContent += 'Top Lead Sources,,\n';
  csvContent += toCsvSection(['Source', 'Count'], snapshot.topLeadSources, (item) => [item.source, item.count]) + '\n\n';

  csvContent += 'Top Visa Grant Counsellors,,\n';
  csvContent += toCsvSection(['Counsellor', 'Visa Grants'], snapshot.topVisaGrantCounsellors, (item) => [
    item.name,
    item.grants,
  ]) + '\n\n';

  csvContent += 'Top Staff Referrers,,\n';
  csvContent += toCsvSection(['Staff', 'Referrals'], snapshot.topStaffReferrers, (item) => [item.name, item.referrals]) + '\n\n';

  csvContent += `VIsa Rate Trend (${snapshot.selectedLocation}),,,\n`;
  csvContent += toCsvSection(['Month', 'Visa Granted', 'Visa Refused', 'Visa Lodged'], snapshot.trendData, (item) => [
    item.month,
    item.granted,
    item.refused,
    item.lodged,
  ]) + '\n\n';

  return csvContent;
};

export const buildExcelContent = (snapshot: DashboardDownloadSnapshot, aiInsights: DashboardAiInsights) => {
  const styles = `
    <style>
      body { font-family: "Segoe UI", Tahoma, Arial, sans-serif; color: #1f2937; padding: 20px; }
      .report-header { padding: 16px 20px; border: 1px solid #dbeafe; background: #eff6ff; border-radius: 10px; margin-bottom: 18px; }
      .report-title { font-size: 24px; font-weight: 700; color: #1d4ed8; margin: 0 0 8px 0; }
      .report-meta { font-size: 13px; margin: 2px 0; }
      .section-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; margin-bottom: 14px; background: #ffffff; }
      .section-card h2, .section-card h3, .section-card h4 { color: #1d4ed8; margin: 0 0 10px 0; }
      table { border-collapse: collapse; width: 100%; margin-top: 10px; }
      th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; font-size: 12px; }
      th { background: #eff6ff; color: #1e3a8a; font-weight: 700; }
      tr:nth-child(even) td { background: #f8fafc; }
      ul { margin: 8px 0 0 18px; padding: 0; }
      li { margin: 4px 0; font-size: 12px; }
      p { margin: 6px 0; font-size: 12px; }
    </style>
  `;

  let htmlContent = styles;
  htmlContent += `<div class="report-header"><h1 class="report-title">Dashboard Intelligence Report</h1>`;
  htmlContent += `<p class="report-meta"><strong>Prepared For:</strong> ${snapshot.userName}</p>`;
  htmlContent += `<p class="report-meta"><strong>Generated On:</strong> ${snapshot.reportDate}</p>`;
  htmlContent += `<p class="report-meta"><strong>Scope:</strong> ${snapshot.selectedFunnelLocation}</p>`;
  htmlContent += `<p class="report-meta"><strong>Filter by:</strong> ${resolveFilterLabel(snapshot.selectedFunnelMonth, snapshot.selectedQuarter, snapshot.selectedFunnelYear)}</p></div>`;

  htmlContent += `<div class="section-card">${renderAiInsightsHtml(aiInsights)}</div>`;

  htmlContent += `<div class="section-card">${toHtmlTable('Application Funnel', Object.keys(snapshot.funnelData), [snapshot.funnelData], (item) =>
    Object.values(item)
  )}</div>`;
  htmlContent += `<div class="section-card">${toHtmlTable('Target vs Actual Data', ['Metric', 'Actual', 'Target', 'Achievement (%)'], snapshot.targetVsActual, (item) => [
    item.label,
    item.actual,
    item.target,
    item.achievement.toFixed(1),
  ])}</div>`;
  htmlContent += `<div class="section-card">${toHtmlTable('Top Country Destinations', ['Country', 'Applications'], snapshot.topDestinations, (item) => [item.name, item.apps])}</div>`;
  htmlContent += `<div class="section-card">${toHtmlTable('Preferred Course of Study', ['Course', 'Applications'], snapshot.preferredCourses, (item) => [item.name, item.apps])}</div>`;
  htmlContent += `<div class="section-card">${toHtmlTable('Top Lead Sources', ['Source', 'Count'], snapshot.topLeadSources, (item) => [item.source, item.count])}</div>`;
  htmlContent += `<div class="section-card">${toHtmlTable('Top Visa Grant Counsellors', ['Counsellor', 'Visa Grants'], snapshot.topVisaGrantCounsellors, (item) => [
    item.name,
    item.grants,
  ])}</div>`;
  htmlContent += `<div class="section-card">${toHtmlTable('Top Staff Referrers', ['Staff', 'Referrals'], snapshot.topStaffReferrers, (item) => [item.name, item.referrals])}</div>`;
  htmlContent += `<div class="section-card">${toHtmlTable(`VIsa Rate Trend (${snapshot.selectedLocation})`, ['Month', 'Visa Granted', 'Visa Refused', 'Visa Lodged'], snapshot.trendData, (item) => [
    item.month,
    item.granted,
    item.refused,
    item.lodged,
  ])}</div>`;

  return htmlContent;
};
