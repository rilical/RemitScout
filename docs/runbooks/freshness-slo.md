# Freshness SLO Runbook

## What this runbook covers
Freshness regressions and quote staleness across tier-1 and tier-2 corridors.

This runbook is for incidents where:
- quotes are stale or missing
- freshness SLO alarms are firing
- Bronze->Silver throughput looks degraded

## Fast triage (bounded evidence first)
1. Run `evidence.freshness_slo.github_actions`.
1. If missing-quote findings appear, run `evidence.no_quotes_audit.github_actions`.
1. For affected providers, run `evidence.provider_health.github_actions`.
1. If conversion/lag is suspected, run `evidence.bronze_silver_throughput.github_actions`.

## Reason codes and immediate interpretation
- `freshness.p95_high`
  - Tier-1 p95 freshness exceeds threshold.
- `freshness.tier2_regression`
  - Tier-2 p95 freshness exceeds threshold.
- `freshness.missing_quotes`
  - One or more tier corridors have no fresh quotes in the lookback window.
- `pipeline.bronze_write_dropped`
  - Bronze has recent writes but Silver has no corresponding quotes.
- `pipeline.silver_lag_high`
  - Silver collection timestamp significantly lags behind Bronze ingestion.
- `pipeline.conversion_ratio_low`
  - Bronze->Silver conversion ratio has degraded.

## Primary code/data entrypoints
- SLO computation job: `backend/scripts/data-health-slo-job.ts`
- SLO thresholds: `backend/shared/slo-tracker.ts`
- Collector runtime: `backend/plane-b/src/collectors/base-collector.ts`
- Normalization path: `backend/plane-b/src/normalize/quote-normalizer.ts`
- Silver tables: `silver.latest_quote_by_provider`, `silver.quote_record`, `silver.ingestion_run`
- Bronze table: `bronze.provider_raw`

## Decision tree
1. `freshness.p95_high` or `freshness.tier2_regression` only:
   - Check whether issue is isolated to tier or broad across all providers.
   - Validate queue backlog and worker throughput before touching provider logic.
1. `freshness.missing_quotes` present:
   - Use no-quotes audit to identify top corridors/providers.
   - Run provider health evidence for top offenders (403/429/circuit/freshness gaps).
1. `pipeline.*` findings present:
   - Treat as ingestion/normalization pipeline incident.
   - Inspect collector and normalizer changes first; check recent deploys.

## Escalation guidelines
- `prod` + sustained `freshness.p95_high` or `freshness.missing_quotes`: escalate to on-call immediately.
- Any `pipeline.bronze_write_dropped` in `prod`: escalate to Plane B owner.
- If DB pressure/long queries coexist, involve infra/DB owner as parallel workstream.

## Do-not-do during incident
- Do not disable safeguards that make missing data visible.
- Do not bypass rights-matrix rules to “force” coverage.
- Do not paste raw large logs into Case artifacts; store pointers and keep EvidenceResult bounded.

