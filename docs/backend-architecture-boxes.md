# Remit-Scout Backend Architecture: Box Catalog

This catalog explains every box in `docs/backend-architecture-diagram.md`.
Source of truth: `infrastructure/cdk/**` + `backend/**`.
For the full end-to-end narrative, see `docs/backend-architecture-a-z.md`.

## Edge / API

### Clients / Partners
- Role: External customers and partner systems.
- Path: HTTP requests -> CloudFront/WAF (optional) -> API Gateway -> Plane A Lambda.

### Ops / Admins
- Role: Internal ops and admins.
- Path: HTTP requests -> API Gateway (Plane A / Plane C).

### CloudFront (optional)
- Role: CDN + TLS front door for Plane A.
- Entry: `infrastructure/cdk/lib/api.ts` (`planeACloudFront`).

### WAF (optional)
- Role: Request filtering and bot protection.
- Entry: `infrastructure/cdk/lib/api.ts` (`planeAWaf`).

### HTTP API Gateway: Plane A
- Role: Front door for Plane A API.
- Entry: `infrastructure/cdk/lib/api.ts` (`planeAApi`).
- Target: Lambda Plane A.

### HTTP API Gateway: Plane C
- Role: Publisher API front door.
- Entry: `infrastructure/cdk/lib/api.ts` (`planeCApi`).
- Target: Lambda Plane C.

## API Runtimes (Lambda)

### Lambda: Plane A
- Role: Public API runtime.
- Entrypoint: `backend/plane-a/src/app.ts`.
- Reads: Aurora (Silver/Gold), Redis cache.
- Writes: SQS queues, S3 user assets, export jobs.
- Readiness: `/readyz` checks DB + Redis and returns dependency status.
- Ops: `/api/v1/ops/indices/health` (admin) summarizes indices readiness.

### Lambda: Plane C
- Role: Publisher API runtime.
- Entrypoint: `backend/plane-c/src/app.ts`.
- Reads: Aurora (Gold), Redis cache.

## EventBridge + Scheduled Jobs

### EventBridge Rules
- Role: Central scheduler for all cron/rate jobs.
- Entrypoint: `infrastructure/cdk/lib/scheduled-jobs.ts`.

### Plane A Scheduled Lambdas
- export-worker: `backend/scripts/aws/export-worker-lambda.ts`.
- alert-evaluation-scheduler: `backend/scripts/aws/alert-evaluation-scheduler-lambda.ts`.
- alert-evaluation-worker: `backend/scripts/aws/alert-evaluation-worker-lambda.ts`.
- alert-corridor-refresh: `backend/scripts/aws/alert-corridor-refresh-lambda.ts`.
- telemetry-analytics: `backend/scripts/aws/telemetry-analytics-job-lambda.ts`.
- session-cleanup: `backend/scripts/aws/session-cleanup-lambda.ts`.
- bank-vs-specialist-refresh: `backend/scripts/aws/bank-vs-specialist-refresh-lambda.ts`.
- audit-log-cleanup: `backend/scripts/aws/audit-log-cleanup-lambda.ts`.
- oanda-sync: `backend/scripts/aws/oanda-sync-lambda.ts`.

### Plane B Scheduled Lambdas
- gold-fx-rates: `backend/scripts/aws/gold-fx-rates-lambda.ts`.
- smart-alerts: `backend/scripts/aws/smart-alerts-job-lambda.ts`.
- gold-popular-corridors: `backend/scripts/aws/gold-popular-corridors-lambda.ts`.
- gold-pulse-cache: `backend/scripts/aws/gold-pulse-cache-lambda.ts`.
- b2c-retry-failed: `backend/scripts/aws/b2c-retry-failed-lambda.ts`.
- b2c-queue-cleanup: `backend/scripts/aws/quote-refresh-queue-cleanup-lambda.ts`.
- stoplist-auto-resume: `backend/scripts/aws/stoplist-auto-resume-lambda.ts`.
- rights-matrix-sync-countries: `backend/scripts/aws/rights-matrix-sync-countries-lambda.ts`.

### Plane C Scheduled Lambdas
- gold-publisher: `backend/scripts/aws/gold-publisher-lambda.ts`.
- gold-indices: `backend/scripts/aws/gold-indices-job-lambda.ts`.
- provider-weighting: `backend/scripts/aws/provider-weighting-job-lambda.ts`.
- data-health-slo: `backend/scripts/aws/data-health-slo-job-lambda.ts`.
- gold-reconciliation: `backend/scripts/aws/gold-reconciliation-job-lambda.ts`.

### Provider Probe Lambdas
- Providers: remitly, westernunion, wise, worldremit, ria, dahabshiil, sendwave,
  mukuru, xe, alansari, instarem, xoom, remitbee, singx, placid, koronapay,
  wirebarley, intermex.
