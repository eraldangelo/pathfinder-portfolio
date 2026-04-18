# Pathfinder Logic Contract

Purpose: document stable business and security behaviors and map them to automated checks.

Revision: 2026-04-18

## 1) Role and Scope Invariants

- Role helpers in `src/utils/roles.ts` are the baseline authority for frontend role behavior.
- Scope invariants:
  - Developer and Operations: global scope.
  - Branch Manager and Administrative Staff: branch scope.
  - Education Consultant: assigned scope where required.
  - Satellite Office Staff: restricted navigation and branch scope where applicable.
- Firestore lead/archive write invariants:
  - lead create/update/delete must remain role-scoped by branch/assignment for non-global roles.
  - lead child writes (`logs`, `notes`) must remain parent-lead scoped for non-global roles.
  - archive lead create/update/delete must enforce the same scope model.

Regression coverage:

- `src/utils/roles.test.ts`
- `src/components/app/hooks/firestoreDataUtils.test.ts`

## 2) Dashboard Milestone Invariants

- Funnel milestone counts must include current status and status history.
- Progressing an application status must not cause historical milestone drop-off in aggregates.
- Each milestone is attributed to its own event date/year (not the original application submission year).
  - Example: submitted in 2025, offer in 2026 -> `applications` counts in 2025, `offers` counts in 2026.
- Application Funnel period filters follow this normalization rule:
  - selecting a specific `month` resets `quarter` to `All Quarter`
  - selecting a specific `quarter` resets `month` to `All Months`
- Funnel branch alias grouping must remain stable:
  - `Baguio` is treated as `Pampanga`
  - `Cagayan de Oro` is treated as `Davao`
  - grouped aliases should not appear as separate Application Funnel branch options
- Month dropdown options are quarter-scoped when a quarter is selected (months outside the selected quarter are hidden).
- Filter-scoped dashboard widgets must follow branch/month/quarter/staff filters:
  - funnel cards
  - Target vs Actual
  - Leads by Branch
  - Top Country Destination
  - Preferred Course of Study
  - Top Lead Sources
- Heatmap origin invariants (global dashboard):
  - `Leads Origin` uses scoped lead submissions.
  - `Application Origin` includes only submissions whose lead IDs exist in the scoped application set.
  - rendered location is derived from submission `currentLocation`, with `referredStaffBranch` fallback.
- Global ranking widgets remain intentionally unscoped by the funnel filters:
  - Top Visa Grant Counsellors
  - Top Staff Referrers
- Education Consultant widget invariants:
  - `My Leads` card reflects assigned leads created/submitted in the current month.
  - `My Visa Pipeline` bars are month/quarter scoped.
  - `Visa Grant Rate` is overall assigned performance and must remain unscoped by month/quarter filters.

Regression coverage:

- `src/components/dashboard/utils/applicationStatusMatcher.test.ts`
- `src/components/dashboard/hooks/metrics/funnelMetrics.manager-core.test.ts`
- `src/components/dashboard/hooks/metrics/funnelMetrics.consultant.test.ts`
- `src/components/dashboard/utils/funnelFilters.test.ts`
- `src/components/dashboard/utils/targetVsActualMetrics.test.ts`
- `src/components/dashboard/utils/teamRankingMetrics.test.ts`
- `src/components/dashboard/components/default-dashboard/constants.test.ts`
- `src/components/dashboard/components/funnelFilterState.test.ts`
- `src/components/dashboard/widgets/LeadsHeatmap.utils.test.ts`

## 3) Archive Rollover Invariants

- `POST /api/archive/yearly-rollover` archives only completed, prior-year records.
- In-progress applications remain active and must not be archived.
- Archive page visibility uses `canViewArchiveRole` and intentionally includes:
  - `Developer`, `Operations`, `Branch Manager`, `Marketing`, `Administrative Staff`, `Education Consultant`.
- Yearly archive execution remains stricter and must stay `Developer` / `Operations` / `Branch Manager` only.
- Endpoint requires:
  - scheduler key path (`ARCHIVE_JOB_KEY`) or
  - authenticated bearer token with yearly-archive execution role.

Regression coverage:

- `src/app/api/archive/yearly-rollover/utils.test.ts`
- `src/app/api/_shared/routeAuthMatrix.test.ts`

## 4) API Authorization Invariants

Sensitive endpoints must reject missing bearer tokens with `401` and deny disallowed roles with `403`.
Privileged endpoints with body parsing must reject oversized payloads with `413`.
Rate-limited endpoints must return `429` when threshold is exceeded.

Covered routes:

