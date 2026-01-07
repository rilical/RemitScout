# AWS-Native Migration Gap Analysis (Phase 1)

This document is a detailed internal snapshot of the current Remit-Scout backend
deployment footprint and the gaps to reach an AWS-native architecture. It is
intended as a working document for migration planning and implementation.

Last updated: 2026-01-02 (local repo scan)

## Scope

- Backend only (Plane A, Plane B, Plane C, scripts, shared utilities, k8s manifests).
- Frontend is out of scope except for API base URLs and env usage.
- Source of truth: repository files, not assumptions.

## Repository topology (relevant)

- `backend/plane-a/` - Fastify API server (public API + billing + ops)
- `backend/plane-b/` - Ingestion and collectors (workers, schedulers, services)
- `backend/plane-c/` - Analytics API server (publisher validation)
- `backend/scripts/` - Batch jobs, probes, guardrails, synthetic checks
- `backend/shared/` - Shared config, db, logging, metrics, tracing, cache
- `k8s/` and `backend/k8s/` - Kubernetes manifests
- `docs/aws/` - AWS notes and migration planning (env vars in Appendix A)

## 1) Kubernetes resources inventory

### Primary manifests (`k8s/`)

| File | Kind | Name | Purpose | AWS-native mapping |
|---|---|---|---|---|
| `k8s/alertmanager-config.yaml` | Secret | `alertmanager-config` | Alertmanager config + Slack/PagerDuty tokens | CloudWatch Alarms + SNS + AWS Chatbot/PagerDuty; secrets in Secrets Manager |
| `k8s/alertmanager-config.yaml` | ConfigMap | `alertmanager-templates` | Alert message templates | CloudWatch Alarm templates + SNS formatting |
| `k8s/grafana-dashboards-configmap.yaml` | ConfigMap | `grafana-dashboards` | Grafana dashboards (Prometheus) | Amazon Managed Grafana or CloudWatch Dashboards |
| `k8s/jaeger-deployment.yaml` | Deployment | `jaeger` | Jaeger all-in-one tracing | AWS X-Ray (or ADOT + X-Ray exporter) |
| `k8s/jaeger-deployment.yaml` | Service | `jaeger` | Service for Jaeger UI + collectors | X-Ray; no service needed |
| `k8s/prometheus-alert-rules.yaml` | ConfigMap | `prometheus-alert-rules` | Prometheus alert rules | CloudWatch Alarms or AMP rule groups |
| `k8s/synthetic-monitor-deployment.yaml` | Deployment | `synthetic-monitor` | Synthetic monitoring runner | CloudWatch Synthetics (Canary) or EventBridge + Lambda |
| `k8s/synthetic-monitor-deployment.yaml` | Service | `synthetic-monitor` | Metrics endpoint | CloudWatch Metrics / Synthetics |
| `k8s/b2c-refresh-worker-cronjob.yaml` | CronJob | `b2c-refresh-worker` | B2C refresh worker | EventBridge schedule -> Lambda/ECS |

### Plane B cronjobs (`backend/k8s/`)

| File | Kind | Name | Purpose | AWS-native mapping |
|---|---|---|---|---|
| `backend/k8s/b2c-refresh-worker-cronjob.yaml` | CronJob | `b2c-refresh-worker` | B2C refresh worker (schedule */2) | EventBridge schedule -> Lambda/ECS |
| `backend/k8s/b2c-refresh-worker-cronjob.yaml` | CronJob | `b2c-retry-failed` | Retry failed refresh requests (*/15) | EventBridge schedule -> Lambda |
| `backend/k8s/stoplist-auto-resume-cronjob.yaml` | CronJob | `stoplist-auto-resume` | Resume stoplisted providers (daily 02:00) | EventBridge schedule -> Lambda |

Notes:
- There are duplicate CronJob definitions in `k8s/` vs `backend/k8s/` with different
  schedules and image names. Phase 1 should reconcile to a single source of truth.

## 2) Deployment configuration and packaging

- Docker:
  - `docker-compose.yml` exists for local Postgres.
  - `backend/Dockerfile` exists as a placeholder image build (default entrypoint Plane B ingest).
  - Kubernetes manifests reference images (`remit-scout-backend:latest`,
    `remit-scout/backend:latest`) but per-plane Dockerfiles and CI build steps are still missing.
- Runtime entrypoints:
  - Plane A: `backend/plane-a/src/server.ts`
  - Plane B: `backend/plane-b/src/ingest.ts`
  - Plane C: `backend/plane-c/src/server.ts`
  - Batch jobs: `backend/scripts/*.ts` (see below)
- Build:
  - `backend/package.json` -> `tsc -b plane-a plane-c plane-b` generates `dist/`.

AWS gap: standardize Docker/Lambda packaging plus ECR/CDK build pipeline.

## 3) Batch jobs and scheduling

### Production batch jobs

| Script | Purpose | Dependencies | Current schedule | AWS target |
|---|---|---|---|---|
| `backend/scripts/b2c-refresh-worker.ts` | Process live refresh queue | Postgres + Redis | K8s CronJob | EventBridge -> ECS/Lambda |
| `backend/scripts/b2c-retry-failed.ts` | Retry failed refresh requests | Postgres | K8s CronJob | EventBridge -> Lambda |
| `backend/scripts/quote-refresh-queue-cleanup.ts` | Cleanup processed refresh rows | Postgres | None in repo | EventBridge -> Lambda |
| `backend/scripts/stoplist-auto-resume.ts` | Resume stoplisted providers | Postgres + Redis | K8s CronJob | EventBridge -> Lambda |
| `backend/scripts/gold-popular-corridors-job.ts` | Gold cache populate | Postgres + Redis | None in repo | EventBridge -> Lambda |
| `backend/scripts/gold-fx-rates-job.ts` | Gold FX rate aggregation | Postgres + Redis | None in repo | EventBridge -> Lambda |
| `backend/scripts/gold-pulse-cache-job.ts` | Gold pulse cache aggregation | Postgres + Redis | None in repo | EventBridge -> Lambda |
| `backend/scripts/gold-publisher-job.ts` | Publisher gates to Gold | Postgres + Redis | None in repo | EventBridge -> Lambda/ECS |
| `backend/scripts/alert-evaluation-worker.ts` | Alert evaluation worker (SQS) | Postgres + Redis + SQS | None in repo | EventBridge scheduler -> Lambda/ECS worker |
| `backend/scripts/export-worker.ts` | Export job worker (SQS/DB -> S3) | Postgres + S3 | None in repo | ECS/Lambda worker |
| `backend/scripts/telemetry-analytics-job.ts` | Telemetry analytics aggregation | Postgres + Redis | None in repo | EventBridge -> Lambda |
| `backend/scripts/audit-log-cleanup-worker.ts` | Archive + delete audit logs | Postgres + S3 | None in repo | EventBridge -> Lambda/ECS |
| `backend/scripts/session-cleanup-worker.ts` | Revoke expired sessions | Postgres | None in repo | EventBridge -> Lambda |
| `backend/scripts/oanda-rates-sync.ts` | FX rate sync (interval loop) | Postgres + OANDA HTTP | None in repo | ECS service (long-running) |
| `backend/scripts/ingest-run.ts` | Manual ingestion run | Postgres | Manual | Optional EventBridge |
| `backend/scripts/db-migrate.ts` | DB migrations | Postgres | Manual | CodeBuild or pre-deploy step |
| `backend/scripts/sql-guardrail.ts` | SQL guardrail/inventory | Repo scan | Manual | CI only |
| `backend/scripts/bronze-access-check.js` | Guardrail test | HTTP | CI / manual | CI or CloudWatch Synthetics |

### Probes and dev utilities

- Probes: `backend/scripts/*-probe.ts`, `backend/scripts/cache-ttl-probe.ts`
  - Scheduled in GitHub Actions (`.github/workflows/probe-health-checks.yml`).
- AWS canary handler: `backend/scripts/aws-synthetic-monitor.ts` (CloudWatch Synthetics).
- Dev-only: `backend/scripts/dev/remitly-snapshot.ts`, `backend/scripts/dev/westernunion-observe.ts`.

## 4) API endpoints inventory

### Plane A (public API)

Auth mechanisms:
- Supabase JWT verification and role checks in `backend/plane-a/src/plugins/auth-plugin.ts`.
- Entitlements enforced via `requireEntitlement` for Pulse/History/Exports; watchlist and alerts enforce plan limits in-route.

Route base:
- Plane A mounts both `/api` and `/api/v1` prefixes. `/api/v1` is preferred; `/api` is backward compatibility.

Public (no auth):
- GET `/api/quotes/current`
- GET `/api/providers`
- GET `/api/popular-corridors`
- GET `/api/bank-vs-specialist`
- GET `/api/geo`
- GET `/api/rates/spot`
- GET `/api/rates/providers`
- GET `/api/rates/history`
- GET `/api/rates/exchange/:base/:quote`
- GET `/api/rates/exchange/:base/:quote/history`
- POST `/api/contact`
- POST `/api/newsletter/subscribe`
- GET `/api/newsletter/confirm`
- GET `/api/newsletter/unsubscribe`
- GET `/api/newsletter/status`
- POST `/api/telemetry/search`
- POST `/api/telemetry/click`
- POST `/api/telemetry/session`
- POST `/api/provider-visits/track`
- GET `/api/alerts/unsubscribe`
- GET `/healthz`
- GET `/readyz`
- GET `/metrics`

Webhook (no auth, signature required):
- POST `/api/billing/webhook`

Authenticated (requireAuth):
- GET `/api/me`
- PATCH `/api/me`
- POST `/api/me/avatar`
- DELETE `/api/me/avatar`
- POST `/api/me/password`
- POST `/api/billing/checkout-session`
- POST `/api/stripe/create-checkout`
- GET `/api/billing/portal`
- GET `/api/billing/history`
- POST `/api/billing/verify-session`
- GET `/api/sessions`
- DELETE `/api/sessions/:id`
- POST `/api/sessions/revoke-all`
- POST `/api/sessions/track`
- DELETE `/api/account`
- GET `/api/watchlist`
- POST `/api/watchlist`
- PATCH `/api/watchlist/:id`
- DELETE `/api/watchlist/:id`
- GET `/api/alerts`
- POST `/api/alerts`
- PATCH `/api/alerts/:id`
- DELETE `/api/alerts/:id`
- GET `/api/alerts/smart-notifier`
- GET `/api/recent-searches`
- POST `/api/recent-searches`
- POST `/api/history`
- GET `/api/provider-visits/pending-feedback`
- POST `/api/provider-visits/:id/feedback`
- POST `/api/data/export`
- GET `/api/data/export/:id`
- GET `/api/data/export/:id/download`
- GET `/api/audit/my-activity`

