# Pathfinder Smoke Test

Use this before commit/release to catch regressions quickly after feature work or refactors.

Revision: 2026-04-18

## 1) Automated Smoke (Required)

Run from project root:

```bash
npm run verify
npm run check:java
npm run test:rules
npm run test:e2e:smoke
```

`npm run check:java` performs an explicit preflight for Java runtime availability and version (`17-21` required; Temurin 21 recommended).

If a local `next dev` server is already running and Playwright reports `.next/dev/lock`:

```powershell
$env:PLAYWRIGHT_PORT='3000'
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:3000'
npm run test:e2e:smoke
```

Pass criteria:

- Verify pipeline passes (`check:firestore-indexes`, `check:firestore-rules-contract`, `typecheck`, `lint`, `check:max-lines`, `check:secrets`, `check:unused-exports`, `check:required-docs`, `check:env-example`, `test`, `build`)
- Semantic rules suite passes (`npm run test:rules`) for Firestore + Storage allow/deny behavior.
- Playwright smoke suite passes
- Dashboard download smoke assertions pass (PDF spinner/state reset/repeat download on non-production harness route)

## 2) Manual Core Flow Smoke (Required)

## 2.1 Authentication

- Login page renders and Turnstile verification is required.
- Successful login lands on `/navigation`.
- Logout flow works and returns to login.

## 2.2 Navigation + Layout

- Header and sidebar render correctly in expanded and collapsed states.
- Mobile sidebar opens/closes.
- No layout break at 100% and 125% zoom on major pages.

## 2.3 Leads

- Leads table renders with filters (branch, month, counsellor, keyword).
- Leads table branch chip color mapping:
  - `Baguio` uses the same branch chip style as `Pampanga`
  - `Cagayan de Oro` uses the same branch chip style as `Davao`
- Student Information modal opens from table row.
- Notes and Logs tabs show and save correctly.
- Branch Manager restriction works:
  - can view branch leads
  - cannot edit admin tab for other consultants
  - can edit consultation only when assigned

## 2.4 School Applications

- Applications list renders and opens detail page.
- Branch filter grouping behavior:
  - selecting `Pampanga` includes `Baguio` applications
  - selecting `Davao` includes `Cagayan de Oro` applications
- Status update modal works and remains centered/following viewport scroll.
- Status update writes timeline + note entries.
- Date formatting checks (birthday/application snapshots) remain correct.

## 2.5 Dashboard

- Role-based dashboard widgets load without empty wiring regressions.
- Milestone counts do not drop incorrectly when status advances.
- Application Funnel filter controls render in correct order for default dashboards:
  - Branch
  - Month
  - Quarter
  - Staff
- Application Funnel branch dropdown should hide grouped aliases:
  - `Baguio` is grouped under `Pampanga`
  - `Cagayan De Oro` is grouped under `Davao`
- Education Consultant Application Funnel exposes month + quarter filters.
- Month and quarter are mutually normalizing:
  - selecting a specific month resets quarter to `All Quarter`
  - selecting a specific quarter resets month to `All Months`
- When a quarter is selected, Month dropdown hides months outside that quarter.
- Filter-scoped widgets react to the current funnel filters (branch/month/quarter/staff):
  - Target vs Actual
  - Leads by Branch
  - Top Country Destination
  - Preferred Course of Study
  - Top Lead Sources
- Top Visa Grant Counsellors and Top Staff Referrers remain global (not funnel-filtered).
- Heatmap widget checks:
  - title is `Heatmap`
  - origin dropdown is visible (`Leads Origin`, `Application Origin`)
  - `Application Origin` shows lead locations only for leads with applications in the active funnel scope
  - location source uses lead submission current city (`currentLocation`) with branch fallback
  - no heatmap key banner appears (`Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for Google Maps.`)
- Transition animations apply to metric updates in Target vs Actual and scoped ranking widgets.
- Visa Approval Rate Trend dropdown and transition work.
- Heatmap renders correctly (including 125% zoom behavior).

## 2.5.1 Education Consultant Dashboard Specifics

- Funnel shows Month and Quarter filters only.
- `My Leads` subtitle is `Leads Assigned To You This Month`.
- `My Leads` count changes with current-month assigned leads.
- `My Visa Pipeline` bars react to month/quarter selection.
- `Visa Grant Rate` remains up-to-date from overall assigned visa outcomes and does not get reduced by month/quarter filter changes.