- `POST /api/personnel/create`
- `POST /api/personnel/delete`
- `POST /api/personnel/force-password-reset`
- `POST /api/personnel/sync-balances`
- `POST /api/notifications/create`
- `POST /api/archive/yearly-rollover`
- `POST /api/dashboard/ai-report`
- `POST /api/geocode/locations`
- `POST /api/studynavi/sso`
- `GET /api/dashboard/top-staff-referrers`
- `GET /api/dashboard/top-visa-grant-counsellors`
- `GET /api/dashboard/global-visa-approval-trend`

StudyNavi SSO URL safety invariant:

- `parseStudyNaviBaseUrl` only accepts `https` targets.
- URL credentials are rejected.
- Optional `STUDYNAVI_ALLOWED_HOSTS` allowlist is enforced when configured.
- Production mode rejects loopback/private/local-network host targets (IPv4, IPv6, and local/internal hostnames).

Regression coverage:

- `src/app/api/_shared/auth.test.ts`
- `src/app/api/_shared/routeAuthMatrix.test.ts`
- `src/app/api/studynavi/sso/utils.test.ts`
- `src/app/api/turnstile/verify/token.test.ts`

## 5) Dashboard Export Invariants

- Dashboard PDF download wiring must remain connected:
  - header action -> `useDashboardDownloads` handler -> PDF build/cache -> browser download.
- While PDF is generating:
  - action enters downloading state
  - spinner appears
  - state resets after completion
- Repeat download path remains functional.

Smoke coverage:

- `e2e/smoke/dashboard-download-smoke.spec.ts`

## 6) Guardrails

- File size policy: source/test files should stay at or below default 250 lines, with explicit policy overrides only where documented (`npm run check:max-lines`).
- Secret leakage guard: repository secret scan (`npm run check:secrets`).
- Firestore rules contract guard: critical rule invariants must pass (`npm run check:firestore-rules-contract`).
- Semantic rules guard: emulator-based Firestore/Storage allow-deny behavior must pass (`npm run test:rules`).
- API strict type guard: server routes must pass strict TypeScript checks (`npm run typecheck:api:strict`).
- Unused export debt guard: actionable count must stay within budget (`npm run check:unused-exports` with `UNUSED_EXPORTS_MAX`).
- Production sanity guard: endpoint check (`npm run postdeploy:check`).
- Production drift guard: Cloud Run env/secrets/IAM + TTL + monitoring + App Check state assertion (`npm run ops:check:deploy-drift`).

## 7) Search Matching Invariants

- Shared search matcher (`src/utils/searchMatcher.ts`) is the canonical keyword matching behavior for:
  - current leads dataset
  - archived leads/applications datasets
  - school applications list (active and finished tabs)
- Search matcher behavior:
  - case-insensitive and diacritic-insensitive token matching
  - token order does not matter
  - numeric-only matching supports formatted phone numbers

## 8) Leave and Offset Invariants

- Leave balance logic (`src/utils/leave.ts`) must preserve:
  - monthly accrual: `2`
  - annual cap: `24`
  - carryover cap into a new year: `5`
  - yearly boundary handling uses Manila timezone
- Offset balance logic (`src/utils/offset.ts`) must preserve:
  - offset-use min/max constraints (`1` to `7` whole-hour path)
  - yearly reset of `offsetBalance` and `offsetUsed` at Manila new-year boundary
- Offset-use time-slot logic (`src/utils/offsetUse.ts`) must preserve:
  - consumed usage hours are computed from time range minus lunch overlap (`12:00-13:00`)
  - `12:00` is not offered as a start-time option in the request modal
- Approved offset-use checkpoint plotting (`functions/index.js`) must preserve:
  - conditional checkpoint writes at `09:00`, `12:00`, `13:00`, `17:00` when included in approved range
  - non-overwrite behavior for existing manual punches
  - standardized offset remark line append behavior

## 9) Branch-Change Request Invariants

- Branch-change submission persists both:
  - requester history at `personnel/{uid}/branchChangeRequests/{requestId}`
  - operational queue at `branchChangeRequestQueue/{requestId}`
- Queue records must include routing + notification health fields:
  - `targetBranchKey`, `targetRoles`, `status`
  - `notificationStatus`, `notificationAttemptedAt`, `notificationSentAt`, `notificationError`
- Notification dispatch failures must not invalidate request creation.
- Approver discoverability must not depend only on notifications:
  - approvers can query pending branch-change queue items by role/branch scope.
- Approval recipient lookup is migration-safe while personnel approval-field backfill is incomplete:
  - indexed `approvalBranchKey` candidates are merged with legacy branch-query candidates, then typed filtering + dedupe runs once.
  - after `npm run migrate:personnel-approval-fields:verify:strict` passes consistently, fallback merge can be retired in a later pass.
