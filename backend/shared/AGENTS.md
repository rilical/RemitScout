---
entrypoints:
  - "backend/shared/config.ts"
  - "backend/shared/db.ts"
  - "backend/shared/sqs.ts"
  - "backend/shared/slo-tracker.ts"
  - "backend/shared/health-corridors.ts"
evidence_skills:
  - "evidence.queue_backlog.github_actions"
  - "evidence.freshness_slo.github_actions"
common_reason_codes:
  - "queue.oldest_age_high"
  - "freshness.p95_high"
---
# Backend Shared (AGENTS)

What this directory is:
Shared libraries used across planes and scripts (config, db, metrics, SQS, SLO targets).

Entrypoints:
- `backend/shared/config.ts`
- `backend/shared/db.ts`
- `backend/shared/sqs.ts`
- `backend/shared/slo-tracker.ts`
- `backend/shared/health-corridors.ts`

Common failure modes:
- Env var wiring drift across dev/staging/prod.
- SQS queue urls missing in CI workflows (must fall back to GetQueueUrl by name).

Evidence skills to run:
- `evidence.queue_backlog.github_actions`
- `evidence.freshness_slo.github_actions`

Do-not-break rules:
- Keep config defaults safe: prod read-only by default for automation.

