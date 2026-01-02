# SQL Repository Refactor Plan (Plane-B + Expansion)

## Purpose
Persist a clear, resumable plan for refactoring all direct SQL in Plane-B into repositories, then expand to Plane-A/Plane-C where direct SQL remains.

## Status
- Phase 1 cataloging completed in chat (see file list + table list below).
- Repository structure created in `backend/plane-b/src/repositories`.
- Plane-B direct SQL now isolated to repositories + explicit transaction control in `ingest.ts`.
- Plane-A and Plane-C still contain direct SQL in services/routes (see Expansion Scope).
- Completed repositories: `silver.collector_attempt_metrics`, `silver.provider_rate_config`,
  `silver.quote_refresh_request`, `gold.signal_history`, `gold.webhook_subscriptions`,
  `bronze.provider_raw`, `silver.provider_corridor_capability`, `silver.quote_attempt`,
  `silver.ops_alert_event`, `silver.provider`, `silver.corridor`, `silver.rights_matrix`,
  `silver.circuit_breaker`, `silver.ingestion_run`, `silver.latest_quote_by_provider`,
  `silver.quote_record`, `silver.corridor_priority`, `silver.freshness_slo_report`,
  `silver.countries`, `gold.fx_rates`, `gold.fx_provider_rates`, `gold.popular_corridors`,
  `gold.pulse_cache`.

## Scope (Sources With Direct SQL)
- `backend/plane-b/src/collectors/base.ts`
- `backend/plane-b/src/collectors/attempt-metrics.ts`
- `backend/plane-b/src/collectors/rate-config.ts`
- `backend/plane-b/src/collectors/bronze-writer.ts`
- `backend/plane-b/src/collectors/alert-routing.ts`
- `backend/plane-b/src/ingest.ts`
- `backend/plane-b/src/quote-refresh.ts`
- `backend/plane-b/src/signals/webhook-dispatcher.ts`
- `backend/plane-b/src/signals/anomaly-detector.ts`
- `backend/plane-b/src/lib/proxy-router.ts`
- `backend/plane-b/src/providers/*/collector.ts`

## Expansion Scope (Plane-A + Plane-C)
Plane-A direct SQL:
- cleared (only `SELECT 1` health check remains)

Plane-C direct SQL (to refactor into Plane-C repositories):
 - cleared (only `SELECT 1` health check remains)

Explicitly allowed (health checks / infra):
- `backend/plane-a/src/app.ts` (SELECT 1)
- `backend/plane-c/src/server.ts` (SELECT 1)
Scripts/tests remain out of scope for repository refactor.

## Tables Touched (Current Inventory)
- silver.provider
- silver.provider_corridor_capability
- silver.corridor
- silver.quote_attempt
- silver.ops_alert_event
- silver.quote_record
- silver.latest_quote_by_provider
- silver.rights_matrix
- silver.circuit_breaker
- silver.ingestion_run
- silver.collector_attempt_metrics
- silver.provider_rate_config
- silver.corridor_priority
- silver.freshness_slo_report
- silver.countries
- silver.quote_refresh_request
- bronze.provider_raw
- gold.signal_history
- gold.webhook_subscriptions
- gold.fx_rates
- gold.fx_provider_rates
- gold.popular_corridors
- gold.pulse_cache

## Repository Structure To Create
```
backend/plane-b/src/repositories/
├── interfaces/
├── implementations/
└── index.ts
```
One interface + implementation per table (or tight domain), exported via `index.ts`.

