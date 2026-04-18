# Pathfinder

Pathfinder is an operations platform for leads, school applications, dashboards, notifications, archive, personnel, and timesheets.

## Doc Revision

- last updated: 2026-04-18
- this revision aligns docs to the current hardened baseline and portfolio sanitization pass (local-only media assets, generic project endpoints, and removed school website/source links from seed data).

## Stack

- Next.js 16 App Router (`src/app`)
- React + TypeScript
- Firebase client SDK (Auth, Firestore, Storage)
- Firebase Admin SDK (server routes)
- Cloudflare Turnstile (login verification)
- Playwright (smoke E2E)
- Cloud Run deployment via Cloud Build

## Runtime Architecture

- Public login route: `src/app/(public)/login/page.tsx`
- Protected route group: `src/app/(protected)`
- Protected redirect: `src/app/(protected)/page.tsx` -> `/navigation`
- Protected shell route: `src/app/(protected)/[...slug]/page.tsx`
- App startup chain:
  - `src/app/client-only.tsx`
  - `src/app/app-root.tsx`
  - `src/components/app/App.tsx`

The app is a protected SPA shell; client-side view switching is handled by `useAppUiState` + `AppView`.

## Asset Link Registry

Image sources are centralized so branding/assets can be replaced from one source:

- `src/config/imageLinks.ts`
  - global branding assets (logo, favicon, background, mascot) served from local `public/assets/branding/*`
  - shared UI imagery (headers, transfer icon, status runner, podium medals) served from local `public/assets/ui/*`
- `src/config/schoolImageLinks.ts`
  - school-logo placeholder registry (local-only; no external logo host dependency)
- `src/components/common/components/SchoolLogo.tsx`
  - resolves school logos from centralized registry first, then initials fallback (no external Clearbit fallback)

## Main Views

- Dashboard
- Profiles (Leads)
- School Applications
- Application Detail
- Education Providers
- Timesheet
- Personnel
- Notifications
- Archive
- Profile

## Role Model

Role helpers are centralized in `src/utils/roles.ts`.

Primary roles:

- `Developer`
- `Operations`
- `Branch Manager`
- `Education Consultant`
- `Administrative Staff`
- `Satellite Office Staff`

High-level behavior:

- `Developer` / `Operations`: global data visibility.
- `Branch Manager` / `Administrative Staff`: branch-scoped visibility for leads/submissions/applications.
- `Education Consultant`: assigned-only visibility for lead/application actions where required.
- `Satellite Office Staff`: restricted navigation (no applications, no education providers, no personnel), branch-scoped where applicable.
- Archive access policy:
  - Archive page visibility (`canViewArchiveRole`): `Developer`, `Operations`, `Branch Manager`, `Marketing`, `Administrative Staff`, and `Education Consultant`.
  - Yearly archive execution (`isArchiveViewerRole` / `canRunYearlyArchiveRole`): `Developer`, `Operations`, and `Branch Manager` only.

Authoritative enforcement:

- Frontend scope/query logic: `src/components/app/hooks/useFirestoreData.ts` and feature-level access helpers.
- Firestore rules: `firestore.rules` (must remain aligned with role logic).

## Core Features

- **Leads + Student Modal**
  - Admin/consultation actions
  - Notes/logs
  - Endorsement + assignment flows
  - Application creation from lead context
- **School Applications**
  - Status timeline/history
  - Milestone notifications
  - Role-aware edit permissions
- **Dashboard**
  - Role-based widget layouts
  - Application Funnel filters (Branch, Month, Quarter, Staff) on default dashboards
  - Application Funnel filters (Month, Quarter) on Education Consultant dashboards
  - Month/Quarter mutual normalization and quarter-scoped month options
  - Milestone-safe metrics (current status + status history)
  - Filter-scoped widgets: Target vs Actual, Leads by Branch, Top Country, Preferred Course, Top Lead Sources
  - Global ranking widgets: Top Visa Grant Counsellors and Top Staff Referrers remain unscoped
  - Heatmap origin filter:
    - `Leads Origin` (default): plots locations from scoped leads
    - `Application Origin`: plots locations for leads that have applications in the active funnel scope
    - location source is lead submission `currentLocation` (fallback `referredStaffBranch`)
  - Education Consultant widget invariants:
    - `My Leads` shows assigned leads for the current month (`Leads Assigned To You This Month`)
    - `My Visa Pipeline` bars follow selected month/quarter, while `Visa Grant Rate` stays up-to-date from overall assigned visa outcomes
  - Heatmap geocoding endpoint
  - PDF/Excel report exports
  - AI-generated insights for exported reports
