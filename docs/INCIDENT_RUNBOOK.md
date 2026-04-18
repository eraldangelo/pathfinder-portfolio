# Incident Runbook

Purpose: reduce mean time to detect and recover for production issues.

Revision: 2026-04-18

## 1) Severity Model

- `SEV-1`: Core flows unusable (login blocked, protected shell inaccessible, major data actions failing).
- `SEV-2`: Partial degradation (one feature area or role path affected).
- `SEV-3`: Non-blocking defects (copy issues, minor UI glitches, performance warnings).

## 2) First 10 Minutes

1. Confirm impact scope:
   - all users or specific role
   - all branches or specific branch
2. Capture evidence:
   - timestamp (UTC)
   - route
   - role/account type
   - console/server error text
3. Assign incident owner and start timeline notes.
4. Validate endpoint health quickly:
   - `npm run postdeploy:check`
5. Validate production control baseline quickly:
   - `npm run ops:check:deploy-drift -- --allow-app-check-unenforced`

## 3) Diagnostic Checklist

- Auth
  - `/login` renders
  - protected routes redirect correctly
- Dashboard
  - key widgets load
  - export buttons still work
- Leads and Applications
  - list and detail flows render
  - status updates persist
- Timesheet
  - time in/out and request paths still work
- Archive
  - page access stays role-correct
  - rollover endpoint still auth-gated

Known hardened-route failure mode (401/403/413/429):

- Symptom:
  - API calls fail after hardening rollout with unauthorized, forbidden, payload-too-large, or rate-limit responses
- Quick checks:
  - verify bearer token is present on:
    - `/api/personnel/create`
    - `/api/geocode/locations`
    - `/api/studynavi/sso`
    - `/api/dashboard/top-staff-referrers`
    - `/api/dashboard/top-visa-grant-counsellors`
    - `/api/dashboard/global-visa-approval-trend`
  - confirm caller role is allowed for admin-only routes (`/api/personnel/create`, `/api/personnel/delete`, archive/manual endpoints)
  - confirm request payload size does not exceed route limits
  - if `429` appears, retry after cool-down and check for polling loops on client
- If broken:
  - check recent frontend fetch changes for missing `Authorization: Bearer <token>`
  - validate route auth matrix behavior with `npm run test -- src/app/api/_shared/routeAuthMatrix.test.ts`

Known login failure mode (Firebase init friction):

- Symptom:
  - login shows `Firebase failed to initialize.`
  - console shows `[firebase] Missing env vars`
- Quick checks:
  - open `https://your-app.example.com/login`
  - in browser console, run `window.__PATHFINDER_PUBLIC_ENV__`
  - verify Firebase keys are present (non-empty object)
- If broken:
  - redeploy using `build image with substitutions -> deploy image`
  - do not use deploy paths that skip build substitutions
  - test in incognito or hard refresh to remove stale cached chunks

Known dashboard heatmap failure mode (Google Maps key friction):

- Symptom:
  - dashboard heatmap shows `Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for Google Maps.`
  - refresh may temporarily recover behavior
- Quick checks:
  - open `https://your-app.example.com/navigation`
  - open browser console and run:
    - `window.__PATHFINDER_PUBLIC_ENV__?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
  - if runtime key exists but issue persists, verify deployment path:
    - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` may be secret-backed at runtime and still missing from build substitutions
- If broken:
  - redeploy using `npm run deploy:prod` (updated to resolve secret-backed `NEXT_PUBLIC_*` values for build substitutions)
  - avoid manual deploy paths that do not pass `NEXT_PUBLIC_*` build substitutions
  - retest in incognito / hard refresh to clear stale chunks

Known StudyNavi SSO failure mode (configured host DNS `NXDOMAIN`):

- Symptom:
  - opening StudyNavi from Pathfinder fails with `DNS_PROBE_FINISHED_NXDOMAIN`
  - StudyNavi login URL is unreachable in browser even when Pathfinder is healthy
