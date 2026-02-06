# Backend Baseline (Entrypoints + Stack)

Feedback source: chat transcript

Goal: evidence-based baseline of backend stack/runtime, service topology, entrypoints/routes, datastores/migrations, workers/queues/schedules, auth/session model, and observability (so the follow-on “slop audit” and DDD plan are grounded in reality).

Primary reference: `ARCHITECTURE.md` (planes + tier invariants + SLOs).

---

## 1) Language/runtime + repo structure

- **Runtime**: Node.js + TypeScript monorepo.
  - Backend package: `backend/package.json` (build via `tsc -b`, dev via `tsx`).
  - Local dev DB/Redis: `docker-compose.yml` (Postgres 15 + Redis 7).

- **Testing**: `vitest` (`backend/package.json` → `test`/`test:coverage`).

- **Backend “planes” layout**:
  - Plane A (public API): `backend/plane-a/**`
  - Plane B (ingest + workers): `backend/plane-b/**`
  - Plane C (internal publisher API): `backend/plane-c/**`
  - Shared libs: `backend/shared/**`
  - Operational/worker scripts: `backend/scripts/**` and AWS wrappers under `backend/scripts/aws/**`
  - DB migrations: `backend/db/migrations/*.sql`

## 2) Service topology (what runs where)

### Plane A (Public API)

- **Local dev entrypoint**: `backend/plane-a/src/server.ts` (Fastify HTTP server).
- **AWS entrypoint**: `backend/plane-a/src/lambda.ts` (Fastify on Lambda via `@fastify/aws-lambda`).
- **Infra wiring**: API Gateway v2 → Lambda.
  - `infrastructure/cdk/lib/api.ts` creates `PlaneAApiFunction` from `backend/plane-a/src/lambda.ts`.
  - Example: `new NodejsFunction(... entry: ... backend/plane-a/src/lambda.ts ...)` in `infrastructure/cdk/lib/api.ts`.

### Plane B (Ingest + background workers)

- **Core ingest entrypoint**: `backend/plane-b/src/ingest.ts`.
- **Health server (ECS)**: `backend/plane-b/src/health-server.ts` (default port `8080`, endpoints `/healthz`, `/readyz`, `/metrics`).
- **Infra wiring**: ECS/Fargate services + task definitions.
  - Task definitions and commands: `infrastructure/cdk/lib/ecs-tasks.ts` (e.g., `PlaneBIngestContainer` runs `scripts/aws/plane-b-ingest-ecs.ts`).
  - Services and desired counts: `infrastructure/cdk/lib/ecs-services.ts` (e.g., `PlaneBIngestService`, `B2cRefreshWorkerService`, fanout workers, notification workers).

### Plane C (Internal publisher API)

- **Local dev entrypoint**: `backend/plane-c/src/server.ts`.
- **AWS entrypoint**: `backend/plane-c/src/lambda.ts`.
- **Infra wiring**: API Gateway v2 → Lambda.
  - `infrastructure/cdk/lib/api.ts` creates `PlaneCApiFunction` from `backend/plane-c/src/lambda.ts`.
- **Primary route surface** (internal): `backend/plane-c/src/routes/publisher.ts` exposes `POST /internal/publisher/validate`.

## 3) API style + routing layout (Plane A)

- **Framework**: Fastify (`backend/plane-a/src/app.ts`).
- **API style**: REST-ish endpoints registered under both `/api/v1/*` (preferred) and `/api/*` (deprecated).
  - Routes are registered twice in `backend/plane-a/src/app.ts` (once with prefix `/api/v1` and again with `/api`).
  - Backward compatibility + deprecation headers: `backend/plane-a/src/plugins/api-versioning.ts`.

- **Health and metrics endpoints**:
  - `GET /healthz`, `GET /readyz` (checks Postgres + Redis), `GET /metrics` in `backend/plane-a/src/app.ts`.

- **Swagger/OpenAPI**:
  - Plugin: `backend/plane-a/src/plugins/swagger.ts`.
  - Swagger UI route: `/api-docs` (disabled by default in AWS runtime unless `SWAGGER_ENABLED=1`).

## 4) Datastores + migrations

### Postgres (primary system of record)

- **Client**: `pg` via pooled connections (`backend/shared/db.ts`).
- **DB URLs**: `backend/shared/config.ts` → `config.db.{planeAUrl,planeBUrl,planeCUrl}`.
- **Schemas/tiering**:
  - Silver/Gold are concrete Postgres schemas (example: `backend/db/migrations/002_rse_silver_core.sql` creates `silver.*` tables and `gold_export` schema).
  - Tier snapshot seed referenced in architecture: `backend/db/migrations/063_seed_tier_version_0.sql`.

- **Migrations**:
  - Custom migrator: `backend/scripts/db-migrate.ts` (applies `backend/db/migrations/*.sql` and records `public.schema_migrations`).

### Redis (cache + rate limiting)

- **Config**: `backend/shared/config.ts` → `config.redis.url` (from `REDIS_URL`).
- **Client + health**: `backend/shared/redis.ts` (connect/ping health check, reconnect strategy; detects ElastiCache cluster by hostname).
- **Plane A usage**:
  - `/readyz` checks Redis ping in `backend/plane-a/src/app.ts`.
  - Rate limiting uses Redis in AWS runtime when available: `backend/plane-a/src/app.ts` (falls back to in-memory rate limiting for local/dev).

### S3 (bronze payloads + exports + audit logs)

