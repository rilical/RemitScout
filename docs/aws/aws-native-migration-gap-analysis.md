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
- `docs/aws/` - AWS notes and env var hints

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
  - Only `docker-compose.yml` exists (local Postgres). No Dockerfiles found.
  - Kubernetes manifests reference images (`remit-scout-backend:latest`,
    `remit-scout/backend:latest`) but Docker build definitions are missing.
- Runtime entrypoints:
  - Plane A: `backend/plane-a/src/server.ts`
  - Plane B: `backend/plane-b/src/ingest.ts`
  - Plane C: `backend/plane-c/src/server.ts`
  - Batch jobs: `backend/scripts/*.ts` (see below)
- Build:
  - `backend/package.json` -> `tsc -b plane-a plane-c plane-b` generates `dist/`.

AWS gap: need Dockerfiles or Lambda packaging strategy plus ECR/CDK build pipeline.

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
| `backend/scripts/ingest-run.ts` | Manual ingestion run | Postgres | Manual | Optional EventBridge |
| `backend/scripts/db-migrate.ts` | DB migrations | Postgres | Manual | CodeBuild or pre-deploy step |
| `backend/scripts/sql-guardrail.ts` | SQL guardrail/inventory | Repo scan | Manual | CI only |
| `backend/scripts/bronze-access-check.js` | Guardrail test | HTTP | CI / manual | CI or CloudWatch Synthetics |

### Probes and dev utilities

- Probes: `backend/scripts/*-probe.ts`, `backend/scripts/cache-ttl-probe.ts`
  - Scheduled in GitHub Actions (`.github/workflows/probe-health-checks.yml`).
- Dev-only: `backend/scripts/dev/remitly-snapshot.ts`, `backend/scripts/dev/westernunion-observe.ts`.

## 4) API endpoints inventory

### Plane A (public API)

Auth mechanisms:
- Supabase JWT verification and role checks in `backend/plane-a/src/plugins/auth-plugin.ts`.
- Entitlements gate in `backend/plane-a/src/routes/pulse-status.ts`.

| Method | Path | Auth | File | Notes |
|---|---|---|---|---|
| GET | `/api/quotes/current` | Public | `backend/plane-a/src/routes/quotes.ts` | Uses B2C refresh queue and caching |
| GET | `/api/popular-corridors` | Public | `backend/plane-a/src/routes/popular-corridors.ts` | Public cache headers |
| GET | `/api/pulse/status` | Entitlement (`pulse`) | `backend/plane-a/src/routes/pulse-status.ts` | |
| GET | `/api/me` | requireAuth | `backend/plane-a/src/routes/me.ts` | |
| POST | `/api/billing/checkout-session` | requireAuth | `backend/plane-a/src/routes/billing/checkout-session.ts` | |
| POST | `/stripe/create-checkout` | requireAuth | `backend/plane-a/src/routes/billing/checkout-session.ts` | |
| POST | `/api/billing/webhook` | No auth (bypass) | `backend/plane-a/src/routes/billing/webhook.ts` | Stripe webhook |
| POST | `/stripe/verify-session` | requireAuth | `backend/plane-a/src/routes/billing/verify-session.ts` | |
| GET | `/api/billing/portal` | requireAuth | `backend/plane-a/src/routes/billing/portal.ts` | |
| GET | `/api/ops/{provider}/health` | requireAdmin | `backend/plane-a/src/routes/ops/*.ts` | Ops-only endpoints |
| GET | `/healthz` | Public | `backend/plane-a/src/app.ts` | Health |
| GET | `/readyz` | Public | `backend/plane-a/src/app.ts` | DB readiness |
| GET | `/metrics` | Public | `backend/plane-a/src/app.ts` | Prometheus metrics |

### Plane C (internal API)

| Method | Path | Auth | File | Notes |
|---|---|---|---|---|
| POST | `/internal/publisher/validate` | None | `backend/plane-c/src/routes/publisher.ts` | Should be private network / IAM |
| GET | `/healthz` | Public | `backend/plane-c/src/server.ts` | |
| GET | `/readyz` | Public | `backend/plane-c/src/server.ts` | |
| GET | `/metrics` | Public | `backend/plane-c/src/server.ts` | Prometheus metrics |

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
- Plane C: `/healthz`, `/readyz`, `/metrics` in `backend/plane-c/src/server.ts`.
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

- Policies documented in `secrets/README.md` (Secrets Manager + SSM recommended).
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
- SQL seeds reference "seed:S3.0" in `backend/db/migrations/009_provider_seeds.sql`.

AWS gap: implement real S3 integration for Bronze data path.

## Gap summary (by category)

- IaC: None present. Need CDK/Terraform.
- Compute: No AWS deployments or task definitions.
- Scheduling: K8s CronJobs only. Need EventBridge schedules.
- Observability: Prometheus/Jaeger stack in k8s; no CloudWatch/X-Ray.
- Secrets: Policy exists, no runtime integration.
- Queues: SQS integrated for quote refresh and fanout queues. ECS services exist
  for queue workers; queue mode defaults to off.
- Storage: S3 not wired in code.
- CI/CD: GitHub Actions only. No CodePipeline.
- Network: No VPC or IAM modeling in repo.

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
- See `docs/aws/db-queue-to-sqs-migration.md` for the cutover runbook.

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
