# Release Runbook

Purpose: provide a low-risk release process for Pathfinder on Cloud Run.

Revision: 2026-04-18

## 1) Preconditions

- Branch is `main` and synced with remote.
- `npm run verify:smoke` passes locally.
- `npm run check:java` passes locally (Java `17-21`, Temurin 21 recommended).
- `npm run test:rules` passes locally (Firebase emulator semantic rules tests require Java `17-21`).
- `cd functions && npm run lint` passes locally.
- GitHub `Quality Gate` workflow is green.
- GitHub `Quality Gate / rules-semantic` job is green (Java-enabled CI semantic rules execution).
- Ops drift workflow prerequisites are configured:
  - GitHub repo secrets `GCP_WIF_PROVIDER`, `GCP_WIF_SERVICE_ACCOUNT`
  - optional repo vars `PATHFINDER_GCP_PROJECT`, `PATHFINDER_GCP_REGION`, `PATHFINDER_CLOUD_RUN_SERVICE`, `PATHFINDER_BASE_URL`
- Branch protection policy is enabled (see `docs/GITHUB_BRANCH_PROTECTION.md`).
- Required runtime secrets exist for production service:
  - `FIREBASE_ADMIN_SDK_JSON`
  - `TURNSTILE_SECRET_KEY`
  - optional feature secrets/env (`OPENAI_API_KEY`, `ARCHIVE_JOB_KEY`, `STUDYNAVI_URL`, `STUDYNAVI_ALLOWED_HOSTS`, `TURNSTILE_EXPECTED_ACTION`, `TURNSTILE_ALLOWED_HOSTNAMES`, `GEOCODING_PROVIDER`, `GOOGLE_GEOCODING_API_KEY`)
  - public env: `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY` (required when App Check is enforced for Firebase Authentication) and `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN` (local-only; blocked from production runtime exposure)
  - optional heatmap secret (`pathfinder-google-maps-api-key`) when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is secret-backed

## 2) Pre-Release Checklist

1. Confirm no uncommitted changes:
   - `git status --short`
2. Confirm smoke expectations:
   - `docs/SMOKE_TEST.md`
   - include timesheet offset-use lunch exclusion checks (`12:00-13:00` not deducted from offset usage)
3. Confirm production URL target stays unchanged:
   - `https://your-app.example.com/`

## 3) Release Procedure

0. (Recommended) Deploy Firebase rules before application rollout when rules changed:
   - `firebase deploy --only firestore:rules --project your-gcp-project`
   - `firebase deploy --only storage --project your-gcp-project`
   - repo now pins `storage.rules` explicitly in `firebase.json`, so storage-only deploys stay deterministic.
1. Push release commit to `main`.
2. Ensure CI is green:
   - `.github/workflows/quality-gate.yml`
   - `.github/workflows/security-gate.yml` (moderate+ dependency severity enforcement)
3. Build container image with explicit `NEXT_PUBLIC_*` substitutions.
   - When a `NEXT_PUBLIC_*` key is bound from Secret Manager at runtime (for example `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`), resolve it to a value for build substitutions first.
4. Deploy image to existing service `pathfinder` in `asia-southeast1`.
5. Reapply runtime secrets and runtime env on deploy.
   - include `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY` whenever App Check enforcement includes `identitytoolkit.googleapis.com`.
6. Recommended command:

   ```powershell
   npm run deploy:prod
   ```

7. Manual fallback command pattern (PowerShell):

   ```powershell
   $IMAGE_TAG = Get-Date -Format "yyyyMMdd-HHmmss"
   $IMAGE = "asia-southeast1-docker.pkg.dev/your-gcp-project/cloud-run-source-deploy/pathfinder:$IMAGE_TAG"

   gcloud builds submit . --config cloudbuild.yaml --project your-gcp-project --substitutions `
     "_IMAGE=$IMAGE,_NEXT_PUBLIC_FIREBASE_API_KEY=<api_key>,_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<auth_domain>,_NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project_id>,_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<storage_bucket>,_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<messaging_sender_id>,_NEXT_PUBLIC_FIREBASE_APP_ID=<app_id>,_NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=<measurement_id>,_NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY=<appcheck_site_key>,_NEXT_PUBLIC_TURNSTILE_SITE_KEY=<turnstile_site_key>,_NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<google_maps_api_key>,_NEXT_PUBLIC_STUDYNAVI_URL=<studynavi_url>"

   gcloud run deploy pathfinder --image $IMAGE --region asia-southeast1 --project your-gcp-project `
     --update-secrets "FIREBASE_ADMIN_SDK_JSON=firebase-admin-sdk:latest,TURNSTILE_SECRET_KEY=turnstile-secret-key:latest,OPENAI_API_KEY=openai-api-key:latest" `
     --update-env-vars "NEXT_PUBLIC_FIREBASE_API_KEY=<api_key>,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<auth_domain>,NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project_id>,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<storage_bucket>,NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<messaging_sender_id>,NEXT_PUBLIC_FIREBASE_APP_ID=<app_id>,NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=<measurement_id>,NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY=<appcheck_site_key>,NEXT_PUBLIC_TURNSTILE_SITE_KEY=<turnstile_site_key>,NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<google_maps_api_key>,STUDYNAVI_URL=<studynavi_url>,NEXT_PUBLIC_STUDYNAVI_URL=<studynavi_url>,OPENAI_REPORT_MODEL=<model>"
   ```

8. Confirm deploy target URL remains:
   - `https://your-app.example.com/`
