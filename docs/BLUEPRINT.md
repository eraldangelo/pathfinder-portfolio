# Pathfinder Blueprint

Doc revision: 2026-04-18

## 1) Product Scope

Pathfinder is the internal Pathfinder operating system for:

- lead intake and endorsement
- school application lifecycle management
- role-based dashboard reporting
- personnel management
- notifications
- timesheet/leave/offset workflows
- yearly archive rollover

The app is Firebase-backed and designed for near real-time updates.

## 2) Runtime Architecture

### 2.1 Route Structure

- Public route:
  - `src/app/(public)/login/page.tsx`
- Protected route group:
  - `src/app/(protected)/layout.tsx` (AuthGuard)
  - `src/app/(protected)/page.tsx` (`/navigation` redirect)
  - `src/app/(protected)/[...slug]/page.tsx` (SPA shell mount)

### 2.2 Client Startup Chain

- `src/app/client-only.tsx`
- `src/app/app-root.tsx`
- `src/components/app/App.tsx`

`App.tsx` composes:

- auth session (`useAuthSession`)
- global Firestore data (`useFirestoreData`)
- notifications/time tracking state
- role-aware navigation
- yearly archive auto-attempt (`useYearlyArchiveRollover`)

### 2.3 View Routing

Client-side view state is managed by `useAppUiState` and rendered by `AppView`.

Active views include:

- dashboard
- leads
- applications
- application-detail
- education-providers
- timesheet
- personnel
- notifications
- archive
- profile
- logout

## 3) Data Model (Firestore)

### 3.1 Primary Collections

- `personnel/{uid}`
- `leads/{leadId}`
- `leads/{leadId}/applications/{applicationId}`
- `leads/{leadId}/notes/{noteId}`
- `leads/{leadId}/logs/{logId}`
- `leads/{leadId}/status/{statusId}`
- `personnel/{uid}/notifications/{notificationId}`
- `personnel/{uid}/timesheets/{dateKey}`
- `personnel/{uid}/leaveRequests/{requestId}`
- `personnel/{uid}/offsetRequests/{requestId}`
- `personnel/{uid}/branchChangeRequests/{requestId}`
- `branchChangeRequestQueue/{requestId}`

Branch-change storage is intentionally two-layered:

- requester history lives under each personnel folder (`personnel/{uid}/branchChangeRequests/*`)
- approver operations use the top-level queue/index (`branchChangeRequestQueue/*`)

Queue records track operational routing and notification health:

- `targetBranchKey`, `targetRoles`, `status`
- `notificationStatus`, `notificationAttemptedAt`, `notificationSentAt`, `notificationError`
- optional `approverSummary` for matched recipients

### 3.2 Lead Documents

The `leads` collection stores both:

- standard lead records
- assessment submission-style records

Client filtering (`isAssessmentSubmissionDoc`) separates both shapes.

### 3.3 Application Records

Applications are nested under `leads/{leadId}/applications/{applicationId}`.  
Reads commonly use `collectionGroup('applications')` with role/client filters.

## 4) Role Access Model

Role predicates live in `src/utils/roles.ts`.

Primary rules:

- `Developer` / `Operations`: global scope
- `Branch Manager` / `Administrative Staff`: branch scope
- `Education Consultant`: assignment-based scope for leads/application edit paths
- `Satellite Office Staff`: restricted from applications, education providers, and personnel views
- Archive view allowed for `Developer`, `Operations`, `Branch Manager`

UI access helpers:

- student modal permissions: `studentInfoModalHelpers`
- leave/offset approval access: `timesheet/utils/*Access.ts`
- notification approval access: `notificationApprovalUtils.ts`

## 5) Security Model

### 5.1 Firestore Rules

Rules: `firestore.rules`

Highlights:

- role + branch checks are derived from `personnel/{uid}`
- read/write constraints for leads/applications/status subcollections
- lead and archive write paths are scope-guarded (global roles vs branch/assignment-scoped roles)
- consultant + branch manager application updates are constrained to assigned records
- `passwordNeedsReset` is not client-self-mutable via Firestore rules
- collection group safety net rules exist for:
  - `applications`
  - `leaveRequests`
  - `offsetRequests`
  - `timesheets`
