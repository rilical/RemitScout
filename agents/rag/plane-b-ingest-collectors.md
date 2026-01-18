# Plane B Ingest & Collectors RAG

## Purpose
Own Plane B ingestion, provider collectors, normalization, and refresh workers. This agent guarantees data correctness from provider fetch -> Bronze -> Silver so both B2B sweeps and B2C refreshes are reliable.

## Primary RAG
- `ARCHITECTURE.md` (authoritative system map + invariants)

## Scope (must stay within)
Runtime entrypoints:
- `backend/plane-b/src/ingest.ts`
- `backend/plane-b/src/quote-refresh.ts`
- `backend/plane-b/src/fx-rate-refresh.ts`
- `backend/plane-b/src/health-server.ts`

Collectors + providers:
- `backend/plane-b/src/collectors/**`
- `backend/plane-b/src/providers/**`

Normalization + signals:
- `backend/plane-b/src/normalize/**`
- `backend/plane-b/src/signals/**`

Services + repos:
- `backend/plane-b/src/services/**`
- `backend/plane-b/src/repositories/**`

Shared (only when referenced by Plane B):
- `backend/shared/**`

AWS entrypoints + workers:
- `backend/scripts/ingest-run.ts`
- `backend/scripts/aws/plane-b-ingest-ecs.ts`
- `backend/scripts/aws/ingest-fanout-worker-ecs.ts`
- `backend/scripts/aws/b2c-refresh-worker-ecs.ts`
- `backend/scripts/b2c-refresh-worker.ts`

## Required behavior
- Validate collector flow (rate limits, retries, block detection, proxy routing).
- Ensure parse + normalization yields valid, comparable quotes.
- Ensure Bronze write happens before Silver normalization.
- Ensure refresh status/attempt metrics always converge (no stuck queues).
- Follow the standard output format from `AGENTS.md`.

## How Plane B connects to the rest of the system
- **Plane A** enqueues B2C refresh requests -> **SQS/DB queue** -> `quote-refresh.ts`.
- **EventBridge schedule** runs `ingest.ts` (B2B sweeps) -> collectors -> Bronze/Silver.
- **Gold jobs** read Silver outputs for aggregates and publishing (Plane C).
- **Rights matrix + provider capability** gate corridor eligibility during ingestion and refresh.

## Non-negotiable invariants
- Do not emit quotes for unsupported corridors or methods.
- Rights matrix is authoritative; NULL/empty country sets do **not** match all corridors.
- Amount buckets are exact; if no exact bucket, enqueue fresh request (no reuse).
- Raw provider payloads are stored in Bronze before normalization.
- Normalized quotes include provider id, corridor, amount bucket, methods, fxRate, fees, timestamps.
- Refresh status must move to completed/failed/blocked with explicit reason.

## Key runtime paths and triggers (read these first)
1) **Ingest + B2B sweeps**:
   - `backend/plane-b/src/ingest.ts`
   - `backend/scripts/ingest-run.ts`
   - `backend/scripts/aws/plane-b-ingest-ecs.ts`
   - Uses `RightsMatrixRepository`, `ProviderCapabilityRepository`, `LatestQuoteRepository`.
   - B2B defaults in `ingest.ts`: provider-specific `b2bAmount`, payin/payout defaults, shard logic.

2) **B2C refresh worker**:
   - `backend/plane-b/src/quote-refresh.ts`
   - `backend/scripts/b2c-refresh-worker.ts`
   - Reads `config.queues.quoteRefresh*` and `QuoteRefreshRepository`.
   - Uses `VolatilityService` to determine freshness TTL.

3) **FX refresh worker**:
   - `backend/plane-b/src/fx-rate-refresh.ts`
   - `config.queues.fxRateRefresh*` and `fxRates` settings.

## Config knobs that control behavior
- `backend/shared/config.ts`:
  - `config.planeB.*`: per-provider delays, jitter, b2bAmount, blockCooldown, shard settings.
  - `config.planeB.b2cRefresh*`: batch limit, retries, concurrency, live RPM overrides.
  - `config.queues.*`: `quoteRefreshUrl`, `quoteRefreshMode`, DLQ URLs, DB fallback.
  - `config.fxRates.*`: TTLs and OANDA refresh settings.

## Ingestion flow (expected)
1) Scheduler selects corridor + provider + amount bucket.
2) Collector fetches via HTTP client + proxy router.
3) Parse response -> normalize to canonical quote.
4) Write Bronze payload (raw).
5) Write Silver normalized quote + attempt metrics.
6) Update refresh status and cache freshness if applicable.

## Data contracts (what a normalized quote must include)
- `provider_id`
- `corridor_id` (source + dest country)
- `amount_bucket` (exact)
- `payin_method`, `payout_method`
- `fx_rate`, `fees`, `recipient_gets`
- `collected_at`, `normalized_at`
- `quality_flags` (if applicable)

## File map to inspect (priority order)
Scheduler + collectors:
1) `backend/plane-b/src/collectors/scheduler.ts`
2) `backend/plane-b/src/collectors/base-collector.ts`
3) `backend/plane-b/src/collectors/http-client.ts`
4) `backend/plane-b/src/collectors/block-detection.ts`
5) `backend/plane-b/src/collectors/rpm-ramp.ts`
6) `backend/plane-b/src/collectors/alert-routing.ts`

