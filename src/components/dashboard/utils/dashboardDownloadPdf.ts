import type { DashboardDownloadSnapshot } from './dashboardDownloadSnapshot';
import type { DashboardAiInsights } from './dashboardAiInsights';
import { resolveFilterLabel } from './dashboardReportPeriod';

export type PdfAutoTableRunner = (docRef: any, options: any) => void;

export const buildPdfReport = (
  doc: any,
  snapshot: DashboardDownloadSnapshot,
  aiInsights: DashboardAiInsights,
  autoTableRunner: PdfAutoTableRunner
) => {
  let finalY = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const bottomMargin = 14;
  const contentWidth = pageWidth - 28;

  const addPageIfNeeded = (spaceNeeded: number) => {
    if (finalY + spaceNeeded > pageHeight - bottomMargin) {
      doc.addPage();
      finalY = 14;
    }
  };

  const addSectionHeader = (title: string) => {
    addPageIfNeeded(20);
    doc.setFillColor(224, 239, 255);
    doc.roundedRect(marginX, finalY, contentWidth, 9, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 64, 151);
    doc.text(title, marginX + 3, finalY + 6);
    finalY += 13;
  };

  const drawWrappedParagraph = (text: string, width = contentWidth, indent = 0) => {
    const lines = doc.splitTextToSize(text || 'No data available.', width);
    lines.forEach((line: string) => {
      addPageIfNeeded(5);
      doc.text(line, marginX + indent, finalY);
      finalY += 5;
    });
  };

  const drawBulletList = (items: string[]) => {
    const safeItems = items.length ? items : ['No data available.'];
    safeItems.forEach((item) => {
      const wrapped = doc.splitTextToSize(item, contentWidth - 8);
      wrapped.forEach((line: string, index: number) => {
        addPageIfNeeded(5);
        const prefix = index === 0 ? '- ' : '  ';
        doc.text(`${prefix}${line}`, marginX + 2, finalY);
        finalY += 5;
      });
    });
  };

  const drawNumberedList = (items: string[]) => {
    const safeItems = items.length ? items : ['No data available.'];
    safeItems.forEach((item, itemIndex) => {
      const numberPrefix = `${itemIndex + 1}. `;
      const wrapped = doc.splitTextToSize(item, contentWidth - 10);
      wrapped.forEach((line: string, lineIndex: number) => {
        addPageIfNeeded(5);
        const prefix = lineIndex === 0 ? numberPrefix : '   ';
        doc.text(`${prefix}${line}`, marginX + 2, finalY);
        finalY += 5;
      });
    });
  };

  const addTableSection = (title: string, head: any[], body: any[], columnStyles = {}) => {
    addSectionHeader(title);
    const columns = Array.isArray(head?.[0]) ? head[0].length : 0;
    const fallbackRow = Array.from({ length: columns }, (_, index) =>
      index === 0 ? 'No data available' : '-'
    );
    const safeBody = body.length ? body : [fallbackRow];
    autoTableRunner(doc, {
      head,
      body: safeBody,
      startY: finalY,
      margin: { left: marginX, right: marginX },
      theme: 'grid',
      headStyles: { fillColor: [224, 239, 255], textColor: [0, 64, 151] },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles,
    });
    finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : finalY + 8;
  };

  addPageIfNeeded(46);
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(marginX, finalY, contentWidth, 36, 3, 3, 'F');
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(29, 78, 216);
  doc.text('Dashboard Intelligence Report', marginX + 3, finalY + 8);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);
  const leftMetaX = marginX + 3;
  const rightMetaX = marginX + contentWidth / 2 + 2;
  doc.text(`Prepared for: ${snapshot.userName || 'N/A'}`, leftMetaX, finalY + 15);
  doc.text(`Generated On: ${snapshot.reportDate}`, leftMetaX, finalY + 21);
  doc.text(`Funnel Scope: ${snapshot.selectedFunnelLocation}`, rightMetaX, finalY + 15);
  doc.text(
    `Filter by: ${resolveFilterLabel(snapshot.selectedFunnelMonth, snapshot.selectedQuarter, snapshot.selectedFunnelYear)}`,
    rightMetaX,
    finalY + 21
  );
  finalY += 44;

  addSectionHeader('Section 1: AI Insights');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55);
  addPageIfNeeded(5);
  doc.text('Executive Summary', marginX, finalY);
  finalY += 5;
  doc.setFont('helvetica', 'normal');
  drawWrappedParagraph(aiInsights.executiveSummary || 'No data available.');
  finalY += 2;

  doc.setFont('helvetica', 'bold');
  addPageIfNeeded(5);
  doc.text('Key Findings', marginX, finalY);
  finalY += 5;
  doc.setFont('helvetica', 'normal');
  drawBulletList(aiInsights.keyFindings);
  finalY += 2;

  doc.setFont('helvetica', 'bold');
  addPageIfNeeded(5);
  doc.text('Recommended Actions', marginX, finalY);
  finalY += 5;
  doc.setFont('helvetica', 'normal');
  drawNumberedList(aiInsights.recommendedActions);
  finalY += 4;

  addTableSection(
    `Section 2: Application Funnel (${snapshot.selectedFunnelLocation})`,
    [Object.keys(snapshot.funnelData)],
    [Object.values(snapshot.funnelData)]
  );
  addTableSection(
    'Section 3: Target vs Actual Data',
    [['Metric', 'Actual', 'Target', 'Achievement (%)']],
    snapshot.targetVsActual.map((item) => [item.label, item.actual, item.target, item.achievement.toFixed(1)])
  );
  addTableSection(
    'Section 4: Top Country Destinations',
    [['Country', 'Applications']],
    snapshot.topDestinations.map((item) => [item.name, item.apps])
  );
  addTableSection(
    'Section 5: Preferred Course of Study',
    [['Course', 'Applications']],
    snapshot.preferredCourses.map((item) => [item.name, item.apps])
  );
  addTableSection(
    'Section 6: Top Lead Sources',
    [['Source', 'Count']],
    snapshot.topLeadSources.map((item) => [item.source, item.count])
  );
  addTableSection(
    'Section 7: Top Visa Grant Counsellors',
    [['Counsellor', 'Visa Grants']],
    snapshot.topVisaGrantCounsellors.map((item) => [item.name, item.grants])
  );
  addTableSection(
    'Section 8: Top Staff Referrers',
    [['Staff', 'Referrals']],
    snapshot.topStaffReferrers.map((item) => [item.name, item.referrals])
  );
  addTableSection(
    `Section 9: VIsa Rate Trend (${snapshot.selectedLocation})`,
    [['Month', 'Visa Granted', 'Visa Refused', 'Visa Lodged']],
    snapshot.trendData.map((item) => [item.month, item.granted, item.refused, item.lodged])
  );

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(`Page ${page} of ${totalPages}`, pageWidth - marginX, pageHeight - 6, { align: 'right' });
  }
};
