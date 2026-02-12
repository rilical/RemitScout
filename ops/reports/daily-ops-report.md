# Remit-Scout Daily Ops Report

> **Generated:** (auto-filled by automation)
> **Environment:** (auto-filled)
> **Status:** PENDING

---

## Executive Summary

| Dimension | Status | Details |
|-----------|--------|---------|
| AWS Resources | PENDING | — |
| Provider Health (B2B) | PENDING | — |
| Provider Health (B2C) | PENDING | — |
| Gold Indices Pipeline | PENDING | — |
| Export Delivery | PENDING | — |
| Database Health | PENDING | — |
| B2B/B2C Coverage | PENDING | — |
| Codebase Hygiene | PENDING | — |
| Environment Drift | PENDING | — |
| Cost | PENDING | — |
| SLO Compliance | PENDING | — |
| API Smoke | FAIL | Dev `ci:integration-smoke` fails on corridors without cached quotes in devPaused mode (quotes_unavailable: US→PH/IN/NG/KE/CO). |
| Frontend E2E | PENDING | — |
| Queue & Corridor Pipeline | PENDING | — |
| Rate Anomalies | PENDING | — |
| Provider API Changes | PENDING | — |
| Data Reconciliation | PENDING | — |
| FX Rate Health | PENDING | — |
| Capacity Plan | PENDING | — |
| Post-Mortems | PENDING | — |

**Overall:** PENDING

---

## Section 1: AWS Resources
<!-- Written by: remit-scout-aws-resource-audit -->

(awaiting data)

---

## Section 2: Provider Health — B2B
<!-- Written by: remit-scout-provider-health-probe -->
<!-- B2B providers filtered by: allowed_b2b=true, collector_type LIKE 'b2b_%' -->

(awaiting data)

---

## Section 3: Provider Health — B2C
<!-- Written by: remit-scout-provider-health-probe -->
<!-- B2C providers filtered by: allowed_b2c=true -->

(awaiting data)

---

## Section 4: B2B/B2C Corridor Coverage
<!-- Written by: remit-scout-b2b-b2c-corridor-diagnostics -->

(awaiting data)

---

## Section 5: Gold Indices Pipeline
<!-- Written by: remit-scout-gold-indices-integrity -->

(awaiting data)

---

## Section 6: Export Delivery
<!-- Written by: remit-scout-export-monitor -->

(awaiting data)

---

## Section 7: Database Health
<!-- Written by: remit-scout-db-observer -->

(awaiting data)

---

## Section 8: Codebase Hygiene
<!-- Written by: remit-scout-codebase-hygiene -->

(awaiting data)

---

## Section 9: Environment Drift
<!-- Written by: remit-scout-env-drift-detector -->

(awaiting data)

---

## Section 10: Cost
<!-- Written by: remit-scout-dev-cost-guard -->

(awaiting data)

---

## Section 11: SLO Compliance
<!-- Written by: remit-scout-daily-ops-report -->

(awaiting data)

---

## Section 12: API Smoke
<!-- Written by: remit-scout-smoke -->

Run (dev): `SMOKE_BASE_URL=https://vhugw1jucg.execute-api.us-east-1.amazonaws.com pnpm -C backend ci:integration-smoke`

- PASS: `/healthz`, `/readyz`, `/metrics`, `/corridor-currencies` (US→MX/PH/IN/NG/KE/CO), `/providers` (US→MX bank), `/indices/health`
- FAIL: `/providers` returned `collecting (quotes_unavailable)` for:
  - US→PH (bank)
  - US→IN (bank)
  - US→NG (bank)
  - US→KE (wallet)
  - US→CO (bank)
- Timing summary: p50=87ms p95=309ms count=16

Notes:
- This is expected when dev is in “observation / devPaused” posture (schedules disabled, no background B2C warming).
- For dev observation proofs, run controlled `/api/v1/quotes/current` refresh + one-off `b2c-refresh-worker` drain for the specific corridor(s) under test.

---

## Section 13: Frontend E2E
<!-- Written by: remit-scout-frontend-e2e -->

(awaiting data)

---

## Section 14: Queue & Corridor Pipeline
<!-- Written by: remit-scout-queue-corridor-watchdog -->

(awaiting data)

---

## Section 15: Rate Anomalies
<!-- Written by: remit-scout-rate-anomaly-detector -->

(awaiting data)

---

## Section 16: Provider API Changes
<!-- Written by: remit-scout-provider-api-change-detector -->

(awaiting data)

---

## Section 17: Release Gate
<!-- Written by: remit-scout-release-readiness-gate (on-demand) -->

(awaiting data)

---

## Section 18: Data Reconciliation
<!-- Written by: remit-scout-silver-gold-reconciliation -->

(awaiting data)

---

## Section 19: FX Rate Health
<!-- Written by: remit-scout-fx-rate-anomaly-detector -->

(awaiting data)

---

## Section 20: Capacity Plan
<!-- Written by: remit-scout-capacity-planner -->

(awaiting data)

---

## Section 21: Post-Mortems
<!-- Written by: remit-scout-incident-postmortem-generator -->

(awaiting data)

---

## Action Items

| # | Priority | Issue | Source Skill | Root Cause | Fix | Status |
|---|----------|-------|-------------|------------|-----|--------|
| — | — | — | — | — | — | PENDING |

---

## Self-Healing Log

| Timestamp | Issue | Diagnosis | Fix Applied | Branch | PR | Result |
|-----------|-------|-----------|-------------|--------|-----|--------|
| — | — | — | — | — | — | — |