## 2.6 Timesheet

- Time in/out/lunch actions work.
- Leave/offset requests and approvals work by role.
- Offset-use checkpoint behavior:
  - approved range crossing `09:00` auto-plots `timeIn`
  - approved range crossing `12:00` auto-plots lunch-out (`lunchStart`)
  - approved range crossing `13:00` auto-plots lunch-in (`lunchEnd`)
  - approved range crossing `17:00` auto-plots `timeOut`
  - auto-plot must not overwrite existing manual punches
- Offset-use duration behavior:
  - lunch overlap (`12:00-13:00`) is excluded from consumed offset credits
  - request modal start-time dropdown does not offer `12:00`
  - sample validation: `11:00` start with `2 hours` resolves to `14:00` end and consumes `2h`
- Offset-use approved entries append standardized remarks in the daily row.
- `admin_ph@example.com` can access Timesheet Download tab.
- Timesheet download creates one workbook with one sheet per staff.

## 2.6.1 Personnel Admin

- Personnel page create flow works for authorized roles only.
- Unauthorized users cannot create personnel through `/api/personnel/create` (expect `403`/`401` depending on auth state).
- Delete flow still works through `/api/personnel/delete` for authorized roles.

## 2.7 Archive

- Archive page is visible only to Developer, Operations, Branch Manager.
- Archived leads/applications load.
- Archive keyword search behavior matches live leads/applications search normalization.
- Yearly archive trigger does not archive in-progress applications.

## 2.8 Notifications

- Notification bell count updates.
- Status milestone notifications are sent to correct branch-role recipients.
- Notification sound triggers on new notification.

## 2.9 Branding/Footer

- Sidebar footer should display:
  - `Pathfinder©`
  - `Created by Pathfinder Team`
  - `All Rights Reserved 2026`

## 3) Role Access Smoke Matrix

Validate at least one account each:

- Developer
- Operations
- Branch Manager
- Education Consultant
- Administrative Staff
- Satellite Office Staff

Minimum checks:

- page visibility by role
- data scope (global vs branch vs assigned)
- edit permissions
- dashboard widget scope

## 4) Latest Verified Run

Date: 2026-04-08

Automated results:

- `npm run verify:smoke` -> PASS
  - includes full verify chain + Playwright smoke (`5/5` passed)
- `npm run test:rules` -> REQUIRES JAVA (run in CI `Quality Gate / rules-semantic`)
  - CI executes this on Java-enabled runner (`actions/setup-java`, Temurin 21)
- `npm run verify` -> PASS
- `npm run test:e2e:smoke` -> PASS
- `npm audit --omit=dev` -> low-severity transitive advisories only (`@tootallnate/once` chain)

Routes confirmed during build:

- `/`
- `/login`
- `/[...slug]`
- `/api/archive/yearly-rollover`
- `/api/dashboard/ai-report`
- `/api/dashboard/global-visa-approval-trend`
- `/api/dashboard/top-staff-referrers`
- `/api/dashboard/top-visa-grant-counsellors`
- `/api/geocode/locations`
- `/api/notifications/create`
- `/api/personnel/create`
- `/api/personnel/delete`
- `/api/personnel/sync-balances`
- `/api/studynavi/sso`
- `/api/turnstile/verify`

Live production smoke (`https://your-app.example.com`):

- `GET /` -> `200`
- `GET /login` -> `200`
- `GET /navigation` -> `200`
- `POST /api/turnstile/verify` with invalid token -> `403` (expected)
- if a transient Turnstile upstream timeout occurs, `/api/turnstile/verify` may return `503` with retry guidance (`Retry-After: 5`)
- canonical host redirect probe (`x-forwarded-host` override) -> `308` to canonical URL
- Login HTML check -> no `Firebase failed to initialize` banner
- Browser console check on `/login` -> `window.__PATHFINDER_PUBLIC_ENV__` returns non-empty object with Firebase keys
- Browser console check on `/navigation` -> `window.__PATHFINDER_PUBLIC_ENV__.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is non-empty
- `GET /favicon.ico` -> `200`


