import { z } from 'zod';

const dashboardSnapshotSchema = z
  .object({
    userName: z.string().min(1),
    reportDate: z.string().min(1),
    selectedFunnelLocation: z.string().min(1),
    selectedFunnelMonth: z.string().min(1),
    selectedFunnelYear: z.string().min(1),
    selectedLocation: z.string().min(1),
    funnelData: z.record(z.string(), z.unknown()),
    targetVsActual: z.array(z.unknown()),
    topDestinations: z.array(z.unknown()),
    preferredCourses: z.array(z.unknown()),
    topLeadSources: z.array(z.unknown()),
    topVisaGrantCounsellors: z.array(z.unknown()),
    topStaffReferrers: z.array(z.unknown()),
    trendData: z.array(z.unknown()),
  })
  .passthrough();

export const dashboardAiReportBodySchema = z.object({
  snapshot: dashboardSnapshotSchema,
});