- **Runtime config**: `backend/shared/config.ts` → `config.storage.bronze/exports` and `config.auditLogs.*`.
- **AWS buckets**: `infrastructure/cdk/lib/storage.ts` creates:
  - `remit-scout-bronze-<env>`
  - `remit-scout-exports-<env>`
  - `remit-scout-user-assets-<env>`
  - `remit-scout-audit-logs-<env>`

## 5) Queues, workers, schedules

### SQS queues (async processing backbone)

- **Queue declarations + DLQs**: `infrastructure/cdk/lib/queues.ts`.
  - Examples: `quote-refresh`, `fx-rate-refresh`, `export-job`, `alert-evaluation`, `ingest-fanout` (+ tier2), `gold-live`, `notifications`, `ops-alerts`.
- **Runtime config**: `backend/shared/config.ts` → `config.queues.*`.
- **Client implementation**: `backend/shared/sqs.ts` (send/receive/batch, DLQ helpers, visibility extension, and CloudWatch queue depth metrics).

### ECS/Fargate workers (Plane B)

- **Task definitions and commands**: `infrastructure/cdk/lib/ecs-tasks.ts`.
  - Plane B ingest runs `backend/scripts/aws/plane-b-ingest-ecs.ts`.
  - Worker catalog exists under `backend/scripts/aws/*` (mix of ECS tasks and Lambda jobs).

- **Services + desired counts**: `infrastructure/cdk/lib/ecs-services.ts`.
  - Notable: desired counts default to `1` in prod and `0` in dev for several workers (ingest/queue workers).

### EventBridge scheduled jobs (Lambda)

- **Schedules**: `infrastructure/cdk/lib/scheduled-jobs.ts`.
  - Explicitly includes `data-health-slo` job (see `NodejsFunction` for `backend/scripts/aws/data-health-slo-job-lambda.ts`).
  - Multiple “gold” jobs (fx rates, indices, publisher, reconciliation) are also defined here.

## 6) Auth/session model

- **Primary user auth**: Supabase JWT verification.
  - Runtime config: `backend/shared/config.ts` → `config.auth.supabase.*`.
  - Plane A hook verifies JWT on requests: `backend/plane-a/src/plugins/auth-plugin.ts` (calls `verifySupabaseJwt`).

- **API keys (enterprise access)**:
  - `x-api-key` header validated in `backend/plane-a/src/plugins/auth-plugin.ts` (calls `validateApiKey`).
  - Per-key rate limiting uses Redis when available; otherwise falls back to in-memory map in the same file.

- **Sessions**:
  - Session endpoints live in `backend/plane-a/src/routes/sessions.ts`.
  - Sessions are persisted via `SessionRepository` (Postgres pool from `config.db.planeAUrl`).

## 7) Observability (logs, metrics, traces, errors)

- **Structured logging**: JSON logs with AWS context + trace ID in `backend/shared/logger.ts`.

- **Metrics**:
  - Prometheus endpoint via `prom-client`: `backend/shared/api-metrics.ts` exposed at `/metrics` in `backend/plane-a/src/app.ts` and `backend/plane-c/src/app.ts`.
  - CloudWatch metric shipping is built-in: `backend/shared/cloudwatch-metrics.ts` (gated by `config.observability.cloudwatch.enabled` in `backend/shared/config.ts`).

- **Tracing**:
  - OpenTelemetry initialization: `backend/shared/tracing.ts`.
  - Plane A adds spans per request: `backend/plane-a/src/app.ts` (sets `request.span`, records span status by HTTP status).

- **Error tracking**:
  - Sentry integration: `backend/shared/error-tracker.ts` (filters sensitive headers/fields, tags AWS context).

## 8) AWS config + secrets wiring (how runtime env gets populated)

- **Lambda env resolution**:
  - Plane A: `backend/plane-a/src/lambda.ts` resolves DB URL + required env vars from Secrets Manager / SSM via `backend/shared/aws-params.ts`.
  - Plane C: `backend/plane-c/src/lambda.ts` resolves DB URL similarly.

- **CDK stack assembly (high-level)**: `infrastructure/cdk/lib/remit-scout-stack.ts`.
  - Creates VPC, IAM, Aurora Postgres (+ optional proxy), ElastiCache Redis (TLS enabled), S3 buckets, SQS queues, API Gateway + Lambda, ECS services, and scheduled jobs.

## 9) Guardrails that matter to business invariants

- **“Plane A must never read Bronze directly” invariant**: architecture states it; repo has an explicit guardrail script.
  - `backend/scripts/bronze-access-check.js` (CI/dev guardrail, expects `403` by default).

---

## Open questions / items to validate (before major refactors)

1) **Plane A / Plane C Lambda vs ECS**: Lambda is clearly wired in `infrastructure/cdk/lib/api.ts`; confirm there are no parallel ECS deployments for A/C in `infrastructure/cdk/**` that could diverge.
2) **“Source of truth” for secrets**: both Secrets Manager and SSM are supported (see `backend/shared/aws-params.ts` + `infrastructure/cdk/lib/api.ts`). Decide and enforce one for prod to reduce misconfig risk.
3) **Prod toggles** for queue modes and schedules: many workers are conditional on `*_QUEUE_MODE` / `rulesEnabled` (see `backend/shared/config.ts` + `infrastructure/cdk/lib/scheduled-jobs.ts`). Ensure staging mirrors prod behavior for these toggles.