- **Archive**
  - View access is broader for operations workflows (see role model above)
  - Yearly rollover archives completed records
  - Yearly rollover execution remains restricted to `Developer`, `Operations`, and `Branch Manager`
  - Keeps in-progress/unfinished applications active
  - Manual + guarded automatic trigger flow
- **Timesheet**
  - Time in/out, lunch, leave, offset
  - Approval workflows
  - Auto-plot from approved requests
  - Offset-use duration excludes lunch overlap (`12:00-13:00`) from consumed offset credits
  - Offset-use start-time dropdown excludes `12:00`
  - Approved offset-use requests append standardized remark lines and apply boundary checkpoints only when crossed:
    - `09:00` -> auto `timeIn`
    - `12:00` -> auto lunch-out (`lunchStart`)
    - `13:00` -> auto lunch-in (`lunchEnd`)
    - `17:00` -> auto `timeOut`
  - Auto-plot logic does not overwrite existing manual punches
  - Leave policy runtime logic:
    - accrual: `2` leave credits/month
    - annual cap: `24`
    - carryover cap into new year: `5`
  - Offset policy runtime logic:
    - offset-use request minimum is `1` hour (whole-hour usage path)
    - offset balances reset at new-year boundary in Manila timezone
  - `admin_ph@example.com` gets a Timesheet Download tab that exports one workbook with one sheet per staff member
- **Notifications**
  - Persistent Firestore-backed notifications
  - Action/event-key formatting and approval flows

## API Routes

- `POST /api/turnstile/verify`
  - Verifies Cloudflare Turnstile token.
- `POST /api/personnel/create`
  - Admin SDK endpoint; role-gated personnel + auth creation.
- `POST /api/personnel/delete`
  - Admin SDK endpoint; role-gated personnel + auth deletion.
- `POST /api/personnel/sync-balances`
  - Admin SDK-backed balance reconciliation endpoint for leave/offset fields.
  - bearer-token protected with route-level rate limiting.
- `POST /api/personnel/force-password-reset`
  - Admin SDK-backed forced-password-reset completion endpoint.
  - clears `passwordNeedsReset` only after server-side password update.
  - bearer-token protected with route-level rate limiting.
- `POST /api/notifications/create`
  - Admin SDK-backed cross-user notification dispatch endpoint.
  - bearer-token protected with role checks + route-level rate limiting.
- `POST /api/geocode/locations`
  - Philippines-focused geocoding with fallback aliases for dashboard heatmap.
  - bearer-token protected with route-level rate limiting and bounded cache guards.
- `GET /api/dashboard/top-visa-grant-counsellors`
  - Aggregates visa grants (non-archived applications).
- `GET /api/dashboard/top-staff-referrers`
  - Aggregates staff referral counts from leads.
- `GET /api/dashboard/global-visa-approval-trend`
  - Returns global visa approval trend data.
- `POST /api/dashboard/ai-report`
  - Generates structured dashboard insights from snapshot data via OpenAI.
- `POST /api/archive/yearly-rollover`
  - Archives prior-year completed records (manual token-based trigger or scheduler key).
- `POST /api/studynavi/sso`
  - Generates StudyNavi SSO redirect URL using Firebase custom token.
  - bearer-token protected with route-level rate limiting.

## Environment Variables

Required:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `FIREBASE_ADMIN_SDK_JSON`

Feature-dependent:

- `OPENAI_API_KEY` (required for `/api/dashboard/ai-report`)
- `OPENAI_REPORT_MODEL` (optional, default `gpt-4.1-mini`)
- `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY` (required when App Check is enforced for Firebase Authentication / `identitytoolkit`)
- `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN` (optional; local-only App Check debug token, blocked from production public-runtime exposure)
- `STUDYNAVI_URL` (required for `/api/studynavi/sso`)
- `STUDYNAVI_ALLOWED_HOSTS` (optional comma-separated hostname allowlist for `/api/studynavi/sso`)
- `TURNSTILE_EXPECTED_ACTION` (optional; defaults to `login` and must match Cloudflare Turnstile widget action)
- `TURNSTILE_ALLOWED_HOSTNAMES` (optional comma-separated host allowlist for Turnstile server verification)
- `ARCHIVE_JOB_KEY` (optional scheduler secret for `/api/archive/yearly-rollover`)
- `GEOCODING_PROVIDER` (optional; `google` or `nominatim`)
- `GOOGLE_GEOCODING_API_KEY` (optional; required when forcing `GEOCODING_PROVIDER=google`)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (required for dashboard leads heatmap map)
  - can be provided as direct Cloud Run env value or secret-backed runtime binding (`pathfinder-google-maps-api-key`)
