# Remit-Scout Backend Architecture - A-Z Guide

This is the single, comprehensive engineer-facing guide for the Remit-Scout backend.
It is intentionally long and explicit so that new engineers can trace any box in the
master diagram to code, runtime, and AWS wiring.

## 0) Sources and scope
- Source of truth: `infrastructure/cdk/**` and `backend/**`.
- Invariants: `ARCHITECTURE.md` (data tier rules, plane boundaries, freshness rules).
- Diagram: `docs/backend-architecture-diagram.md` (rendered to PNG under `docs/diagrams/`).
- Additional diagrams:
  - `docs/diagrams/00-backend-architecture-master-14x.png`
  - `docs/diagrams/01-data-lineage-10x.png`
  - `docs/diagrams/02-deployment-view-10x.png`

## 1) System overview (what this platform does)
Remit-Scout ingests provider rate data, normalizes it into Silver, curates
aggregates into Gold, and serves customers with low-latency APIs and exports.

**Planes**
- Plane A: public API (clients/admins). Reads Silver/Gold, writes refresh/export jobs.
- Plane B: ingestion and refresh workers. Writes Bronze/Silver, drives Gold live.
- Plane C: publisher API (Gold outputs, internal distribution).

**Data tiers**
- Bronze: raw provider payloads (S3). Immutable audit trail.
- Silver: normalized quotes, refresh queues, rights matrix, tier snapshots (Aurora).
- Gold: curated aggregates, indices, pulse, popular corridors, and `provider_weight_snapshot`
  (Aurora + Redis cache). Indices include weight metadata (`weight_confidence`,
  `weight_window_days`, `methodology_version`).

## 2) End-to-end workflows (traceable paths)

### 2.1 B2C refresh (on-demand)
1. Client hits Plane A API.
2. Plane A enqueues a quote refresh request in `silver.quote_refresh_request`
   and, when SQS mode is enabled, sends message to `remit-scout-${env}-quote-refresh`.
3. B2C Refresh Worker (ECS) consumes SQS, refreshes provider data via Plane B,
   updates Silver, and updates cache as needed.

**Key files**
- Producer: `backend/plane-a/src/repositories/implementations/quote-refresh-repository.ts`
- Queue: `infrastructure/cdk/lib/queues.ts` (QuoteRefreshQueue)
- Consumer: `backend/scripts/b2c-refresh-worker.ts`
- ECS entry: `backend/scripts/aws/b2c-refresh-worker-ecs.ts`

### 2.2 FX refresh (on-demand / scheduled)
1. Plane A enqueues FX refresh requests into `silver.fx_rate_refresh_request` and SQS.
2. FX Refresh Worker consumes `remit-scout-${env}-fx-rate-refresh`.
3. Worker updates Gold FX rates (via Plane B refresh logic and OANDA fetcher).

**Key files**
- Producer: `backend/plane-a/src/repositories/implementations/fx-rate-refresh-repository.ts`
- Consumer: `backend/scripts/fx-rate-refresh-worker.ts`
- ECS entry: `backend/scripts/aws/fx-rate-refresh-worker-ecs.ts`

### 2.3 B2B sweep + ingest (scheduled)
1. EventBridge triggers ECS task `b2b-sweep-scheduler` every minute.
2. Scheduler computes due corridors and enqueues fanout tasks to
   `ingest-fanout` (tier1 and tier2 queues).
3. Ingest Fanout Workers consume tiered queues, execute provider ingest.
4. Plane B ingest writes Bronze payloads to S3 and normalized Silver rows to Aurora.
5. Plane B collectors may enqueue Gold live updates for near-real-time Gold tables.

**Key files**
- Scheduler: `backend/scripts/b2b-sweep-scheduler.ts`
- ECS entry: `backend/scripts/aws/b2b-sweep-scheduler-ecs.ts`
- Fanout worker: `backend/scripts/ingest-fanout-worker.ts`
- Fanout ECS entry: `backend/scripts/aws/ingest-fanout-worker-ecs.ts`
- Ingest: `backend/plane-b/src/ingest.ts`
- Bronze writer: `backend/plane-b/src/collectors/bronze-writer.ts`