- default deny-all fallback

### 5.2 Storage Rules

Rules: `storage.rules`

Highlights:

- profile picture ownership constraints
- report screenshot storage reads are owner/admin scoped
- authenticated access for protected uploads

## 6) Dashboard Architecture

Key folder: `src/components/dashboard`

Role-based layout entry:

- `components/DashboardContent.tsx`

Current dashboard pillars:

- Application Funnel
- Target vs Actual metrics
- Top Country / Course / Lead Source rankings
- Top Visa Grant Counsellors
- Top Staff Referrers
- Visa Approval Rate Trend
- Heatmap (role/layout dependent)

### 6.1 Funnel Filter Model

- Default dashboard funnel controls:
  - Branch, Month, Quarter, Staff
- Education Consultant funnel controls:
  - Month, Quarter
- Month and quarter selection are mutually normalizing:
  - specific month -> quarter resets to `All Quarter`
  - specific quarter -> month resets to `All Months`
- Month dropdown options are quarter-scoped when a quarter is selected.
- Filter-scoped widgets:
  - funnel KPI cards
  - Target vs Actual
  - Leads by Branch
  - Top Country Destination
  - Preferred Course of Study
  - Top Lead Sources
- Global (intentionally unscoped) widgets:
  - Top Visa Grant Counsellors
  - Top Staff Referrers
- Heatmap (global dashboard) exposes an origin dropdown:
  - `Leads Origin` (default)
  - `Application Origin` (only leads with applications in current funnel scope)
- Heatmap location source is submission `currentLocation` with `referredStaffBranch` fallback.

### 6.2 Metric Consistency Rule

Milestone counts must not depend only on "current status".  
Use current status plus status history (`hasStatusInCurrentOrHistory`) to avoid count drop-offs when statuses progress.

### 6.3 Education Consultant Widget Rules

- Consultant `My Leads` card reports current-month assigned leads only.
- Consultant `My Visa Pipeline` bars respect selected month/quarter/year filters.
- Consultant `Visa Grant Rate` remains overall and up-to-date for assigned applications (not reduced by month/quarter filters).

### 6.4 Report Exports

`useDashboardDownloads` builds report snapshots and exports:

- PDF
- Excel

AI insights path:

- `POST /api/dashboard/ai-report`
- OpenAI response parsed through `parseDashboardAiInsights`
- fallback narrative generation if AI fails/unavailable

## 7) Archive System

UI:

- `src/components/archive/components/ArchivePage.tsx`

Server endpoint:

- `POST /api/archive/yearly-rollover`

Rules:

- archives previous-year completed records
- keeps unfinished/in-progress applications active
- stores rollover status under `system/archive-rollovers/years/{year}`
- supports:
  - authenticated manual trigger (`Developer`, `Operations`, `Branch Manager` only)
  - scheduler-style trigger via `x-archive-job-key` + `ARCHIVE_JOB_KEY`

Archive role split:

- page visibility is broader (`canViewArchiveRole`): `Developer`, `Operations`, `Branch Manager`, `Marketing`, `Administrative Staff`, `Education Consultant`
- yearly rollover execution is stricter (`isArchiveViewerRole` / `canRunYearlyArchiveRole`): `Developer`, `Operations`, `Branch Manager`

Automatic trigger:

- `useYearlyArchiveRollover` attempts once per client/year (localStorage guarded)

## 8) Timesheet System

Key folder: `src/components/timesheet`

Capabilities:

- time in/out + lunch logs
- leave request workflow + approvals
- offset add/use workflow + approvals
- auto-plot approved leave/offset use into timesheets
- team timesheet views (role-scoped)
- admin PH download tab:
  - `admin_ph@example.com` only
  - branch/month/cutoff/year filters
  - one Excel workbook, one sheet per staff

## 9) API Surface

All in `src/app/api`.