- `NEXT_ALLOWED_DEV_ORIGINS` (optional comma-separated local dev origins for Next.js LAN access)

Reference: `.env.example`

## Local Setup

1. Install dependencies: `npm install`
2. Create `.env.local` from `.env.example`
3. Run dev server: `npm run dev`

## Validation Commands

- `npm run check:firestore-indexes`
- `npm run check:firebase-config`
- `npm run check:firestore-rules-contract`
- `npm run check:java` (preflight for emulator-based rules tests)
- `npm run typecheck`
- `npm run typecheck:api:strict`
- `npm run lint`
- `npm run check:max-lines`
- `npm run check:secrets`
- `npm run check:unused-exports`
- `npm run check:required-docs`
- `npm run check:env-example`
- `npm run test`
- `npm run test:rules`
- `npm run build`
- `npm run verify`
- `npm run test:e2e:smoke`
- `npm run verify:smoke`
- `cd functions && npm run lint`
- `npm run postdeploy:check`
- `npm run ops:check:deploy-drift`
- `npm run ops:ensure:alerting`
- `npm run ops:enforce:app-check -- --mode=UNENFORCED` (dry-run example)
- `npm run doctor`
- `npm run hooks:setup`

Notes:

- `npm run test:rules` intentionally fails fast when Java is missing and prints installation guidance.
- `npm run check:java` now enforces Java `17-21` (Temurin/OpenJDK), with Temurin 21 recommended.
- CI `Quality Gate / rules-semantic` runs `npm run test:rules` on a Java-enabled runner (`actions/setup-java`, Temurin 21).
- Rollout-only drift-check overrides are available when needed:
  - `npm run ops:check:deploy-drift -- --allow-app-check-unenforced`
  - `npm run ops:check:deploy-drift -- --allow-ttl-creating`

## Data Maintenance Scripts

Entrypoints:

- `scripts/cleanup-preferred-courses.cjs`
- `scripts/import-archives-from-excel.cjs`
- `scripts/backfill-archive-lead-sync.cjs`
- `scripts/cleanup-lead-sources.cjs`
- `scripts/backfill-personnel-approval-fields.cjs`

Personnel approval-field rollout:

- `npm run migrate:personnel-approval-fields` runs dry-run and prints proposed updates.
- `npm run migrate:personnel-approval-fields:verify` prints migration coverage metrics (no writes).
- `npm run migrate:personnel-approval-fields:verify:strict` exits non-zero when coverage is incomplete.
- `npm run migrate:personnel-approval-fields:apply` writes normalized approval fields.
- During rollout, approver lookup intentionally merges indexed `approvalBranchKey` matches with legacy branch fallback results so partial backfill does not hide valid approvers.

Current layout:

- Keep root files as thin wrappers.
- Keep implementation in `scripts/lib/<feature>/` using small focused modules (`parseArgs`, normalization/mapping helpers, runner).
- Shared Firebase Admin bootstrap is in `scripts/config/firebase-admin-utils.cjs`.

## CI

- `.github/workflows/quality-gate.yml`
  - blocking gate on `main` push/PR
  - runs `npm audit --omit=dev`, `npm run verify`, semantic emulator rules tests (`npm run test:rules`), `npm run test:e2e:smoke`, and `functions` lint verification
- `.github/workflows/security-gate.yml`
  - security workflow (secret scan, dependency review, npm audit artifact, unused-exports report)
  - dependency/audit policy aligned to fail on `moderate+` severity
- `.github/workflows/codeql.yml`
  - CodeQL SAST scan for JavaScript/TypeScript on `main` push/PR and weekly schedule
- `.github/workflows/postdeploy-uptime-check.yml`
  - scheduled/manual production uptime checks against `https://your-app.example.com/`
- `.github/workflows/ops-drift-verification.yml`
  - scheduled/manual production drift assertion for Cloud Run env/secrets/IAM, Firestore TTL, App Check service enforcement, and monitoring baseline integrity
  - requires GitHub repository secrets: `GCP_WIF_PROVIDER`, `GCP_WIF_SERVICE_ACCOUNT`
  - optional repo vars: `PATHFINDER_GCP_PROJECT`, `PATHFINDER_GCP_REGION`, `PATHFINDER_CLOUD_RUN_SERVICE`, `PATHFINDER_BASE_URL`
