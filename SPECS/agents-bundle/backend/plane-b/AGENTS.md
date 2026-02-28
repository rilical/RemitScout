---
entrypoints:
  - "backend/plane-b/src/collectors/AGENTS.md"
  - "backend/plane-b/src/normalize/AGENTS.md"
  - "backend/plane-b/src/repositories/AGENTS.md"
  - "backend/plane-b/src/signals/AGENTS.md"
  - "backend/plane-b/src/providers/AGENTS.md"
evidence_skills:
  - "evidence.provider_health.github_actions"
  - "evidence.bronze_silver_throughput.github_actions"
common_reason_codes:
  - "provider.blocked.http_403"
  - "pipeline.bronze_write_dropped"
---
# Plane B (Ingest + Normalize + Signals) (AGENTS)

What this directory is:
Plane B collects provider data, writes Bronze/Silver, emits metrics/signals, and powers most ops evidence.

Entrypoints:
- `backend/plane-b/src/collectors/AGENTS.md`
- `backend/plane-b/src/normalize/AGENTS.md`
- `backend/plane-b/src/repositories/AGENTS.md`
- `backend/plane-b/src/providers/AGENTS.md`
- `backend/plane-b/src/signals/AGENTS.md`

Common failure modes:
- Providers blocked/rate-limited causing freshness drop.
- Bronze writes succeed but Silver normalization drops rows.

Evidence skills to run:
- `evidence.provider_health.github_actions`
- `evidence.bronze_silver_throughput.github_actions`

Do-not-break rules:
- Keep CloudWatch metrics low-cardinality by default.
- Preserve rights-matrix NULL/empty semantics (empty set must not match all).