## Proposed Order (Small → Large)
1) `silver.collector_attempt_metrics` (isolated, 2 queries, low risk) [done]
2) `silver.provider_rate_config` (isolated, 2 queries) [done]
3) `silver.quote_refresh_request` (small, queue logic) [done]
4) `gold.signal_history` + `gold.webhook_subscriptions` (small, 2 queries) [done]
5) `bronze.provider_raw` (2 locations) [done]
6) `silver.provider_corridor_capability` (shared across collectors + base) [done]
7) `silver.quote_attempt` + `silver.ops_alert_event` (base + alert routing) [done]
8) `silver.provider` + `silver.corridor` (simple inserts) [done]
9) `silver.rights_matrix` + `silver.circuit_breaker` (stateful but bounded) [done]
10) `silver.ingestion_run` (used in base + ingest) [done]
11) `silver.latest_quote_by_provider` + `silver.quote_record` (largest + complex) [done]
12) `silver.corridor_priority` (proxy tier + priority queues) [done]
13) `silver.freshness_slo_report` (bulk UNNEST insert) [done]
14) Seed-only tables in `ingest.ts`: `silver.countries`, `gold.fx_rates`,
    `gold.fx_provider_rates`, `gold.popular_corridors`, `gold.pulse_cache` [done]
15) Transaction control in `ingest.ts` (`BEGIN`/`COMMIT`/`ROLLBACK`):
    keep in service layer to preserve transactional orchestration [decided]
16) Plane-A: user/account + plan usage (small, isolated) [done]
17) Plane-A: gold.fx_rates + gold.popular_corridors (read-only) [done]
18) Plane-A: quote refresh + rights matrix (queue + gating) [done]
19) Plane-A: latest quotes + quote attempts (health + quotes) [done]
20) Plane-C: publisher contributor counts (single query) [done]

## Completed Targets (So Far)
- `silver.collector_attempt_metrics` (collectors)
- `silver.provider_rate_config` (collectors)
- `silver.quote_refresh_request` (queue worker)
- `gold.signal_history` + `gold.webhook_subscriptions` (signals)
- `bronze.provider_raw` (collectors + seed ingest)
- `silver.provider_corridor_capability` (collectors + ingest)
- `silver.quote_attempt` + `silver.ops_alert_event` (collectors + alerts)
- `silver.provider` + `silver.corridor` (collectors + seed ingest)
- `silver.rights_matrix` + `silver.circuit_breaker` (collectors + seed ingest)
- `silver.ingestion_run` (collectors + ingest)
- `silver.latest_quote_by_provider` + `silver.quote_record` (collectors + ingest + anomaly detection)
- `silver.corridor_priority` (proxy router)
- `silver.freshness_slo_report` (ingest)
- `silver.countries`, `gold.fx_rates`, `gold.fx_provider_rates`,
  `gold.popular_corridors`, `gold.pulse_cache` (seed ingest)
- Plane-A: `silver.user_account`, `silver.plan_usage_counter`
- Plane-A: `gold.fx_rates`, `gold.popular_corridors`
- Plane-A: `silver.quote_refresh_request`, `silver.rights_matrix`,
  `silver.latest_quote_by_provider`, `silver.quote_attempt`
- Plane-C: `silver.provider_corridor_capability`