### 2.4 Gold batch + live updates
- Gold batch jobs run on schedules (EventBridge) and aggregate from Silver to Gold.
- Gold Live worker consumes `gold-live` queue for near-real-time updates.
- Gold caches are stored in Redis (hot views).

**Key files**
- Gold jobs (Lambdas):
  - `backend/scripts/aws/gold-fx-rates-lambda.ts`
  - `backend/scripts/aws/gold-popular-corridors-lambda.ts`
  - `backend/scripts/aws/gold-pulse-cache-lambda.ts`
  - `backend/scripts/aws/gold-publisher-lambda.ts`
  - `backend/scripts/aws/gold-indices-job-lambda.ts`
  - `backend/scripts/aws/provider-weighting-job-lambda.ts`
  - `backend/scripts/aws/gold-reconciliation-job-lambda.ts`
- Gold live worker: `backend/scripts/gold-live-worker.ts`
- Gold live ECS entry: `backend/scripts/aws/gold-live-worker-ecs.ts`

### 2.4.1 Indices weighting + methodology (current)
- **Weights job**: `provider-weighting` (Plane C Lambda) computes synthetic weights
  from `silver.quote_record` (B2B-only, production-eligible providers) and writes
  to `gold.provider_weight_snapshot` (corridor + `__global__`).
- **Weight formula**:
  - Frequency score: `log1p(provider_quotes / available_hours)`.
  - Spread score: `exp(-0.5 * z^2)`, `z = (avg_rate - median_rate) / std_rate`.
  - Recency score: `exp(-lambda * age_minutes)`, half-life default `180m`.
  - Tier multiplier (persistence): `1.5` if >= 0.9, `1.0` if >= 0.6, else `0.5`.
  - Raw weight: `frequency^alpha * spread^beta * recency^gamma * tier_multiplier`
    (defaults: `alpha=0.4`, `beta=0.4`, `gamma=0.2`).
- **Confidence + blending**:
  - `weight_confidence = min(1, window_days / lookback_days) * min(1, quote_count / min_quotes)`
    (defaults: lookback=30d, min_days=3, min_providers=3, min_quotes=500).
  - Final weight blends corridor + global: `conf * corridor + (1 - conf) * global`.
- **Indices formulas** (Gold + live Plane A provider route):
  - RCI: weighted cost ratio `((fee + FX_markup) / send_amount)`.
  - TEER: `mid_market_rate * (1 - RCI)`.
  - RVI: weighted stddev of effective rate where
    `effective_rate = ((send_amount - fee) * implied_fx_rate) / send_amount`.
  - RVI (bps): `(RVI / TEER) * 10,000`.
  - Mid-market source: `gold.fx_rate_history` (date-matched) with fallback to `gold.fx_rates`.
  - Per-index allowlists: `allowed_in_teer`, `allowed_in_rci`, `allowed_in_rvi`.
  - Default indices bucket: `500` (override via `GOLD_INDICES_AMOUNT_BUCKET`).

### 2.4.2 Data health SLO job (indices readiness)
- Scheduled Lambda `data-health-slo` reads Silver + Gold and emits SLO metrics:
  freshness p95 (tier1/tier2), quote success rate (tier1/tier2),
  provider coverage (tier1/tier2), indices availability/suppression ratios,
  and `weight_confidence_p10`.
- Tier-0 corridors come from `backend/shared/health-corridors.ts` and use
  amount bucket `500` with `method_profile = standard_bank`.

### 2.5 Alerts and notifications
- Alert Evaluation Scheduler Lambda enqueues alert tasks to SQS.
- Alert Evaluation Worker consumes SQS, reads Silver, writes outputs and triggers
  notifications or ops alerts.
- Notifications and Ops Alerts workers fan out webhooks / ops actions.

**Key files**
- Scheduler: `backend/scripts/aws/alert-evaluation-scheduler-lambda.ts`
- Worker: `backend/scripts/alert-evaluation-worker.ts`
- Notifications worker: `backend/scripts/notifications-queue-worker.ts`
- Ops alerts worker: `backend/scripts/ops-alerts-queue-worker.ts`