9. Post-release validation:
   - `npm run postdeploy:check`
   - `npm run ops:check:deploy-drift`
   - run manual checks from `docs/SMOKE_TEST.md`
   - confirm login runtime payload includes `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY`
   - verify hardened route behavior:
     - authenticated requests succeed for `/api/geocode/locations` and dashboard ranking endpoints
     - unauthorized requests correctly return `401` for privileged endpoints
     - forced-password-reset completion path works only via `POST /api/personnel/force-password-reset`
10. Confirm daily uptime job remains healthy:
   - `.github/workflows/postdeploy-uptime-check.yml`
11. Confirm ops drift workflow remains healthy:
   - `.github/workflows/ops-drift-verification.yml`

## 3.1) Production Control Baseline Commands

Run these controls after major infra/security changes and at least once per quarter:

- Ensure alerting + uptime policies exist and are up to date:
  - `npm run ops:ensure:alerting`
- Assert production drift baseline:
  - strict: `npm run ops:check:deploy-drift`
  - rollout-only fallback flags:
    - `--allow-app-check-unenforced`
    - `--allow-ttl-creating`
- Validate/prepare App Check enforcement state:
  - dry-run validation: `npm run ops:enforce:app-check`
  - enforcement apply: `npm run ops:enforce:app-check -- --apply`

Important App Check note:

- Do not apply App Check enforcement until all client apps using this Firebase project are shipping App Check tokens in production (Pathfinder/StudyNavi/Assessment).
- Do not set `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN` on production Cloud Run service; drift checks now fail when it is present.
- If `identitytoolkit.googleapis.com` is enforced and login returns `401 Firebase App Check token is invalid`, verify both:
  - Cloud Run env has `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY`
  - Firebase App Check config has `recaptchaEnterpriseConfig.siteKey` for each deployed web app ID (Pathfinder + StudyNavi + Assessment)
  - Pathfinder app ID reference: `<firebase-web-app-id>`
- If `/api/turnstile/verify` returns `503` (`Captcha verification is temporarily unavailable. Please retry.`), treat as transient upstream timeout/network issue first; retry and validate network egress before changing application logic.

Manual console verification checkpoints:

- Firestore TTL must remain enabled on `__rateLimits.expiresAt` (target state: `ACTIVE`).
- App Check enforcement must be aligned across Pathfinder, StudyNavi, and Assessment before moving services to `ENFORCED` mode.
- Monitoring baseline must include:
  - `[Pathfinder] Cloud Run 5xx Error Rate`
  - `[Pathfinder] Cloud Run P95 Latency`
  - `[Pathfinder] Production Uptime Failure`
  - `[Pathfinder] prod uptime`
- Monitoring alert policies should stay enabled and include at least one notification channel each (validated by `ops:check:deploy-drift`).

## 3.2) Auth Hotfix Deploy Sequence (Turnstile / App Check)

Use this when login fails with `Captcha verification failed`, `invalid-input-secret`, or `auth/firebase-app-check-token-is-invalid`.

1. Rotate/fix auth env or secret values first (`TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY`).
2. Redeploy with the standard path so build-time `NEXT_PUBLIC_*` substitutions stay aligned:

```bash
npm run deploy:prod
```

3. Validate immediately:

```bash
npm run postdeploy:check
npm run ops:check:deploy-drift
```

4. Manual check:
- open `/login` in incognito
- confirm `POST /api/turnstile/verify` returns `200`
- confirm Firebase sign-in no longer returns App Check token invalid errors

Important:
- local success with live failure usually indicates deployment/env drift, not a frontend regression.

## 4) Rollback Procedure

If release behavior is degraded:

1. Identify last known-good commit on `main`.
2. Revert problematic commit(s) with a new commit (do not rewrite history).
3. Push revert commit to `main`.
4. Redeploy using the same production command path.
5. Re-run:
   - `npm run postdeploy:check`
   - required manual smoke checks

## 5) Known Friction and Prevention

- Friction root cause:
  - `NEXT_PUBLIC_*` values are build-time for Next.js client bundles.
  - Runtime env updates alone do not repair a bad client build.
  - If a `NEXT_PUBLIC_*` key exists only as a runtime secret binding and is not passed to Cloud Build substitutions, the client bundle can compile with an empty value.
- Prevention:
  - always use `build image -> deploy image` flow above
  - never skip substitutions for `NEXT_PUBLIC_*` (including secret-backed runtime bindings)
  - after deploy, verify login has no Firebase init error

## 6) Decision Gates

- Proceed only if:
  - verify + smoke pass
  - no blocker incident open
  - postdeploy check passes on production URL
- Roll back if:
  - login/protected routing fails
  - core dashboard/leads/application flows break
  - archive/personnel admin endpoints regress
