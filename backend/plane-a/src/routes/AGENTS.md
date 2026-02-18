---
entrypoints:
  - "backend/plane-a/src/routes/quotes.ts"
  - "backend/plane-a/src/routes/pulse.ts"
  - "backend/plane-a/src/routes/exports.ts"
  - "backend/plane-a/src/routes/ops/indices-health.ts"
evidence_skills:
  - "evidence.http_latency.github_actions"
  - "evidence.no_quotes_audit.github_actions"
  - "evidence.pulse_cache_health.github_actions"
common_reason_codes:
  - "http.p95_high"
  - "coverage.no_quotes_detected"
  - "pulse.cache_stale"
---
# Plane A Routes (AGENTS)

What this directory is:
Fastify route plugins for the Plane A API (public site + ops endpoints).

Entrypoints:
- `backend/plane-a/src/routes/quotes.ts`
- `backend/plane-a/src/routes/pulse.ts`
- `backend/plane-a/src/routes/exports.ts`
- `backend/plane-a/src/routes/ops/indices-health.ts`

Common failure modes:
- Tier freshness regressions causing stale/empty quotes.
- Pulse responses claiming freshness while cache is stale/missing.
- Export endpoints returning job status but artifacts not landing.

Evidence skills to run:
- `evidence.http_latency.github_actions`
- `evidence.no_quotes_audit.github_actions`
- `evidence.pulse_cache_health.github_actions`

Do-not-break rules:
- Keep outputs bounded (no raw logs/DB dumps in responses).
- Preserve tier freshness semantics (tier overrides + max quote age caps).

