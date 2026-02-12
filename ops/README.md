# Remit-Scout Ops Reports

## Purpose

Central location for automated operational reports. Every Codex skill and agent writes its findings here. The **self-healing automation** reads this file and acts on findings autonomously.

## How it works

1. **Skills run** (scheduled or on-demand) and append their findings to `ops/reports/daily-ops-report.md`
2. **Self-healing automation** reads the report, diagnoses root causes, creates fixes, and pushes PRs
3. **Report is regenerated daily** — previous reports are archived as `ops/reports/archive/YYYY-MM-DD.md`

## Report file

- **Active report:** `ops/reports/daily-ops-report.md`
- **Archive:** `ops/reports/archive/YYYY-MM-DD.md`

## Skills that write to this report

| Skill | Section | Cadence |
|-------|---------|---------|
| `remit-scout-aws-resource-audit` | AWS Resources | Daily |
| `remit-scout-provider-health-probe` | Provider Health | Daily |
| `remit-scout-gold-indices-integrity` | Gold Indices | Every 4h |
| `remit-scout-export-monitor` | Exports | Hourly |
| `remit-scout-db-observer` | Database | Every 15 min |
| `remit-scout-codebase-hygiene` | Codebase | Weekly |
| `remit-scout-env-drift-detector` | Env Drift | Before deploy |
| `remit-scout-b2b-b2c-corridor-diagnostics` | B2B/B2C Coverage | Daily |
| `remit-scout-queue-corridor-watchdog` | Queue & Corridor Pipeline | Every 15 min |
| `remit-scout-rate-anomaly-detector` | Rate Anomalies | Every 15 min |
| `remit-scout-provider-api-change-detector` | Provider API Changes | Every 4h |
| `remit-scout-release-readiness-gate` | Release Gate | Before deploy |
| `remit-scout-silver-gold-reconciliation` | Data Reconciliation | Every 4h |
| `remit-scout-fx-rate-anomaly-detector` | FX Rate Health | Hourly |
| `remit-scout-capacity-planner` | Capacity Plan | Weekly |
| `remit-scout-incident-postmortem-generator` | Post-Mortems | Daily (after fixes) |
| `remit-scout-dev-cost-guard` | Cost Guard | Daily |
| `remit-scout-smoke` | API Smoke | Daily |
| `remit-scout-frontend-e2e` | Frontend E2E | Daily |
| `remit-scout-weekly-risk-review` | Risk Review | Weekly |

## Self-healing automation

- **Skill:** `remit-scout-self-healing`
- **Reads:** `ops/reports/daily-ops-report.md`
- **Actions:** Diagnose → Fix → Test → Branch → PR → Push
- **Guardrails:** Never pushes to main/develop directly; always creates feature branches with PR
