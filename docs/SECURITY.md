# Security Policy

Revision: 2026-04-18

## Supported Versions

Pathfinder follows a rolling-release model on `main`. Security fixes are applied to the latest deployed version.

## Reporting a Vulnerability

Do not open public GitHub issues for security findings.

Report privately to:

- Email: `support@example.com`
- Subject: `Pathfinder Security Report`

Include:

- affected endpoint/file/flow
- reproduction steps
- expected vs actual behavior
- potential impact
- optional mitigation suggestion

## Response Expectations

- Initial acknowledgment target: within 2 business days
- Triage target: within 5 business days
- Fix timeline: depends on severity and exploitability

## Secret Handling Rules

- Never commit `.env.local`, service account JSON, or private keys.
- Keep runtime credentials in deployment secret stores.
- Rotate compromised credentials immediately.
- Keep `npm run check:secrets` clean before push.
- Keep local credential files (`key.json`, `service-account.json`, `firebase-adminsdk-*.json`) out of chat uploads, tickets, and screen shares; rotate immediately if exposure is suspected.

## Scope Notes

- In-scope: application code in this repository, API routes, deployment workflow configuration.
- Out-of-scope: social engineering, physical access attacks, third-party service outages.

## Recent Hardening Snapshot (2026-04-18)

- Added explicit bearer auth + rate limiting on sensitive server routes:
  - `/api/geocode/locations`
  - `/api/studynavi/sso`
  - `/api/dashboard/top-staff-referrers`
  - `/api/dashboard/top-visa-grant-counsellors`
  - `/api/dashboard/global-visa-approval-trend`
- Added secured backend personnel creation endpoint (`/api/personnel/create`) and moved create-user flow out of client-side auth orchestration.
- Added secured balance reconciliation endpoint (`/api/personnel/sync-balances`) and moved leave/offset balance persistence off direct client writes.
- Added secured cross-user notification dispatch endpoint (`/api/notifications/create`) and moved privileged notification fan-out off direct client Firestore writes.
- Added server-side recipient validation + duplicate suppression for cross-user notification dispatch requests.
- Added strict notification metadata/event allowlists and requester-identity canonicalization on server dispatch.
- Added secured forced-password-reset completion endpoint (`/api/personnel/force-password-reset`) and removed client-side self-mutation of `passwordNeedsReset`.
- Improved verification resilience by excluding transient `.next/dev` generated types from `tsc` inputs and hardening smoke navigation timeouts.
- Tightened geocoding resilience controls (bounded cache sizes + unresolved cache TTL handling).
- Expanded route auth matrix coverage for 401/403/413 guardrails and payload schema checks.
- Tightened Firestore lead/archive write scope to role + branch/assignment constraints (create/update/delete now scope-guarded).
- Tightened Firestore/Storage `reports` handling, including owner/admin-only Storage reads for report screenshots.
- Locked `educationProviders` writes, restricted lead note creation to lead-scoped write helpers, and locked notification creation to self-only client writes.
- Hardened request-body enforcement to stream and cap bytes even without trusted `Content-Length`, preventing oversized chunked payload reads.
- Removed token-fingerprint based rate-limit keying and moved to stable request subjects to reduce bypass surface and rate-limit write amplification.
- Added explicit outbound fetch timeouts for external providers (Turnstile/OpenAI) and default timeout handling in shared server fetch wrapper.
- Added stricter proxy header posture with production HSTS + enhanced browser isolation headers.
- Hardened CSP posture with `script-src-attr 'none'`, explicit App Check/recaptcha source allowlists, and secure-browser headers while preserving current runtime compatibility.
- Replaced executable inline runtime-public-env bootstrap with non-executable DOM metadata payload to reduce inline script exposure.
- Added Firebase App Check bootstrap in client initialization (`NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY` + optional debug token for local-only flows); site key is required when auth enforcement is enabled.
- Added console-enforcement automation for App Check services (`npm run ops:enforce:app-check`) with dry-run validation to avoid accidental outage before all clients have site-key rollout.
- Enforced stricter StudyNavi SSO base URL safety constraints: `https`-only, credential rejection, optional hostname allowlist (`STUDYNAVI_ALLOWED_HOSTS`), and production blocking for loopback/private/local-network targets (IPv4/IPv6/local domains).
- Reduced dashboard API data exposure by projecting only required Firestore fields for trend/ranking aggregation routes.
- Added Firestore rules contract automation (`check:firestore-rules-contract`) into the verification chain.
- Expanded Firestore rules contract checks from 7 to 12 critical invariants.
- Added semantic emulator rules tests for Firestore/Storage (`npm run test:rules`) to validate allow/deny behavior, not only regex contracts.
- Added strict API-only TypeScript verification gate (`npm run typecheck:api:strict`) to incrementally harden server-route type safety.
- Extended max-lines guard to cover `functions/` sources with explicit policy-based overrides.
- Added dedicated `functions/` quality-gate verification and aligned Functions runtime target to Node `20`.
- Added dedicated `functions/eslint.config.mjs` so Functions linting no longer inherits frontend lint rules.
- Normalized Firebase ID-token failure handling on protected routes so invalid/expired/malformed tokens resolve to `401` (not generic `500`), while true infrastructure faults still surface as `500`.
- Hardened personnel deletion semantics with tombstoned, idempotent cleanup flow to prevent silent Auth/Firestore drift on partial failures.
- Hardened Turnstile verification by validating expected hostname + action (`login`) and failing closed on mismatch.
- Blocked App Check debug-token exposure in production public runtime env, while keeping local-dev support path.
- Reduced dashboard API read pressure via short-lived server response caching on heavy ranking/trend endpoints.
- Reduced scheduled offset autoplot scan pressure by using filtered query path with safe fallback when composite index is unavailable.
- Aligned CI dependency severity policy to fail on `moderate+` in both quality/security workflows.
- Pinned GitHub Actions workflow dependencies to immutable commit SHAs.
- Added CodeQL SAST workflow (`.github/workflows/codeql.yml`) for static security coverage on push/PR + weekly cadence.
- Hardened container runtime by running production image as non-root user.
- Added unused-export budget guardrail (`UNUSED_EXPORTS_MAX`, default `71`) to prevent debt growth regressions.
- Added deploy drift guardrail script (`npm run ops:check:deploy-drift`) covering runtime env/secrets, IAM, TTL state, App Check enforcement state, and monitoring baseline.
- Strengthened deploy drift assertions to require:
  - Firestore TTL `ACTIVE` on `__rateLimits.expiresAt` (with explicit rollout override flag)
  - uptime check host/path integrity (`[Pathfinder] prod uptime` on `/login`)
  - required alert policies enabled and wired with notification channels
