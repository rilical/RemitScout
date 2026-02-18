---
entrypoints:
  - "backend/db/migrations/001_init.sql"
  - "backend/db/migrations/002_rse_silver_core.sql"
  - "backend/db/migrations/026_export_job.sql"
evidence_skills:
  - "evidence.db_health.github_actions"
common_reason_codes:
  - "db.connection_failed"
---
# Database (Migrations) (AGENTS)

What this directory is:
SQL migrations defining Bronze/Silver/Gold schemas and operational tables.

Entrypoints:
- `backend/db/migrations/001_init.sql`
- `backend/db/migrations/002_rse_silver_core.sql`
- `backend/db/migrations/026_export_job.sql`

Common failure modes:
- Migration drift between envs causing runtime errors.
- Missing indexes leading to slow Evidence scripts and worker timeouts.

Evidence skills to run:
- `evidence.db_health.github_actions`

Do-not-break rules:
- Preserve grants and plane boundaries (Plane A/B/C permissions).
- Keep high-cardinality indexes intentional and documented.