- Why this happens:
  - Pathfinder SSO route can be correct, but target StudyNavi hostname may fail DNS resolution on some resolver paths
- Quick checks:
  - verify configured URL in runtime env:
    - `gcloud run services describe pathfinder --region asia-southeast1 --project your-gcp-project --format="json(spec.template.spec.containers[0].env)"`
  - verify DNS resolution:
    - `nslookup studynavi.example.com`
    - `nslookup studynavi.example.com 8.8.8.8`
- If broken:
  - update `STUDYNAVI_URL` and `NEXT_PUBLIC_STUDYNAVI_URL` to reachable StudyNavi host
  - if `STUDYNAVI_ALLOWED_HOSTS` is configured, include the target hostname in the allowlist
  - redeploy/update Cloud Run env for `pathfinder`
  - rerun `npm run postdeploy:check`
  - confirm `/api/studynavi/sso` no longer returns URL to an unreachable domain

Known Turnstile hard-fail mode (hostname/action mismatch):

- Symptom:
  - login captcha appears solved, but `/api/turnstile/verify` returns `403` (`Captcha verification failed.`)
- Quick checks:
  - verify `TURNSTILE_EXPECTED_ACTION` matches widget action (`login` by default)
  - verify request host is included in `TURNSTILE_ALLOWED_HOSTNAMES` (when allowlist is configured)
  - verify Cloudflare Turnstile site config includes active hostname(s)
- If broken:
  - update `TURNSTILE_ALLOWED_HOSTNAMES` and/or `TURNSTILE_EXPECTED_ACTION`
  - redeploy env and retest login flow

Known Turnstile upstream timeout mode (transient network):

- Symptom:
  - `/api/turnstile/verify` returns `503` with `Captcha verification is temporarily unavailable. Please retry.`
  - server log includes `[turnstile] verify upstream timeout/network error` with `ETIMEDOUT`/connection reset details
- Quick checks:
  - verify `TURNSTILE_SECRET_KEY` is still bound in Cloud Run service config
  - verify no egress/network outage between service and `https://challenges.cloudflare.com`
  - retry the request (this path is intentionally retryable)
- If broken:
  - fix network/egress issue first (firewall, DNS, transient upstream outage)
  - avoid changing login/business logic for this symptom alone

Known App Check auth token invalid mode:

- Symptom:
  - login fails with `auth/firebase-app-check-token-is-invalid`
  - Firebase Auth request returns `401` while App Check enforcement includes `identitytoolkit.googleapis.com`
- Quick checks:
  - verify `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY` exists in Cloud Run env and built bundle/runtime payload
  - verify Firebase App Check `recaptchaEnterpriseConfig.siteKey` is set for each deployed web app ID (Pathfinder/StudyNavi/Assessment)
  - hard refresh/incognito to remove stale cached client bundle
- If broken:
  - redeploy using `npm run deploy:prod` with correct `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY`
  - update missing web-app App Check `siteKey` config in Firebase console
  - rerun `npm run postdeploy:check` and retry login

## 4) Containment Options

1. Fast revert (preferred for SEV-1/SEV-2):
   - revert last bad commit on `main`
   - redeploy
2. Temporary feature disable:
   - disable non-critical feature path if possible
3. Internal communication:
   - notify impacted users and expected recovery window

## 5) Recovery Validation

Run required checks from `docs/SMOKE_TEST.md` plus:

- `npm run postdeploy:check`
- `npm run ops:check:deploy-drift -- --allow-app-check-unenforced`
- dashboard PDF download smoke check (`npm run test:e2e:smoke`)

Primary monitoring alert policies to watch:

- `[Pathfinder] Cloud Run 5xx Error Rate`
- `[Pathfinder] Cloud Run P95 Latency`
- `[Pathfinder] Production Uptime Failure`

Close incident only after successful smoke and stakeholder confirmation.

## 6) Postmortem Requirements

- root cause summary
- trigger and detection gap
- corrective action (code/process/test)
- due date and owner