### 2.6 Exports
- Plane A creates export requests and enqueues `export-job` queue.
- Export worker Lambda consumes queue and writes artifacts to S3 Exports.

**Key files**
- Producer: Plane A export routes (see `backend/plane-a/src/routes/**`).
- Worker: `backend/scripts/export-worker.ts` + `backend/scripts/aws/export-worker-lambda.ts`

## 3) Runtime and infrastructure inventory (box-by-box)
This section maps each diagram box to code and runtime behavior.

### 3.1 Edge / API
**Clients / Partners**
- Role: External API users and partner systems.
- Path: HTTP requests -> CloudFront/WAF -> API Gateway -> Plane A Lambda.

**Ops / Admins**
- Role: Internal operators and admin tooling.
- Path: HTTP requests -> API Gateway (Plane A/Plane C).

**CloudFront (optional)**
- Resource: `planeACloudFront` in `infrastructure/cdk/lib/api.ts`.
- Purpose: CDN + TLS termination + optional caching in front of Plane A API.

**WAF (optional)**
- Resource: `planeAWaf` in `infrastructure/cdk/lib/api.ts`.
- Purpose: IP allow/block, bot control.

**HTTP API Gateway: Plane A (`planeAApi`)**
- File: `infrastructure/cdk/lib/api.ts`.
- Integration: `backend/plane-a/src/app.ts` Lambda.

**HTTP API Gateway: Plane C (`planeCApi`)**
- File: `infrastructure/cdk/lib/api.ts`.
- Integration: `backend/plane-c/src/app.ts` Lambda.

### 3.2 API runtimes (Lambda)
**Lambda: Plane A**
- Entrypoint: `backend/plane-a/src/app.ts` (NodejsFunction bundling).
- Key routes: `backend/plane-a/src/routes/**`.
- Reads: Silver/Gold in Aurora, Redis cache.
- Writes: Quote refresh queue, FX refresh queue, export job queue, user assets S3.
- Readiness: `/readyz` checks DB + Redis and returns dependency status.
- Ops: `/api/v1/ops/indices/health` (admin) summarizes indices readiness.

**Lambda: Plane C**
- Entrypoint: `backend/plane-c/src/app.ts`.
- Reads: Gold data in Aurora + Redis.

### 3.3 EventBridge scheduled jobs
**EventBridge Rules**
- File: `infrastructure/cdk/lib/scheduled-jobs.ts`.
- All rules named `remit-scout-${env}-*`.

**Plane A scheduled Lambdas**
- export-worker: `backend/scripts/aws/export-worker-lambda.ts` -> `runExportWorker`.
- alert-evaluation-scheduler: `backend/scripts/aws/alert-evaluation-scheduler-lambda.ts`.
- alert-evaluation-worker: `backend/scripts/aws/alert-evaluation-worker-lambda.ts` -> `runAlertEvaluationWorker`.
- alert-corridor-refresh: `backend/scripts/aws/alert-corridor-refresh-lambda.ts` -> `runAlertCorridorRefreshJob`.
- telemetry-analytics: `backend/scripts/aws/telemetry-analytics-job-lambda.ts` -> `runTelemetryAnalyticsJob`.
- session-cleanup: `backend/scripts/aws/session-cleanup-lambda.ts` -> `runSessionCleanup`.
- bank-vs-specialist-refresh: `backend/scripts/aws/bank-vs-specialist-refresh-lambda.ts` -> `runBankVsSpecialistRefresh`.
- audit-log-cleanup: `backend/scripts/aws/audit-log-cleanup-lambda.ts` -> `runAuditLogCleanup`.
- oanda-sync: `backend/scripts/aws/oanda-sync-lambda.ts` -> `syncRates`.