Entitlement-gated:
- GET `/api/pulse/status`
- GET `/api/pulse/corridors`
- GET `/api/pulse/overview`
- GET `/api/pulse/charts/:chartId`
- GET `/api/pulse/method-coverage`
- GET `/api/pulse/table`
- GET `/api/pulse/hero`
- GET `/api/pulse/coverage-summary`
- GET `/api/pulse/snapshot-summary`
- GET `/api/pulse/providers/benchmarking`
- GET `/api/pulse/events`
- GET `/api/pulse/providers/heatmap`
- GET `/api/pulse/smart-send`
- GET `/api/pulse/market-snapshot`
- GET `/api/pulse/true-cost`
- GET `/api/pulse/market-depth`
- GET `/api/pulse/arbitrage`
- GET `/api/pulse/bank-comparison`
- GET `/api/pulse/cost-trend`
- GET `/api/pulse/fx-rate-history`
- GET `/api/history/corridor`
- POST `/api/exports`
- GET `/api/exports`
- GET `/api/exports/:id`
- GET `/api/exports/:id/download`

Admin-only:
- GET `/api/ops/{provider}/health`
- GET `/api/telemetry/analytics`
- GET `/api/analytics/*`
- GET `/api/audit/logs`
- GET `/api/audit/logs/export`
- GET `/api/audit/logs/:eventId`

### Plane C (internal API)

| Method | Path | Auth | File | Notes |
|---|---|---|---|---|
| POST | `/internal/publisher/validate` | None | `backend/plane-c/src/routes/publisher.ts` | Should be private network / IAM |
| GET | `/healthz` | Public | `backend/plane-c/src/app.ts` | |
| GET | `/readyz` | Public | `backend/plane-c/src/app.ts` | |
| GET | `/metrics` | Public | `backend/plane-c/src/app.ts` | Prometheus metrics |

## 5) Database connectivity

- Core DB module: `backend/shared/db.ts`
  - Uses `pg` Pool. Env `DATABASE_URL*` from `backend/shared/config.ts`.
  - Instrumented with Prometheus metrics (`backend/shared/db-metrics.ts`).
- No RDS Proxy or IAM auth.
- Multiple pools by connection string: Plane A/B/C URLs.

AWS gap: migrate to RDS Proxy for Lambda/ECS; remove long-lived connections in Lambda.

## 6) Async / queue processing

- DB queue table: `silver.quote_refresh_request` created in `backend/db/migrations/008_quote_refresh_request.sql`.
- SQS helpers: `backend/shared/sqs.ts`.
- Quote refresh:
  - Enqueue in Plane A: `backend/plane-a/src/repositories/implementations/quote-refresh-repository.ts`
    (DB insert + optional SQS publish when `QUOTE_REFRESH_QUEUE_URL` is set).
  - Dequeue/process in Plane B: `backend/plane-b/src/quote-refresh.ts`
    (SQS when `QUOTE_REFRESH_QUEUE_URL` is set, otherwise DB queue).
- Ingestion fanout queue (SQS):
  - Queue scaffolded in CDK, env in `backend/shared/config.ts`.
  - Plane B can enqueue shard payloads when `PLANE_B_INGEST_FANOUT_QUEUE_MODE=shadow|queue`.
  - Worker script: `backend/scripts/ingest-fanout-worker.ts` (queue mode only).
  - ECS service created; desired count gated by queue mode in CDK.
- Notifications fanout queue (SQS):
  - Optional enqueue in `backend/plane-b/src/notifications/dispatcher.ts`.
  - Mode gated by `PLANE_B_NOTIFICATIONS_QUEUE_MODE`.
  - Worker script: `backend/scripts/notifications-queue-worker.ts` (queue mode only).
  - ECS service created; desired count gated by queue mode in CDK.
- Ops alerts fanout queue (SQS):
  - Optional enqueue in `backend/plane-b/src/collectors/base.ts`.
  - Mode gated by `PLANE_B_OPS_ALERT_QUEUE_MODE`.
  - Worker script: `backend/scripts/ops-alerts-queue-worker.ts` (queue mode only).
  - ECS service created; desired count gated by queue mode in CDK.
- Export job queue (SQS/DB):
  - Enqueue in Plane A exports API (`backend/plane-a/src/routes/exports.ts`), optional SQS via `EXPORT_JOB_QUEUE_URL`.
  - Worker script: `backend/scripts/export-worker.ts` (queue/shadow/off).
- Alert evaluation queue (SQS):
  - Queue config in `backend/shared/config.ts` (`alerts.evaluation`).
  - Scheduler/worker in `backend/scripts/aws/*` and `backend/scripts/alert-evaluation-worker.ts`.
- Ingestion execution is still inline in `backend/plane-b/src/ingest.ts`.

AWS gap: quote refresh is SQS-ready. Ingestion/notifications/ops alerts now have
queue workers and ECS services, but queue mode is still off by default. Decide
cutover timing and scaling thresholds.

## 7) Observability and logging

### Metrics (Prometheus)

- Shared registry: `backend/shared/metrics-registry.ts`.
- API metrics: `backend/shared/api-metrics.ts`.
- DB metrics: `backend/shared/db-metrics.ts`.
- Data health metrics: `backend/shared/data-health-metrics.ts`.
- Batch job metrics: `backend/scripts/*-job-metrics.ts`, `backend/scripts/b2c-refresh-worker-metrics.ts`.
- Provider collection metrics: `backend/plane-b/src/collectors/collector-metrics.ts`.

### Health endpoints

- Plane A: `/healthz`, `/readyz`, `/metrics` in `backend/plane-a/src/app.ts`.
- Plane C: `/healthz`, `/readyz`, `/metrics` in `backend/plane-c/src/app.ts`.
- Plane B: `backend/plane-b/src/health-server.ts` with `/healthz`, `/readyz`, `/metrics`.
- Jobs: `backend/scripts/*-job-health.ts` (per-job health + metrics server).

### Tracing

- OpenTelemetry + Jaeger exporter in `backend/shared/tracing.ts`.
- Jaeger deployed in `k8s/jaeger-deployment.yaml`.

### Logging

- JSON logs to stdout in `backend/shared/logger.ts`.
- Error tracking via Sentry in `backend/shared/error-tracker.ts`.

AWS gap: replace Prometheus/Grafana/Alertmanager + Jaeger with CloudWatch + X-Ray
or keep OTel with ADOT collector and export to CloudWatch/X-Ray.

## 8) Caching / Redis

- Redis client in `backend/shared/redis.ts`.
- Cache helpers in `backend/shared/cache.ts`.
- Redis used for:
  - Rate limit token bucket: `backend/plane-b/src/lib/redis-token-bucket.ts`
  - Circuit breaker state: `backend/plane-b/src/lib/redis-circuit-breaker.ts`
  - Worker locks: `backend/plane-b/src/lib/worker-lock.ts`

AWS mapping: ElastiCache Redis (or MemoryDB if multi-region durability is needed).

## 9) Secrets and configuration