## Files Created (So Far)
- `backend/plane-b/src/repositories/interfaces/attempt-metrics-repository.interface.ts`
- `backend/plane-b/src/repositories/implementations/attempt-metrics-repository.ts`
- `backend/plane-b/src/repositories/index.ts`
- `backend/plane-b/src/repositories/interfaces/provider-rate-repository.interface.ts`
- `backend/plane-b/src/repositories/implementations/provider-rate-repository.ts`
- `backend/plane-b/src/repositories/interfaces/quote-refresh-repository.interface.ts`
- `backend/plane-b/src/repositories/implementations/quote-refresh-repository.ts`
- `backend/plane-b/src/repositories/interfaces/signal-repository.interface.ts`
- `backend/plane-b/src/repositories/implementations/signal-repository.ts`
- `backend/plane-b/src/repositories/interfaces/webhook-repository.interface.ts`
- `backend/plane-b/src/repositories/implementations/webhook-repository.ts`
- `backend/plane-b/src/repositories/interfaces/bronze-repository.interface.ts`
- `backend/plane-b/src/repositories/implementations/bronze-repository.ts`
- `backend/plane-b/src/repositories/interfaces/provider-capability-repository.interface.ts`
- `backend/plane-b/src/repositories/implementations/provider-capability-repository.ts`
- `backend/plane-b/src/repositories/interfaces/quote-attempt-repository.interface.ts`
- `backend/plane-b/src/repositories/implementations/quote-attempt-repository.ts`
- `backend/plane-b/src/repositories/interfaces/ops-alert-repository.interface.ts`
- `backend/plane-b/src/repositories/implementations/ops-alert-repository.ts`
- `backend/plane-b/src/repositories/interfaces/provider-repository.interface.ts`
- `backend/plane-b/src/repositories/implementations/provider-repository.ts`
- `backend/plane-b/src/repositories/interfaces/corridor-repository.interface.ts`
- `backend/plane-b/src/repositories/implementations/corridor-repository.ts`
- `backend/plane-b/src/repositories/interfaces/rights-matrix-repository.interface.ts`
- `backend/plane-b/src/repositories/implementations/rights-matrix-repository.ts`
- `backend/plane-b/src/repositories/interfaces/circuit-breaker-repository.interface.ts`
- `backend/plane-b/src/repositories/implementations/circuit-breaker-repository.ts`
- `backend/plane-b/src/repositories/interfaces/ingestion-run-repository.interface.ts`
- `backend/plane-b/src/repositories/implementations/ingestion-run-repository.ts`
- `backend/plane-b/src/repositories/interfaces/latest-quote-repository.interface.ts`
- `backend/plane-b/src/repositories/implementations/latest-quote-repository.ts`
- `backend/plane-b/src/repositories/interfaces/quote-record-repository.interface.ts`
- `backend/plane-b/src/repositories/implementations/quote-record-repository.ts`
- `backend/plane-b/src/repositories/interfaces/corridor-priority-repository.interface.ts`
- `backend/plane-b/src/repositories/implementations/corridor-priority-repository.ts`
- `backend/plane-b/src/repositories/interfaces/freshness-report-repository.interface.ts`
- `backend/plane-b/src/repositories/implementations/freshness-report-repository.ts`
- `backend/plane-b/src/repositories/interfaces/countries-repository.interface.ts`
- `backend/plane-b/src/repositories/implementations/countries-repository.ts`
- `backend/plane-b/src/repositories/interfaces/fx-rate-repository.interface.ts`
- `backend/plane-b/src/repositories/implementations/fx-rate-repository.ts`
- `backend/plane-b/src/repositories/interfaces/fx-provider-rate-repository.interface.ts`
- `backend/plane-b/src/repositories/implementations/fx-provider-rate-repository.ts`
- `backend/plane-b/src/repositories/interfaces/popular-corridor-repository.interface.ts`
- `backend/plane-b/src/repositories/implementations/popular-corridor-repository.ts`
- `backend/plane-b/src/repositories/interfaces/pulse-cache-repository.interface.ts`
- `backend/plane-b/src/repositories/implementations/pulse-cache-repository.ts`
- `backend/plane-a/src/repositories/interfaces/user-account-repository.interface.ts`
- `backend/plane-a/src/repositories/implementations/user-account-repository.ts`
- `backend/plane-a/src/repositories/interfaces/plan-usage-repository.interface.ts`
- `backend/plane-a/src/repositories/implementations/plan-usage-repository.ts`
- `backend/plane-a/src/repositories/interfaces/fx-rate-repository.interface.ts`
- `backend/plane-a/src/repositories/implementations/fx-rate-repository.ts`
- `backend/plane-a/src/repositories/interfaces/popular-corridor-repository.interface.ts`
- `backend/plane-a/src/repositories/implementations/popular-corridor-repository.ts`
- `backend/plane-a/src/repositories/interfaces/quote-refresh-repository.interface.ts`
- `backend/plane-a/src/repositories/implementations/quote-refresh-repository.ts`
- `backend/plane-a/src/repositories/interfaces/rights-matrix-repository.interface.ts`
- `backend/plane-a/src/repositories/implementations/rights-matrix-repository.ts`
- `backend/plane-a/src/repositories/interfaces/latest-quote-repository.interface.ts`
- `backend/plane-a/src/repositories/implementations/latest-quote-repository.ts`
- `backend/plane-a/src/repositories/interfaces/quote-attempt-repository.interface.ts`
- `backend/plane-a/src/repositories/implementations/quote-attempt-repository.ts`
- `backend/plane-c/src/data/publisher-repository.interface.ts`
- `backend/plane-c/src/data/publisher-repository.ts`
- `backend/plane-c/src/data/index.ts`

