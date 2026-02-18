# Exports Health Runbook

## What this runbook covers
User data exports (history/watchlist/alerts/all/gdpr_export) backed by:
- `silver.export_job` (status tracking)
- Exports SQS queue (`remit-scout-<env>-export-job`)
- S3 export artifacts (`EXPORTS_S3_BUCKET`, prefix `EXPORTS_S3_PREFIX`)

Primary goal: quickly answer "are exports working right now, and if not, why?"

## Fast triage (LLM-safe, bounded)
1. Run evidence skill: `evidence.exports_health.github_actions`
1. If DLQ is non-zero: run `evidence.queue_backlog.github_actions` with `queue_kind=exports`
1. If jobs are stuck queued/running: check worker health and backlog (below)

## Interpreting EvidenceResult reason codes
- `exports.dlq_nonzero`
  - Meaning: exports messages are failing and being dead-lettered.
  - Immediate action: inspect DLQ depth; do not ignore.
- `exports.job_failed_recently`
  - Meaning: export worker is failing jobs (see sampled `error` strings).
- `exports.job_stuck_queued`
  - Meaning: jobs are enqueued but not being processed (worker down/backpressured).
- `exports.job_stuck_running`
  - Meaning: worker picked jobs up but is hanging (S3/DB/perf/lock issues).
- `exports.s3_artifact_missing`
  - Meaning: DB says `done` but artifact is missing in S3 (credentials/bucket/key mismatch).
- `exports.config_missing_bucket`
  - Meaning: the evidence workflow cannot verify S3 artifacts because `EXPORTS_S3_BUCKET` is not wired in the GitHub environment.

## Where to look in code (entrypoints)
- Worker: `backend/scripts/export-queue-worker.ts`
- Export job repository: `backend/plane-a/src/repositories/implementations/export-job-repository.ts`
- Export job schema: `backend/db/migrations/026_export_job.sql`
- Queue evidence helper: `backend/scripts/evidence/queue-backlog-evidence.ts`

## Likely causes and what to do
1. Worker not running / no capacity
   - Symptom: `exports.job_stuck_queued`, queue oldest age high, no `running` jobs.
   - Action: verify ECS/Lambda for export worker is deployed and healthy (Plane B/Infra owner).
1. Worker failing
   - Symptom: `exports.job_failed_recently` and/or `exports.dlq_nonzero`.
   - Action: check worker logs, recent deploys, and DB connectivity.
1. S3 artifact missing
   - Symptom: `exports.s3_artifact_missing`.
   - Action: confirm `EXPORTS_S3_BUCKET` and IAM permissions; validate DB `s3_key` matches the worker’s key format.

## Escalation
Escalate to Infra/Platform if:
- DLQ is non-zero in `prod`
- Jobs are stuck running in `prod` for > 60 minutes
- S3 artifacts are missing for multiple `done` jobs