- Policies documented in `CONTRIBUTING.md` (Secrets Manager + SSM recommended).
- Runtime uses `process.env` directly in `backend/shared/config.ts` and other files.
- Sensitive configs include:
  - DB URLs (`DATABASE_URL*`)
  - Redis URL (`REDIS_URL`)
  - Stripe secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
  - Supabase keys (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_JWKS_URL`)
  - Notification providers (SendGrid/Twilio/SMTP/SMS)
  - Sentry (`SENTRY_DSN`)

AWS gap: implement Secrets Manager / SSM retrieval and remove direct env dependencies
in runtime code (or use env injection from Lambda/ECS via secrets).

## 10) CI/CD

- GitHub Actions:
  - `validate.yml` (lint + tests)
  - `probe-health-checks.yml` (provider probes on schedule)
- No AWS pipeline or infra deployment automation.

AWS gap: CodePipeline + CodeBuild + IaC deploy (CDK/Terraform).

## 11) Storage

- Bronze storage is placeholder: `backend/storage/bronze/bronzeUtil.js`
  (no S3 integration in runtime code).
- S3 is used for exports (`backend/scripts/export-worker.ts`),
  user assets (`backend/plane-a/src/services/avatar-upload.ts`),
  and audit log archives (`backend/scripts/audit-log-cleanup-worker.ts`).
- SQL seeds reference "seed:S3.0" in `backend/db/migrations/009_provider_seeds.sql`.

AWS gap: implement real S3 integration for Bronze data path and standardize bucket provisioning.

## 12) RSE alignment notes (update RSE-271225-022936.pdf/.txt)

These are the code-first corrections to apply to the RSE knowledge base:

- API base: Plane A mounts both `/api` and `/api/v1`; `/api/v1` is preferred and `/api` is backward compatibility.
- Pulse: chart path is `/api/pulse/charts/:chartId` (plural). RSE should also list the rest of the Pulse surface
  (`/api/pulse/corridors`, `/overview`, `/method-coverage`, `/table`, `/hero`, `/coverage-summary`,
  `/snapshot-summary`, `/providers/benchmarking`, `/providers/heatmap`, `/events`, `/smart-send`,
  `/market-snapshot`, `/true-cost`, `/market-depth`, `/arbitrage`, `/bank-comparison`, `/cost-trend`,
  `/fx-rate-history`), all gated by the `pulse` entitlement.
- Telemetry: use `/api/telemetry/search` and `/api/telemetry/click` (public). `recent-searches` is
  `/api/recent-searches` (auth) and is not a telemetry endpoint. Also add `/api/telemetry/session`
  (public) and admin `/api/telemetry/analytics`.
- History: endpoint is `GET /api/history/corridor` with query params, plus `POST /api/history` for
  comparison history logging (auth). Remove `/api/history/{corridor}`.
- Billing: `/api/billing/portal` is GET; add `/api/billing/history` and `/api/billing/verify-session`.
  Keep `/api/billing/webhook` (no auth, Stripe signature). `/api/stripe/create-checkout` is an alias
  for checkout session creation.
- Alerts: no guest alert subsystem in code. Keep `/api/alerts` CRUD, `/api/alerts/unsubscribe`, and
  `/api/alerts/smart-notifier`.
- Exports: add `GET /api/exports`, `GET /api/exports/:id`, and `GET /api/exports/:id/download`
  alongside `POST /api/exports`. Add GDPR export endpoints under `/api/data/export`.
- Additional public endpoints to include: `/api/providers`, `/api/bank-vs-specialist`, `/api/geo`,
  `/api/rates/*`, `/api/contact`, `/api/newsletter/*`, `/api/provider-visits/track`.
- Additional auth/admin endpoints to include: `/api/sessions/*`, `/api/account`, `/api/provider-visits/*`,
  `/api/analytics/*` (admin), `/api/audit/logs*` (admin), `/api/audit/my-activity` (auth).
- Tiering and freshness: corridor priority comes from `silver.corridor_priority` with tiers
  `tier_1_alpha`, `tier_2_reference`, `tier_3_discovery`. Current sweep intervals/SLOs in code are
  60s/1m, 3600s/60m, 86400s/1440m (see `backend/plane-b/src/ingest.ts`); remove the
  `corridors_schedule.json` requirement unless it becomes authoritative again.
- Data products: Pulse and history read from Postgres gold schemas
  (`gold.pulse_cache`, `gold_export.*`), not ClickHouse, in the current codebase.
- B2C cache TTL: volatility-based TTLs are 30m/1h/4h defaults with a US-MX 5h override
  (`backend/shared/volatility-service.ts`, `backend/plane-a/src/routes/quotes.ts`).
- FX move trigger: code emits SNS alerts on >5% FX rate changes; there is no 0.5% auto-sweep trigger.
- Queues: B2C refresh uses `QUOTE_REFRESH_QUEUE_URL`; ingestion fanout uses
  `PLANE_B_INGEST_FANOUT_QUEUE_URL`; exports use `EXPORT_JOB_QUEUE_URL`;
  ops alerts and notifications use their respective Plane B queue envs; alert evaluation uses
  `ALERT_EVALUATION_QUEUE_URL`.

## Gap summary (by category)

- IaC: CDK scaffold exists (VPC/SG/IAM/SQS/Lambda/ECS placeholders), but core services
  (Aurora, API Gateway, CloudFront, X-Ray) are not deployed here.
- Compute: ECS/Lambda placeholders exist; no production deploy pipeline yet.
- Scheduling: EventBridge schedules added for gold jobs and workers; K8s CronJobs still present for legacy.
- Observability: Prometheus/Jaeger stack in k8s; no CloudWatch/X-Ray.
- Secrets: Secrets Manager/SSM resolver exists (`backend/shared/aws-params.ts`), but runtime still uses env for most services.
- Queues: SQS integrated for quote refresh, ingest fanout, notifications, ops alerts, exports, and alert evaluation.
  Queue mode defaults to off.
- Storage: Bronze not wired; exports/avatars/audit logs already use S3.
- CI/CD: GitHub Actions only. No CodePipeline.
- Network: VPC/SG modeling exists in CDK, but no full AWS deployment wiring yet.

## AWS-native target mapping (high level)

- Plane A:
  - API Gateway (HTTP API) -> Lambda (Fastify adapter) or ECS/Fargate.
  - RDS Proxy -> Aurora.
  - CloudFront + WAF.
  - JWT authorizer for Supabase.
- Plane B:
  - EventBridge schedules -> ECS/Fargate or Lambda for jobs.
  - SQS for refresh queue + ingestion fanout.
  - ElastiCache Redis for locks/circuit breakers.
- Plane C:
  - API Gateway -> Lambda/ECS for internal publisher validation.
  - EventBridge for publishing jobs.
- Observability:
  - CloudWatch Logs + Metrics, X-Ray tracing.
  - Managed Grafana (optional) or CloudWatch dashboards.

## Phase 1 deliverables (analysis)

This document is the Phase 1 artifact. It includes:
- K8s inventory and AWS mapping
- Deployment and batch job inventory
- API endpoints catalog
- DB, queue, caching, observability, secrets, CI/CD gap list

Next: implement IaC scaffold and migrate the first cron job to EventBridge + Lambda
as a reference pattern.

## Phase 1 implementation status

- CDK scaffold added under `infrastructure/cdk` with a base stack:
  - VPC (public + private subnets)
  - IAM roles with baseline Secrets Manager/SSM read policies
  - Security groups for Plane A/B/C, DB, Redis
  - ECS cluster placeholder
- Workspace now includes `infrastructure/cdk` for installs and builds.
- Next steps:
  - Add VPC outputs, security groups, and baseline IAM policies.
  - Define the first scheduled job (EventBridge -> Lambda) as the reference pattern.
  - Add ECR repo + ECS task definition placeholders and Dockerfile.

### Phase 1 implementation updates

- VPC outputs added (VPC ID, subnet IDs, SG IDs).
- IAM roles include Secrets Manager + SSM Parameter Store read policies.
- Security groups defined for Plane A/B/C + DB + Redis.
- EventBridge schedule added for `gold-fx-rates` (placeholder Lambda).
- ECR repository placeholder added (`remit-scout-backend-${env}`).
- ECS task definition placeholders for Plane B ingest + B2C refresh worker.
- EventBridge schedule placeholders added for:
  - `gold-popular-corridors` (hourly)
  - `gold-pulse-cache` (hourly)
  - `gold-publisher` (30m)
  - `b2c-retry-failed` (15m)
  - `stoplist-auto-resume` (daily @ 02:00 UTC)
- EventBridge ECS target added for `b2c-refresh-worker` (5m cadence).
- ECS service placeholder for Plane B ingestion (desiredCount=1 in prod, 0 otherwise).
- Gold FX rates, popular corridors, pulse cache, publisher, retry, and stoplist
  jobs are wired to real Lambda handlers (NodejsFunction) with Secrets Manager / SSM
  resolution via `backend/shared/aws-params.ts`.
- ECS tasks now use resolver wrappers (`backend/scripts/aws/*-ecs.ts`) and accept
  secret ARNs for DB/Redis before bootstrapping the actual worker code.
- SQS queues now provisioned in CDK for quote refresh, ingest fanout,
  notifications, and ops alerts, with queue URLs injected into Plane B ECS tasks.
- Queue feature flags added in `backend/shared/config.ts` to support
  shadow/queue modes for ingestion fanout, notifications, and ops alerts.
- `backend/Dockerfile` added as a placeholder image build.

## Phase 2: AWS-native architecture mapping and implementation plan

This section converts Phase 1 inventory into a target AWS architecture and an
ordered implementation plan. It is meant to be prescriptive and execution-ready.

### 2.0 Goals

- Finalize runtime choices (Lambda vs ECS) by workload class.
- Define AWS service boundaries per plane and per job.
- Standardize secrets, config, and network access patterns.
- Establish observability strategy aligned to AWS-native tooling.
- Produce a sequenced, dependency-aware execution plan.

### 2.1 Decisions and guiding principles

- IaC: use AWS CDK (TypeScript) under `infrastructure/cdk` to keep infra and
  app code in the same language, with environment contexts (dev, staging, prod).
- Compute: default to Lambda for short, stateless jobs; ECS/Fargate for
  long-running, high-concurrency, or heavy egress workloads.
- Network: private subnets for DB/Redis and Lambda/ECS; public subnets only
  for NAT and public ingress layers (API Gateway + CloudFront).
- Secrets: store secrets in Secrets Manager; non-secret config in SSM.
  Inject secrets into Lambda/ECS at runtime; avoid direct `process.env` secrets
  in app code where possible.
- Observability: move to CloudWatch Logs + Metrics and X-Ray; keep Prometheus
  metrics for a transition window and export via ADOT or a sidecar.
- Security: least privilege IAM, explicit SG rules, and restrict Plane C to
  private access only.

### 2.2 Runtime selection matrix (Lambda vs ECS)

| Dimension | Lambda | ECS/Fargate |
|---|---|---|
| Typical duration | < 15 minutes | 15+ minutes or continuous |
| Concurrency model | Burst, event-driven | Sustained, worker pool |
| Network egress | OK, but NAT costs can spike | Better for steady egress |
| Cold start sensitivity | Higher | Lower |
| Stateful needs | None | Can maintain local caches |
| Cost profile | Pay per request | Pay per vCPU/GB-hour |
| Best fit here | Gold jobs, retry, stoplist | Ingestion workers, refresh loops |

### 2.3 Plane A (Public API) target architecture

**Ingress and routing**
- CloudFront + WAF -> API Gateway (HTTP API) -> Lambda.
- API Gateway JWT authorizer for Supabase tokens.

**Runtime**
- Fastify app packaged as Lambda (use adapter in `backend/plane-a/src/server.ts`).
- Configure reserved concurrency for predictable latency.

**Data access**
- RDS Proxy for Aurora Postgres.
- ElastiCache Redis for caching and rate limits.

**Observability**
- CloudWatch Logs for structured logs.
- X-Ray for request traces.
- Keep `/metrics` during transition; export to AMP if needed.

**Security**
- VPC-enabled Lambda with SG access to RDS Proxy and Redis.
- No direct internet egress unless provider APIs are needed (not expected).

### 2.4 Plane B (Ingestion and collectors) target architecture

**Ingestion runtime**
- ECS/Fargate service for `backend/plane-b/src/ingest.ts` with steady-state
  concurrency (desiredCount 1 in prod, 0 in lower envs).

**Scheduled jobs**
- EventBridge rules for batch jobs; target Lambda for short jobs and ECS for
  long-running jobs (see mapping below).

**Queueing**
- Move `silver.quote_refresh_request` from DB-queue to SQS standard queue.
- Maintain a migration window where DB and SQS are dual-written.

**External egress**
- Private subnets with NAT gateways; allow outbound only to provider APIs.

**Locks and rate limits**
- ElastiCache Redis for locks and circuit breaker state.

### 2.5 Plane C (Analytics API) target architecture

**Access model**
- Private API Gateway or internal ALB only (no public ingress).
- If Lambda: VPC-enabled Lambda with RDS Proxy access.
- If ECS: small Fargate service with ALB ingress locked to VPC.

**Use cases**
- `/internal/publisher/validate` should be callable only by trusted AWS
  principals (IAM auth) or VPC-private network clients.

### 2.6 Batch job mapping (EventBridge -> Lambda/ECS)

| Job | Script | Runtime | Schedule | AWS target |
|---|---|---|---|---|
| Refresh worker | `backend/scripts/b2c-refresh-worker.ts` | Long | 5m | EventBridge -> ECS task |
| Retry failed refresh | `backend/scripts/b2c-retry-failed.ts` | Short | 15m | EventBridge -> Lambda |
| Refresh queue cleanup | `backend/scripts/quote-refresh-queue-cleanup.ts` | Short | daily | EventBridge -> Lambda |
| Stoplist auto-resume | `backend/scripts/stoplist-auto-resume.ts` | Short | daily 02:00 | EventBridge -> Lambda |
| Gold popular corridors | `backend/scripts/gold-popular-corridors-job.ts` | Short | hourly | EventBridge -> Lambda |
| Gold FX rates | `backend/scripts/gold-fx-rates-job.ts` | Short | 15m | EventBridge -> Lambda |
| Gold pulse cache | `backend/scripts/gold-pulse-cache-job.ts` | Short | hourly | EventBridge -> Lambda |
| Gold publisher | `backend/scripts/gold-publisher-job.ts` | Short/Med | 30m | EventBridge -> Lambda (ECS if > 15m) |
| Ingest run | `backend/scripts/ingest-run.ts` | Med/Long | on-demand | ECS task (manual trigger) |
| DB migrate | `backend/scripts/db-migrate.ts` | Short | pre-deploy | CodeBuild or ECS one-off |

### 2.7 Data layer (Aurora + RDS Proxy)

- Aurora Postgres as the system of record for Silver/Gold.
- RDS Proxy for Lambda/ECS to reduce connection spikes and pool overhead.
- Secrets Manager holds DB credentials; Lambda/ECS reads secrets via IAM
  or via injection at deploy time.
- Use distinct secrets per environment (dev, staging, prod).

### 2.8 Queueing and eventing

- Introduce SQS Standard queues for refresh requests and any ingestion fanout.
- Define DLQs with alerting thresholds.
- Update Plane A enqueue and Plane B dequeue paths with a dual-write
  migration (DB + SQS) then switch reads to SQS only.
- Cutover runbook should live in Confluence (or a dedicated runbook), covering the DB -> SQS switchover.

### 2.9 Secrets and config resolution

**Target pattern**
- Secrets Manager for secrets, SSM Parameter Store for non-secret config.
- Common resolver in `backend/shared/aws-params.ts`.
- ECS task definitions inject secrets directly (no raw secret ARNs in env
  at runtime).
- Support JSON key extraction for composite secrets.

**Naming**
- `/remit-scout/{env}/config/*` for SSM.
- `remit-scout/{env}/secrets/*` for Secrets Manager.

### 2.10 Observability mapping

- CloudWatch Logs for app and job logs.
- CloudWatch Metrics for infra-level metrics and alarms.
- X-Ray for distributed traces.
- Keep Prometheus endpoints temporarily to avoid breaking operational
  dashboards; export via ADOT or AMP in parallel.
- Alerting in CloudWatch + SNS, with PagerDuty/Slack integration.

### 2.11 Networking and security

- VPC with private subnets (app, DB, Redis) and public subnets (NAT).
- VPC endpoints for Secrets Manager, SSM, CloudWatch Logs, and S3.
- Dedicated SGs for Plane A/B/C, RDS Proxy, Redis, and Lambda.
- Egress filtering for Plane B to provider domains where possible.

### 2.12 CI/CD and build artifacts

- ECR repo per environment: `remit-scout-backend-{env}`.
- Build pipeline produces both Lambda bundles and container images.
- CDK deploy per environment; drift detection in CI.
- Keep GitHub Actions for tests and lint; use CodeBuild for deploy jobs
  if/when moving off GitHub.

### 2.13 Phase 2 execution plan (ordered)

1. Finalize runtime selections for each job (Lambda vs ECS) and lock schedules.
2. Expand CDK stacks to include Aurora + RDS Proxy + Redis + S3 Bronze.
3. Add SQS queues and DLQs, wire IAM policies for producers/consumers.
4. Wrap Plane A and Plane C as Lambda handlers; deploy behind API Gateway.
5. Convert Plane B ingestion to ECS/Fargate service with NAT egress.
6. Wire EventBridge schedules to Lambda/ECS for all batch jobs.
7. Integrate Secrets Manager and SSM for config across Lambda/ECS.
8. Add CloudWatch dashboards and alarms, and enable X-Ray on APIs and jobs.
9. Perform migration cutover for refresh queue from DB to SQS.
10. Validate with load tests and synthetic checks before prod cutover.

### 2.14 Phase 2 deliverables checklist

- CDK stacks for VPC, IAM, RDS Proxy, Redis, S3, SQS, API Gateway, ECS, Lambda.
- EventBridge schedules for all production jobs.
- Plane A and Plane C Lambda packaging and deployment.
- Plane B ECS/Fargate service definition.
- Secrets Manager + SSM integration with consistent naming.
- CloudWatch dashboards + alarms + X-Ray tracing enabled.
- Migration runbook and rollback plan.

### 2.15 Current migration status (repo)

- SQS queues provisioned in CDK; queue URLs injected into Plane B ECS tasks.
- Quote refresh dual-write/dual-consume is implemented behind `QUOTE_REFRESH_QUEUE_URL`.
- Ingestion fanout, notifications, and ops alerts have queue workers in `backend/scripts`;
  ECS wiring is still pending.
- Core AWS infra components (Aurora, RDS Proxy, API Gateway, CloudFront, X-Ray)
  are not yet deployed in this repo.

### 2.16 Open decisions and risks

- Lambda vs ECS for gold-publisher job (depends on runtime and data size).
- Prometheus migration strategy (AMP vs full CloudWatch conversion).
- SQS migration impacts on retry semantics and ordering.
- API Gateway vs ALB for Plane C (security and latency trade-offs).
- RDS Proxy scaling limits during ingestion spikes.
- NAT gateway cost impact from provider scraping workloads.

## Appendix A: Environment variables
Baseline list from Sprint 2; treat as a starting point and update as config evolves.

Use this as a reminder for what must be configured in AWS (ECS/Lambda/EC2). Store secrets in AWS Secrets Manager and non-secrets in SSM Parameter Store. If unsure, treat the value as a secret.

## Plane A (API/Auth/Billing)
- PLANE_A_PORT
- PLANE_A_RATE_LIMIT_MAX
- PLANE_A_RATE_LIMIT_WINDOW_MS
- PLANE_A_REQUIRE_API_KEY
- PLANE_A_REQUIRE_JWT
- PLANE_A_API_KEYS
- PLANE_A_JWT_SECRET
- PLANE_A_JWT_ISSUER (API Gateway JWT authorizer)
- PLANE_A_JWT_AUDIENCES (comma-separated, API Gateway JWT authorizer)
- PLANE_A_ENABLE_JWT_AUTH (1|true to enable API Gateway JWT auth)
- PLANE_C_BASE_URL
- PLANE_A_CORS_ORIGINS (comma-separated, optional)
- PLANE_A_CORS_ALLOWED_HEADERS (comma-separated, optional)
- PLANE_A_CORS_ALLOWED_METHODS (comma-separated, optional)
- PLANE_A_CORS_ALLOW_CREDENTIALS (1|true, optional)
- PLANE_A_DOMAIN_NAME (optional, CloudFront custom domain)
- PLANE_A_CERT_ARN (optional, ACM cert for CloudFront)
- PLANE_A_HOSTED_ZONE_ID (optional, Route 53 zone ID)
- PLANE_A_HOSTED_ZONE_NAME (optional, Route 53 zone name)
- PLANE_A_API_THROTTLE_RATE (optional, API Gateway stage throttle)
- PLANE_A_API_THROTTLE_BURST (optional, API Gateway stage throttle)

## Plane C (Publisher)
- PLANE_C_PORT
- PLANE_C_ENABLE_IAM_AUTH (1|true to require SigV4 at API Gateway)
- PLANE_C_DISABLE_EXECUTE_ENDPOINT (1|true to disable execute-api endpoint)
- PLANE_C_API_THROTTLE_RATE (optional, API Gateway stage throttle)
- PLANE_C_API_THROTTLE_BURST (optional, API Gateway stage throttle)

## Database
- DATABASE_URL
- DATABASE_URL_PLANE_A
- DATABASE_URL_PLANE_B
- DATABASE_URL_PLANE_C
- PGSSLMODE (set to require in production)

## Storage (Bronze S3)
- BRONZE_S3_BUCKET
- BRONZE_S3_PREFIX

## Storage (Exports S3)
- EXPORTS_S3_BUCKET
- EXPORTS_S3_PREFIX
- EXPORT_JOB_MAX_ACTIVE_PER_USER

## Geo
- GEO_COUNTRY_HEADER

## Supabase Auth
- SUPABASE_URL
- SUPABASE_PUBLISHABLE_KEY
- SUPABASE_JWKS_URL (optional)
- SUPABASE_AUTH_VERIFY_MODE (auto|jwks|remote)
- SUPABASE_AUTH_REMOTE_VERIFY_CACHE_TTL_SECONDS

## Frontend (Public)
- PUBLIC_SUPABASE_URL
- PUBLIC_SUPABASE_ANON_KEY

## Stripe Billing
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_ID_PLUS
- FRONTEND_BASE_URL

## Newsletter
- NEWSLETTER_EMAIL_ENABLED
- NEWSLETTER_EMAIL_FROM
- NEWSLETTER_EMAIL_FROM_NAME
- NEWSLETTER_BASE_URL
- NEWSLETTER_TOKEN_EXPIRY_HOURS
- NEWSLETTER_WELCOME_ENABLED

## Observability
- CLOUDWATCH_METRICS_ENABLED
- CLOUDWATCH_NAMESPACE
- CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS
- CLOUDWATCH_HIGH_CARDINALITY_METRICS
- TRACING_EXPORTER (xray|otlp|none)
- OTEL_LAMBDA_LAYER_ARN (optional AWS OTel Lambda layer)

## Queues (SQS)
- QUOTE_REFRESH_QUEUE_URL
- QUOTE_REFRESH_DLQ_URL
- QUOTE_REFRESH_QUEUE_MODE (off|shadow|queue)
- EXPORT_JOB_QUEUE_URL
- EXPORT_JOB_QUEUE_MODE (off|shadow|queue)
- PLANE_B_INGEST_FANOUT_QUEUE_URL
- PLANE_B_NOTIFICATIONS_QUEUE_URL
- PLANE_B_OPS_ALERT_QUEUE_URL
- PLANE_B_INGEST_FANOUT_QUEUE_MODE (off|shadow|queue)
- PLANE_B_NOTIFICATIONS_QUEUE_MODE (off|shadow|queue)
- PLANE_B_OPS_ALERT_QUEUE_MODE (off|shadow|queue)
- PLANE_B_B2C_QUEUE_IN_SWEEP (enable enqueue during sweeps)

## Proxy infrastructure (Plane B)
- PROXY_RESIDENTIAL_URL (Tier 1 B2B; residential/ISP proxy endpoint)
- PROXY_DATACENTER_URL (Tier 2 B2B; rotating datacenter proxy endpoint)
- PROXY_RESIDENTIAL_SECRET_ARN (optional; Secrets Manager source)
- PROXY_RESIDENTIAL_SECRET_JSON_KEY (optional; JSON field name for proxy URL)
- PROXY_RESIDENTIAL_SSM_NAME (optional; SSM parameter name)
- PROXY_DATACENTER_SECRET_ARN (optional; Secrets Manager source)
- PROXY_DATACENTER_SECRET_JSON_KEY (optional; JSON field name for proxy URL)
- PROXY_DATACENTER_SSM_NAME (optional; SSM parameter name)

## CI/CD (CodePipeline)
- PIPELINE_CONNECTION_ARN
- PIPELINE_REPO_OWNER
- PIPELINE_REPO_NAME
- PIPELINE_REPO_BRANCH
- PIPELINE_ENABLE_DEPLOY

## Edge Security (WAF/CloudFront)
- ENABLE_CLOUDFRONT (1|true)
- ENABLE_WAF (1|true)
- WAF_ALLOWLIST_IPS (comma-separated CIDRs)
- WAF_BLOCKLIST_IPS (comma-separated CIDRs)
- WAF_ENABLE_BOT_CONTROL (1|true)

## Test-only (optional)
- RUN_BRONZE_GUARDRAIL_TEST

## Appendix B: Plane A Lambda deployment notes

This document covers AWS Lambda-specific optimizations and considerations for the Remit-Scout Plane A API.

## Rate Limiting

### Redis-Based Rate Limiting (Recommended)

The application uses Redis/ElastiCache for distributed rate limiting across Lambda invocations:

- **Location**: `backend/plane-a/src/plugins/rate-limit-redis.ts`
- **Storage**: Redis/ElastiCache
- **Fallback**: In-memory rate limiting (only works within a single Lambda invocation)

### API Gateway Throttling (Alternative)

For production, consider using API Gateway throttling instead of or in addition to application-level rate limiting:

- **Burst Limit**: Maximum requests per second
- **Rate Limit**: Steady-state requests per second
- **Per-Key Throttling**: Throttle by API key or user

**Configuration**:
```yaml
# In CDK or CloudFormation
throttle:
  burstLimit: 5000
  rateLimit: 2000
```

### Rate Limit Configuration

Environment variables:
- `PLANE_A_RATE_LIMIT_MAX`: Maximum requests per window (default: 120)
- `PLANE_A_RATE_LIMIT_WINDOW_MS`: Time window in milliseconds (default: 60000)
- `REDIS_URL`: Redis connection string (required for distributed rate limiting)

## Lambda Timeout Optimization

### Timeout Monitoring

The application monitors request duration and logs warnings:
- **Warning Threshold**: 5 seconds
- **Critical Threshold**: 28 seconds (Lambda max is 30s)

**Location**: `backend/plane-a/src/plugins/timeout-monitor.ts`

### Optimized Routes

#### Quotes Route (`/api/v1/quotes/current`)

- **Refresh Enqueue**: Non-blocking, parallel execution
- **Database Queries**: Optimized with indexes
- **Caching**: TTL cache for frequently accessed data
- **Expected Duration**: < 2 seconds for cached requests

#### Ops Health Routes (`/api/v1/ops/*/health`)

- **Query Optimization**: Single query per provider
- **Limited Corridors**: Uses health corridors subset
- **Expected Duration**: < 1 second

### Heavy Operations

For operations that may exceed Lambda timeout:

1. **Move to Async Jobs**: Use SQS + Lambda for background processing
2. **Pagination**: Break large datasets into smaller chunks
3. **Streaming**: Use response streaming for large payloads (API Gateway HTTP API)

## Payload Size Management

### API Gateway Limits

- **Maximum Response Size**: 10MB
- **Warning Threshold**: 5MB (logged)

**Location**: `backend/plane-a/src/plugins/payload-size.ts`

### Large Response Handling

Routes that may return large payloads:

1. **Pulse Routes**: Consider pagination for large datasets
2. **Providers Route**: Already cached, but monitor size
3. **Quotes Route**: Typically small, but monitor with many providers

### Pagination

For routes that may exceed size limits:

```typescript
// Example pagination pattern
app.get('/api/v1/pulse/data', async (request, reply) => {
  const page = Number(request.query.page) || 1
  const pageSize = Math.min(Number(request.query.pageSize) || 100, 1000)
  const offset = (page - 1) * pageSize
  
  // Fetch paginated data
  const data = await repository.list({ limit: pageSize, offset })
  
  return {
    data,
    pagination: {
      page,
      pageSize,
      total: await repository.count(),
    },
  }
})
```

## Connection Pooling with RDS Proxy

### RDS Proxy Configuration

The application supports RDS Proxy through connection string configuration:

**Environment Variables**:
- `PLANE_A_DB_HOST`: RDS Proxy endpoint
- `PLANE_A_DB_PORT`: Database port (default: 5432)
- `PLANE_A_DB_NAME`: Database name
- `PLANE_A_DB_SECRET_ARN`: Secrets Manager ARN for credentials
- `PGSSLMODE`: SSL mode (should be `require` for RDS Proxy)

**Connection String Format**:
```
postgresql://username:password@proxy-endpoint:5432/dbname?sslmode=require
```

### Pool Configuration

**Location**: `backend/shared/db.ts`

The connection pool is automatically configured:
- **Max Connections**: Defaults to pg Pool defaults (10)
- **Idle Timeout**: Managed by RDS Proxy
- **SSL**: Required for RDS Proxy connections

### Monitoring

Connection pool metrics are tracked:
- **Active Connections**: `db_pool_active_connections`
- **Idle Connections**: `db_pool_idle_connections`
- **Namespace**: `RemitScout`

### Lambda Concurrency

**Important**: Ensure RDS Proxy max connections >= Lambda concurrency

- **Lambda Reserved Concurrency**: Set based on expected load
- **RDS Proxy Max Connections**: Should be 2-3x Lambda concurrency
- **Connection Pool Size**: Should match Lambda concurrency per instance

**Example**:
- Lambda Reserved Concurrency: 100
- RDS Proxy Max Connections: 300
- Pool Max Connections: 10 (per Lambda instance)

## Cold Start Optimization

### Lazy Loading

Heavy initialization is deferred until first use:

- **Repositories**: Created on-demand
- **Services**: Lazy-loaded
- **Redis Client**: Connection deferred until first use

### Warm-Up Strategies

For critical routes, consider:

1. **CloudWatch Events**: Schedule periodic warm-up requests
2. **API Gateway Canary**: Use canary deployments to keep instances warm
3. **Provisioned Concurrency**: For critical routes (cost consideration)

### Initialization Order

1. **Fast**: Config, logging, error handlers
2. **Medium**: Database pools (RDS Proxy handles connection reuse)
3. **Slow**: Redis connection (deferred)

## API Gateway Integration

### CORS Configuration

CORS is configured for API Gateway:

**Environment Variables**:
- `PLANE_A_CORS_ORIGINS`: Allowed origins (comma-separated)
- `PLANE_A_CORS_ALLOW_CREDENTIALS`: Allow credentials (default: true)
- `PLANE_A_CORS_ALLOWED_METHODS`: Allowed methods
- `PLANE_A_CORS_ALLOWED_HEADERS`: Allowed headers

**Headers Added**:
- `Access-Control-Allow-Origin`
- `Access-Control-Allow-Credentials`
- `Access-Control-Allow-Methods`
- `Access-Control-Allow-Headers`

### Error Response Format

All errors follow a consistent format for API Gateway:

```json
{
  "error": "error_code",
  "message": "Human-readable message",
  "details": {}
}
```

**Status Codes**:
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Rate Limit Exceeded
- `500`: Internal Server Error
- `503`: Service Unavailable

### Webhook Route (`/api/billing/webhook`)

**Raw Body Handling**:
- Content-Type parser configured to preserve raw body for Stripe webhook verification
- Body is kept as Buffer for signature verification

**Location**: `backend/plane-a/src/app.ts` (line 117-133)

### API Gateway HTTP API vs REST API

The application works with both:
- **HTTP API**: Recommended (lower latency, lower cost)
- **REST API**: Also supported

**Differences**:
- HTTP API: No stage variables, simpler integration
- REST API: Stage variables, more features

## Environment Detection

The application automatically detects AWS Lambda environment:

```typescript
const isAwsRuntime = Boolean(
  process.env.AWS_EXECUTION_ENV ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.AWS_REGION
)
```

This enables:
- Redis-based rate limiting
- Environment-aware Swagger URLs
- AWS-specific optimizations

## Monitoring and Logging

### CloudWatch Logs

All logs are sent to CloudWatch Logs:
- **Log Group**: `/aws/lambda/remit-scout-plane-a-{env}`
- **Structured Logging**: JSON format
- **Log Levels**: `debug`, `info`, `warn`, `error`

### CloudWatch Metrics

Custom metrics published to `RemitScout` namespace:
- Request duration
- Error rates
- Cache hit rates
- Database query performance

### X-Ray Tracing

Distributed tracing enabled:
- **Service Name**: `plane-a`
- **Sampling**: Configurable via environment variables

## Best Practices

1. **Use RDS Proxy**: Always use RDS Proxy for Lambda database connections
2. **Monitor Timeouts**: Watch for requests > 5 seconds
3. **Payload Size**: Monitor response sizes, use pagination when needed
4. **Rate Limiting**: Use Redis or API Gateway throttling
5. **Cold Starts**: Consider provisioned concurrency for critical routes
6. **Error Handling**: All errors return consistent format
7. **CORS**: Configure CORS for your frontend domains

## Troubleshooting

### Rate Limiting Not Working

- Check Redis connection: `REDIS_URL` environment variable
- Verify Redis is accessible from Lambda (VPC configuration)
- Check CloudWatch Logs for rate limit errors

### Timeout Errors

- Check CloudWatch Logs for slow request warnings
- Review database query performance
- Consider moving heavy operations to async jobs

### Payload Too Large

- Check response size in logs (`X-Response-Size-Bytes` header in dev)
- Implement pagination for large datasets
- Consider response compression

### Connection Pool Exhausted

- Verify RDS Proxy max connections > Lambda concurrency
- Check connection pool metrics
- Review connection pool configuration

## Related Documentation

- **API Versioning**: `backend/README.md` (API Versioning section)
- **Error Handling**: `backend/plane-a/src/plugins/error-handler.ts`
- **Database Migrations**: `README.md` (see internal runbook)
- **CDK Infrastructure**: Appendix C in this document

## Appendix C: CDK Infrastructure

This directory contains the AWS CDK infrastructure code for the Remit-Scout application. It defines all AWS resources including VPC, databases, compute, APIs, frontend, and CI/CD pipelines.

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Node.js** 20+ and **pnpm** installed
3. **AWS CDK CLI** installed: `npm install -g aws-cdk`
4. **CDK Bootstrap** completed for your account/region:
   ```bash
   cdk bootstrap aws://ACCOUNT-ID/REGION
   ```

## Quick Start

```bash
# Install dependencies
pnpm install

# Set AWS account and region
export CDK_DEFAULT_ACCOUNT=123456789012
export CDK_DEFAULT_REGION=us-east-1

# Synthesize CloudFormation template
./scripts/synth.sh dev

# Deploy to dev environment
./scripts/deploy.sh dev latest
```

## Environment Setup

### Required Environment Variables

```bash
export CDK_DEFAULT_ACCOUNT=123456789012  # Your AWS account ID
export CDK_DEFAULT_REGION=us-east-1      # Your AWS region
```

### Context Variables

Context variables can be set via:
1. **Command line**: `-c key=value`
2. **cdk.json**: Add to `context` object
3. **Environment variables**: Some variables fall back to env vars

## Context Variables Reference

### Required Variables

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `env` | string | Environment name (dev, staging, prod) | `dev` |

### Core Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `backendImageTag` | string | `latest` | ECR image tag for backend Docker image |
| `stackVersion` | string | `1.0.0` | Stack version for tracking deployments |

### Database Configuration

#### Plane A Database

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `planeADbSecretArn` | string | Auto-generated | ARN of Secrets Manager secret for Plane A DB |
| `planeADbSecretJsonKey` | string | - | JSON key in secret (e.g., `DATABASE_URL_PLANE_A`) |
| `planeADbSsmName` | string | - | SSM Parameter Store path (e.g., `/remit-scout/dev/plane-a-db-url`) |

#### Plane B Database

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `planeBDbSecretArn` | string | Auto-generated | ARN of Secrets Manager secret for Plane B DB |
| `planeBDbSsmName` | string | - | SSM Parameter Store path (e.g., `/remit-scout/dev/plane-b-db-url`) |

#### Plane C Database

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `planeCDbSecretArn` | string | Auto-generated | ARN of Secrets Manager secret for Plane C DB |
| `planeCDbSecretJsonKey` | string | - | JSON key in secret (e.g., `DATABASE_URL_PLANE_C`) |
| `planeCDbSsmName` | string | - | SSM Parameter Store path (e.g., `/remit-scout/dev/plane-c-db-url`) |

**Note**: If secret ARNs are not provided, the stack uses `remit-scout/{env}/database/master` and builds `DATABASE_URL` at runtime.

### Redis Configuration

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `redisSecretArn` | string | - | ARN of Secrets Manager secret for Redis |
| `redisSecretJsonKey` | string | - | JSON key in secret (e.g., `REDIS_URL`) |
| `redisSsmName` | string | - | SSM Parameter Store path (e.g., `/remit-scout/dev/redis-url`) |

### Proxy Configuration

#### Residential Proxy

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `proxyResidentialSecretArn` | string | - | ARN of Secrets Manager secret for residential proxy |
| `proxyResidentialSecretJsonKey` | string | - | JSON key in secret |
| `proxyResidentialSsmName` | string | - | SSM Parameter Store path |
| `proxyResidentialUrl` | string | - | Residential proxy URL |

#### Datacenter Proxy

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `proxyDatacenterSecretArn` | string | - | ARN of Secrets Manager secret for datacenter proxy |
| `proxyDatacenterSecretJsonKey` | string | - | JSON key in secret |
| `proxyDatacenterSsmName` | string | - | SSM Parameter Store path |
| `proxyDatacenterUrl` | string | - | Datacenter proxy URL |

### Queue Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `planeBIngestFanoutMode` | string | `off` (dev), `queue` (prod) | Ingest fanout queue mode: `off`, `queue`, `shadow` |
| `planeBNotificationsMode` | string | `off` (dev), `queue` (prod) | Notifications queue mode: `off`, `queue`, `shadow` |
| `planeBOpsAlertsMode` | string | `off` (dev), `queue` (prod) | Ops alerts queue mode: `off`, `queue`, `shadow` |
| `planeBB2cQueueInSweep` | boolean | - | Enable B2C queue in sweep |

### Storage Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `bronzePrefix` | string | `bronze` | S3 prefix for bronze storage |

### API Configuration

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `planeCBaseUrl` | string | - | Base URL for Plane C API |

### CloudFront & WAF Configuration

| Variable | Type | Description |
|----------|------|-------------|
| `enableCloudFront` | boolean | Enable CloudFront distribution for Plane A API |
| `enableWaf` | boolean | Enable WAF for Plane A API |
| `wafAllowListIps` | string[] | List of IP addresses to allow in WAF |
| `wafBlockListIps` | string[] | List of IP addresses to block in WAF |
| `wafEnableBotControl` | boolean | Enable AWS WAF bot control |

### Authentication Configuration

#### Plane A JWT Auth

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `enablePlaneAJwtAuth` | boolean | Enable JWT authentication for Plane A |
| `planeAJwtIssuer` | string | JWT issuer URL | `https://xxx.supabase.co/auth/v1` |
| `planeAJwtAudiences` | string[] | JWT audience values | `["authenticated", "https://remit-scout.com"]` |

#### Plane C IAM Auth

| Variable | Type | Description |
|----------|------|-------------|
| `enablePlaneCIamAuth` | boolean | Enable IAM authentication for Plane C |
| `disablePlaneCExecuteEndpoint` | boolean | Disable execute endpoint for Plane C |

### Throttling Configuration

| Variable | Type | Description |
|----------|------|-------------|
| `planeAThrottleRate` | number | Throttle rate for Plane A API (requests per second) |
| `planeAThrottleBurst` | number | Throttle burst for Plane A API |
| `planeCThrottleRate` | number | Throttle rate for Plane C API (requests per second) |
| `planeCThrottleBurst` | number | Throttle burst for Plane C API |

### Observability Configuration

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `otelLambdaLayerArn` | string | ARN of OpenTelemetry Lambda layer | `arn:aws:lambda:region:account:layer:otel:1` |

### CI/CD Pipeline Configuration

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `pipelineConnectionArn` | string | ARN of CodeStar Connections connection | `arn:aws:codestar-connections:region:account:connection/xxx` |
| `pipelineRepoOwner` | string | GitHub repository owner | `remit-scout` |
| `pipelineRepoName` | string | GitHub repository name | `remit-scout` |
| `pipelineRepoBranch` | string | `main` | GitHub repository branch |
| `pipelineEnableDeploy` | boolean | Enable deployment stage in pipeline |

### Custom Domain Configuration

#### Plane A API Domain

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `planeADomainName` | string | Custom domain name for Plane A API | `api.remit-scout.com` |
| `planeACertificateArn` | string | ACM certificate ARN | `arn:aws:acm:region:account:certificate/xxx` |
| `planeAHostedZoneId` | string | Route53 hosted zone ID | `Z1234567890ABC` |
| `planeAHostedZoneName` | string | Route53 hosted zone name | `remit-scout.com` |

#### Frontend Domain

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `frontendDomainName` | string | Custom domain name for frontend | `remit-scout.com` |
| `frontendCertificateArn` | string | ACM certificate ARN | `arn:aws:acm:region:account:certificate/xxx` |
| `frontendHostedZoneId` | string | Route53 hosted zone ID | `Z1234567890ABC` |
| `frontendHostedZoneName` | string | Route53 hosted zone name | `remit-scout.com` |

**Note**: Custom domain configuration is optional but recommended for production.

### Alerting Configuration

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `slackWebhookUrl` | string | Slack webhook URL for alert notifications | `https://hooks.slack.com/services/...` |
| `pagerDutyIntegrationKey` | string | PagerDuty integration key for critical alerts | `xxx` |

**Note**: Alerting configuration is optional. If not provided, alarms will still be created but won't send notifications.

## Usage Examples

### Development Environment

```bash
# Synthesize
pnpm cdk synth -c env=dev

# Deploy
pnpm cdk deploy -c env=dev -c backendImageTag=latest
```

### Staging Environment

```bash
# With custom domain
pnpm cdk deploy \
  -c env=staging \
  -c backendImageTag=v1.2.3 \
  -c planeADomainName=api-staging.remit-scout.com \
  -c planeACertificateArn=arn:aws:acm:us-east-1:123456789012:certificate/xxx \
  -c planeAHostedZoneId=Z1234567890ABC \
  -c planeAHostedZoneName=remit-scout.com
```

### Production Environment

```bash
# Full production deployment with all features
pnpm cdk deploy \
  -c env=prod \
  -c backendImageTag=v1.2.3 \
  -c enableCloudFront=true \
  -c enableWaf=true \
  -c enablePlaneAJwtAuth=true \
  -c planeAJwtIssuer=https://xxx.supabase.co/auth/v1 \
  -c planeADomainName=api.remit-scout.com \
  -c planeACertificateArn=arn:aws:acm:us-east-1:123456789012:certificate/xxx \
  -c planeAHostedZoneId=Z1234567890ABC \
  -c planeAHostedZoneName=remit-scout.com \
  -c frontendDomainName=remit-scout.com \
  -c frontendCertificateArn=arn:aws:acm:us-east-1:123456789012:certificate/yyy \
  -c frontendHostedZoneId=Z1234567890ABC \
  -c frontendHostedZoneName=remit-scout.com \
  -c slackWebhookUrl=https://hooks.slack.com/services/... \
  -c pagerDutyIntegrationKey=xxx \
  --require-approval never
```

## Deployment Scripts

### Synthesis Script

```bash
./scripts/synth.sh [env] [backendImageTag]
```

Example:
```bash
./scripts/synth.sh dev latest
```

### Deployment Script

```bash
./scripts/deploy.sh [env] [backendImageTag] [approval]
```

Example:
```bash
./scripts/deploy.sh dev latest never
```

The deployment script:
- Validates AWS account and region are set
- Validates context variables
- Prompts for confirmation in production
- Deploys the stack

## Context Validation

The CDK app validates context variables against `cdk.context.schema.json`. Validation errors will prevent deployment.

### Validation Rules

1. **Required variables** must be present
2. **Type checking**: Variables must match their schema types
3. **Enum validation**: Variables with enum values must be one of the allowed values
4. **Production warnings**: Production environment should have custom domain configuration

### Viewing Validation Errors

```bash
pnpm cdk synth -c env=dev
```

Validation errors are displayed before synthesis.

## File Structure

```
cdk/
├── bin/
│   └── app.ts              # CDK app entry point
├── lib/
│   ├── remit-scout-stack.ts    # Main stack
│   ├── context-validator.ts    # Context validation
│   ├── api.ts                  # API Gateway resources
│   ├── frontend.ts             # Frontend resources
│   ├── database.ts             # Database resources
│   ├── cache.ts                # Redis resources
│   ├── compute.ts              # ECS resources
│   ├── storage.ts              # S3 resources
│   ├── queues.ts               # SQS resources
│   └── ...                     # Other resources
├── scripts/
│   ├── synth.sh                # Synthesis script
│   └── deploy.sh               # Deployment script
├── cdk.json                    # CDK configuration
├── cdk.context.json            # CDK context cache (committed)
├── cdk.context.schema.json    # Context variable schema
├── .gitignore                  # Git ignore rules
└── README.md                   # Merged into Appendix C
```

## Common Tasks

### View Stack Diff

```bash
pnpm cdk diff -c env=dev
```

### Destroy Stack

```bash
pnpm cdk destroy -c env=dev
```

### List Stacks

```bash
pnpm cdk list -c env=dev
```

### Watch Mode

```bash
pnpm cdk watch -c env=dev
```

## Troubleshooting

### Context Validation Errors

If you see context validation errors:
1. Check `cdk.context.schema.json` for allowed values
2. Verify variable types match the schema
3. Ensure required variables are set

### Missing Account/Region

If you see "CDK_DEFAULT_ACCOUNT and CDK_DEFAULT_REGION must be set":
```bash
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
export CDK_DEFAULT_REGION=$(aws configure get region)
```

### Bootstrap Issues

If you see bootstrap errors:
```bash
cdk bootstrap aws://ACCOUNT-ID/REGION
```

## Best Practices

1. **Always validate before deploying**: Use `synth.sh` to validate context
2. **Use version tags**: Set `backendImageTag` to specific versions, not `latest`
3. **Custom domains for production**: Always configure custom domains for prod
4. **Review diffs**: Use `cdk diff` before deploying
5. **Use deployment scripts**: Use provided scripts for consistent deployments
6. **Keep context.json**: Commit `cdk.context.json` for reproducible builds

## Security Notes

- Never commit secrets or credentials
- Use Secrets Manager or SSM Parameter Store for sensitive values
- Review IAM permissions before deploying
- Enable WAF for production APIs
- Use HTTPS-only (enforced by CloudFront)

## Support

For issues or questions:
1. Check the validation errors in synthesis output
2. Review the context schema: `cdk.context.schema.json`
3. Check AWS CDK documentation
4. Review stack-specific documentation in `lib/` directory

## Appendix D: Monitoring Queries and Dashboards

## CloudWatch Metrics Queries for SLO Monitoring

This document contains CloudWatch Metrics queries for monitoring Service Level Objectives (SLOs) and data health metrics. All custom metrics are published to the `RemitScout` namespace.

### Accessing CloudWatch Metrics

#### Via AWS Console
1. Navigate to **CloudWatch** → **Metrics** → **All metrics**
2. Select namespace: **RemitScout**
3. Filter by metric name or dimensions

#### Via AWS CLI
```bash
aws cloudwatch list-metrics --namespace RemitScout
aws cloudwatch get-metric-statistics \
  --namespace RemitScout \
  --metric-name data_freshness_age_minutes \
  --dimensions Name=priority_tier,Value=tier_1_alpha \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 300 \
  --statistics Average,Maximum
```

#### Via CloudWatch Insights (Logs)
For log-based metrics, use CloudWatch Logs Insights:
```
fields @timestamp, @message
| filter @message like /data_freshness/
| stats avg(freshness_minutes) by bin(5m)
```

### Freshness SLO

**SLO**: Tier 1 corridors should have p95 freshness ≤ 15 minutes

#### CloudWatch Metric Query
**Metric Name**: `data_freshness_age_minutes`  
**Namespace**: `RemitScout`  
**Dimensions**: `priority_tier=tier_1_alpha`  
**Statistic**: `p95` (or `Average`, `Maximum`)  
**Period**: `5 minutes`

#### CloudWatch Dashboard Widget JSON
```json
{
  "metrics": [
    ["RemitScout", "data_freshness_age_minutes", {
      "priority_tier": "tier_1_alpha"
    }, {
      "stat": "p95",
      "label": "Tier 1 Freshness (p95)"
    }]
  ],
  "period": 300,
  "view": "timeSeries",
  "stacked": false,
  "yAxis": {
    "left": {
      "min": 0,
      "max": 30
    }
  }
}
```

#### CloudWatch Alarm Threshold
- **Threshold**: `15` minutes
- **Comparison**: `GreaterThanThreshold`
- **Evaluation Periods**: `1`
- **Datapoints to Alarm**: `1`

### Quote Success Rate SLO

**SLO**: ≥ 98% success rate for Tier 1 corridors

#### CloudWatch Metric Query
**Metric Name**: `quote_success_rate`  
**Namespace**: `RemitScout`  
**Dimensions**: `priority_tier=tier_1_alpha`  
**Statistic**: `Average`  
**Period**: `10 minutes`

#### CloudWatch Dashboard Widget JSON
```json
{
  "metrics": [
    ["RemitScout", "quote_success_rate", {
      "priority_tier": "tier_1_alpha"
    }, {
      "stat": "Average",
      "label": "Quote Success Rate"
    }]
  ],
  "period": 600,
  "view": "timeSeries",
  "stacked": false,
  "yAxis": {
    "left": {
      "min": 0,
      "max": 1
    }
  }
}
```

#### CloudWatch Alarm Threshold
- **Threshold**: `0.98` (98%)
- **Comparison**: `LessThanThreshold`
- **Evaluation Periods**: `1`
- **Datapoints to Alarm**: `1`

### Provider Coverage SLO

**SLO**: ≥ 3 providers for Tier 1 corridors

#### CloudWatch Metric Query
**Metric Name**: `provider_coverage_count`  
**Namespace**: `RemitScout`  
**Dimensions**: `priority_tier=tier_1_alpha`  
**Statistic**: `Minimum` (or `Average`)  
**Period**: `5 minutes`

#### CloudWatch Dashboard Widget JSON
```json
{
  "metrics": [
    ["RemitScout", "provider_coverage_count", {
      "priority_tier": "tier_1_alpha"
    }, {
      "stat": "Minimum",
      "label": "Min Provider Coverage"
    }]
  ],
  "period": 300,
  "view": "timeSeries",
  "stacked": false,
  "yAxis": {
    "left": {
      "min": 0,
      "max": 10
    }
  }
}
```

#### CloudWatch Alarm Threshold
- **Threshold**: `3` providers
- **Comparison**: `LessThanThreshold`
- **Evaluation Periods**: `1`
- **Datapoints to Alarm**: `1`

### Gold Export Lag SLO

#### Intraday Export (≤ 15 minutes)

**SLO**: Gold publisher job should complete within 15 minutes

#### CloudWatch Metric Query
**Metric Name**: `gold_publisher_job_last_success_age_seconds`  
**Namespace**: `RemitScout`  
**Statistic**: `Maximum`  
**Period**: `5 minutes`

#### CloudWatch Alarm Threshold
- **Threshold**: `900` seconds (15 minutes)
- **Comparison**: `GreaterThanThreshold`
- **Evaluation Periods**: `1`
- **Datapoints to Alarm**: `1`

#### Daily Export (≤ 2 hours)

**SLO**: Daily batch jobs should complete within 2 hours

#### CloudWatch Metric Query
**Metric Name**: `gold_publisher_job_last_success_age_seconds`  
**Namespace**: `RemitScout`  
**Statistic**: `Maximum`  
**Period**: `10 minutes`

#### CloudWatch Alarm Threshold
- **Threshold**: `7200` seconds (2 hours)
- **Comparison**: `GreaterThanThreshold`
- **Evaluation Periods**: `1`
- **Datapoints to Alarm**: `1`

### Batch Job Health

#### Job Duration (p95)

**Metric Names**:
- `gold_popular_corridors_job_duration_seconds`
- `gold_fx_rates_job_duration_seconds`
- `gold_pulse_cache_job_duration_seconds`
- `gold_publisher_job_duration_seconds`

**Namespace**: `RemitScout`  
**Statistic**: `p95` (or `Average`, `Maximum`)  
**Period**: `5 minutes`

#### CloudWatch Dashboard Widget JSON (All Jobs)
```json
{
  "metrics": [
    ["RemitScout", "gold_popular_corridors_job_duration_seconds", {}, {
      "stat": "p95",
      "label": "Popular Corridors (p95)"
    }],
    ["RemitScout", "gold_fx_rates_job_duration_seconds", {}, {
      "stat": "p95",
      "label": "FX Rates (p95)"
    }],
    ["RemitScout", "gold_pulse_cache_job_duration_seconds", {}, {
      "stat": "p95",
      "label": "Pulse Cache (p95)"
    }],
    ["RemitScout", "gold_publisher_job_duration_seconds", {}, {
      "stat": "p95",
      "label": "Publisher (p95)"
    }]
  ],
  "period": 300,
  "view": "timeSeries",
  "stacked": false
}
```

#### Job Failure Rate

**Metric Names**:
- `gold_popular_corridors_job_failures_total`
- `gold_fx_rates_job_failures_total`
- `gold_pulse_cache_job_failures_total`
- `gold_publisher_job_failures_total`

**Namespace**: `RemitScout`  
**Statistic**: `Sum` (count of failures)  
**Period**: `5 minutes`

#### CloudWatch Alarm Threshold
- **Threshold**: `0` (any failure triggers alarm)
- **Comparison**: `GreaterThanThreshold`
- **Evaluation Periods**: `1`
- **Datapoints to Alarm**: `1`

#### Job Throughput

**Metric Names**:
- `gold_popular_corridors_job_rows_processed_total`
- `gold_fx_rates_job_rates_processed_total`
- `gold_pulse_cache_job_entries_processed_total`

**Namespace**: `RemitScout`  
**Statistic**: `Sum` (total processed)  
**Period**: `5 minutes`

**Note**: To calculate rate (items/second), use CloudWatch Math:
```
SUM([metric]) / PERIOD(metric)
```

### Lambda Function Metrics

#### Lambda Errors
**Namespace**: `AWS/Lambda`  
**Metric Name**: `Errors`  
**Dimensions**: `FunctionName=<function-name>`  
**Statistic**: `Sum`

#### Lambda Duration
**Namespace**: `AWS/Lambda`  
**Metric Name**: `Duration`  
**Dimensions**: `FunctionName=<function-name>`  
**Statistic**: `p95`, `p99`, `Average`

#### Lambda Throttles
**Namespace**: `AWS/Lambda`  
**Metric Name**: `Throttles`  
**Dimensions**: `FunctionName=<function-name>`  
**Statistic**: `Sum`

### ECS Service Metrics

#### ECS CPU Utilization
**Namespace**: `AWS/ECS`  
**Metric Name**: `CPUUtilization`  
**Dimensions**: 
- `ServiceName=<service-name>`
- `ClusterName=<cluster-name>`

**Statistic**: `Average`, `Maximum`

#### ECS Memory Utilization
**Namespace**: `AWS/ECS`  
**Metric Name**: `MemoryUtilization`  
**Dimensions**: 
- `ServiceName=<service-name>`
- `ClusterName=<cluster-name>`

**Statistic**: `Average`, `Maximum`

### RDS/Aurora Metrics

#### Database CPU
**Namespace**: `AWS/RDS`  
**Metric Name**: `CPUUtilization`  
**Dimensions**: `DBClusterIdentifier=<cluster-id>`

#### Database Connections
**Namespace**: `AWS/RDS`  
**Metric Name**: `DatabaseConnections`  
**Dimensions**: `DBClusterIdentifier=<cluster-id>`

### ElastiCache/Redis Metrics

#### Redis CPU
**Namespace**: `AWS/ElastiCache`  
**Metric Name**: `CPUUtilization`  
**Dimensions**: `ReplicationGroupId=<replication-group-id>`

#### Redis Memory
**Namespace**: `AWS/ElastiCache`  
**Metric Name**: `DatabaseMemoryUsagePercentage`  
**Dimensions**: `ReplicationGroupId=<replication-group-id>`

### SQS Queue Metrics

#### Queue Depth
**Namespace**: `AWS/SQS`  
**Metric Name**: `ApproximateNumberOfMessagesVisible`  
**Dimensions**: `QueueName=<queue-name>`

#### DLQ Depth
**Namespace**: `AWS/SQS`  
**Metric Name**: `ApproximateNumberOfMessagesVisible`  
**Dimensions**: `QueueName=<queue-name>-dlq`

### Custom Metric Publishing

Custom metrics are published via `backend/shared/cloudwatch-metrics.ts`:

```typescript
import { recordCloudWatchMetric } from './shared/cloudwatch-metrics'

recordCloudWatchMetric({
  name: 'data_freshness_age_minutes',
  value: 12.5,
  unit: 'None',
  dimensions: {
    priority_tier: 'tier_1_alpha',
    corridor_id: 'USD-EUR',
  },
})
```

### Metric Naming Conventions

- **Custom Metrics**: Use snake_case (e.g., `data_freshness_age_minutes`)
- **AWS Metrics**: Use AWS standard names (e.g., `CPUUtilization`)
- **Dimensions**: Use lowercase with underscores (e.g., `priority_tier`, `corridor_id`)
- **Namespace**: Always `RemitScout` for custom metrics

### Best Practices

1. **Period Selection**: Use 5-minute periods for most metrics, 1-minute for high-frequency alerts
2. **Statistic Selection**: 
   - Use `p95` or `p99` for latency/freshness SLOs
   - Use `Average` for rates and percentages
   - Use `Sum` for counts and totals
   - Use `Minimum`/`Maximum` for bounds checking
3. **Alarm Evaluation**: Use 1-2 evaluation periods for critical alerts, 3+ for warning alerts
4. **Missing Data**: Use `TreatMissingData: NOT_BREACHING` for optional metrics, `BREACHING` for required metrics



## Prometheus Queries for SLO Monitoring

This document contains PromQL queries for monitoring Service Level Objectives (SLOs) and data health metrics.

### Freshness SLO

**SLO**: Tier 1 corridors should have p95 freshness ≤ 15 minutes

```promql
histogram_quantile(0.95, 
  data_freshness_age_minutes{priority_tier="tier_1_alpha"}
) <= 15
```

**Alternative**: Get actual p95 value
```promql
histogram_quantile(0.95, 
  data_freshness_age_minutes{priority_tier="tier_1_alpha"}
)
```

### Quote Success Rate SLO

**SLO**: ≥ 98% success rate for Tier 1 corridors

```promql
avg(quote_success_rate{priority_tier="tier_1_alpha"}) >= 0.98
```

**Alternative**: Get actual average success rate
```promql
avg(quote_success_rate{priority_tier="tier_1_alpha"})
```

### Provider Coverage SLO

**SLO**: ≥ 3 providers for Tier 1 corridors

```promql
min(provider_coverage_count{priority_tier="tier_1_alpha"}) >= 3
```

**Alternative**: Get minimum coverage
```promql
min(provider_coverage_count{priority_tier="tier_1_alpha"})
```

### Gold Export Lag SLO

#### Intraday Export (≤ 15 minutes)

**SLO**: Gold publisher job should complete within 15 minutes

```promql
(time() - gold_publisher_job_last_success_timestamp) / 60 <= 15
```

**Alternative**: Get actual lag in minutes
```promql
(time() - gold_publisher_job_last_success_timestamp) / 60
```

#### Daily Export (≤ 2 hours)

**SLO**: Daily batch jobs should complete within 2 hours

```promql
(time() - gold_publisher_job_last_success_timestamp) / 3600 <= 2
```

### Batch Job Health

#### Job Duration (p95)

```promql
histogram_quantile(0.95, gold_popular_corridors_job_duration_seconds)
histogram_quantile(0.95, gold_fx_rates_job_duration_seconds)
histogram_quantile(0.95, gold_pulse_cache_job_duration_seconds)
histogram_quantile(0.95, gold_publisher_job_duration_seconds)
```

#### Job Failure Rate

```promql
rate(gold_popular_corridors_job_failures_total[5m])
rate(gold_fx_rates_job_failures_total[5m])
rate(gold_pulse_cache_job_failures_total[5m])
rate(gold_publisher_job_failures_total[5m])
```

#### Job Throughput

```promql
rate(gold_popular_corridors_job_rows_processed_total[5m])
rate(gold_fx_rates_job_rates_processed_total[5m])
rate(gold_pulse_cache_job_entries_processed_total[5m])
```




## CloudWatch Dashboard Configuration

**⚠️ MIGRATION NOTE**: This document has been updated for AWS-native deployment. Grafana/Prometheus dashboards are deprecated. All monitoring now uses **CloudWatch Dashboards** defined in `infrastructure/cdk/lib/monitoring.ts`.

### CloudWatch Dashboards

CloudWatch Dashboards are automatically created by CDK and named: `remit-scout-{env}` (e.g., `remit-scout-prod`).

#### Accessing Dashboards

1. **AWS Console**: CloudWatch → Dashboards → `remit-scout-{env}`
2. **AWS CLI**: `aws cloudwatch get-dashboard --dashboard-name remit-scout-{env}`
3. **CDK**: Defined in `infrastructure/cdk/lib/monitoring.ts`

#### Dashboard Widgets

The CDK creates the following widgets:
- SQS Queue Depth
- SQS DLQ Depth
- Lambda Errors
- API Gateway Latency (p95)
- ECS CPU Utilization
- ECS Memory Utilization
- Aurora CPU & Connections
- Redis CPU

#### Custom Metrics

Custom metrics are published to the `RemitScout` namespace. See the CloudWatch section above for query examples.

---

### Legacy Grafana Dashboard Configuration (Deprecated)

<details>
<summary>Click to expand legacy Grafana configuration (for reference only)</summary>

This section describes the previous Grafana dashboard structure. **Do not use** - it is provided for reference only.

### Dashboard: Data Health SLO

#### Panel 1: Tier 1 Freshness (p95) - Single Stat

**Title**: Tier 1 Freshness (p95)

**Query**:
```promql
histogram_quantile(0.95, data_freshness_age_minutes{priority_tier="tier_1_alpha"})
```

**Visualization**: Stat (Single Stat)
**Unit**: Minutes
**Thresholds**:
- Green: < 15
- Yellow: 15-20
- Red: > 20

**Description**: Shows p95 data freshness for Tier 1 corridors. Should be < 15 minutes.

---

#### Panel 2: Quote Success Rate - Gauge

**Title**: Quote Success Rate (%)

**Query**:
```promql
avg(quote_success_rate{priority_tier="tier_1_alpha"}) * 100
```

**Visualization**: Gauge
**Unit**: Percent (0-100)
**Thresholds**:
- Green: > 98
- Yellow: 95-98
- Red: < 95

**Description**: Average quote success rate for Tier 1 corridors. Target: ≥ 98%.

---

#### Panel 3: Provider Coverage - Table

**Title**: Provider Coverage by Corridor

**Query**:
```promql
provider_coverage_count{priority_tier="tier_1_alpha"}
```

**Visualization**: Table
**Columns**:
- `corridor_id` (Label)
- `amount_bucket` (Label)
- `Value` (Provider Count)

**Description**: Shows provider coverage count per corridor and amount bucket.

---

#### Panel 4: Freshness Trend - Time Series

**Title**: Freshness Trend (Last 24h)

**Query**:
```promql
data_freshness_age_minutes{priority_tier="tier_1_alpha"}
```

**Visualization**: Time Series
**Unit**: Minutes
**Legend**: `{{corridor_id}} - {{provider_id}}`

**Description**: Time series showing freshness age over the last 24 hours, grouped by corridor and provider.

---

### Dashboard: Batch Job Health

#### Panel 1: Job Last Success Time - Table

**Title**: Last Success Timestamp

**Query**:
```promql
gold_popular_corridors_job_last_success_timestamp
gold_fx_rates_job_last_success_timestamp
gold_pulse_cache_job_last_success_timestamp
gold_publisher_job_last_success_timestamp
```

**Visualization**: Table
**Format**: Time Series
**Columns**:
- `__name__` (Metric Name)
- `Value` (Unix Timestamp, formatted as time)

**Description**: Shows the last successful execution time for each batch job.

---

#### Panel 2: Job Duration (p95) - Bar Gauge

**Title**: Job Duration (p95)

**Query**:
```promql
histogram_quantile(0.95, gold_popular_corridors_job_duration_seconds)
histogram_quantile(0.95, gold_fx_rates_job_duration_seconds)
histogram_quantile(0.95, gold_pulse_cache_job_duration_seconds)
histogram_quantile(0.95, gold_publisher_job_duration_seconds)
```

**Visualization**: Bar Gauge
**Unit**: Seconds
**Thresholds**:
- Green: < 60
- Yellow: 60-300
- Red: > 300

**Description**: p95 execution duration for each batch job.

---

#### Panel 3: Job Failures - Time Series

**Title**: Job Failures Over Time

**Query**:
```promql
rate(gold_popular_corridors_job_failures_total[5m])
rate(gold_fx_rates_job_failures_total[5m])
rate(gold_pulse_cache_job_failures_total[5m])
rate(gold_publisher_job_failures_total[5m])
```

**Visualization**: Time Series
**Unit**: Failures/sec
**Legend**: `{{__name__}}`

**Description**: Failure rate over time for each batch job.

---

#### Panel 4: Job Throughput - Time Series

**Title**: Job Throughput

**Query**:
```promql
rate(gold_popular_corridors_job_rows_processed_total[5m])
rate(gold_fx_rates_job_rates_processed_total[5m])
rate(gold_pulse_cache_job_entries_processed_total[5m])
```

**Visualization**: Time Series
**Unit**: Items/sec
**Legend**: `{{__name__}}`

**Description**: Processing throughput for batch jobs.

---

### Dashboard Variables (Optional)

Add these variables to enable filtering:

- **`job_name`**: `gold_popular_corridors_job`, `gold_fx_rates_job`, `gold_pulse_cache_job`, `gold_publisher_job`
- **`priority_tier`**: `tier_1_alpha`, `tier_2_reference`, `tier_3_discovery`
- **`corridor_id`**: Label values from `data_freshness_age_minutes`

</details>

### CloudWatch Dashboard Customization

To add custom widgets to the CloudWatch Dashboard, edit `infrastructure/cdk/lib/monitoring.ts`:

```typescript
const customWidget = new GraphWidget({
  title: 'Custom Metric',
  left: [
    new Metric({
      namespace: 'RemitScout',
      metricName: 'your_metric_name',
      statistic: 'Average',
      period: Duration.minutes(5),
    }),
  ],
})

dashboard.addWidgets(customWidget)
```

After updating, redeploy the CDK stack:
```bash
cd infrastructure/cdk
npm run cdk deploy
```

### Monitoring Documentation

- **CloudWatch Queries**: This document (CloudWatch section)
- **CloudWatch Alarms**: Defined in `infrastructure/cdk/lib/monitoring.ts`
- **SLO Tracking**: See `backend/shared/slo-tracker.ts` for metric publishing
- **Custom Metrics**: See `backend/shared/cloudwatch-metrics.ts` for publishing API

### Accessing Custom Metrics

All custom metrics are in the `RemitScout` namespace:

1. **AWS Console**: CloudWatch → Metrics → All metrics → RemitScout
2. **Metric Names**:
   - `data_freshness_age_minutes`
   - `quote_success_rate`
   - `provider_coverage_count`
   - `gold_*_job_*` (batch job metrics)

See the CloudWatch section above for detailed query examples.

## Appendix E: Runtime Guardrails

This document describes the runtime controls that must enforce the Golden Rule beyond lint.
Plane A must not be able to access Bronze storage at runtime.

## Required Infrastructure Controls
- **IAM Deny:** Plane A roles must have an explicit deny for Bronze resources (S3 buckets, KMS keys, database credentials).
- **VPC Segmentation:** Plane A services should have no network path to Bronze subnets or endpoints.
- **Security Groups:** Only Plane B roles and subnets should be permitted to reach Bronze storage endpoints.

## Guardrail Integration Test
Use the script in `backend/scripts/bronze-access-check.js` to verify Plane A cannot access Bronze.

### Usage
- Set `BRONZE_TEST_URL` to a Bronze endpoint that should be denied for Plane A.
- Optionally set `BRONZE_EXPECT_STATUS` (default `403`).

Example:
```
BRONZE_TEST_URL=https://bronze.example.internal/health \
BRONZE_EXPECT_STATUS=401,403 \
pnpm -C backend guardrail:test
```

A passing result confirms that Plane A cannot access Bronze at runtime. Any 200-level response is a failure and must be treated as a security regression.

## Database Guardrail Test (Plane A)
The Vitest guardrail in `backend/tests/guardrails.test.ts` ensures the Plane A DB user cannot read Bronze.

### Usage
```
RUN_BRONZE_GUARDRAIL_TEST=1 \
DATABASE_URL_PLANE_A=postgres://plane_a:plane_a@localhost:5432/remit \
pnpm -C backend test
```

The test passes only when the Plane A role receives a permission error for `bronze.provider_raw`.

## Appendix F: SLO Targets
Definition: 95th percentile response time for search and compare endpoints stays under 200ms. Measurement: capture request latency from Plane A logs and compute p95 for /api/quotes/current and /api/popular-corridors (monitoring TBD).

## Tier-1 freshness <=15m
Definition: for Tier-1 corridors, the latest quote age is no more than 15 minutes. Measurement: compute NOW() - collected_at from the latest quote records in Silver (monitoring TBD).

## Tier-3 freshness <=4h
Definition: for Tier-3 corridors, the latest quote age is no more than 4 hours. Measurement: compute NOW() - collected_at from the latest quote records in Silver (monitoring TBD).

## Derived coverage >=3 providers
Definition: any derived output exposed externally must have contributions from at least 3 providers. Measurement: enforce in publisher gates and record contributor_count per dataset (monitoring TBD).