- `.github/workflows/dependabot-triage.yml`
  - auto-labels Dependabot PRs for triage (`dependencies`, `automated`, `needs-triage`, plus `ci`/`regression` when applicable)
- `.github/workflows/label-sync.yml`
  - syncs repository labels from `.github/labels.yml`
- `.github/workflows/stale.yml`
  - marks/closes stale issues and pull requests for hygiene
- all third-party GitHub Actions in workflow files are commit-SHA pinned.

Current dependency posture (2026-04-08):

- app runtime pinned to `next@16.1.7` / `eslint-config-next@16.1.7`
- dependency hardening includes overrides for `node-forge`, `fast-xml-parser`, `dompurify`, `brace-expansion`, `flatted`, `picomatch`, `yaml`, and `lodash`
- `npm audit --omit=dev` residual risk is low-severity transitive Firebase/Google chain (`@tootallnate/once`)
- full `npm audit` (including dev) is now reduced to low-severity transitive Firebase/Google chain advisories only.
- unused-export guardrail uses an actionable budget ceiling (`UNUSED_EXPORTS_MAX`, default `71`) to prevent regression growth

## Firestore Operations

- Rules file: `firestore.rules`
- Indexes file: `firestore.indexes.json`
- Storage rules file: `storage.rules`
- Firebase deployment config: `firebase.json` (explicit `firestore.rules` + `storage.rules` bindings)
- Index drift helper: `npm run check:firestore-indexes`
- Rules contract helper: `npm run check:firestore-rules-contract`
- Semantic rules helper: `npm run test:rules`
- Deploy drift guardrail: `npm run ops:check:deploy-drift`
  - strict defaults verify:
    - Firestore TTL state `ACTIVE` on `__rateLimits.expiresAt`
    - App Check enforcement state for `firestore.googleapis.com`, `firebasestorage.googleapis.com`, `identitytoolkit.googleapis.com`
    - uptime check host/path integrity (`[Pathfinder] prod uptime` on `/login`)
    - required alert policies enabled and wired with notification channels
  - rollout escape hatches:
    - `--allow-app-check-unenforced`
    - `--allow-ttl-creating`

Production controls aligned to this repo:

- Firestore TTL:
  - collection group: `__rateLimits`
  - field: `expiresAt`
  - state target: `ACTIVE`
- App Check enforcement:
  - service targets: `firestore.googleapis.com`, `firebasestorage.googleapis.com`, `identitytoolkit.googleapis.com`
  - enforce with: `npm run ops:enforce:app-check -- --apply`
  - safe validation-only mode: `npm run ops:enforce:app-check`
- Monitoring baseline:
  - ensure alerting + uptime checks with `npm run ops:ensure:alerting`
  - drift assertion with `npm run ops:check:deploy-drift`

When queries evolve, update and deploy indexes/rules together to avoid runtime `collectionGroup` index errors and permission mismatches.

## Deploy (Cloud Run)

Cloud Build config: `cloudbuild.yaml`

Canonical production flow (single source of truth):

1. Build an image with explicit `NEXT_PUBLIC_*` substitutions.
2. Deploy that image to existing service `pathfinder` in `asia-southeast1`.
3. Reapply runtime env + secrets on deploy.

App Check prerequisite when `identitytoolkit.googleapis.com` is `ENFORCED`:

1. Ensure `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY` is set on Cloud Run.
2. Ensure Firebase App Check web app config has a valid enterprise site key:
   - `projects/<firebase-project-number>/apps/<firebase-web-app-id>/recaptchaEnterpriseConfig.siteKey`
3. If either is missing, Firebase Auth login can fail with `401 Firebase App Check token is invalid`.
4. Repeat check for each web app sharing Firebase auth in production (Pathfinder, StudyNavi, Assessment).

Turnstile network timeout note:

- If `/api/turnstile/verify` returns `503` with message `Captcha verification is temporarily unavailable. Please retry.`, treat as transient upstream timeout/network issue (`ETIMEDOUT`/connection reset). Retry login and verify egress/network health before changing app logic.

Why this is required:

- `NEXT_PUBLIC_*` values are compiled into client bundles at build-time.
- Runtime-only env updates do not repair already-built client bundles.
- Runtime fallback (`window.__PATHFINDER_PUBLIC_ENV__`) is a safety net, not a replacement for correct build-time config.

PowerShell example:

```powershell
$IMAGE_TAG = Get-Date -Format "yyyyMMdd-HHmmss"
$IMAGE = "asia-southeast1-docker.pkg.dev/your-gcp-project/cloud-run-source-deploy/pathfinder:$IMAGE_TAG"

gcloud builds submit . --config cloudbuild.yaml --project your-gcp-project --substitutions `
  "_IMAGE=$IMAGE,_NEXT_PUBLIC_FIREBASE_API_KEY=<api_key>,_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<auth_domain>,_NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project_id>,_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<storage_bucket>,_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<messaging_sender_id>,_NEXT_PUBLIC_FIREBASE_APP_ID=<app_id>,_NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=<measurement_id>,_NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY=<appcheck_site_key>,_NEXT_PUBLIC_TURNSTILE_SITE_KEY=<turnstile_site_key>,_NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<google_maps_api_key>,_NEXT_PUBLIC_STUDYNAVI_URL=<studynavi_url>"

gcloud run deploy pathfinder --image $IMAGE --region asia-southeast1 --project your-gcp-project `
  --update-secrets "FIREBASE_ADMIN_SDK_JSON=firebase-admin-sdk:latest,TURNSTILE_SECRET_KEY=turnstile-secret-key:latest,OPENAI_API_KEY=openai-api-key:latest" `
  --update-env-vars "NEXT_PUBLIC_FIREBASE_API_KEY=<api_key>,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<auth_domain>,NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project_id>,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<storage_bucket>,NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<messaging_sender_id>,NEXT_PUBLIC_FIREBASE_APP_ID=<app_id>,NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=<measurement_id>,NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY=<appcheck_site_key>,NEXT_PUBLIC_TURNSTILE_SITE_KEY=<turnstile_site_key>,NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<google_maps_api_key>,STUDYNAVI_URL=<studynavi_url>,NEXT_PUBLIC_STUDYNAVI_URL=<studynavi_url>,OPENAI_REPORT_MODEL=<model>"
```

Post-deploy required checks:

- `npm run postdeploy:check`
- Login page does not show `Firebase failed to initialize`
- Browser console has no `[firebase] Missing env vars` warning
- Login runtime payload includes `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY`

One-command production deploy (recommended):

- `npm run deploy:prod`
- pulls current Cloud Run env/secrets
- builds image with required `NEXT_PUBLIC_*` substitutions and present optional `NEXT_PUBLIC_*` values
- resolves optional `NEXT_PUBLIC_*` values from secret-backed runtime env bindings when needed (for example `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)
- deploys same service with env/secrets reapplied
- runs postdeploy checks plus login runtime env validation

## Known Limitations / Future Work

- Known rough edges:
  - Heatmap location quality depends on free-text lead location values plus alias normalization; unexpected new location formats may require alias updates.
  - Dashboard mixes scoped and intentionally global widgets; filter behavior must stay aligned with `docs/LOGIC_CONTRACT.md` to avoid regressions.
  - School seed data intentionally omits external school website links after portfolio scrub; provider website values now depend on runtime/source-of-truth data entry.
- Deferred refactors:
  - Dashboard metric/filter logic is distributed across multiple hooks/utilities (`funnelMetrics`, `funnelFilters`, `targetVsActualMetrics`, widget-specific transforms); centralization is still a future maintainability improvement.
  - Heatmap geocoding utilities and alias mappings are split for line-length policy and maintainability, but still rely on static alias inventory curation.
- Risky areas to touch carefully:
  - Role scope changes must stay aligned across `src/utils/roles.ts`, client query scope, and `firestore.rules`.
  - Archive rollover logic is year + milestone sensitive; adjust only with matching logic-contract/test updates.
  - Build-time vs runtime env behavior (`NEXT_PUBLIC_*`) remains a deployment-sensitive area.
  - StudyNavi integration depends on external hostname reachability (`STUDYNAVI_URL` / `NEXT_PUBLIC_STUDYNAVI_URL`); DNS failures on the configured StudyNavi host can break SSO even when Pathfinder is healthy.
- Future product/analytics extensions:
  - Heatmap can be extended with stronger geocoding normalization and country-level drilldowns once source data quality constraints are addressed.
  - Additional dashboard widgets should explicitly declare whether they are funnel-scoped or globally ranked before implementation.

## Operations Docs

- `docs/BLUEPRINT.md`
- `docs/SMOKE_TEST.md`
- `docs/LOGIC_CONTRACT.md`
- `docs/RELEASE_RUNBOOK.md`
- `docs/INCIDENT_RUNBOOK.md`
- `docs/SECURITY.md`
- `docs/SUPPORT.md`
- `docs/OPERATIONS_HANDOVER.md`
- `docs/GITHUB_BRANCH_PROTECTION.md`
- `docs/adr/0001-testing-split-smoke-regression.md`
