# GitHub Branch Protection

Purpose: enforce merge safety for `main` using existing CI checks.

Revision: 2026-04-18

## Recommended Rules for `main`

1. Require a pull request before merging.
2. Require at least 1 approving review.
3. Require review from Code Owners.
4. Dismiss stale approvals when new commits are pushed.
5. Require status checks to pass before merging:
   - `Quality Gate / verify`
   - `Quality Gate / functions-verify`
   - `Quality Gate / rules-semantic`
   - `Quality Gate / smoke`
   - `CodeQL / Analyze (javascript-typescript)`
6. Require branches to be up to date before merging.
7. Restrict direct pushes to `main` (admins optional).
8. Require all review conversations to be resolved before merge.

## Dependency PR Policy

For Dependabot pull requests:

- keep `Dependabot Triage` enabled (`.github/workflows/dependabot-triage.yml`)
- require human approval before merge
- do not auto-merge major updates without explicit regression checks

## Setup Path

GitHub repository settings:

- `Settings` -> `Branches` -> `Add branch protection rule`
- branch name pattern: `main`