## Files Updated (So Far)
- `backend/plane-b/src/collectors/attempt-metrics.ts`
- `backend/plane-b/src/collectors/rate-config.ts`
- `backend/plane-b/src/quote-refresh.ts`
- `backend/plane-b/src/signals/webhook-dispatcher.ts`
- `backend/plane-b/src/collectors/bronze-writer.ts`
- `backend/plane-b/src/ingest.ts`
- `backend/plane-b/src/collectors/base.ts`
- `backend/plane-b/src/collectors/alert-routing.ts`
- `backend/plane-b/src/signals/anomaly-detector.ts`
- `backend/plane-b/src/providers/remitly/collector.ts`
- `backend/plane-b/src/providers/wise/collector.ts`
- `backend/plane-b/src/providers/worldremit/collector.ts`
- `backend/plane-b/src/providers/westernunion/collector.ts`
- `backend/plane-b/src/providers/xe/collector.ts`
- `backend/plane-b/src/lib/proxy-router.ts`
- `backend/plane-a/src/repositories/index.ts`
- `backend/plane-a/src/services/user-account.ts`
- `backend/plane-a/src/services/plan-usage.ts`
- `backend/plane-a/src/routes/quotes.ts`
- `backend/plane-a/src/routes/popular-corridors.ts`
- `backend/scripts/sql-guardrail.ts`
- `backend/package.json`
- `backend/plane-a/src/routes/ops/remitly-health.ts`
- `backend/plane-a/src/routes/ops/worldremit-health.ts`
- `backend/plane-a/src/routes/ops/wise-health.ts`
- `backend/plane-a/src/routes/ops/westernunion-health.ts`
- `backend/plane-a/src/routes/ops/xe-health.ts`
- `backend/plane-c/src/routes/publisher.ts`

## Removals / Cleanup
- No file deletions planned.
- Remove direct SQL calls + `query`/`pool.query` imports from refactored modules.
 - Keep `SELECT 1` health checks outside repositories (explicit allowlist).

## Refactor Rules (Do Not Deviate)
- Do not change SQL logic; copy SQL verbatim into repositories.
- Keep function signatures stable in existing modules.
- All repository methods return `Promise<T>` and are fully typed.
- Keep transformations (row mapping, business logic) outside repositories.
- One table at a time; verify after each refactor.

## Tooling
- `pnpm -C backend guardrail:sql` fails if SQL calls appear outside repositories.
- `pnpm -C backend sql:inventory` lists SQL call sites in `plane-b/src`.
- `pnpm -C backend guardrail:sql:plane-a` fails if SQL calls appear outside repositories in `plane-a/src`.
- `pnpm -C backend guardrail:sql:plane-c` fails if SQL calls appear outside repositories in `plane-c/src`.
- `pnpm -C backend sql:inventory:plane-a` lists SQL call sites in `plane-a/src`.
- `pnpm -C backend sql:inventory:plane-c` lists SQL call sites in `plane-c/src`.
- Plane-C guardrail should pass now; only `SELECT 1` is allowlisted outside repositories.