**Plane B scheduled Lambdas**
- gold-fx-rates: `backend/scripts/aws/gold-fx-rates-lambda.ts` -> `runGoldFxRatesJob`.
- smart-alerts: `backend/scripts/aws/smart-alerts-job-lambda.ts` -> `runSmartAlertsJob`.
- gold-popular-corridors: `backend/scripts/aws/gold-popular-corridors-lambda.ts` -> `runGoldPopularCorridorsJob`.
- gold-pulse-cache: `backend/scripts/aws/gold-pulse-cache-lambda.ts` -> `runGoldPulseCacheJob`.
- b2c-retry-failed: `backend/scripts/aws/b2c-retry-failed-lambda.ts` -> `runB2cRetryFailed`.
- b2c-queue-cleanup: `backend/scripts/aws/quote-refresh-queue-cleanup-lambda.ts` -> `runQuoteRefreshQueueCleanup`.
- stoplist-auto-resume: `backend/scripts/aws/stoplist-auto-resume-lambda.ts` -> `runStoplistAutoResume`.
- rights-matrix-sync-countries: `backend/scripts/aws/rights-matrix-sync-countries-lambda.ts` -> `runRightsMatrixSyncCountries`.

**Plane C scheduled Lambdas**
- gold-publisher: `backend/scripts/aws/gold-publisher-lambda.ts` -> `runGoldPublisherJob`.
- gold-indices: `backend/scripts/aws/gold-indices-job-lambda.ts` -> `runGoldIndicesJob`.
- data-health-slo: `backend/scripts/aws/data-health-slo-job-lambda.ts` -> `runDataHealthSloJob`.
- gold-reconciliation: `backend/scripts/aws/gold-reconciliation-job-lambda.ts`.

**Provider probe Lambdas**
- Providers: remitly, westernunion, wise, worldremit, ria, dahabshiil, sendwave, mukuru,
  xe, alansari, instarem, xoom, remitbee, singx, placid, koronapay, wirebarley, intermex.
- Entrypoints: `backend/scripts/aws/<provider>-probe-lambda.ts`.
- Function: `runGenericProbe` in `backend/scripts/lib/generic-probe.ts`.

**ECS scheduled task**
- b2b-sweep-scheduler: `backend/scripts/aws/b2b-sweep-scheduler-ecs.ts` -> `runB2bSweepScheduler`.

### 3.4 ECS workers (Fargate)
All ECS tasks are defined in `infrastructure/cdk/lib/ecs-tasks.ts` and wired
as services in `infrastructure/cdk/lib/ecs-services.ts`.
All workers expose a shared health server on port 8080 (`/healthz`, `/readyz`).
ECS health checks hit `/healthz` (HTTP).

- Plane B Ingest: `backend/scripts/aws/plane-b-ingest-ecs.ts` -> `runIngestion`.
- B2C Refresh Worker: `backend/scripts/aws/b2c-refresh-worker-ecs.ts` -> `runB2cRefreshWorkerLoop`.
- FX Refresh Worker: `backend/scripts/aws/fx-rate-refresh-worker-ecs.ts` -> `runFxRateRefreshWorkerLoop`.
- Ingest Fanout Tier1/Tier2: `backend/scripts/aws/ingest-fanout-worker-ecs.ts`
  -> `runIngestFanoutWorkerLoop`.
- Gold Live Worker: `backend/scripts/aws/gold-live-worker-ecs.ts` -> `runGoldLiveWorker`.
- Notifications Worker: `backend/scripts/aws/notifications-queue-worker-ecs.ts`
  -> `runNotificationsQueueWorkerLoop`.
- Ops Alerts Worker: `backend/scripts/aws/ops-alerts-queue-worker-ecs.ts`
  -> `runOpsAlertsQueueWorkerLoop`.

### 3.5 Queues (SQS + DLQs)
Defined in `infrastructure/cdk/lib/queues.ts`.

- quote-refresh: produced by Plane A API and alert-corridor-refresh; consumed by B2C worker.
- fx-rate-refresh: produced by Plane A API; consumed by FX refresh worker.
- export-job: produced by Plane A API; consumed by export-worker Lambda.
- alert-evaluation: produced by alert-evaluation-scheduler; consumed by alert-evaluation-worker.
- ingest-fanout (tier1/tier2): produced by b2b-sweep-scheduler; consumed by ingest-fanout workers.
- gold-live: produced by Plane B collectors; consumed by gold-live worker.
- notifications: produced by alerting/notifications pipelines; consumed by notifications worker.
- ops-alerts: produced by alert routing in Plane B; consumed by ops-alerts worker.

