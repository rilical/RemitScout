---
name: remit-scout-smoke
description: Run Remit-Scout Plane A smoke checks (local or remote) to verify health, corridor/provider responses, and indices health; use for release gates, incident triage, and monitoring runs against staging/prod.
---

# Remit-Scout Smoke

## Overview

Run a deterministic HTTP smoke against Plane A (and indices health) using the repo’s existing CI scripts.
Use this when you need fast evidence that Remit‑Scout is “actually working”, not just up.

## Quick start (remote)

Prod:

```bash
SMOKE_BASE_URL="https://api.remit-scout.com" pnpm -C backend ci:integration-smoke
```

Staging:

```bash
SMOKE_BASE_URL="https://api-staging.remit-scout.com" pnpm -C backend ci:integration-smoke
```

Notes:
- Script entry: `backend/scripts/ci/integration-smoke.ts`
- It fails if we return “collecting/refresh_pending” or empty providers for core corridors.

## Quick start (local)

Runs a minimal local smoke using Fastify inject (no remote base URL):

```bash
pnpm -C backend ci:integration-smoke
```

## What this check covers
- `GET /healthz`, `GET /readyz`, `GET /metrics`
- Multiple B2C corridors through `GET /api/v1/providers` (expects real provider data)
- `GET /api/v1/indices/health` (expects `healthy` or `degraded`)

## Triage map (fast)
- `GET /readyz` fails: dependency issue (DB/Redis). Treat as release-blocking.
- `/providers` returns `refresh_pending` / `quotes_unavailable`: data freshness/collector issue.
  - Runbook: `docs/runbooks/provider-outage.md`
- `/indices/health` is unhealthy: gold publish/indices readiness issue.
  - Runbook: `docs/runbooks/indices-readiness.md`

## Output template (for automations/inbox items)

Include:
- Target: `<prod|staging|local>`
- Result: `PASS` or `FAIL`
- Failed checks: list `GET ...` names + status + note
- Timing: `p50`, `p95` from script footer

## Central report integration

Write output to **Section 12: API Smoke** in `ops/reports/daily-ops-report.md`. Update Executive Summary row for "API Smoke" with the verdict.