- Entrypoints: `backend/scripts/aws/<provider>-probe-lambda.ts`.

### ECS Scheduled Task
- b2b-sweep-scheduler: `backend/scripts/aws/b2b-sweep-scheduler-ecs.ts`.

## ECS Workers (Fargate)
All ECS workers expose a shared health server on port 8080 (`/healthz`, `/readyz`).
ECS health checks call `/healthz` (HTTP) instead of `pgrep`.

### Plane B Ingest
- Entrypoint: `backend/scripts/aws/plane-b-ingest-ecs.ts`.
- Function: `runIngestion` in `backend/plane-b/src/ingest.ts`.

### Ingest Fanout Tier1/Tier2
- Entrypoint: `backend/scripts/aws/ingest-fanout-worker-ecs.ts`.
- Function: `runIngestFanoutWorkerLoop` in `backend/scripts/ingest-fanout-worker.ts`.

### B2C Refresh Worker
- Entrypoint: `backend/scripts/aws/b2c-refresh-worker-ecs.ts`.
- Function: `runB2cRefreshWorkerLoop` in `backend/scripts/b2c-refresh-worker.ts`.

### FX Refresh Worker
- Entrypoint: `backend/scripts/aws/fx-rate-refresh-worker-ecs.ts`.
- Function: `runFxRateRefreshWorkerLoop` in `backend/scripts/fx-rate-refresh-worker.ts`.

### Gold Live Worker
- Entrypoint: `backend/scripts/aws/gold-live-worker-ecs.ts`.
- Function: `runGoldLiveWorker` in `backend/scripts/gold-live-worker.ts`.

### Notifications Worker
- Entrypoint: `backend/scripts/aws/notifications-queue-worker-ecs.ts`.
- Function: `runNotificationsQueueWorkerLoop` in `backend/scripts/notifications-queue-worker.ts`.

### Ops Alerts Worker
- Entrypoint: `backend/scripts/aws/ops-alerts-queue-worker-ecs.ts`.
- Function: `runOpsAlertsQueueWorkerLoop` in `backend/scripts/ops-alerts-queue-worker.ts`.

## SQS Queues + DLQs
Each queue is created in `infrastructure/cdk/lib/queues.ts`.

- quote-refresh: producers Plane A + alert-corridor-refresh; consumer B2C refresh worker.
- fx-rate-refresh: producer Plane A; consumer FX refresh worker.
- export-job: producer Plane A; consumer export-worker Lambda.
- alert-evaluation: producer alert-evaluation-scheduler; consumer alert-evaluation-worker.
- ingest-fanout tier1/tier2: producer b2b-sweep-scheduler; consumers ingest fanout workers.
- gold-live: producer Plane B collectors; consumer gold-live worker.
- notifications: producer alerting pipeline; consumer notifications worker.
- ops-alerts: producer Plane B alert routing; consumer ops-alerts worker.

## Data Stores

### Aurora Postgres
- Role: Primary system of record (Silver + Gold schemas).
- Entrypoint: `infrastructure/cdk/lib/database.ts`.
- Gold schema includes `provider_weight_snapshot` plus indices metadata
  (`weighting_model`, `weight_confidence`, `weight_window_days`, `methodology_version`).

### RDS Proxy (optional)
- Role: Connection pooling for Lambdas.
- Entrypoint: `infrastructure/cdk/lib/database.ts`.

### ElastiCache Redis
- Role: Cache + distributed locks.
- Entrypoint: `infrastructure/cdk/lib/cache.ts`.

### S3 Buckets
- Bronze: `remit-scout-bronze-${env}`.
- Exports: `remit-scout-exports-${env}`.
- User Assets: `remit-scout-user-assets-${env}`.
- Audit Logs: `remit-scout-audit-logs-${env}`.

## Observability + Alerts
- CloudWatch Dashboard: `remit-scout-${env}`.
- Alarms: queue depth/DLQ, API p95/5xx, ECS CPU/Mem, RDS, Redis.
- Probe heartbeat metric: `RemitScout/Probes:probe_run_total` with heartbeat alarms.
- Data health SLO job emits indices readiness and freshness metrics.
- Synthetics canaries: `/healthz`, `/quotes`, `/api/indices/latest` (env-dependent).
- SNS topics: alerts-critical, alerts-warning, alerts-ops.
- Tracing: X-Ray / OTel (if enabled).

## Cost Guardrails
- CUR bucket: `remit-scout-${env}-cur` (prod by default).
- Monthly budgets and anomaly detection (optional by env).

## Networking
- VPC: public + private subnets with egress.
- Security groups: Plane A/B/C, DB, Redis.
- VPC endpoints: S3, ECR, Logs, Secrets Manager, SSM, STS.