- Added production monitoring baseline automation (`npm run ops:ensure:alerting`) for Cloud Run `5xx`, p95 latency, and uptime-failure alert policies.
- Added scheduled/manual GitHub ops verification workflow (`.github/workflows/ops-drift-verification.yml`) for continuous drift checks against production controls.
- Added explicit `storage.rules` binding in `firebase.json` so `firebase deploy --only storage` always uses repository rules.
- Added explicit `firebase.json` config assertion (`npm run check:firebase-config`) in the `verify` chain to prevent deploy-config drift for Firestore/Storage rules bindings.
- Enforced Firestore TTL lifecycle on `__rateLimits.expiresAt` to prevent unbounded rate-limit document growth.
- Applied strict portfolio sanitization of external content links:
  - replaced external branding/UI image hosts with local `public/assets/*` sources
  - removed external school website links from static school-detail seed maps
  - removed external logo fallback (`logo.clearbit.com`) from school-logo rendering
- Dependency hardening:
  - pinned `next` / `eslint-config-next` to `16.1.7`
  - upgraded `firebase-admin` to `13.7.0`
  - upgraded `jspdf` to `4.2.1`
  - added overrides for `node-forge`, `fast-xml-parser`, `dompurify`, `brace-expansion`, `flatted`, `picomatch`, `yaml`, and `lodash`
- `npm audit --omit=dev` and full `npm audit` current residual is low-severity transitive Firebase/Google chain (`@tootallnate/once`); no moderate/high/critical advisories remain in the app dependency graph.

## Console-Enforced Controls (Not Fully Enforceable In Repo)

- Firestore TTL:
  - collection group: `__rateLimits`
  - field: `expiresAt`
  - required state: `ACTIVE`
- Firebase App Check enforcement:
  - service targets: `firestore.googleapis.com`, `firebasestorage.googleapis.com`, `identitytoolkit.googleapis.com`
  - rollout scope: Pathfinder + StudyNavi + Assessment (same Firebase project)
  - run dry-run check: `npm run ops:enforce:app-check`
  - apply only after all clients emit valid tokens: `npm run ops:enforce:app-check -- --apply`
- Production alerting baseline:
  - `[Pathfinder] Cloud Run 5xx Error Rate`
  - `[Pathfinder] Cloud Run P95 Latency`
  - `[Pathfinder] Production Uptime Failure`
  - `[Pathfinder] prod uptime`
- Secret hygiene:
  - never upload/share `key.json` / service-account files in chat, tickets, or screenshots
  - rotate immediately if any exposure is suspected

## Rate-Limit Trust Boundary

- API limiter identity now prefers `cf-connecting-ip`, then `x-real-ip`, then the last valid `x-forwarded-for` entry to reduce simple header-prepend spoofing.
- Residual risk remains if ingress allows arbitrary client-supplied forwarding headers to pass through unchanged.
- Enforce trusted-header sanitization at edge/load-balancer layer and keep Firestore TTL active for `__rateLimits.expiresAt` to control growth/cost.

## CSP Residual Limitation

- Current CSP still includes `'unsafe-inline'` for `script-src` and `style-src`.
- Why `script-src 'unsafe-inline'` remains: Next.js runtime/app bootstrap currently emits inline script blocks (`self.__next_f.push(...)`) in production rendering; nonce-only rollout without deeper framework integration caused protected app boot/login regressions in local production validation.
- Why `style-src 'unsafe-inline'` remains: Pathfinder currently uses inline style attributes across many UI components and framework/runtime style emission behavior.
- This pass removed custom executable inline bootstrap (`PublicEnvScript`) and removed unused external style source allowance (`https://unpkg.com`), but full inline removal still requires broader framework-compatible nonce/hash migration plus UI style-attribute reduction.
