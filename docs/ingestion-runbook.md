# Ingestion Runbook (Plane B)

## Overview
- Plane B runs scheduled B2B sweeps plus on-demand B2C refreshes.
- Daily sweeps use Tier 1 corridors from `silver.corridor_tier` and apply coverage + freshness filters.
- Monthly sweeps run a full corridor pass per provider.
- Rights matrix and stoplists are enforced before collection begins.

## Rights Matrix and Stoplists
- `allowed_collect` and `allowed_b2b` must be true for B2B sweeps.
- `stoplist_status` must be `active`. Any paused provider is skipped.
- Circuit breakers are opened on block signals and paused providers are auto-resumed after cooldown.

## Rate Limits (HTTP)
Provider | RPM | Concurrency | Per-locale | Per-corridor RPM
--- | --- | --- | --- | ---
Remitly | 6 | 1 | true | 2
Western Union | 6 | 1 | true | 2
WorldRemit | 6 | 1 | true | 2
Xe | 6 | 1 | true | 2
Wise | 30 | 2 | true | 2

Notes:
- Effective RPM is capped by runtime latency: min(configured_rpm, (concurrency * 60) / avg_attempt_seconds).
- Per-corridor cap is enforced by the scheduler.

## Proxy Policy
- Proxies are disabled for Sprint 3.
- Do not attempt to rotate IPs or bypass block signals.

## Operator Checks
- If sweeps stop unexpectedly, confirm rights matrix status and circuit breaker cooldowns.
- If coverage drops below N>=3, outputs will be gated by publisher rules.
