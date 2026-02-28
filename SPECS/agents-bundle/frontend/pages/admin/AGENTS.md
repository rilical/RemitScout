---
entrypoints:
  - "frontend/pages/admin/index.vue"
  - "frontend/pages/admin/gold-exports.vue"
  - "frontend/pages/admin/observer.vue"
evidence_skills:
  - "evidence.indices_readiness.github_actions"
  - "evidence.db_health.github_actions"
common_reason_codes:
  - "indices.low_available_ratio"
  - "db.connection_pressure_high"
---
# Admin Pages (AGENTS)

What this directory is:
Admin UI pages used by operators for observability and control surfaces.

Entrypoints:
- `frontend/pages/admin/index.vue`
- `frontend/pages/admin/gold-exports.vue`
- `frontend/pages/admin/observer.vue`

Common failure modes:
- Admin loads too much data in one request (timeouts).
- Admin expects fields that backend changed (contract drift).

Evidence skills to run:
- `evidence.indices_readiness.github_actions`
- `evidence.db_health.github_actions`

Do-not-break rules:
- Admin pages must remain safe for prod (no mutating calls without explicit gating).

