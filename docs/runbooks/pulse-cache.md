# Runbook: Pulse Cache Staleness / Lag

## Symptoms
- Pulse UI shows stale timestamps, missing charts, or unexpected fallback/defaults.
- Operators suspect Gold pulse cache is not updating on schedule.

## First evidence (bounded, agent-friendly)
- Skill: `evidence.pulse_cache_health.github_actions`
  - Confirms `gold.pulse_cache` key count and `updated_at` freshness.
  - Produces `evidence.json` artifact and a Case Run record when Brain ingestion is enabled.

## Next checks
1. Indices readiness (often correlates with Gold export health):
   - Skill: `evidence.indices_readiness.github_actions`
2. Gold pulse batch job wiring:
   - Script: `backend/scripts/gold-pulse-cache-job.ts`
3. Pulse API truthfulness (must not fabricate freshness):
   - Route: `backend/plane-a/src/routes/pulse.ts`
   - Invariant: if data is missing/stale, return explicit availability flags (see `ARCHITECTURE.md`)

## Common root causes
- Scheduled job disabled (ops pause) or misconfigured schedule.
- DB connectivity issues in Gold jobs.
- Long-running pulse cache job (lock contention, concurrency too high/low).
- Upstream freshness regression (Silver stale -> Gold stale).

## Escalation
- If `gold.pulse_cache` is empty or stale in `prod` for > 6h, escalate as `sev2` or `sev3` depending on user impact.
- Prefer evidence-first escalation: attach the Case Run + Actions run URL to the incident channel.

