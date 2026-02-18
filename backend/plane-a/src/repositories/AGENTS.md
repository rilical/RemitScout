---
entrypoints:
  - "backend/plane-a/src/repositories/index.ts"
  - "backend/plane-a/src/repositories/implementations/export-job-repository.ts"
  - "backend/db/migrations/026_export_job.sql"
evidence_skills:
  - "evidence.exports_health.github_actions"
common_reason_codes:
  - "exports.job_failed_recently"
  - "exports.job_stuck_queued"
---
# Plane A Repositories (AGENTS)

What this directory is:
Plane A repository interfaces + implementations over the shared Postgres schemas.

Entrypoints:
- `backend/plane-a/src/repositories/index.ts`
- `backend/plane-a/src/repositories/implementations/export-job-repository.ts`
- `backend/db/migrations/026_export_job.sql`

Common failure modes:
- Status transitions not updated (queued->running->done/failed).
- Missing indexes causing slow list queries.
- Export job rows say `done` but S3 artifact never landed.

Evidence skills to run:
- `evidence.exports_health.github_actions`

Do-not-break rules:
- Repo methods must remain bounded (limits + stable ordering).
- Do not return PII payloads in logs/errors.

