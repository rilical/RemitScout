# Queues Architecture

## One-screen quick map
Queue helpers:
- `backend/shared/sqs.ts`
- `backend/shared/config.ts` (queue URLs)

Workers:
- `backend/scripts/*queue-worker.ts`
- `backend/scripts/ingest-fanout-worker.ts`

Evidence:
- `backend/scripts/evidence/queue-backlog-evidence.ts`
- GitHub workflow: `.github/workflows/evidence-queue-backlog.yml`

## Ops expectations
- Queue oldest-age is the primary “stuck” signal (depth alone is insufficient).
- DLQ must remain 0 across queues.
- Missing SQS age metrics should be treated as a failure signal (SLO police stance).