### 3.6 Data stores
- Aurora Postgres (silver + gold schemas): `infrastructure/cdk/lib/database.ts`.
- RDS Proxy (optional): `infrastructure/cdk/lib/database.ts`.
- Redis (ElastiCache): `infrastructure/cdk/lib/cache.ts`.
- S3 buckets: `infrastructure/cdk/lib/storage.ts`:
  - Bronze: `remit-scout-bronze-${env}`
  - Exports: `remit-scout-exports-${env}`
  - User assets: `remit-scout-user-assets-${env}`
  - Audit logs: `remit-scout-audit-logs-${env}`

### 3.7 Observability
- Dashboards and alarms: `infrastructure/cdk/lib/monitoring.ts`.
- Topics: `alerts-critical`, `alerts-warning`, `alerts-ops` (SNS).
- Metrics and tracing in `backend/shared/*` (metrics registry, worker metrics, tracing).
- ECS tasks run an OTEL sidecar when `ENABLE_TELEMETRY` is enabled.
- Probe heartbeat metric: `RemitScout/Probes:probe_run_total` with heartbeat alarms.
- Synthetics canaries validate `/healthz`, `/quotes`, `/api/indices/latest`.
- Data health SLO job emits indices readiness metrics (availability/suppression/confidence).

### 3.8 Cost guardrails
- Implemented in `infrastructure/cdk/lib/budgets.ts`.
- Optional CUR bucket, budgets, anomaly monitor/subscriptions.

### 3.9 Networking
- VPC + subnets + security groups: `infrastructure/cdk/lib/vpc.ts`.
- VPC endpoints: S3, ECR (API + Docker), CloudWatch Logs, Secrets Manager, SSM, STS.

## 4) Data lineage and schema highlights

**Bronze**
- Raw payloads from provider collectors stored in S3.
- Primary writer: `backend/plane-b/src/collectors/bronze-writer.ts`.

**Silver**
- Normalized quotes, refresh requests, rights matrix, tier snapshots.
- Key repositories:
  - `backend/plane-b/src/repositories/implementations/quote-record-repository.ts`
  - `backend/plane-b/src/repositories/implementations/latest-quote-repository.ts`
  - `backend/plane-b/src/repositories/implementations/quote-refresh-repository.ts`
  - `backend/plane-b/src/repositories/implementations/fx-rate-refresh-repository.ts`

**Gold**
- Curated aggregates (fx_rates, indices, pulse, popular corridors, publisher outputs).
- Jobs: `backend/scripts/gold-*.ts` and publisher under `backend/plane-c/src/services/`.

## 5) Deployment and environment differences
Defined by CDK in `infrastructure/cdk/lib/*`.

**dev**
- VPC: `natGateways=1`.
- ECS: public subnets + public IPs; spot-only by default.
- Aurora: serverless v2 (min 0, max 1, auto-pause 10m).
- Redis: `cache.t4g.micro`, single-AZ.
- S3: RemovalPolicy=DESTROY for non-prod.

**staging**
- VPC: `natGateways=1`.
- ECS: private subnets, on-demand default.
- Aurora: provisioned `r6g.large`, 1 instance.
- Redis: `cache.t4g.micro`, single-AZ.
- S3: RemovalPolicy=DESTROY.

**prod**
- VPC: `natGateways=2`.
- ECS: private subnets, FARGATE + FARGATE_SPOT mix.
- Aurora: provisioned `r6g.xlarge`, 2 instances, deletion protection, 30d backups.
- Redis: `cache.r6g.large`, Multi-AZ + replica.
- S3: RemovalPolicy=RETAIN, longer retention policies.

## 5.1 Runtime verification (dev/us-east-1, 2026-02-05)
Verified via AWS CLI (`profile=rs-dev`).
- Stack: `remit-scout-dev` status `UPDATE_COMPLETE` (LastUpdatedTime: 2026-02-05).
- Drift: `DRIFTED` (5 resources):
  - `OpsPauseParam` value set to `true`.
  - EventBridge rules `gold-fx-rates` and `gold-indices` are `DISABLED`.
  - CloudFront distribution tags removed.
  - CloudWatch dashboard tags removed.
