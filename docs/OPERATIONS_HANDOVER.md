# Operations Handover

Purpose: transfer day-to-day Pathfinder ownership with minimal knowledge loss.

Revision: 2026-04-18

## 1) Critical Production Facts

- Runtime: Node.js 20
- Hosting: Cloud Run
- Production URL: `https://your-app.example.com/`
- Main branch: `main`

## 2) Required Secrets

- `FIREBASE_ADMIN_SDK_JSON`
- `TURNSTILE_SECRET_KEY`
- optional: `OPENAI_API_KEY`
- optional: `ARCHIVE_JOB_KEY`
- optional: `STUDYNAVI_URL`
- optional: `NEXT_PUBLIC_STUDYNAVI_URL` (keep equal to `STUDYNAVI_URL`)
- optional: `STUDYNAVI_ALLOWED_HOSTS` (comma-separated hostname allowlist for SSO target validation)
- optional: `TURNSTILE_EXPECTED_ACTION` (default `login`)
- optional: `TURNSTILE_ALLOWED_HOSTNAMES` (comma-separated hostnames allowed by server-side Turnstile verification)
- optional: `GEOCODING_PROVIDER` (`google` or `nominatim`)
- optional: `GOOGLE_GEOCODING_API_KEY` (required when forcing `GEOCODING_PROVIDER=google`)
- `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY` (required when App Check enforcement includes `identitytoolkit.googleapis.com`)
- optional: `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN` (local debug only; production drift checks fail if present)

StudyNavi DNS reliability note:

- Pathfinder depends on StudyNavi hostname reachability for SSO redirect.
- On 2026-03-26, a hosted StudyNavi domain returned `NXDOMAIN` on affected resolvers while app backend remained healthy.
- Current stable target is `https://studynavi.example.com/`.
- If this regresses, follow `docs/INCIDENT_RUNBOOK.md` DNS checks and update both StudyNavi URL env vars together.

## 2.1) External Access Inventory (Maintain Outside Repo)

Keep this inventory current in the team handoff store (not in git):

- Firebase / GCP project access (console, IAM role ownership, billing visibility)
- Cloud Run operational access for production service (`pathfinder`) and rollout permissions
- GitHub admin settings access, including branch protection and workflow permissions
- Secret Manager / deployment secret ownership and rotation access
- Any additional production service access required to operate Pathfinder end-to-end

This section is a handoff reminder only; do not store credentials in repository docs.

## 2.2) GitHub Ops Verification Prerequisites

To keep scheduled ops drift verification running (`.github/workflows/ops-drift-verification.yml`):

- required GitHub repository secrets:
  - `GCP_WIF_PROVIDER`
  - `GCP_WIF_SERVICE_ACCOUNT`
- optional GitHub repository variables (defaults exist if unset):
  - `PATHFINDER_GCP_PROJECT`
  - `PATHFINDER_GCP_REGION`
  - `PATHFINDER_CLOUD_RUN_SERVICE`
  - `PATHFINDER_BASE_URL`

## 3) Core Quality Gates

- `npm run verify`
- `npm run check:java`
- `npm run test:rules` (requires Java `17-21`, Temurin 21 recommended)
- `npm run test:e2e:smoke`
- `cd functions && npm run lint`
- If local `next dev` is already running and smoke cannot acquire `.next/dev/lock`, reuse existing server:
  - PowerShell:
    - `$env:PLAYWRIGHT_PORT='3000'; $env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:3000'; npm run test:e2e:smoke`
- `npm run postdeploy:check`
- `npm run ops:check:deploy-drift`

## 4) Release Flow

