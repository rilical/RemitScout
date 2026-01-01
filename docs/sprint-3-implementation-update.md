# Sprint 3 Implementation Update (Current State)

## Scope
This document summarizes the current implementation across the Sprint 2 and Sprint 3 packs and the RSE document. It is intended to explain what is working today, what changed from the original plans, and where we still diverge from the published documentation.

## Sources Reviewed
- RSE-271225-022936.pdf (extracted to /tmp/rse-271225-022936.txt)
- docs/prompt-pack/S2-identity-entitlements.md
- docs/prompt-pack/S3-provider-integration.md
- docs/sprint-3-delta-notes.md
- docs/providers/global-defaults.md
- docs/providers/bucket-policy.md
- docs/providers/code-map-policy.md
- docs/providers/corridor-coverage-policy.md
- docs/providers/rate-limit-tuning.md
- docs/catalogs/data-stores.md
- backend/db/migrations/*.sql

## Current Architecture Summary
- Planes: Plane A (API), Plane B (ingestion), Plane C (analytics/export).
- Bronze: raw provider payloads (bronze.provider_raw).
- Silver: operational truth (quote_record, latest_quote_by_provider, provider/corridor registry, attempts, ops events).
- Gold: derived datasets for product endpoints (fx_rates, popular_corridors, pulse_cache).
- Gold export: gold_export schema exists for future B2B publishing.

## What Is Implemented Now
### Remitly ingestion (Plane B)
- Collector orchestration is active: fetch -> block detect -> bronze write -> parse -> normalize -> persist.
- Promo fields are parsed and stored: promotional_rate, base_rate, promotional_cap_amount.
- Block detection logs to silver.ops_alert_event and silver.quote_attempt.
- Jitter and backoff are implemented in the HTTP client and per-corridor pacing.
- Supported corridors now include base currency variants:
  - Send currencies: source default + USD/EUR/GBP.
  - Receive currencies: destination default + USD.
- Canonical mapping uses alpha-2 countries and ISO-4217 alpha-3 currencies; Remitly currency map now includes EUR.

### Buckets and approximate logic
- Buckets remain 50, 100, 500, 1000, 3000, 10000.
- Nearest-bucket selection is used for amount buckets.
- Floor-bucket selection is used for fee buckets.
- Tie-break for nearest bucket now prefers the higher bucket (example: 300 -> 500).
- Shared implementation in backend/shared/amount-bucket.ts.

### B2B vs B2C execution model
- One pipeline, two modes via orchestration:
  - B2B sweep: Plane B ingest runs fixed-amount sweeps (collector_type = b2b_sweep).
  - B2C live: Plane A can trigger a targeted refresh for a single corridor/bucket (collector_type = b2c_live).
- B2B fixed amount is configurable via PLANE_B_REMITLY_B2B_AMOUNT (default 500).

### B2C caching and concurrency
- /api/quotes/current accepts amount and maps to nearest bucket.
- Per-bucket caching is enforced with a TTL (PLANE_A_B2C_CACHE_TTL_SECONDS).
- Live refreshes are queued (Plane A enqueues into silver.quote_refresh_request; Plane B processes on the next sweep).
- Optional jitter is applied before enqueue (PLANE_A_B2C_JITTER_MS).
- Response includes bucket_used, fee_bucket_used, approximate, cache metadata, and refresh metadata.

### B2C refresh worker
- A standalone worker exists for near-real-time queue processing (scripts/b2c-refresh-worker.ts).
- It is cronable and processes a limited batch per run (PLANE_B_B2C_REFRESH_BATCH_LIMIT).

### Schema consolidation
- Legacy silver tables are no longer written by Plane B ingestion:
  - silver.providers, silver.corridors, silver.provider_quotes.
- Compatibility views now map legacy table names to canonical tables.
- Canonical tables in use: silver.provider, silver.corridor, silver.quote_record, silver.latest_quote_by_provider.

### Tests added
- Remitly corridor variants test for base-currency combinations.
- Bucket selection tests include tie-break behavior.

## Key Deviations From Published Docs
- Corridor discovery is currently static (generated from source/destination lists) rather than fully discovery-driven from provider responses (docs/providers/corridor-coverage-policy.md).
- Tier promotion/demotion windows (3-day/2-day) are not implemented; current view is immediate based on 24h metrics.
- Minimum send rejection (USD 50 equivalent) is documented but not enforced in API or collectors.
- B2B publishing is still in Silver/Gold; gold_export publishing gates are not implemented yet.
- Scheduler and per-locale RPM enforcement are not implemented; current pacing is in-collector jitter/backoff.
- Plane A enqueues live refresh requests into Silver; Plane B processes them on the next sweep. This preserves plane separation but makes live refresh best-effort rather than immediate.

## What This Means For Teams
- Product and B2C behavior: stable bucketed caching with optional live refresh, controlled by TTL and inflight limits.
- Ops and compliance: stop-on-block logging exists, but stoplist/circuit breaker automation is still manual.
- B2B roadmap: we are collecting sweep data, but publishing to gold_export and enforcing N>=3 gates is still pending.

## Recommended Next Documentation Updates
1) Update docs/providers/corridor-coverage-policy.md to reflect current static corridor generation plus provider capability updates.
2) Update docs/providers/global-defaults.md to clarify the new B2B/B2C split and fixed B2B amount.
3) Add a short section to docs/sprint-3-delta-notes.md for:
   - Base-currency corridor variants.
   - B2C caching + live refresh behavior.
   - Legacy table compatibility views.
4) Decide whether Plane A is allowed to invoke collectors directly or whether we need a Plane B job queue.

## Config Values Added (Current)
- PLANE_A_B2C_CACHE_TTL_SECONDS
- PLANE_A_B2C_JITTER_MS
- PLANE_B_REMITLY_B2B_AMOUNT
- PLANE_B_REMITLY_BLOCK_COOLDOWN_MS
- PLANE_B_B2C_REFRESH_BATCH_LIMIT

## Quick Reference (Current Behavior)
- B2B sweep amount: 500 (configurable).
- Buckets: 50/100/500/1000/3000/10000.
- Base currency variants: USD/EUR/GBP on send, USD on receive (plus native currencies).
- Live refresh path: /api/quotes/current with amount or live=true.
- B2C refresh worker: pnpm -C backend b2c:refresh-worker