- `POST /api/turnstile/verify`
- `POST /api/personnel/create`
- `POST /api/personnel/delete`
- `POST /api/personnel/force-password-reset`
- `POST /api/geocode/locations`
- `POST /api/dashboard/ai-report`
- `GET /api/dashboard/top-visa-grant-counsellors`
- `GET /api/dashboard/top-staff-referrers`
- `GET /api/dashboard/global-visa-approval-trend`
- `POST /api/archive/yearly-rollover`
- `POST /api/studynavi/sso`

Auth model:

- most privileged routes require bearer ID token
- admin routes use Firebase Admin SDK token verification
- role checks enforced server-side where needed
- route-level rate limiting is enforced on exposed heavy/sensitive API routes
- oversized payloads are rejected before expensive work on privileged POST routes

## 10) Environment Model

Core:

- `NEXT_PUBLIC_FIREBASE_*`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `FIREBASE_ADMIN_SDK_JSON`

Feature keys:

- `OPENAI_API_KEY`
- `OPENAI_REPORT_MODEL` (optional; default `gpt-4.1-mini`)
- `STUDYNAVI_URL`
- `NEXT_PUBLIC_STUDYNAVI_URL`
- `STUDYNAVI_ALLOWED_HOSTS` (optional)
- `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY` (required when App Check is enforced for Firebase Authentication)
- `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN` (optional, local debug)
- `ARCHIVE_JOB_KEY` (optional scheduler path)
- `GEOCODING_PROVIDER` (optional; `google` or `nominatim`)
- `GOOGLE_GEOCODING_API_KEY` (optional; required when forcing `GEOCODING_PROVIDER=google`)

## 11) Index and Rules Maintenance

Files:

- `firestore.indexes.json`
- `firestore.rules`

Operational command:

- `npm run check:firestore-indexes`
- `npm run check:firestore-rules-contract`

Policy:

- every query shape change should be validated against indexes
- every role/permission change must be mirrored in rules, not only frontend

## 12) Test Coverage and Quality Gates

Current checks:

- `npm run check:firestore-indexes`
- `npm run check:firestore-rules-contract`
- `npm run check:java`
- `npm run test:rules`
- `npm run typecheck`
- `npm run typecheck:api:strict`
- `npm run lint`
- `npm run check:max-lines`
- `npm run check:secrets`
- `npm run check:unused-exports`
- `npm run test`
- `npm run build`
- `npm run verify`
- `npm run test:e2e:smoke`
- `npm run verify:smoke`
- `npm run postdeploy:check`
- `npm run ops:check:deploy-drift`
- `npm run ops:ensure:alerting`
- `cd functions && npm run lint`

CI workflow:

- `.github/workflows/quality-gate.yml`
- runs `npm audit --omit=dev`, `npm run verify`, semantic emulator rules tests (`npm run test:rules`), `functions` lint verification, and `npm run test:e2e:smoke` on `main` pushes and pull requests.
- `.github/workflows/security-gate.yml` runs secret scan, dependency review (PR), npm audit moderate+ enforcement, and unused-exports advisory reporting.
- `.github/workflows/codeql.yml` runs CodeQL SAST on push/PR and weekly schedule.
- `.github/workflows/postdeploy-uptime-check.yml` runs scheduled/manual endpoint checks on production.
- `.github/workflows/ops-drift-verification.yml` runs scheduled/manual production drift assertions (TTL, App Check, monitoring, Cloud Run config) via OIDC-authenticated gcloud.

Current automated tests focus on:

- role behavior
- query config and scoping
- dashboard filter interactions (month/quarter + scoped/global widget expectations)
- status/milestone metric logic

## 13) Change Checklist

When touching role-sensitive or metric-sensitive logic:

1. update role helper(s) in `src/utils/roles.ts` if needed
2. update Firestore query scope in `useFirestoreData` / related hooks
3. update Firestore rules to match
4. update index definitions if query shape changed
5. run quality gates (`typecheck`, `lint`, `test`, `build`)
6. smoke test per impacted role (Developer, Operations, Branch Manager, Education Consultant, Administrative Staff, Satellite Office Staff)