1. Merge to `main`.
2. Confirm CI is green.
3. Run `npm run deploy:prod`.
4. Deploy script builds image with explicit `NEXT_PUBLIC_*` substitutions and redeploys service with runtime secrets/env.
   - Script resolves public build keys from plain runtime env values and secret-backed runtime bindings (including `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) so client bundles do not compile with empty public values.
   - When App Check enforcement includes `identitytoolkit.googleapis.com`, keep `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY` present in runtime env and build substitutions.
5. Run post-deploy check.
6. Monitor uptime workflow status.

Important:

- `NEXT_PUBLIC_*` values are build-time for client bundles.
- Runtime-only env changes are not enough if build substitutions were missing.
- Secret-backed runtime `NEXT_PUBLIC_*` values still need build substitutions (now handled by `npm run deploy:prod`).
- Keep one deployment path only: `build image -> deploy image`.
- Missing `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY` on enforced auth can produce login `401 Firebase App Check token is invalid`.

## 4.1) Auth-Critical Env Rotation (Turnstile / App Check)

When rotating auth-critical env values (`TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY`, Firebase public keys):

1. Update Cloud Run env/secrets first.
2. Redeploy with the standard production script (this rebuilds client bundle with `NEXT_PUBLIC_*` substitutions):

```bash
npm run deploy:prod
```

3. Validate immediately:

```bash
npm run postdeploy:check
npm run ops:check:deploy-drift
```

4. Smoke login in both:
- local (`http://localhost:3000/login`)
- live (`https://your-app.example.com/login`)

If local works but live fails with `auth/firebase-app-check-token-is-invalid`, treat it as deployment/env drift and redeploy again with `npm run deploy:prod` before changing app logic.

## 5) Rollback Flow

1. Identify last known-good commit.
2. Revert with a new commit (no history rewrite).
3. Push revert to `main`.
4. Redeploy.
5. Re-run smoke + postdeploy checks.

## 6) Highest-Risk Areas to Modify (Touch Carefully)

- Dashboard metric and filter logic:
  - funnel month/quarter/staff interactions
  - scoped vs global widget boundaries
- Archive rollover behavior:
  - completion criteria and prior-year archive targeting
  - endpoint authorization paths (manual + scheduler key)
- Role logic and Firestore rules alignment:
  - `src/utils/roles.ts` changes must be mirrored in query scope and `firestore.rules`
- Build-time vs runtime env behavior:
  - `NEXT_PUBLIC_*` values must be correct at build time; runtime updates alone do not fix bad client bundles
- Dashboard report export wiring (PDF/Excel) and snapshot consistency
- Forced password reset flow:
  - `passwordNeedsReset` is now cleared by `/api/personnel/force-password-reset` (server route), not direct client Firestore writes
- Timesheet offset-use duration math:
  - consumed offset credits must exclude lunch overlap (`12:00-13:00`)
  - request start-time options must not include `12:00`
- Asset/branding URL management:
  - keep centralized registries as source of truth (`src/config/imageLinks.ts`, `src/config/schoolImageLinks.ts`)
  - avoid reintroducing hardcoded image URLs in feature components

## 7) Maintenance Cadence

- Weekly: dependency and security workflow review.
- Daily: uptime check workflow result.
- Daily: ops drift workflow result (`.github/workflows/ops-drift-verification.yml`).
- Per release: run `verify:smoke` and postdeploy checks.
- Per infra/security change: run `npm run ops:ensure:alerting` then `npm run ops:check:deploy-drift`.
- Rollout-only temporary flags for drift checks:
  - `--allow-app-check-unenforced`
  - `--allow-ttl-creating`
- App Check rollout gate:
  - validate with `npm run ops:enforce:app-check`
  - apply only after all client apps send App Check tokens in production: `npm run ops:enforce:app-check -- --apply`
- Audit baseline note:
  - `npm audit --omit=dev` currently has low-severity transitive Firebase/Google-chain advisories only (`@tootallnate/once`).
  - Do not use `npm audit fix --force` because it proposes breaking Firebase package downgrades.

## 8) Data Script Ownership

- Treat `scripts/*.cjs` as stable operator entrypoints.
- For script updates, keep logic in `scripts/lib/<feature>/` and avoid monolithic single-file scripts.
- Shared Admin SDK bootstrap must stay in `scripts/config/firebase-admin-utils.cjs`.
- Data maintenance commands used in operations:
  - `npm run cleanup:preferred-courses`
  - `npm run cleanup:lead-sources`
  - `node scripts/import-archives-from-excel.cjs --dry-run --file=<xlsx>`
  - `node scripts/backfill-archive-lead-sync.cjs --dry-run`
  - `npm run migrate:personnel-approval-fields:verify`
  - `npm run migrate:personnel-approval-fields:verify:strict`
  - `npm run migrate:personnel-approval-fields:apply`

## 9) Key Docs

- `docs/README.md`
- `docs/README.md` -> `Known Limitations / Future Work`
- `docs/BLUEPRINT.md`
- `docs/SMOKE_TEST.md`
- `docs/LOGIC_CONTRACT.md`
- `docs/RELEASE_RUNBOOK.md`
- `docs/INCIDENT_RUNBOOK.md`
- `docs/SECURITY.md`
- `docs/SUPPORT.md`
