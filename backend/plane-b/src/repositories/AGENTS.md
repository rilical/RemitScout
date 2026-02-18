---
entrypoints:
  - "backend/plane-b/src/repositories/index.ts"
  - "backend/plane-b/src/repositories/DATABASE_INDEXES.sql"
  - "backend/db/migrations/002_rse_silver_core.sql"
evidence_skills:
  - "evidence.db_health.github_actions"
common_reason_codes:
  - "db.connection_pressure_high"
  - "db.long_query_detected"
---
# Plane B Repositories (AGENTS)

What this directory is:
Plane B DB access layer (Silver/Bronze write paths, hot queries, index notes).

Entrypoints:
- `backend/plane-b/src/repositories/index.ts`
- `backend/plane-b/src/repositories/DATABASE_INDEXES.sql`
- `backend/db/migrations/002_rse_silver_core.sql`

Common failure modes:
- Slow queries from missing indexes or high cardinality scans.
- Connection pressure causing worker retries/backpressure.

Evidence skills to run:
- `evidence.db_health.github_actions`

Do-not-break rules:
- Keep queries parameterized; avoid unsafe interpolation.
- Keep read paths paged/capped.