- ECS services: all 8 services `desired=0` / `running=0` (dev is paused).
- EventBridge rules: 35 total, all `DISABLED`.
- SQS queues: 18/18 expected queues present (including DLQs).

## 5.2 Dev pause policy + commands
Dev pause/resume is **CDK-only** using `devPaused` (no console toggles).

Commands:
- `make pause-dev`
- `make resume-dev`
- `make status-dev`

Runbook: `docs/runbooks/dev-pause-resume.md`.

## 6) Configuration and secrets

**Runtime config**
- Central config: `backend/shared/config.ts`.
- Key config groups: queues, db, redis, storage, observability, alerts, auth, billing.

**Secrets**
- Secrets Manager + SSM are used in CDK to inject into Lambda/ECS.
- Key secret types: DB credentials, Redis credentials, communications, OANDA, Sentry.

**Queue modes**
- Each queue can run in `queue`, `db`, or `off` mode.
- DB fallback is supported for quote refresh and FX refresh (Silver tables).

## 7) Reliability and scaling behavior
- ECS services scale by SQS depth and queue age metrics.
- Workers use bounded retries and DLQs (see `backend/shared/worker-retry.ts`).
- Worker locks prevent double-processing (Redis + DB when needed).
- Long running jobs extend SQS visibility (notifications worker).

## 8) A-Z reference (glossary-style)

A - API gateways and Plane A/C Lambdas. File: `infrastructure/cdk/lib/api.ts`.
B - Bronze tier in S3. Writers in `backend/plane-b/src/collectors/**`.
C - Compute (ECS + Lambda). Task defs in `infrastructure/cdk/lib/ecs-tasks.ts`.
D - Database (Aurora + RDS Proxy). `infrastructure/cdk/lib/database.ts`.
E - EventBridge schedules. `infrastructure/cdk/lib/scheduled-jobs.ts`.
F - FX rates (queue + worker + OANDA sync). `backend/plane-b/src/fx-rate-refresh.ts`.
G - Gold tier jobs and live updates. `backend/scripts/gold-*.ts`.
H - Health, SLOs, and freshness checks. `backend/shared/slo-tracker.ts`,
    `backend/scripts/data-health-slo-job.ts`, `/readyz` dependency checks, probe heartbeats.
I - Ingest fanout and Plane B ingest. `backend/scripts/ingest-fanout-worker.ts`.
J - Jobs (scheduled lambdas). See Section 3.3.
K - Keys/secrets (Secrets Manager + SSM). `infrastructure/cdk/lib/iam.ts` + `aws-params`.
L - Logs (CloudWatch log groups per service). `infrastructure/cdk/lib/ecs-tasks.ts`.
M - Metrics (CloudWatch + custom metrics). `backend/shared/cloudwatch-metrics.ts`.
N - Networking (VPC, subnets, endpoints). `infrastructure/cdk/lib/vpc.ts`.
O - Observability (dashboards, alarms, SNS). `infrastructure/cdk/lib/monitoring.ts`.
P - Planes (A/B/C) separation and invariants. `ARCHITECTURE.md`.
Q - Queues (SQS + DLQs). `infrastructure/cdk/lib/queues.ts`.
R - Redis (cache + locks). `infrastructure/cdk/lib/cache.ts`.
S - Storage buckets (Bronze/Exports/UserAssets/Audit). `infrastructure/cdk/lib/storage.ts`.
T - Tracing (X-Ray / OTEL). `backend/shared/tracing.ts`.
U - User assets + Exports (S3 + API). `backend/plane-a/src/routes/**`.
V - VPC endpoints and egress. `infrastructure/cdk/lib/vpc.ts`.
W - WAF + CloudFront (optional). `infrastructure/cdk/lib/api.ts`.
X - X-Ray traces across Lambda/ECS (optional OTel sidecars).
Y - YAML/IaC via CDK (Typescript). `infrastructure/cdk/**`.
Z - Zones (AZs) and HA policy (prod multi-AZ). `infrastructure/cdk/lib/vpc.ts`.

