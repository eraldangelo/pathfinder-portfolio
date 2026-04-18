# ADR 0001: Split Smoke and Regression Validation

## Status

Accepted

Last reviewed: 2026-04-07

## Context

Pathfinder needs fast release confidence while keeping protection for deeper role and API invariants.
Single broad browser E2E suites increase feedback time and make failures harder to triage.

## Decision

- Keep browser smoke intentionally focused and fast:
  - `npm run test:e2e:smoke`
- Keep deeper logic validation in deterministic tests:
  - `npm run test` for unit/regression contracts
  - includes role logic, archive utils, geocode utils, turnstile token parsing, and API auth matrices
- Run `verify` as the main quality gate and `verify:smoke` as full release gate.
- Keep postdeploy production sanity as a separate guard:
  - `npm run postdeploy:check`

## Consequences

Positive:

- Faster local and CI feedback for common breakages.
- Better isolation when regressions happen.
- Clear separation between local deterministic checks and browser wiring checks.

Tradeoffs:

- Requires discipline to keep smoke small.
- Requires docs to keep suite purpose clear.

## Follow-up Validation (2026-04-07)

- `npm run verify` passed.
- `npm run test:e2e:smoke` passed (after clearing a stale `.next/dev/lock` from an existing local dev process).
- Decision remains valid and is kept as the release default.