Provider correctness:
7) `backend/plane-b/src/providers/*/fetch.ts`
8) `backend/plane-b/src/providers/*/parse.ts`
9) `backend/plane-b/src/providers/*/supported-corridors.ts`
10) `backend/plane-b/src/providers/*/limits.ts`

Normalization + volatility:
11) `backend/plane-b/src/normalize/quote-normalizer.ts`
12) `backend/plane-b/src/normalize/method-profile.ts`
13) `backend/plane-b/src/services/volatility-service.ts`

Repos and DB writes:
14) `backend/plane-b/src/repositories/implementations/quote-record-repository.ts`
15) `backend/plane-b/src/repositories/implementations/latest-quote-repository.ts`
16) `backend/plane-b/src/repositories/implementations/quote-refresh-repository.ts`
17) `backend/plane-b/src/repositories/implementations/attempt-metrics-repository.ts`
18) `backend/plane-b/src/repositories/implementations/rights-matrix-repository.ts`
19) `backend/plane-b/src/repositories/implementations/provider-capability-repository.ts`

Shared logic:
20) `backend/shared/amount-bucket.ts`
21) `backend/shared/provider-currencies.ts`
22) `backend/shared/corridor.ts`
23) `backend/shared/volatility-service.ts`

## Checklist (what to verify)
- **Rate control**: RPM limits, jitter, backoff, concurrency caps.
- **Block detection**: correct signals and cooldown behavior per provider.
- **Proxy routing**: provider-specific proxy rules, fallback strategy.
- **Parse correctness**: decimal handling, currency direction, fee semantics.
- **Method mapping**: provider method -> canonical method profile.
- **Normalization**: no inverted fxRate, no negative fees, no missing timestamps.
- **Bronze write**: raw payload stored once per attempt with trace ids.
- **Silver write**: idempotent latest quote updates.
- **Refresh status**: queue states move pending -> processing -> completed/failed/blocked.
- **Rights matrix**: corridor eligibility enforced before any collector run.
- **Bucket logic**: `amount_bucket` exact, no fallback reuse.

## AWS readiness
- ECS tasks run in private subnets with NAT or VPC endpoints.
- Secrets pulled via Secrets Manager/SSM only (no local defaults).
- SQS queues have DLQs and alarms for depth and age.
- EventBridge schedules enabled for sweeps and refresh workers.

## Observability expectations
- Every attempt logs provider id, corridor, amount bucket, request id.
- Attempt metrics track success, failure, blocked, retry counts.
- Collector checkpoints prevent duplicate runs.
- Queue depth logs for SQS + DB fallback when enabled.

## Hands-on checks (evidence required)
1) **Single-provider ingest**: run one corridor/provider sweep and confirm Bronze + Silver writes.
2) **Queue lifecycle**: enqueue a refresh and confirm status transitions to completed/failed.
3) **SQL counts**: compare Bronze raw count vs Silver quote count for a time window.
4) **Freshness SLOs**: query `silver.freshness_slo_report` for stale ratios by corridor/provider.
5) **Attempt metrics**: verify `silver.collector_attempt_metrics` updates after runs.

## Evidence capture template
- Provider/corridor: <provider> <corridor> bucket=<amount>
- Bronze row id + s3_object_key: <id> <key>
- Silver record count (24h): <count>
- Refresh status counts: pending=<n> processing=<n> completed=<n> failed=<n>
- Freshness stale%: <percent> (window=<hours>)

## Common failure modes to catch
- Provider shows on unsupported corridor (missing supported-corridors or rights-matrix gating).
- Method filter ignored (cash shown for bank-only provider).
- FX rate inverted or wrong base/quote currency.
- Amount bucket mismatch (reusing 500 for large amounts).
- Missing Bronze write or partial Silver write on failure.
- Refresh status never completes (stuck pending/processing).
- Volatility TTL too aggressive, causing repeated refresh churn.

## Tests to lean on
- Provider tests: `backend/tests/*-fetch.test.ts`, `backend/tests/*-parse.test.ts`, `backend/tests/*-corridors.test.ts`
- Guardrails: `backend/tests/guardrails.test.ts`, `backend/tests/rights-matrix-enforcement.test.ts`
- Repos: `backend/tests/*-repository.test.ts`

## Output expectations
- Identify concrete data correctness risks first.
- Provide a minimal fix path and any regression risks.
- Call out downstream impact on Plane A, Gold jobs, and exports.

## Provider fixture validation
- Every provider should have fixture snapshots.
- Parsers should be validated against fixtures before deploy.
- Fixture failures block release for that provider.

## Rights matrix sync
- Ensure `rights-matrix-sync-countries.ts` is run when matrix changes.
- Provider eligibility must match rights matrix in Silver.

## Ingestion run health
- Ingestion runs must have `started_at` and `finished_at`.
- Failed runs must have error codes.
- Sweep cadence must match tier expectations.

## Additional SQL probes
- Ingestion runs:
  - `SELECT provider_id, collector_type, status, finished_at FROM silver.ingestion_run ORDER BY finished_at DESC LIMIT 50;`
- Provider capability coverage:
  - `SELECT provider_id, COUNT(*) FROM silver.provider_corridor_capability GROUP BY provider_id;`


## Self-healing loop
- Detect missing/incorrect fundamentals that affect multiple agents and propose updates to `ARCHITECTURE.md`.
- Detect agent-specific gaps and propose updates to this RAG file.
- Apply updates only when edits are authorized; otherwise propose changes for approval.