## 9) Box catalog (diagram nodes)
This is the explicit mapping from diagram nodes to code and behavior.

### Edge / API
- Clients / Partners: External users -> Plane A/Plane C.
- Ops / Admins: Internal ops -> Plane A/Plane C.
- CloudFront (optional): CDN in `infrastructure/cdk/lib/api.ts`.
- WAF (optional): WAF in `infrastructure/cdk/lib/api.ts`.
- HTTP API Gateway: Plane A -> `planeAApi` -> Lambda Plane A.
- HTTP API Gateway: Plane C -> `planeCApi` -> Lambda Plane C.

### API Lambdas
- Lambda Plane A: `backend/plane-a/src/app.ts`.
- Lambda Plane C: `backend/plane-c/src/app.ts`.

### ECS Workers
- Plane B Ingest: `backend/scripts/aws/plane-b-ingest-ecs.ts` -> `runIngestion`.
- Ingest Fanout Tier1/Tier2: `backend/scripts/aws/ingest-fanout-worker-ecs.ts` -> `runIngestFanoutWorkerLoop`.
- B2C Refresh Worker: `backend/scripts/aws/b2c-refresh-worker-ecs.ts` -> `runB2cRefreshWorkerLoop`.
- FX Refresh Worker: `backend/scripts/aws/fx-rate-refresh-worker-ecs.ts` -> `runFxRateRefreshWorkerLoop`.
- Gold Live Worker: `backend/scripts/aws/gold-live-worker-ecs.ts` -> `runGoldLiveWorker`.
- Notifications Worker: `backend/scripts/aws/notifications-queue-worker-ecs.ts` -> `runNotificationsQueueWorkerLoop`.
- Ops Alerts Worker: `backend/scripts/aws/ops-alerts-queue-worker-ecs.ts` -> `runOpsAlertsQueueWorkerLoop`.

### ECS Scheduled Task
- B2B Sweep Scheduler: `backend/scripts/aws/b2b-sweep-scheduler-ecs.ts` -> `runB2bSweepScheduler`.

### Scheduled Lambdas (by plane)
- Plane A: export-worker, alert-evaluation-scheduler/worker, alert-corridor-refresh,
  telemetry-analytics, session-cleanup, bank-vs-specialist-refresh, audit-log-cleanup, oanda-sync.
- Plane B: gold-fx-rates, smart-alerts, gold-popular-corridors, gold-pulse-cache,
  b2c-retry-failed, b2c-queue-cleanup, stoplist-auto-resume, rights-matrix-sync-countries.
- Plane C: gold-publisher, gold-indices, data-health-slo, gold-reconciliation.

### Queues
- quote-refresh -> B2C refresh worker (ECS).
- fx-rate-refresh -> FX refresh worker (ECS).
- export-job -> export-worker (Lambda).
- alert-evaluation -> alert-evaluation-worker (Lambda).
- ingest-fanout (tier1/tier2) -> ingest fanout workers (ECS).
- gold-live -> gold-live worker (ECS).
- notifications -> notifications worker (ECS).
- ops-alerts -> ops alerts worker (ECS).

### Data stores
- Aurora Postgres: Silver + Gold schemas, primary system of record.
- RDS Proxy: optional connection pooling for Lambdas.
- Redis: cache + locks.
- S3 buckets: bronze, exports, user assets, audit logs.

### Observability
- CloudWatch Dashboard + Alarms.
- SNS alert topics: critical, warning, ops.
- X-Ray / OTel tracing across Lambdas + ECS.
- Probe heartbeat alarms and SLO alarms for indices readiness.
- Synthetics canaries for health/quotes/indices.

### Cost guardrails
- CUR bucket, monthly budget, anomaly monitor/subscription.

### Networking
- VPC, public/private subnets, security groups, VPC endpoints.

---

This document is intentionally exhaustive. If a component is missing here, it is
missing from the diagram and should be added in both places.
