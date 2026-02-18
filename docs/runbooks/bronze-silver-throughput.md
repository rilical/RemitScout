# Bronze->Silver Throughput Runbook

## What this runbook covers
Incidents where ingestion writes are not flowing cleanly from Bronze (`bronze.provider_raw`) to Silver (`silver.quote_record` / `silver.latest_quote_by_provider`).

Primary symptom patterns:
- stale or missing quotes even though collectors appear active
- sharp drops in Silver volume while Bronze volume remains high
- lag between Bronze ingest timestamps and Silver collection timestamps

## Fast triage (evidence-first)
1. Run `evidence.bronze_silver_throughput.github_actions`.
1. For top affected providers, run `evidence.provider_health.github_actions`.
1. If freshness is user-visible, run `evidence.freshness_slo.github_actions`.

## Reason codes and interpretation
- `pipeline.bronze_write_dropped`
  - Bronze has recent writes but Silver has zero corresponding rows for one or more providers.
- `pipeline.silver_lag_high`
  - Silver collection is materially behind Bronze ingest.
- `pipeline.conversion_ratio_low`
  - Bronze->Silver conversion ratio regressed for providers with meaningful volume.

## Primary code and data entrypoints
- Collector orchestration: `backend/plane-b/src/collectors/base-collector.ts`
- Normalizer: `backend/plane-b/src/normalize/quote-normalizer.ts`
- Provider registry: `backend/plane-b/src/providers/index.ts`
- Bronze table: `bronze.provider_raw`
- Silver tables: `silver.quote_record`, `silver.latest_quote_by_provider`, `silver.ingestion_run`

## Decision flow
1. If `pipeline.bronze_write_dropped` is present:
   - inspect recent parser/normalizer changes first
   - verify collector runs are succeeding and writing expected payload shapes
1. If `pipeline.silver_lag_high` dominates:
   - check queue/worker backpressure and DB latency
   - confirm no long-running DB queries are slowing write paths
1. If `pipeline.conversion_ratio_low` dominates:
   - inspect provider-specific parsing/quality-flag logic
   - compare affected providers against provider health reason codes (403/429/circuit)

## Escalation rules
- `prod` + persistent `pipeline.bronze_write_dropped`: escalate to Plane B on-call.
- Pipeline findings plus DB pressure findings: escalate to infra/DB in parallel.
- If customer-facing freshness SLO is breached, run freshness runbook concurrently.

## Do-not-do during incident
- Do not relax rights-matrix semantics to hide missing coverage.
- Do not switch to unbounded ad-hoc dumps in Case artifacts; keep evidence bounded and pointer-based.

