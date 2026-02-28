---
name: remit-scout-frontend-e2e
description: Run Remit-Scout Playwright E2E checks (local or remote) and capture traces; use for deployment smoke tests, consent/ads regressions, and validating critical pages.
---

# Remit-Scout Frontend E2E

## Overview

Run the repo’s Playwright E2E suite in a way that works both locally and against remote prod/staging, with predictable artifacts for debugging failures.

## Quick start (local)

This builds + previews Nuxt and then runs Playwright against `http://127.0.0.1:3000` (see `frontend/playwright.config.ts`):

```bash
pnpm -C frontend test:e2e
```

## One-time setup (if browsers are missing)

If Playwright fails with a “browser executable doesn’t exist” style error, install browsers once:

```bash
pnpm -C frontend exec playwright install
```

## Quick start (remote)

Prod:

```bash
PLAYWRIGHT_BASE_URL="https://remit-scout.com" pnpm -C frontend test:e2e
```

Staging:

```bash
PLAYWRIGHT_BASE_URL="https://staging.remit-scout.com" pnpm -C frontend test:e2e
```

## Targeted runs (keep signal high)

Consent/ads regression spec only:

```bash
PLAYWRIGHT_BASE_URL="https://remit-scout.com" pnpm -C frontend test:e2e --grep consent
```

## Where to look when it fails
- Playwright traces + screenshots: `frontend/test-results/`
- HTML report (when generated): `frontend/playwright-report/`

## Output template (for automations/inbox items)
Include:
- Target: `<prod|staging|local>`
- Suite: `<full|grep ...>`
- Result: `PASS` or `FAIL`
- First failing test name + error line
- Artifact paths (`frontend/test-results/...`)

## Central report integration

Write output to **Section 13: Frontend E2E** in `ops/reports/daily-ops-report.md`. Update Executive Summary row for "Frontend E2E" with the verdict.
