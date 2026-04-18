# Support

Revision: 2026-04-18

## Primary Contact

- Owner: `support@example.com`

## Before Requesting Help

Include:

- branch and commit hash
- route and flow affected
- user role involved
- exact API status/response when applicable (`401`, `403`, `413`, `429`, `500`, `502`, `503`)
- console/server error output
- screenshot or short recording for UI issues

## Fast Self-Checks

Run:

```bash
npm run verify:smoke
npm run check:java
npm run test:rules
npm run postdeploy:check
npm run ops:check:deploy-drift
```

Java note:

- `npm run check:java` / `npm run test:rules` require Java `17-21` (Temurin 21 recommended).

Ops verification workflow:

- `.github/workflows/ops-drift-verification.yml` (scheduled + manual drift checks using OIDC workload identity)

Optional local health:

```bash
npm run doctor
```

Console warning note:

- Browser warnings like `Permissions policy violation: xr-spatial-tracking` and Cloudflare Turnstile preload messages can appear even when login is healthy; treat them as advisory unless they correlate with failed API responses.

Local-vs-live auth note:

- if localhost login works but production fails, prioritize env/deploy drift checks first (`npm run deploy:prod`, then `npm run postdeploy:check`) before changing login code.

## Incident Paths

- release/deploy issues: `docs/RELEASE_RUNBOOK.md`
- runtime outage/degradation: `docs/INCIDENT_RUNBOOK.md`
- logic expectations: `docs/LOGIC_CONTRACT.md`
