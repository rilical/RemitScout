# DB Health Runbook

## What this runbook covers
Operational database health issues that can degrade ingestion, freshness, exports, or API latency.

Primary symptom patterns:
- connection pressure near max connections
- long-running non-idle queries
- sudden table size growth and storage pressure

## Fast triage (evidence-first)
1. Run `evidence.db_health.github_actions`.
1. If queue backlog is also present, run `evidence.queue_backlog.github_actions`.
1. If freshness or export incidents are active, run those domain evidence packs in parallel.

## Reason codes and interpretation
- `db.connection_failed`
  - Evidence runner cannot establish a DB session.
- `db.connection_pressure_high`
  - Active connections are near `max_connections`.
- `db.long_query_detected`
  - Long-running non-idle statements are present.
- `db.long_query_observation_failed`
  - Evidence could not read `pg_stat_activity` reliably.
- `db.table_size_high`
  - One or more large tables crossed conservative size thresholds.

## Primary code and data entrypoints
- DB config/pool: `backend/shared/db.ts`, `backend/shared/config.ts`
- Schemas/migrations: `backend/db/migrations/`
- Evidence script: `backend/scripts/evidence/db-health-evidence.ts`
- Related infra alarms: `infrastructure/cdk/lib/monitoring.ts`

## Decision flow
1. `db.connection_failed`:
   - validate credentials/network for the target environment
   - confirm DB instance is healthy and reachable
1. `db.connection_pressure_high`:
   - identify top connection sources (workers/API/jobs)
   - reduce concurrency where safe, then tune pool/limits
1. `db.long_query_detected`:
   - identify blocking/expensive query families and recent deploy deltas
   - verify index coverage and query plans before hot-fixing
1. `db.table_size_high`:
   - assess growth trend, retention, and partitioning/vacuum strategy

## Escalation rules
- `prod` + `db.connection_failed` or sustained high pressure: escalate infra/DB owner immediately.
- DB issues causing downstream freshness/export/pipeline failures: run a coordinated incident across teams.

## Do-not-do during incident
- Do not run destructive DB operations without explicit change control.
- Do not expose raw query text or sensitive payload data in Case artifacts.

