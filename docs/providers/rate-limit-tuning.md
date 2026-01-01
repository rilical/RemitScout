# Sprint 3 Rate Limit Tuning

## Effective RPM
- effective_RPM ~= (concurrency * 60) / avg_attempt_seconds.
- Scheduler must cap RPM to min(configured_RPM, effective_RPM).

## Per-locale buckets
- Treat each provider+locale as its own bucket (example: wise:US vs wise:UK).
- Apply RPM and concurrency per bucket.

## Ramp schedule
- Start at Profile A (HTTP/XHR): RPM 12, concurrency 2.
- Start at Profile B (Playwright): RPM 4, concurrency 1.
- Every 24 hours, if no blocks and p95 latency stable:
  - Increase RPM by 20 percent.
  - Increase concurrency by 1 only if RPM is not the bottleneck.

## Backoff triggers
- Any HTTP 429, 403, CAPTCHA, or block signal.
- p95 latency doubling vs baseline.
- Rising 5xx rates or repeated timeouts.

## What to measure
- attempts_per_minute (per provider + locale)
- success_rate
- avg_attempt_seconds and p95_attempt_seconds
- 429_count, 403_count, captcha_count
- unavailable_corridor_or_method count (not a block)
