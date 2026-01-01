# Sprint 3 Delta Notes (For Confluence Update)

## Data Model and DB
- Added promo fields to Silver: promotional_rate, base_rate, promotional_cap_amount on silver.quote_record and silver.latest_quote_by_provider (backend/db/migrations/006_quote_promotions.sql).
- Implemented corridor tiering as a view: silver.corridor_tier with 24h success/block/freshness logic (backend/db/migrations/005_corridor_tier_view.sql).
- Ops health tables exist: silver.quote_attempt and silver.ops_alert_event (backend/db/migrations/004_provider_integration.sql).
- Legacy silver tables (providers, corridors, provider_quotes) are now read-only views over canonical tables; legacy tables were renamed with _legacy suffix (backend/db/migrations/007_legacy_compat_views.sql).

## API Surface (B2C)
- /api/quotes/current returns promo fields (nullable): promotional_rate, base_rate, promotional_cap_amount (backend/plane-a/src/routes/quotes.ts, docs/openapi/public.yaml).

## Normalization
- Normalizer accepts and preserves promo fields (backend/plane-b/src/normalize/quote-normalizer.ts).

## Remitly Pipeline (Provider-Specific)
- Remitly parser extracts promo/base/cap rates (backend/plane-b/src/providers/remitly/parse.ts).
- Remitly fixture + corridor snapshots exist for 10 corridors (backend/plane-b/src/providers/remitly/fixtures/corridors/*).
- Snapshot script: backend/scripts/remitly-snapshot.ts (captures payloads without using provider collector).

## Ops and Admin Health
- Admin-only read-only health endpoint: GET /api/ops/remitly/health (backend/plane-a/src/routes/ops/remitly-health.ts).
- Admin access controlled by allowlist PLANE_A_ADMIN_EMAILS (backend/shared/config.ts, backend/.env.example).
- Endpoint reads from Silver only; no live fetch from Plane A (Golden Rule safe).

## Daily Probe Cycle (Manual and Scheduled)
- Remitly probe runner: pnpm -C backend probe:remitly (backend/scripts/remitly-probe.ts).
- Writes silver.quote_attempt, silver.ops_alert_event, and updates silver.latest_quote_by_provider with promo fields.

## Docs Mismatches and Gaps to Resolve
- Tier promotion/demotion windows (3-day/2-day) are not implemented in the view; current logic is immediate based on 24h metrics.
- Stop-on-block in the probe logs to ops_alert_event, but does not update rights_matrix.stoplist_status or circuit_breaker yet.
- Proxy policy mismatch: RSE allows proxies under strict constraints, Sprint 3 docs say proxies disabled; code supports proxy but unused.

## Provider Integration Status (Reality Check)
- Remitly: fetch + parse + fixtures + tests exist; no full collector registry yet.
- Other providers: catalogs/limits/code-maps exist; fetch/parse/collector not implemented.
- Scheduler/throttling not implemented.

## Env and Config
- New admin allowlist env: PLANE_A_ADMIN_EMAILS.

## Tests Added
- Promo normalization: backend/tests/quote-normalizer.test.ts.
- Remitly corridor extraction: backend/tests/remitly-corridors.test.ts.
