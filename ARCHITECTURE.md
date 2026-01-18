# Remit-Scout Architecture Guide (ARCHITECTURE.md)

## Purpose
This file is the primary architecture RAG for future LLMs. It defines system boundaries, data flows, AWS wiring, tiering rules, and operational health checks. Treat this as authoritative unless explicitly superseded.

## How to use this file
- Always read this file before reviewing code or suggesting changes.
- Use file references listed here to anchor reasoning; do not assume missing components.
- When in doubt, prefer correctness, observability, and AWS readiness over local convenience.

## RAG self-healing policy
- Agents must propose updates to this file when they discover fundamentals that affect multiple agents.
- Agent-specific gaps should be updated in the agent’s RAG file instead.
- Apply updates only when edits are authorized; otherwise propose changes for approval.

## System invariants (must not break)
- Plane A never reads Bronze directly.
- All public APIs must validate inputs and return stable schemas.
- Silver is the source of truth for alert evaluations; Gold is the source of truth for aggregates.
- Tier assignments are versioned; history is never rewritten.
- Exports normalize to **$500 USD equivalent** in send currency and include destination equivalents.
- Rights matrix is authoritative: providers must be explicitly eligible for corridor + method.
- A NULL/empty rights-matrix country set must **not** match all corridors.
- Amount buckets must be exact; if no exact bucket exists, enqueue a fresh request (do not reuse an unrelated bucket).
- Method filters must match provider capabilities; do not show unsupported methods.

## Environment model
- **dev**: faster iteration, shorter TTLs, smaller capacity.
- **staging**: parity with prod for networking and security (NAT, WAF/CloudFront), used for pre-release validation.
- **prod**: strict SLOs, zero-risk changes, full auditability.

## Data flow overview
- **Ingest**: Plane B collectors -> Bronze (raw) -> Silver (normalized).
- **Refresh**: B2C requests enqueue refresh -> Plane B refresh workers -> Silver updates.
- **Publish**: Gold jobs aggregate Silver -> Plane C publishes.
- **Serve**: Plane A serves clients, with Redis hot cache for fast reads.
Canonical flow definitions live in the Data lineage table below; treat this as a summary.

## Sweep mechanics (B2B vs B2C)
- **B2C sweeps**: user-initiated refresh requests enqueue SQS; Plane B refresh workers fetch quotes, write Silver, update refresh status, and warm caches.
- **B2B sweeps**: scheduled ingestion (EventBridge -> ECS ingest) runs provider collectors, writes Bronze/Silver, and triggers Gold aggregation on cadence.
- **Storage**: Bronze raw payloads -> Silver normalized quotes -> Gold aggregates (FX history, pulse, popular corridors).

## Readiness gates
- Gold publish gated by provider coverage + quality flags.
- Alerts only fire when corridor coverage and freshness are above thresholds.
- Tier changes only apply to future periods (monthly/quarterly snapshots).

## Cadence tiers (labels vs reality)
- **Tier-1 label** = Tier-2 cadence (3 hours), true 1–2 min is future.
- **Tier-2 label** = Tier-3 cadence (daily).
- **Tier-3 label** = daily aggregates only.

## SLO targets (defaults)
- Dev: p95 API <= 1500ms, freshness <= 60m (tier-3), DLQ = 0.
- Staging: p95 API <= 1000ms, freshness <= 30m (tier-2), DLQ = 0.
- Prod: p95 API <= 800ms, freshness <= tier TTL, DLQ = 0.
- Missing SLO metrics are treated as failed SLOs.

## Volatility computation
- Volatility is derived from FX rate history (OANDA or Gold FX history), not provided as a field.
- Use rolling log-return stddev and/or range-based measures (7d/30d) to assign volatility bands.
- Tier changes are only applied on fixed cadence with versioned tiers and published change logs.

## Architecture quick map
- Plane A (public API): `backend/plane-a/src/server.ts` mounted under `/api/v1` (primary) and `/api` (deprecated compat; see API versioning).
- Plane B (ingestion + collectors): `backend/plane-b/src/ingest.ts` (ECS service) + refresh queue workers.
- Plane C (internal/publisher): `backend/plane-c/src/server.ts` (Lambda/API Gateway).
- Data tiers:
  - Bronze: raw provider payloads (Plane B only).
  - Silver: normalized quotes, refresh queues, corridor metadata.
  - Gold: curated outputs (fx rates, popular corridors, pulse cache, publisher outputs).

## Repo map (top-level)
- `infrastructure/cdk/**`: AWS stacks and wiring.
- `backend/plane-a/**`: public API (Fastify/Lambda).
- `backend/plane-b/**`: collectors + ingestion.
- `backend/plane-c/**`: internal publisher (Lambda).
- `backend/scripts/**`: scheduled jobs + workers.
- `backend/shared/**`: config, DB, cache, metrics, AWS utilities.
- `frontend/**`: Nuxt UI.
- `agents/**`: agent registry + RAG files.

## Local/dev-only assets (not deployed to AWS)
- `frontend/pages/mock-stripe/*` local billing mock flows.

## AWS dev snapshot (last known, us-east-1)
- Last updated: 2026-01-17 (refresh via CloudFormation outputs)
- Stack: `remit-scout-dev`
- Plane A URL: `https://vhugw1jucg.execute-api.us-east-1.amazonaws.com`
- Plane C URL: `https://9z79jztem7.execute-api.us-east-1.amazonaws.com`
- VPC: `vpc-00f9dea268760402c`
- Private subnets: `subnet-0a8ea11bf07e9451f`, `subnet-0d067140e51b5937c`
- Public subnets: `subnet-0df265f0b4816e7c0`, `subnet-0ae8cc7d6b80ab085`
- RDS proxy: `remitscoutdbproxy.proxy-csfk2aykg227.us-east-1.rds.amazonaws.com`
- Redis: `master.rer1b7mgk87k71dl.0bgood.use1.cache.amazonaws.com:6379`
- S3: `remit-scout-bronze-dev`, `remit-scout-exports-dev`, `remit-scout-user-assets-dev`, `remit-scout-audit-logs-dev`
- ECS services: Plane B ingest running; B2C refresh worker may be scaled to 0
- CloudFormation stack status must be `*_COMPLETE` before relying on outputs.

## Deployment flow (dev/staging/prod)
- Build backend image:
  - `docker buildx build --platform linux/amd64 -f backend/Dockerfile -t <repo>:<tag> --push .`
- Deploy infra:
  - `infrastructure/cdk/scripts/deploy.sh <env> <image-tag> never`
- Verify:
  - `/api/v1/health` (Plane A)
  - queue depths, ECS desired/running counts

## Secrets + runtime config
- Secrets live in Secrets Manager + SSM and are injected by CDK.
- ECS tasks: secrets wired in `infrastructure/cdk/lib/ecs-tasks.ts`.
- Lambdas: resolve via `backend/shared/aws-params.ts` and env vars.
- Plane A/B/C config loaded in `backend/shared/config.ts`.

## AWS wiring (networking, secrets, regions, monitoring)
- VPC + subnets: `infrastructure/cdk/lib/vpc.ts` creates public + `PRIVATE_WITH_EGRESS` subnets. NAT gateways (dev=1, prod=2).
- ECS tasks (Plane B ingest + queue workers) run in private subnets with no public IP (`infrastructure/cdk/lib/ecs-services.ts`).
- Scheduled Lambdas (Plane A/B/C jobs) are VPC-attached to private subnets (`infrastructure/cdk/lib/scheduled-jobs.ts`).
- VPC endpoints (dev only): S3 gateway + interface endpoints for ECR, CloudWatch Logs, Secrets Manager, SSM (`infrastructure/cdk/lib/vpc.ts`). Prod relies on NAT for outbound.
- WAF + edge: Plane A WAF attaches to CloudFront when `enableWaf` and `enableCloudFront` are true (managed rule groups + rate limits in `infrastructure/cdk/lib/api.ts`). Default: prod on, dev optional.
- Secrets storage: primarily Secrets Manager + SSM.
  - ECS task secrets are injected via Secrets Manager/SSM in `infrastructure/cdk/lib/ecs-tasks.ts` (DB, Redis, proxy creds).
  - Lambdas resolve secrets at runtime via `backend/shared/aws-params.ts` and env vars set in CDK (`infrastructure/cdk/lib/api.ts`, `infrastructure/cdk/lib/scheduled-jobs.ts`).
- Cross-region/global resources:
  - CloudFront is global; Route53 is global. ACM certs for CloudFront must be us-east-1 (see `infrastructure/cdk/lib/api.ts` + `frontend.ts`).
  - SQS/S3/CloudWatch/ElastiCache/RDS are provisioned in the stack region (no cross-region by default).
- Dashboards/alarms:
  - CloudWatch dashboard + DLQ/latency/CPU/RDS/Redis widgets in `infrastructure/cdk/lib/monitoring.ts`.
  - Alarms include DLQ depth, Lambda errors, RDS CPU, and SLO metrics (freshness p95, quote success rate).
- Add explicit p95 API latency alarm in `infrastructure/cdk/lib/monitoring.ts`; missing alarm is treated as SLO risk.

## Detailed component map (granular scope + profiles)

### Backend - Plane A: entrypoints, auth, plugins
- Profile (role): public API surface, request lifecycle wiring, and auth enforcement.
- Profile (inputs): HTTP requests, JWTs (Supabase + JWKS), env config, headers.
- Profile (outputs): JSON responses, auth decisions, logs, metrics, traces.
- Profile (runtime): Fastify server; optional Lambda adapter.
- Runtime entrypoints: `backend/plane-a/src/server.ts`, `backend/plane-a/src/app.ts`, `backend/plane-a/src/lambda.ts`.
- Auth modules: `backend/plane-a/src/auth/jwks-cache.ts`, `backend/plane-a/src/auth/jwks-fetch.ts`, `backend/plane-a/src/auth/jwks-verify.ts`, `backend/plane-a/src/auth/remote-verify.ts`, `backend/plane-a/src/auth/verify-supabase-jwt.ts`, `backend/plane-a/src/auth/types.ts`.
- Fastify plugins: `backend/plane-a/src/plugins/api-versioning.ts`, `backend/plane-a/src/plugins/auth-plugin.ts`, `backend/plane-a/src/plugins/error-handler.ts`, `backend/plane-a/src/plugins/lambda-optimization.ts`, `backend/plane-a/src/plugins/payload-size.ts`, `backend/plane-a/src/plugins/rate-limit-redis.ts`, `backend/plane-a/src/plugins/rds-proxy-monitor.ts`, `backend/plane-a/src/plugins/session-tracker-plugin.ts`, `backend/plane-a/src/plugins/swagger.ts`, `backend/plane-a/src/plugins/timeout-monitor.ts`.
- Types: `backend/plane-a/src/types/errors.ts`, `backend/plane-a/src/types/fastify.d.ts`.
- Utils: `backend/plane-a/src/utils/token-generator.ts`.
- Storage placeholder: `backend/plane-a/src/storage` (currently empty).

### Backend - Plane A: routes (quotes, rates, corridors)
- Profile (role): public quote search/compare and corridor/rate discovery.
- Profile (inputs): corridor_id, amount, payin/payout, provider filters, query params.
- Profile (outputs): quote lists, refresh status, rate data, corridor metadata.
- Quotes + refresh: `backend/plane-a/src/routes/quotes.ts`.
- Compare history: `backend/plane-a/src/routes/history.ts`.
- Recent searches: `backend/plane-a/src/routes/recent-searches.ts`.
- FX rates: `backend/plane-a/src/routes/rates.ts`.
- Bank vs specialist: `backend/plane-a/src/routes/bank-vs-specialist.ts`.
- Corridor currencies: `backend/plane-a/src/routes/corridor-currencies.ts`.
- Corridor limits: `backend/plane-a/src/routes/corridor-limits.ts`.
- Popular corridors: `backend/plane-a/src/routes/popular-corridors.ts`.
- Provider list: `backend/plane-a/src/routes/providers.ts`.
- Provider metadata: `backend/plane-a/src/routes/provider-metadata.ts`.
- Provider visits: `backend/plane-a/src/routes/provider-visits.ts`.
- Pulse data: `backend/plane-a/src/routes/pulse.ts`.
- Pulse status: `backend/plane-a/src/routes/pulse-status.ts`.

### Backend - Plane A: routes (alerts, notifications, marketing)
- Profile (role): user alerts, marketing touchpoints, exports, and analytics surfaces.
- Profile (inputs): user auth, alert subscriptions, newsletter preferences, telemetry payloads.
- Profile (outputs): alert CRUD, notification settings, export jobs, analytics events.
- Alerts: `backend/plane-a/src/routes/alerts.ts`.
- Watchlist: `backend/plane-a/src/routes/watchlist.ts`.
- Notifications: `backend/plane-a/src/routes/notifications.ts`.
- Ads: `backend/plane-a/src/routes/ads.ts`.
- Marketing: `backend/plane-a/src/routes/marketing.ts`.
- Newsletter: `backend/plane-a/src/routes/newsletter.ts`.
- Contact: `backend/plane-a/src/routes/contact.ts`.
- Analytics: `backend/plane-a/src/routes/analytics.ts`.
- Exports: `backend/plane-a/src/routes/exports.ts`.
- Data export: `backend/plane-a/src/routes/data-export.ts`.
- Geo: `backend/plane-a/src/routes/geo.ts`.
- Telemetry: `backend/plane-a/src/routes/telemetry.ts`.

### Backend - Plane A: routes (account, billing, admin, ops)
- Profile (role): account/session management, billing workflows, admin/ops surfaces.
- Profile (inputs): user auth, billing webhooks, admin tokens, health probes.
- Profile (outputs): account settings, billing sessions, audit events, health checks.
- Account: `backend/plane-a/src/routes/account.ts`.
- Me/profile: `backend/plane-a/src/routes/me.ts`.
- Sessions: `backend/plane-a/src/routes/sessions.ts`.
- Billing index: `backend/plane-a/src/routes/billing/index.ts`.
- Billing checkout: `backend/plane-a/src/routes/billing/checkout-session.ts`.
- Billing portal: `backend/plane-a/src/routes/billing/portal.ts`.
- Billing history: `backend/plane-a/src/routes/billing/history.ts`.
- Billing webhook: `backend/plane-a/src/routes/billing/webhook.ts`.
- Billing verify: `backend/plane-a/src/routes/billing/verify-session.ts`.
- Admin: `backend/plane-a/src/routes/admin.ts`.
- Audit: `backend/plane-a/src/routes/audit.ts`.
- Ops index: `backend/plane-a/src/routes/ops/index.ts`.
- Ops health (A-K): `backend/plane-a/src/routes/ops/alansari-health.ts`, `backend/plane-a/src/routes/ops/bossmoney-health.ts`, `backend/plane-a/src/routes/ops/dahabshiil-health.ts`, `backend/plane-a/src/routes/ops/instarem-health.ts`, `backend/plane-a/src/routes/ops/intermex-health.ts`, `backend/plane-a/src/routes/ops/koronapay-health.ts`, `backend/plane-a/src/routes/ops/mukuru-health.ts`, `backend/plane-a/src/routes/ops/orbitremit-health.ts`, `backend/plane-a/src/routes/ops/pangea-health.ts`, `backend/plane-a/src/routes/ops/paysend-health.ts`, `backend/plane-a/src/routes/ops/placid-health.ts`.
- Ops health (L-Z): `backend/plane-a/src/routes/ops/remitbee-health.ts`, `backend/plane-a/src/routes/ops/remitly-health.ts`, `backend/plane-a/src/routes/ops/ria-health.ts`, `backend/plane-a/src/routes/ops/sendwave-health.ts`, `backend/plane-a/src/routes/ops/singx-health.ts`, `backend/plane-a/src/routes/ops/transfergo-health.ts`, `backend/plane-a/src/routes/ops/westernunion-health.ts`, `backend/plane-a/src/routes/ops/wirebarley-health.ts`, `backend/plane-a/src/routes/ops/wise-health.ts`, `backend/plane-a/src/routes/ops/worldremit-health.ts`, `backend/plane-a/src/routes/ops/xe-health.ts`, `backend/plane-a/src/routes/ops/xoom-health.ts`.

### Backend - Plane A: repositories (data access)
- Profile (role): Plane A data access layer; mediates DB and cache operations.
- Profile (inputs): route/service queries, DB clients, cache clients.
- Profile (outputs): domain entities, persisted records, cached values.
- Repository exports: `backend/plane-a/src/repositories/index.ts`.
- Repository interfaces (alerts + analytics): `backend/plane-a/src/repositories/interfaces/alert-repository.interface.ts`, `backend/plane-a/src/repositories/interfaces/analytics-repository.interface.ts`, `backend/plane-a/src/repositories/interfaces/audit-log-repository.interface.ts`.
- Repository interfaces (billing + exports): `backend/plane-a/src/repositories/interfaces/billing-webhook-event-repository.interface.ts`, `backend/plane-a/src/repositories/interfaces/export-job-repository.interface.ts`, `backend/plane-a/src/repositories/interfaces/newsletter-repository.interface.ts`.
- Repository interfaces (quotes + corridors): `backend/plane-a/src/repositories/interfaces/comparison-history-repository.interface.ts`, `backend/plane-a/src/repositories/interfaces/corridor-capability-repository.interface.ts`, `backend/plane-a/src/repositories/interfaces/corridor-priority-repository.interface.ts`, `backend/plane-a/src/repositories/interfaces/latest-quote-repository.interface.ts`, `backend/plane-a/src/repositories/interfaces/quote-attempt-repository.interface.ts`, `backend/plane-a/src/repositories/interfaces/quote-refresh-repository.interface.ts`, `backend/plane-a/src/repositories/interfaces/recent-search-repository.interface.ts`.
- Repository interfaces (rates + pulse): `backend/plane-a/src/repositories/interfaces/fx-rate-history-repository.interface.ts`, `backend/plane-a/src/repositories/interfaces/fx-rate-refresh-repository.interface.ts`, `backend/plane-a/src/repositories/interfaces/fx-rate-repository.interface.ts`, `backend/plane-a/src/repositories/interfaces/popular-corridor-repository.interface.ts`, `backend/plane-a/src/repositories/interfaces/pulse-cache-repository.interface.ts`.
- Repository interfaces (user + access): `backend/plane-a/src/repositories/interfaces/plan-usage-repository.interface.ts`, `backend/plane-a/src/repositories/interfaces/provider-visit-repository.interface.ts`, `backend/plane-a/src/repositories/interfaces/rights-matrix-repository.interface.ts`, `backend/plane-a/src/repositories/interfaces/session-repository.interface.ts`, `backend/plane-a/src/repositories/interfaces/telemetry-repository.interface.ts`, `backend/plane-a/src/repositories/interfaces/user-account-repository.interface.ts`, `backend/plane-a/src/repositories/interfaces/user-plan-repository.interface.ts`, `backend/plane-a/src/repositories/interfaces/watchlist-repository.interface.ts`.
- Repository implementations (alerts + analytics): `backend/plane-a/src/repositories/implementations/alert-repository.ts`, `backend/plane-a/src/repositories/implementations/analytics-repository.ts`, `backend/plane-a/src/repositories/implementations/audit-log-repository.ts`.
- Repository implementations (billing + exports): `backend/plane-a/src/repositories/implementations/billing-webhook-event-repository.ts`, `backend/plane-a/src/repositories/implementations/export-job-repository.ts`, `backend/plane-a/src/repositories/implementations/newsletter-repository.ts`.
- Repository implementations (quotes + corridors): `backend/plane-a/src/repositories/implementations/comparison-history-repository.ts`, `backend/plane-a/src/repositories/implementations/corridor-capability-repository.ts`, `backend/plane-a/src/repositories/implementations/corridor-priority-repository.ts`, `backend/plane-a/src/repositories/implementations/latest-quote-repository.ts`, `backend/plane-a/src/repositories/implementations/quote-attempt-repository.ts`, `backend/plane-a/src/repositories/implementations/quote-refresh-repository.ts`, `backend/plane-a/src/repositories/implementations/recent-search-repository.ts`.
- Repository implementations (rates + pulse): `backend/plane-a/src/repositories/implementations/fx-rate-history-repository.ts`, `backend/plane-a/src/repositories/implementations/fx-rate-refresh-repository.ts`, `backend/plane-a/src/repositories/implementations/fx-rate-repository.ts`, `backend/plane-a/src/repositories/implementations/popular-corridor-repository.ts`, `backend/plane-a/src/repositories/implementations/pulse-cache-repository.ts`.
- Repository implementations (user + access): `backend/plane-a/src/repositories/implementations/plan-usage-repository.ts`, `backend/plane-a/src/repositories/implementations/provider-visit-repository.ts`, `backend/plane-a/src/repositories/implementations/rights-matrix-repository.ts`, `backend/plane-a/src/repositories/implementations/session-repository.ts`, `backend/plane-a/src/repositories/implementations/telemetry-repository.ts`, `backend/plane-a/src/repositories/implementations/user-account-repository.ts`, `backend/plane-a/src/repositories/implementations/user-plan-repository.ts`, `backend/plane-a/src/repositories/implementations/watchlist-repository.ts`.

### Backend - Plane A: services (business logic)
- Profile (role): domain logic for alerts, billing, accounts, telemetry, and rates.
- Profile (inputs): repo interfaces, external APIs (Stripe, OANDA, Supabase).
- Profile (outputs): business decisions, notifications, emails, entitlements.
- Alerts + notifications: `backend/plane-a/src/services/alert-evaluator.ts`, `backend/plane-a/src/services/alert-notifications.ts`, `backend/plane-a/src/services/alert-unsubscribe.ts`, `backend/plane-a/src/services/push-delivery.ts`.
- Billing + email: `backend/plane-a/src/services/billing-email.ts`, `backend/plane-a/src/services/stripe-client.ts`, `backend/plane-a/src/services/stripe-admin.ts`, `backend/plane-a/src/services/stripe-mock.ts`.
- Accounts + entitlements: `backend/plane-a/src/services/account-deletion.ts`, `backend/plane-a/src/services/session-utils.ts`, `backend/plane-a/src/services/user-account.ts`, `backend/plane-a/src/services/user-plan.ts`, `backend/plane-a/src/services/plan-usage.ts`, `backend/plane-a/src/services/entitlements.ts`.
- FX + provider metadata: `backend/plane-a/src/services/oanda-rate-fetcher.ts`, `backend/plane-a/src/services/oanda-code-map.ts`, `backend/plane-a/src/services/volatility-service.ts`, `backend/plane-a/src/services/provider-metadata.ts`.
- Audit + telemetry: `backend/plane-a/src/services/audit-log.ts`, `backend/plane-a/src/services/telemetry-anonymization.ts`.
- Supabase admin: `backend/plane-a/src/services/supabase-admin.ts`.
- Newsletter email: `backend/plane-a/src/services/newsletter-email.ts`.

### Backend - Plane B: ingestion entrypoints
- Profile (role): ingestion and refresh entrypoints for Plane B workers.
- Profile (inputs): schedules, SQS messages, provider configs, env.
- Profile (outputs): Bronze raw payloads, Silver normalized records, refresh status updates.
- ECS ingest: `backend/plane-b/src/ingest.ts`.
- Quote refresh worker: `backend/plane-b/src/quote-refresh.ts`.
- FX rate refresh worker: `backend/plane-b/src/fx-rate-refresh.ts`.
- Health server: `backend/plane-b/src/health-server.ts`.
- Notifications config: `backend/plane-b/src/notifications/config.ts`, `backend/plane-b/src/notifications/config-aws.ts`.
- Data placeholder: `backend/plane-b/src/data` (currently empty).

### Backend - Plane B: collectors and scheduling
- Profile (role): orchestrate provider crawling, rate control, and raw payload capture.
- Profile (inputs): provider configs, schedules, HTTP responses, rate limits.
- Profile (outputs): Bronze writes, attempt metrics, collector checkpoints.
- Collector base: `backend/plane-b/src/collectors/base.ts`, `backend/plane-b/src/collectors/base-collector.ts`, `backend/plane-b/src/collectors/types.ts`.
- HTTP client + UA: `backend/plane-b/src/collectors/http-client.ts`, `backend/plane-b/src/collectors/user-agent.ts`.
- Blocking + ramps: `backend/plane-b/src/collectors/block-detection.ts`, `backend/plane-b/src/collectors/rpm-ramp.ts`.
- Rate control: `backend/plane-b/src/collectors/rate-config.ts`, `backend/plane-b/src/collectors/rate-limit-scope.ts`, `backend/plane-b/src/collectors/scheduler.ts`.
- Bronze + metrics: `backend/plane-b/src/collectors/bronze-writer.ts`, `backend/plane-b/src/collectors/collector-metrics.ts`, `backend/plane-b/src/collectors/attempt-metrics.ts`, `backend/plane-b/src/collectors/checkpoint.ts`.
- Alert routing: `backend/plane-b/src/collectors/alert-routing.ts`.

### Backend - Plane B: providers (collectors)
- Profile (role): per-provider fetch + parse + normalize adapters.
- Profile (inputs): provider-specific endpoints, auth, corridor configs.
- Profile (outputs): normalized quotes, provider metadata, supported corridors.
- Provider module anatomy: `collector.ts`, `fetch.ts`, `parse.ts`, `catalog.ts`, `supported-corridors.ts`, `limits.ts`, `code-map.ts`, `fixtures/*`.
- Providers A-M: `backend/plane-b/src/providers/alansari`, `backend/plane-b/src/providers/bossmoney`, `backend/plane-b/src/providers/dahabshiil`, `backend/plane-b/src/providers/instarem`, `backend/plane-b/src/providers/intermex`, `backend/plane-b/src/providers/koronapay`, `backend/plane-b/src/providers/mukuru`, `backend/plane-b/src/providers/orbitremit`, `backend/plane-b/src/providers/pangea`, `backend/plane-b/src/providers/paysend`, `backend/plane-b/src/providers/placid`, `backend/plane-b/src/providers/remitbee`, `backend/plane-b/src/providers/remitly`.
- Providers N-Z: `backend/plane-b/src/providers/ria`, `backend/plane-b/src/providers/sendwave`, `backend/plane-b/src/providers/singx`, `backend/plane-b/src/providers/transfergo`, `backend/plane-b/src/providers/wellsfargo`, `backend/plane-b/src/providers/westernunion`, `backend/plane-b/src/providers/wirebarley`, `backend/plane-b/src/providers/wise`, `backend/plane-b/src/providers/worldremit`, `backend/plane-b/src/providers/xe`, `backend/plane-b/src/providers/xoom`.
- Provider registry: `backend/plane-b/src/providers/index.ts`.

### Backend - Plane B: normalize, signals, services
- Profile (role): normalize raw quotes, flag quality, and detect anomalies.
- Profile (inputs): provider payloads, method profiles, corridor metadata.
- Profile (outputs): Silver normalized quotes, quality flags, anomaly signals.
- Normalize: `backend/plane-b/src/normalize/canonical.ts`, `backend/plane-b/src/normalize/method-profile.ts`, `backend/plane-b/src/normalize/quality-flags.ts`, `backend/plane-b/src/normalize/quote-normalizer.ts`.
- Signals/anomalies: `backend/plane-b/src/signals/anomaly-config.ts`, `backend/plane-b/src/signals/anomaly-detector.ts`.
- Services: `backend/plane-b/src/services/index.ts`, `backend/plane-b/src/services/provider-capability.ts`, `backend/plane-b/src/services/stoplist-service.ts`, `backend/plane-b/src/services/volatility-service.ts`.
- Notifications: `backend/plane-b/src/notifications/aws-services.ts`, `backend/plane-b/src/notifications/dispatcher.ts`, `backend/plane-b/src/notifications/types.ts`.

### Backend - Plane B: repositories (data access)
- Profile (role): persistence for Bronze/Silver and ingestion metadata.
- Profile (inputs): normalized records, refresh requests, provider metadata.
- Profile (outputs): DB writes, read models, freshness reports.
- Repository exports: `backend/plane-b/src/repositories/index.ts`.
- DB indexes: `backend/plane-b/src/repositories/DATABASE_INDEXES.sql`.
- Repository interfaces: `backend/plane-b/src/repositories/interfaces/*`.
- Repository types: `backend/plane-b/src/repositories/types/fx-rate-refresh-status.ts`, `backend/plane-b/src/repositories/types/quote-refresh-status.ts`.
- Repository implementations (bronze + ingestion): `backend/plane-b/src/repositories/implementations/bronze-repository.ts`, `backend/plane-b/src/repositories/implementations/ingestion-run-repository.ts`.
- Repository implementations (quotes + refresh): `backend/plane-b/src/repositories/implementations/quote-record-repository.ts`, `backend/plane-b/src/repositories/implementations/quote-attempt-repository.ts`, `backend/plane-b/src/repositories/implementations/quote-refresh-repository.ts`, `backend/plane-b/src/repositories/implementations/latest-quote-repository.ts`, `backend/plane-b/src/repositories/implementations/attempt-metrics-repository.ts`.
- Repository implementations (providers + corridors): `backend/plane-b/src/repositories/implementations/provider-repository.ts`, `backend/plane-b/src/repositories/implementations/provider-rate-repository.ts`, `backend/plane-b/src/repositories/implementations/provider-capability-repository.ts`, `backend/plane-b/src/repositories/implementations/corridor-repository.ts`, `backend/plane-b/src/repositories/implementations/corridor-priority-repository.ts`, `backend/plane-b/src/repositories/implementations/corridor-volatility-repository.ts`, `backend/plane-b/src/repositories/implementations/countries-repository.ts`, `backend/plane-b/src/repositories/implementations/rights-matrix-repository.ts`.
- Repository implementations (rates + pulse + ops): `backend/plane-b/src/repositories/implementations/fx-rate-repository.ts`, `backend/plane-b/src/repositories/implementations/fx-rate-history-repository.ts`, `backend/plane-b/src/repositories/implementations/fx-rate-refresh-repository.ts`, `backend/plane-b/src/repositories/implementations/fx-provider-rate-repository.ts`, `backend/plane-b/src/repositories/implementations/pulse-cache-repository.ts`, `backend/plane-b/src/repositories/implementations/popular-corridor-repository.ts`, `backend/plane-b/src/repositories/implementations/ops-alert-repository.ts`, `backend/plane-b/src/repositories/implementations/freshness-report-repository.ts`, `backend/plane-b/src/repositories/implementations/signal-repository.ts`, `backend/plane-b/src/repositories/implementations/circuit-breaker-repository.ts`, `backend/plane-b/src/repositories/implementations/webhook-repository.ts`.

### Backend - Plane B: worker utilities
- Profile (role): worker coordination, rate limiting, and proxy routing.
- Profile (inputs): Redis, queue locks, proxy config.
- Profile (outputs): throttling decisions, lock ownership, routed traffic.
- Redis/locks: `backend/plane-b/src/lib/redis-circuit-breaker.ts`, `backend/plane-b/src/lib/redis-token-bucket.ts`, `backend/plane-b/src/lib/worker-lock.ts`.
- Proxy routing: `backend/plane-b/src/lib/proxy-router.ts`.

### Backend - Plane C: publisher (internal)
- Profile (role): internal publishing API for Gold outputs.
- Profile (inputs): gold datasets, publisher requests, gating rules.
- Profile (outputs): published payloads, status responses.
- Runtime entrypoints: `backend/plane-c/src/server.ts`, `backend/plane-c/src/app.ts`, `backend/plane-c/src/lambda.ts`.
- Routes: `backend/plane-c/src/routes/publisher.ts`.
- Services: `backend/plane-c/src/services/gold-publisher.ts`, `backend/plane-c/src/services/publisher-gates.ts`.
- Data access: `backend/plane-c/src/data/publisher-repository.ts`, `backend/plane-c/src/data/publisher-repository.interface.ts`, `backend/plane-c/src/data/index.ts`.

### Data tiers and caches
- Profile (role): define data lineage from Bronze to Silver to Gold.
- Profile (inputs): provider payloads, normalized quotes, scheduled jobs.
- Profile (outputs): curated data products, caches, publisher outputs.
- Bronze (raw payloads): `backend/plane-b/src/collectors/bronze-writer.ts`, `backend/plane-b/src/repositories/implementations/bronze-repository.ts`, `backend/storage/bronze`.
- Silver (normalized quotes + metadata): `backend/plane-b/src/normalize/*`, `backend/plane-b/src/repositories/implementations/quote-*.ts`, `backend/plane-b/src/repositories/implementations/corridor-*.ts`.
- Gold (curated outputs): `backend/scripts/gold-*.ts`, `backend/plane-c/src/services/gold-publisher.ts`, `backend/plane-a/src/repositories/implementations/pulse-cache-repository.ts`.
- FX rates: `backend/scripts/oanda-rates-sync.ts`, `backend/plane-a/src/repositories/implementations/fx-rate-repository.ts`, `backend/plane-b/src/repositories/implementations/fx-rate-repository.ts`.
- Refresh queues: `backend/plane-b/src/quote-refresh.ts`, `backend/plane-b/src/fx-rate-refresh.ts`, `backend/shared/sqs.ts`.
- Pulse cache keys: `backend/shared/pulse-cache-keys.ts`, `backend/shared/pulse-defaults.ts`.

### Backend shared (cross-cutting)
- Profile (role): shared infra for config, DB, cache, metrics, retries, tracing.
- Profile (inputs): env, AWS params, DB/Redis connections.
- Profile (outputs): validated config, metrics emission, retries, error handling.
- Config/env: `backend/shared/config.ts`, `backend/shared/load-env.ts`, `backend/shared/aws-config-validator.ts`, `backend/shared/aws-params.ts`, `backend/shared/node-polyfills.ts`.
- Logging/errors: `backend/shared/logger.ts`, `backend/shared/error-handler.ts`, `backend/shared/error-tracker.ts`, `backend/shared/shutdown.ts`.
- DB + connections: `backend/shared/db.ts`, `backend/shared/connection-manager.ts`, `backend/shared/db-metrics.ts`, `backend/shared/repository-metrics.ts`, `backend/shared/repository-retry.ts`, `backend/shared/repository-cache.ts`, `backend/shared/sharding.ts`.
- Cache + Redis: `backend/shared/cache.ts`, `backend/shared/redis.ts`, `backend/shared/redis-metrics.ts`, `backend/shared/retry.ts`, `backend/shared/retry-metrics.ts`, `backend/shared/worker-retry.ts`.
- Metrics + tracing: `backend/shared/metrics-registry.ts`, `backend/shared/cloudwatch-metrics.ts`, `backend/shared/slo-tracker.ts`, `backend/shared/tracing.ts`, `backend/shared/worker-metrics.ts`.
- AWS + queues: `backend/shared/sqs.ts`, `backend/shared/sqs-metrics.ts`, `backend/shared/eventbridge-cache-refresh.ts`, `backend/shared/health-server.ts`, `backend/shared/aws-errors.ts`.
- Domain data: `backend/shared/corridor.ts`, `backend/shared/countries-currencies.ts`, `backend/shared/provider-currencies.ts`, `backend/shared/amount-bucket.ts`, `backend/shared/currency-limits.ts`, `backend/shared/pulse-cache-keys.ts`, `backend/shared/pulse-defaults.ts`, `backend/shared/health-corridors.ts`.
- FX helpers: `backend/shared/oanda-code-map.ts`, `backend/shared/oanda-rate-fetcher.ts`, `backend/shared/volatility-service.ts`.
- Bronze storage: `backend/shared/bronze-storage.ts`.
- Metrics adapters: `backend/shared/api-metrics.ts`, `backend/shared/business-metrics.ts`, `backend/shared/data-health-metrics.ts`.
- Utils: `backend/shared/utils/aws-context.ts`, `backend/shared/utils/error-handling.ts`.
- Services placeholder: `backend/shared/services` (currently empty).

### Backend scripts: B2C refresh and queue hygiene
- Profile (role): B2C refresh processing, queue hygiene, and cache warmups.
- Profile (inputs): refresh requests, queue messages, corridor targets.
- Profile (outputs): refreshed quotes, queue cleanup, cache priming.
- Refresh workers: `backend/scripts/b2c-refresh-worker.ts`, `backend/scripts/b2c-refresh-worker-health.ts`, `backend/scripts/b2c-refresh-worker-metrics.ts`.
- Retry/cleanup: `backend/scripts/b2c-retry-failed.ts`, `backend/scripts/quote-refresh-queue-cleanup.ts`.
- Cache warmup: `backend/scripts/b2c-tier2-cache-warmup.ts`, `backend/scripts/b2c-tier2-cache-warmup-audit.ts`.
- AWS entrypoints: `backend/scripts/aws/b2c-refresh-worker-ecs.ts`, `backend/scripts/aws/quote-refresh-queue-cleanup-lambda.ts`.

### Backend scripts: Gold + FX + compare adjacencies
- Profile (role): scheduled Gold outputs, FX sync, and compare adjunct jobs.
- Profile (inputs): Silver datasets, FX sources, schedule triggers.
- Profile (outputs): Gold tables, publisher outputs, refreshed rate caches.
- Gold jobs: `backend/scripts/gold-fx-rates-job.ts`, `backend/scripts/gold-popular-corridors-job.ts`, `backend/scripts/gold-publisher-job.ts`, `backend/scripts/gold-pulse-cache-job.ts`.
- Gold job health/metrics: `backend/scripts/gold-fx-rates-job-health.ts`, `backend/scripts/gold-fx-rates-job-metrics.ts`, `backend/scripts/gold-popular-corridors-job-health.ts`, `backend/scripts/gold-popular-corridors-job-metrics.ts`, `backend/scripts/gold-publisher-job-health.ts`, `backend/scripts/gold-publisher-job-metrics.ts`, `backend/scripts/gold-pulse-cache-job-health.ts`, `backend/scripts/gold-pulse-cache-job-metrics.ts`.
- Gold job entrypoints: `backend/scripts/aws/gold-fx-rates-lambda.ts`, `backend/scripts/aws/gold-popular-corridors-lambda.ts`, `backend/scripts/aws/gold-publisher-lambda.ts`, `backend/scripts/aws/gold-pulse-cache-lambda.ts`.
- FX refresh: `backend/scripts/oanda-rates-sync.ts`, `backend/scripts/fx-rate-refresh-worker.ts`, `backend/scripts/aws/oanda-sync-lambda.ts`.
- Compare adjacencies: `backend/scripts/bank-vs-specialist-refresh.ts`, `backend/scripts/aws/bank-vs-specialist-refresh-lambda.ts`.

### Backend scripts: alerts, notifications, probes
- Profile (role): alert evaluation, notifications fanout, and probing.
- Profile (inputs): alert subscriptions, provider endpoints, metrics triggers.
- Profile (outputs): alerts dispatched, notifications delivered, probe results.
- Alerts: `backend/scripts/alert-evaluation-worker.ts`, `backend/scripts/smart-alerts-job.ts`.
- Alert entrypoints: `backend/scripts/aws/alert-evaluation-worker-lambda.ts`, `backend/scripts/aws/alert-evaluation-scheduler-lambda.ts`.
- Notifications/ops alerts: `backend/scripts/notifications-queue-worker.ts`, `backend/scripts/ops-alerts-queue-worker.ts`, `backend/scripts/aws/notifications-queue-worker-ecs.ts`, `backend/scripts/aws/ops-alerts-queue-worker-ecs.ts`.
- Probes/synthetics: `backend/scripts/*-probe.ts`, `backend/scripts/aws/*-probe-lambda.ts`, `backend/scripts/cache-ttl-probe.ts`, `backend/scripts/provider-capability-probe.ts`, `backend/scripts/aws-synthetic-monitor.ts`, `backend/scripts/synthetic-monitor.ts`.
- Telemetry/metrics jobs: `backend/scripts/telemetry-analytics-job.ts`, `backend/scripts/aws/telemetry-analytics-job-lambda.ts`.

### Backend scripts: ingest + housekeeping
- Profile (role): ingestion orchestration and periodic cleanup/backfill.
- Profile (inputs): schedules, DB state, queue messages.
- Profile (outputs): ingestion runs, cleaned sessions/audit logs, updated metadata.
- Ingest: `backend/scripts/ingest-run.ts`, `backend/scripts/ingest-fanout-worker.ts`, `backend/scripts/aws/plane-b-ingest-ecs.ts`, `backend/scripts/aws/ingest-fanout-worker-ecs.ts`.
- Cleanup/migrations: `backend/scripts/session-cleanup-worker.ts`, `backend/scripts/audit-log-cleanup-worker.ts`, `backend/scripts/db-migrate.ts`, `backend/scripts/aws/db-migrate-ecs.ts`.
- Stoplists/rights: `backend/scripts/stoplist-auto-resume.ts`, `backend/scripts/rights-matrix-sync-countries.ts`, `backend/scripts/aws/stoplist-auto-resume-lambda.ts`, `backend/scripts/aws/rights-matrix-sync-countries-lambda.ts`.
- Backfills: `backend/scripts/volatility-backfill.ts`.
- Guardrails: `backend/scripts/bronze-access-check.js`, `backend/scripts/sql-guardrail.ts`.

### Backend scripts: CI, dev, and shared libs
- Profile (role): local/CI automation and shared script helpers.
- Script libs: `backend/scripts/lib/generic-probe.ts`, `backend/scripts/lib/probe-utils.ts`.
- CI checks: `backend/scripts/ci/api-smoke.ts`, `backend/scripts/ci/observability-check.ts`, `backend/scripts/ci/seed-sanity.ts`, `backend/scripts/ci/validate-runtime-config.ts`.
- Dev tooling: `backend/scripts/dev/continuous-pipeline.ts`, `backend/scripts/dev/local-seed.ts`, `backend/scripts/dev/mukuru-corridors.ts`, `backend/scripts/dev/pangea-fixture-summary.ts`, `backend/scripts/dev/pangea-snapshot.ts`, `backend/scripts/dev/paysend-fixture-summary.ts`, `backend/scripts/dev/paysend-snapshot.ts`, `backend/scripts/dev/provider-snapshot.ts`, `backend/scripts/dev/remitly-snapshot.ts`, `backend/scripts/dev/sendwave-snapshot.ts`, `backend/scripts/dev/westernunion-observe.ts`.

### Backend: data storage and tests
- Profile (role): persistent storage, seed data, and test coverage.
- Profile (inputs): migrations, seeds, fixture payloads.
- Profile (outputs): schema changes, local data, automated verification.
- Migrations: `backend/db/migrations/*`, `backend/scripts/db-migrate.ts`.
- Seed data: `backend/data/manual-tier1-corridors.csv`, `backend/data/manual-tier2-corridors.csv`.
- Bronze storage: `backend/storage/bronze/*`, `backend/shared/bronze-storage.ts`.
- Backend tests (providers): `backend/tests/*-fetch.test.ts`, `backend/tests/*-parse.test.ts`, `backend/tests/*-corridors.test.ts`.
- Backend tests (routes + services): `backend/tests/*-route.test.ts`, `backend/tests/*-service.test.ts`, `backend/tests/*-email.test.ts`.
- Backend tests (repos + infra): `backend/tests/*-repository.test.ts`, `backend/tests/db.test.ts`, `backend/tests/redis.test.ts`, `backend/tests/sqs.test.ts`.
- Backend tests (guardrails): `backend/tests/guardrails.test.ts`, `backend/tests/rights-matrix-enforcement.test.ts`, `backend/tests/stoplist-enforcement.test.ts`.
- Monitoring docs: `backend/docs/monitoring/alertmanager-rules.yml`.

### Frontend: app entry and routing (Nuxt)
- Profile (role): public web app and user journey routing.
- Profile (inputs): user navigation, query params, cookies/session state.
- Profile (outputs): rendered pages, client-side API calls, SEO artifacts.
- App/runtime: `frontend/app.vue`, `frontend/nuxt.config.ts`, `frontend/i18n.config.ts`.
- Layouts: `frontend/layouts/*`.
- Middleware: `frontend/middleware/auth.ts`.
- Plugins: `frontend/plugins/supabase.client.ts`.
- Assets: `frontend/assets/css/tailwind.css`, `frontend/assets/css/reduced-motion.css`.
- Content/locales: `frontend/content/*`, `frontend/locales/en.json`, `frontend/locales/es.json`.
- Public assets: `frontend/public/*`.
- Core routes: `frontend/pages/compare/*`, `frontend/pages/send-money/*`, `frontend/pages/exchange-rates/*`, `frontend/pages/alerts.vue`, `frontend/pages/watchlist.vue`.
- Auth/account/billing: `frontend/pages/sign-in.vue`, `frontend/pages/sign-up.vue`, `frontend/pages/forgot-password.vue`, `frontend/pages/reset-password.vue`, `frontend/pages/dashboard.vue`, `frontend/pages/plus/*`, `frontend/pages/mock-stripe/*`.
- Admin/ops: `frontend/pages/admin/*`.
- Pulse/embeds: `frontend/pages/pulse/*`, `frontend/pages/embed/pulse/*`.
- Providers/learn: `frontend/pages/learn/*`, `frontend/pages/learn/providers/*`, `frontend/pages/go/*`.
- Marketing/legal: `frontend/pages/about.vue`, `frontend/pages/faq.vue`, `frontend/pages/legal/*`, `frontend/pages/newsletter/*`, `frontend/pages/partnerships.vue`, `frontend/pages/how-we-make-money.vue`, `frontend/pages/affiliate-partnerships.vue`.
- Institutions: `frontend/pages/institutions/*`.

### Frontend: UI, data, and server API
- Profile (role): UI composition, client-side data access, and server proxies.
- Profile (inputs): API responses, CMS content, browser events.
- Profile (outputs): composable state, rendered components, server API requests.
- Components: `frontend/components/ads`, `frontend/components/blog`, `frontend/components/corridor`, `frontend/components/home`, `frontend/components/legal`, `frontend/components/nav`, `frontend/components/privacy`, `frontend/components/provider`, `frontend/components/pulse`, `frontend/components/seo`, `frontend/components/shared`.
- Composables: `frontend/composables/*` (auth, alerts, compare, providers, quotes, telemetry).
- Stores/config/lib: `frontend/stores/pulse.ts`, `frontend/config/*`, `frontend/utils/*`, `frontend/lib/*`.
- Server API: `frontend/server/api/[...path].ts`, `frontend/server/api/bank-vs-specialist.get.ts`, `frontend/server/api/geo.get.ts`, `frontend/server/api/newsletter/subscribe.post.ts`, `frontend/server/api/offers.get.ts`, `frontend/server/api/popular-corridors.get.ts`, `frontend/server/api/providers.get.ts`, `frontend/server/api/pulse/[...path].ts`, `frontend/server/api/recent-searches.get.ts`, `frontend/server/api/recent-searches.post.ts`, `frontend/server/api/stripe/create-checkout.post.ts`, `frontend/server/api/stripe/verify-session.post.ts`.
- Server utils/routes: `frontend/server/utils/backendProxy.ts`, `frontend/server/routes/sitemap.xml.ts`.
- Tests: `frontend/tests/e2e/*`, `frontend/tests/unit/*`, `frontend/tests/setup.ts`.
- Mocks: `frontend/mocks/*`.

### Frontend runtime notes (Nuxt)
- API base resolution in `frontend/nuxt.config.ts`: `PUBLIC_API_BASE` -> `PLANE_A_CLOUDFRONT_DOMAIN` + `/api/v1` -> `PLANE_A_API_ENDPOINT` + `/api/v1` -> fallback `/api`.
- Server API base: `API_BASE` override; else absolute public base; else local default `http://127.0.0.1:4000/api/v1` in non-AWS.
- ISR rules (staging/prod only): `/send-money/**` 600s, `/providers/**` 1800s, `/compare/**` 86400s, `/learn/**` 604800s, `/pulse` 300s, `/pulse/charts/**` 300s, `/embed/pulse/**` 60s.
- Modules: `@nuxtjs/tailwindcss`, `@nuxt/image`, `@pinia/nuxt`, plus `@nuxtjs/robots` in staging/prod.
- Watcher env: `NUXT_DISABLE_WATCH`, `NUXT_USE_POLLING`, `CHOKIDAR_USEPOLLING`.

### Infrastructure: AWS CDK and K8s
- Profile (role): infra definitions for networking, compute, storage, queues, and monitoring.
- Profile (inputs): CDK context, env config, asset tags.
- Profile (outputs): VPC, ECS, Lambda, queues, alarms, scheduled jobs.
- CDK stack entry: `infrastructure/cdk/bin/*`, `infrastructure/cdk/lib/remit-scout-stack.ts`.
- Networking/data: `infrastructure/cdk/lib/vpc.ts`, `infrastructure/cdk/lib/database.ts`, `infrastructure/cdk/lib/cache.ts`, `infrastructure/cdk/lib/storage.ts`, `infrastructure/cdk/lib/backup.ts`.
- Compute/ECS: `infrastructure/cdk/lib/compute.ts`, `infrastructure/cdk/lib/ecs-services.ts`, `infrastructure/cdk/lib/ecs-tasks.ts`.
- API/queues/jobs: `infrastructure/cdk/lib/api.ts`, `infrastructure/cdk/lib/queues.ts`, `infrastructure/cdk/lib/scheduled-jobs.ts`, `infrastructure/cdk/lib/monitoring.ts`, `infrastructure/cdk/lib/synthetics.ts`.
- Frontend/registry: `infrastructure/cdk/lib/frontend.ts`, `infrastructure/cdk/lib/registry.ts`.
- Security/pipeline: `infrastructure/cdk/lib/iam.ts`, `infrastructure/cdk/lib/sns-subscriptions.ts`, `infrastructure/cdk/lib/pipeline.ts`, `infrastructure/cdk/lib/context-validator.ts`.
- CDK scripts: `infrastructure/cdk/scripts/deploy.sh`, `infrastructure/cdk/scripts/synth.sh`.
- K8s jobs: `infrastructure/k8s/*` (cronjobs and observability).

### Docs, tooling, and workspace glue
- Profile (role): docs, specs, and workspace tooling.
- Profile (inputs): architecture decisions, API definitions, release notes.
- Profile (outputs): documentation, runbooks, developer tooling.
- API specs: `docs/openapi/*`.
- AWS/SEO/analytics docs: `docs/aws/*`, `docs/seo/*`, `docs/analytics/*`.
- Repo docs: `README.md`, `CONTRIBUTING.md`, `LICENSE`.
- Dev scripts: `scripts/dev/start-local.sh`, `scripts/check-version-tag.mjs`, `docker-compose.yml`.
- Tooling: `tools/aws-cli/*`, `pnpm-workspace.yaml`, `package.json`, `pnpm-lock.yaml`.

## Endpoint-level mapping

### Plane A (public API)
- Health/metrics endpoints (no API prefix): `GET /healthz`, `GET /readyz`, `GET /metrics` in `backend/plane-a/src/app.ts`.
- API prefix: routes are registered under `/api/v1` in `backend/plane-a/src/app.ts`; unversioned `/api/*` is not explicitly registered (compatibility headers only).
- Route modules + endpoints (prefix `/api/v1`):
  - `backend/plane-a/src/routes/account.ts`: `GET /api/v1/account/privacy`, `PUT /api/v1/account/privacy`, `DELETE /api/v1/account`
  - `backend/plane-a/src/routes/admin.ts`: `GET /api/v1/admin/users`, `PATCH /api/v1/admin/users/role`
  - `backend/plane-a/src/routes/ads.ts`: `GET /api/v1/ads/placement`, `POST /api/v1/ads/click`, `GET /api/v1/admin/ads`, `POST /api/v1/admin/ads`, `PATCH /api/v1/admin/ads/:id`
  - `backend/plane-a/src/routes/alerts.ts`: `GET /api/v1/alerts/unsubscribe`, `GET /api/v1/alerts`, `POST /api/v1/alerts`, `PATCH /api/v1/alerts/:id`, `DELETE /api/v1/alerts/:id`, `GET /api/v1/alerts/smart-notifier`
  - `backend/plane-a/src/routes/analytics.ts`: `GET /api/v1/analytics/corridors`, `GET /api/v1/analytics/corridors/trends`, `GET /api/v1/analytics/providers`, `GET /api/v1/analytics/providers/impact`, `GET /api/v1/analytics/providers/ctr`, `GET /api/v1/analytics/engagement`, `GET /api/v1/analytics/engagement/sessions`, `GET /api/v1/analytics/heatmap`, `GET /api/v1/analytics/savings`, `GET /api/v1/analytics/users`, `GET /api/v1/analytics/revenue`
  - `backend/plane-a/src/routes/audit.ts`: `GET /api/v1/audit/logs`, `GET /api/v1/audit/logs/export`, `GET /api/v1/audit/logs/:eventId`, `GET /api/v1/audit/my-activity`
  - `backend/plane-a/src/routes/bank-vs-specialist.ts`: `GET /api/v1/bank-vs-specialist`
  - `backend/plane-a/src/routes/billing/checkout-session.ts`: `POST /api/v1/billing/checkout-session`, `POST /api/v1/stripe/create-checkout`
  - `backend/plane-a/src/routes/billing/history.ts`: `GET /api/v1/billing/history`
  - `backend/plane-a/src/routes/billing/portal.ts`: `GET /api/v1/billing/portal`
  - `backend/plane-a/src/routes/billing/verify-session.ts`: `POST /api/v1/billing/verify-session`
  - `backend/plane-a/src/routes/billing/webhook.ts`: `POST /api/v1/billing/webhook`
  - `backend/plane-a/src/routes/contact.ts`: `POST /api/v1/contact`
  - `backend/plane-a/src/routes/corridor-currencies.ts`: `GET /api/v1/corridor-currencies`
  - `backend/plane-a/src/routes/corridor-limits.ts`: `GET /api/v1/corridor-limits`
  - `backend/plane-a/src/routes/data-export.ts`: `POST /api/v1/data/export`, `GET /api/v1/data/export/:id`, `GET /api/v1/data/export/:id/download`
  - `backend/plane-a/src/routes/exports.ts`: `POST /api/v1/exports`, `GET /api/v1/exports`, `GET /api/v1/exports/:id`, `GET /api/v1/exports/:id/download`
  - `backend/plane-a/src/routes/geo.ts`: `GET /api/v1/geo`
  - `backend/plane-a/src/routes/history.ts`: `GET /api/v1/history/corridor`, `POST /api/v1/history`
  - `backend/plane-a/src/routes/marketing.ts`: `POST /api/v1/marketing/meta`
  - `backend/plane-a/src/routes/me.ts`: `GET /api/v1/me`, `PATCH /api/v1/me`, `POST /api/v1/me/password`
  - `backend/plane-a/src/routes/newsletter.ts`: `POST /api/v1/newsletter/subscribe`, `GET /api/v1/newsletter/confirm`, `GET /api/v1/newsletter/unsubscribe`, `GET /api/v1/newsletter/status`
  - `backend/plane-a/src/routes/notifications.ts`: `GET /api/v1/notifications/preferences`, `PUT /api/v1/notifications/preferences`, `POST /api/v1/notifications/push/subscribe`, `POST /api/v1/notifications/push/unsubscribe`
  - `backend/plane-a/src/routes/ops/alansari-health.ts`: `GET /api/v1/ops/alansari/health`
  - `backend/plane-a/src/routes/ops/bossmoney-health.ts`: `GET /api/v1/ops/bossmoney/health`
  - `backend/plane-a/src/routes/ops/dahabshiil-health.ts`: `GET /api/v1/ops/dahabshiil/health`
  - `backend/plane-a/src/routes/ops/instarem-health.ts`: `GET /api/v1/ops/instarem/health`
  - `backend/plane-a/src/routes/ops/intermex-health.ts`: `GET /api/v1/ops/intermex/health`
  - `backend/plane-a/src/routes/ops/koronapay-health.ts`: `GET /api/v1/ops/koronapay/health`
  - `backend/plane-a/src/routes/ops/mukuru-health.ts`: `GET /api/v1/ops/mukuru/health`
  - `backend/plane-a/src/routes/ops/orbitremit-health.ts`: `GET /api/v1/ops/orbitremit/health`
  - `backend/plane-a/src/routes/ops/pangea-health.ts`: `GET /api/v1/ops/pangea/health`
  - `backend/plane-a/src/routes/ops/paysend-health.ts`: `GET /api/v1/ops/paysend/health`
  - `backend/plane-a/src/routes/ops/placid-health.ts`: `GET /api/v1/ops/placid/health`
  - `backend/plane-a/src/routes/ops/remitbee-health.ts`: `GET /api/v1/ops/remitbee/health`
  - `backend/plane-a/src/routes/ops/remitly-health.ts`: `GET /api/v1/ops/remitly/health`
  - `backend/plane-a/src/routes/ops/ria-health.ts`: `GET /api/v1/ops/ria/health`
  - `backend/plane-a/src/routes/ops/sendwave-health.ts`: `GET /api/v1/ops/sendwave/health`
  - `backend/plane-a/src/routes/ops/singx-health.ts`: `GET /api/v1/ops/singx/health`
  - `backend/plane-a/src/routes/ops/transfergo-health.ts`: `GET /api/v1/ops/transfergo/health`
  - `backend/plane-a/src/routes/ops/westernunion-health.ts`: `GET /api/v1/ops/westernunion/health`
  - `backend/plane-a/src/routes/ops/wirebarley-health.ts`: `GET /api/v1/ops/wirebarley/health`
  - `backend/plane-a/src/routes/ops/wise-health.ts`: `GET /api/v1/ops/wise/health`
  - `backend/plane-a/src/routes/ops/worldremit-health.ts`: `GET /api/v1/ops/worldremit/health`
  - `backend/plane-a/src/routes/ops/xe-health.ts`: `GET /api/v1/ops/xe/health`
  - `backend/plane-a/src/routes/ops/xoom-health.ts`: `GET /api/v1/ops/xoom/health`
  - `backend/plane-a/src/routes/popular-corridors.ts`: `GET /api/v1/popular-corridors`
  - `backend/plane-a/src/routes/provider-metadata.ts`: `GET /api/v1/providers/metadata`, `GET /api/v1/providers/metadata/:id`
  - `backend/plane-a/src/routes/provider-visits.ts`: `POST /api/v1/provider-visits/track`, `GET /api/v1/provider-visits/pending-feedback`, `POST /api/v1/provider-visits/:id/feedback`
  - `backend/plane-a/src/routes/providers.ts`: `GET /api/v1/providers`
  - `backend/plane-a/src/routes/pulse-status.ts`: `GET /api/v1/pulse/status`
  - `backend/plane-a/src/routes/pulse.ts`: `GET /api/v1/pulse/corridors`, `GET /api/v1/pulse/overview`, `GET /api/v1/pulse/charts/:chartId`, `GET /api/v1/pulse/method-coverage`, `GET /api/v1/pulse/table`, `GET /api/v1/pulse/hero`, `GET /api/v1/pulse/coverage-summary`, `GET /api/v1/pulse/snapshot-summary`, `GET /api/v1/pulse/providers/benchmarking`, `GET /api/v1/pulse/events`, `GET /api/v1/pulse/providers/heatmap`, `GET /api/v1/pulse/smart-send`, `GET /api/v1/pulse/market-snapshot`, `GET /api/v1/pulse/true-cost`, `GET /api/v1/pulse/market-depth`, `GET /api/v1/pulse/arbitrage`, `GET /api/v1/pulse/bank-comparison`, `GET /api/v1/pulse/cost-trend`, `GET /api/v1/pulse/fx-rate-history`
  - `backend/plane-a/src/routes/quotes.ts`: `GET /api/v1/quotes/current`, `GET /api/v1/quotes/refresh-status`
  - `backend/plane-a/src/routes/rates.ts`: `GET /api/v1/rates/spot`, `GET /api/v1/rates/providers`, `GET /api/v1/rates/history`, `GET /api/v1/rates/exchange/:base/:quote`, `GET /api/v1/rates/exchange/:base/:quote/history`
  - `backend/plane-a/src/routes/recent-searches.ts`: `GET /api/v1/recent-searches`, `POST /api/v1/recent-searches`
  - `backend/plane-a/src/routes/sessions.ts`: `GET /api/v1/sessions`, `DELETE /api/v1/sessions/:id`, `POST /api/v1/sessions/revoke-all`, `POST /api/v1/sessions/track`
  - `backend/plane-a/src/routes/telemetry.ts`: `POST /api/v1/telemetry/search`, `POST /api/v1/telemetry/click`, `POST /api/v1/telemetry/conversion`, `POST /api/v1/telemetry/session`, `GET /api/v1/telemetry/analytics`
  - `backend/plane-a/src/routes/watchlist.ts`: `GET /api/v1/watchlist`, `POST /api/v1/watchlist`, `PATCH /api/v1/watchlist/:id`, `DELETE /api/v1/watchlist/:id`

### Plane B (ingestion + health server)
- Health server endpoints (HTTP server): `GET /healthz`, `GET /readyz`, `GET /metrics` in `backend/plane-b/src/health-server.ts`.
- No public API routes; Plane B is ingestion + workers.

### Plane C (publisher)
- Health/metrics endpoints: `GET /healthz`, `GET /readyz`, `GET /metrics` in `backend/plane-c/src/app.ts`.
- Publisher endpoint: `POST /internal/publisher/validate` in `backend/plane-c/src/routes/publisher.ts`.

## Provider module deviations (pair deviations)
- Standard provider anatomy: `collector.ts`, `fetch.ts`, `parse.ts`, `catalog.ts`, `supported-corridors.ts`, `limits.ts`, `code-map.ts`, `fixtures/`.
- Deviations by provider:
  - `backend/plane-b/src/providers/remitbee`: extra `countries-data.json`.
  - All other providers match the standard anatomy.

## Data lineage table (Bronze -> Silver -> Gold + cadence)

| Tier / Artifact | Writer(s) | Storage | Refresh trigger / cadence | Primary consumers |
| --- | --- | --- | --- | --- |
| Bronze raw payloads | Plane B collectors (`backend/plane-b/src/collectors/bronze-writer.ts`) | S3 via `backend/shared/bronze-storage.ts` (`config.storage.bronze`), local `backend/storage/bronze/*` | Continuous during ingest + refresh; cadence driven by per-provider sweeps and B2C refresh queue | Plane B normalization and debugging |
| Silver normalized quotes | Plane B ingest + quote refresh (`backend/plane-b/src/ingest.ts`, `backend/plane-b/src/quote-refresh.ts`, `backend/plane-b/src/normalize/*`) | Plane B DB (silver schema via `backend/plane-b/src/repositories/implementations/*`) | Continuous; B2B sweeps follow corridor priority cadence, B2C refresh drains every 2 min (prod) / 1 min (dev) | Plane A (quotes), Gold jobs |
| Gold FX rates | `backend/scripts/oanda-rates-sync.ts`, `backend/scripts/gold-fx-rates-job.ts` | Plane A/Plane B DB + caches | OANDA sync hourly; gold-fx-rates job every 15 min (EventBridge) | Plane A rates endpoints, publisher outputs |
| Gold popular corridors | `backend/scripts/gold-popular-corridors-job.ts` | Gold tables + cache | Hourly (EventBridge) | Plane A popular corridors |
| Gold pulse cache | `backend/scripts/gold-pulse-cache-job.ts` | Gold cache + Pulse cache keys | Hourly (EventBridge) | Plane A `/pulse/*` |
| Gold publisher outputs | `backend/scripts/gold-publisher-job.ts` + Plane C publisher | Plane C DB / publisher outputs | Every 30 min (EventBridge) | Plane C `/internal/publisher/validate` and downstream consumers |

## Database schema inventory (from migrations)

### Bronze schema
- `bronze.provider_raw`: raw provider payload storage.

### Gold schema
- `gold.fx_rates`, `gold.fx_rate_history`, `gold.fx_provider_rates`, `gold.popular_corridors`, `gold.pulse_cache`, `gold.signal_history`, `gold.webhook_subscriptions`.

### Gold export schema
- `gold_export.corridor_rates`, `gold_export.cdp_daily`.

### Public types
- `circuit_state`, `export_job_status`, `export_job_type`, `ingestion_status`, `method_profile`, `quote_status`, `stoplist_status`.

### Silver schema (quotes + ingest)
- `silver.ingestion_run`, `silver.quote_record`, `silver.latest_quote_by_provider`, `silver.quote_attempt`, `silver.quote_refresh_request`.
- `silver.collector_attempt_metrics`, `silver.circuit_breaker`, `silver.fx_rate_refresh_request`.
- `silver.provider_rate_config`, `silver.freshness_slo_report`, `silver.b2b_sweep_schedule`.

### Silver schema (corridors + providers)
- `silver.corridor`, `silver.corridor_priority` (table), `silver.corridor_priority` (view).
- `silver.corridor_volatility_cache`, `silver.corridor_tier_manual`, `silver.hot_corridors`, `silver.corridor_signals`.
- `silver.provider`, `silver.provider_code_map`, `silver.provider_corridor_capability`, `silver.provider_endpoint_registry`.
- `silver.rights_matrix`, `silver.countries`.

### Silver schema (alerts + notifications + signals)
- `silver.alert_rule`, `silver.alert_state`, `silver.alert_event`.
- `silver.notification_pref`, `silver.notification_settings`, `silver.notification_device`, `silver.notification_opt_in_event`.
- `silver.email_suppression`, `silver.ops_alert_event`, `silver.rates`, `silver.rate_snapshots`.

### Silver schema (users + billing + exports)
- `silver.user_account`, `silver.user_plan`, `silver.user_session`, `silver.plan_usage_counter`.
- `silver.billing_webhook_event`, `silver.watchlist_item`, `silver.comparison_history`.
- `silver.export_job`, `silver.contact_submissions`, `silver.recent_searches`.
- `silver.newsletter_subscriber`, `silver.newsletter_subscriptions`, `silver.newsletter_status` (type).

### Silver schema (telemetry + marketing + ads)
- `silver.telemetry_search_event`, `silver.telemetry_outbound_click`, `silver.telemetry_provider_visit`, `silver.telemetry_session`.
- `silver.telemetry_affiliate_conversion`, `silver.telemetry_analytics_aggregate`, `silver.telemetry_marketing_event`.
- `silver.ad_placement`, `silver.ad_inventory`, `silver.ad_impression`, `silver.ad_click`.

### Legacy compatibility views
- `silver.providers`, `silver.corridors`, `silver.provider_quotes` are views in `backend/db/migrations/007_legacy_compat_views.sql` backed by `silver.provider`, `silver.corridor`, `silver.latest_quote_by_provider`.
- Legacy tables `silver.providers`, `silver.corridors`, `silver.provider_quotes`, `silver.clicks` originate in `backend/db/migrations/001_init.sql` and are superseded by canonical tables or views.

## Config limits, RPM, and operational caps

### Plane A (API limits)
- Rate limit (per IP or per user): `config.planeA.rateLimitMax` default 120 per `config.planeA.rateLimitWindowMs` (60s). Authenticated users get 5x allowance in `backend/plane-a/src/app.ts`.
- B2C cache + freshness: `config.planeA.b2c.cacheTtlSeconds` 900, `config.planeA.b2c.latestQuoteCacheTtlSeconds` 15, `config.planeA.b2c.fxRateCacheTtlSeconds` 300, `config.planeA.b2c.maxQuoteAgeSeconds` 1800, `config.planeA.b2c.jitterMs` 300.
- Payload caps: response size hard limit 10MB and warning at 5MB in `backend/plane-a/src/plugins/payload-size.ts`.
- Multipart caps: 5MB max file size, 1 file in `backend/plane-a/src/app.ts`.
- Timeout warnings: 5s warning, 28s near-timeout warning in `backend/plane-a/src/plugins/timeout-monitor.ts`.

### Plane B (queues + refresh limits)
- B2C refresh queue limits: `config.planeB.b2cRefreshBatchLimit` 50, `config.planeB.b2cRefreshMaxRetries` 3, `config.planeB.b2cRefreshConcurrency` 5.
- B2C live RPM caps: `config.planeB.b2cLiveRpm` and `config.planeB.b2cLivePerCorridorRpm` (default 0 = disabled).
- Circuit breaker defaults: `config.planeB.circuitOpenMs` 300000, `config.planeB.circuitHalfOpenMs` 60000, `config.planeB.blockCooldownMs` 86400000.
- B2B sweep cadence: `config.planeB.b2bSweepIntervalMinutes` 15, `config.planeB.b2bFullSweepDays` 30, `config.planeB.b2bTargetMinutes` 0, `config.planeB.b2bFreshnessSloMinutes` 30.
- FX rate cache: `config.fxRates.cacheTtlSeconds` 300, `config.fxRates.historyCacheTtlSeconds` 3600, `config.fxRates.dbFreshnessHours` 1, `config.fxRates.historyDays` 30, `config.fxRates.syncIntervalMinutes` 60.
- Queue modes: `config.queues.*` for quote refresh, FX refresh, exports, ingest fanout, notifications, ops alerts.

### Plane B (RPM controls + scheduler)
- Provider RPM source order: defaults (provider `limits.ts`) -> DB overrides (`ProviderRateRepository`) -> runtime overrides -> Redis penalties (`rpm_penalty:<providerId>`) in `backend/plane-b/src/collectors/rate-config.ts`.
- Scheduler caps: max RPM 100000, burst multiplier 2, max 1000 corridor buckets in `backend/plane-b/src/collectors/scheduler.ts`.
- RPM ramping thresholds in `backend/plane-b/src/collectors/rpm-ramp.ts`:
  - highBlockRate 0.01, moderateBlockRate 0.005, http2xxStableThreshold 0.95
  - decrease base 0.05 (max 0.30), increase base 0.05 (max 0.15), moderate decrease 0.075
- Per-locale buckets: `perLocale: true` in all provider `limits.ts`, so RPM is segmented by locale.

### Provider RPM defaults (from `backend/plane-b/src/providers/*/limits.ts`)

| Provider | HTTP rpm | HTTP perCorridor | HTTP concurrency | Playwright rpm | Playwright perCorridor | Playwright concurrency |
| --- | --- | --- | --- | --- | --- | --- |
| alansari | 20 | 4 | 1 | 4 | 2 | 1 |
| bossmoney | 6 | 2 | 1 | 4 | 2 | 1 |
| dahabshiil | 6 | 2 | 1 | 4 | 2 | 1 |
| instarem | 20 | 4 | 1 | 4 | 2 | 1 |
| intermex | 20 | 4 | 1 | 4 | 2 | 1 |
| koronapay | 20 | 4 | 2 | 4 | 2 | 1 |
| mukuru | 6 | 2 | 1 | 4 | 2 | 1 |
| orbitremit | 6 | 2 | 1 | 4 | 2 | 1 |
| pangea | 6 | 2 | 1 | 4 | 2 | 1 |
| paysend | 6 | 2 | 1 | 4 | 2 | 1 |
| placid | 20 | 4 | 2 | 4 | 2 | 1 |
| remitbee | 20 | 4 | 2 | 4 | 2 | 1 |
| remitly | 6 | 2 | 1 | 4 | 2 | 1 |
| ria | 6 | 2 | 1 | 4 | 2 | 1 |
| sendwave | 6 | 2 | 1 | 4 | 2 | 1 |
| singx | 20 | 4 | 2 | 4 | 2 | 1 |
| transfergo | 6 | 2 | 1 | 4 | 2 | 1 |
| wellsfargo | 6 | 2 | 1 | 4 | 2 | 1 |
| westernunion | 6 | 2 | 1 | 4 | 2 | 1 |
| wirebarley | 20 | 4 | 1 | 4 | 2 | 1 |
| wise | 30 | 2 | 2 | 4 | 2 | 1 |
| worldremit | 6 | 2 | 1 | 4 | 2 | 1 |
| xe | 6 | 2 | 1 | 4 | 2 | 1 |
| xoom | 6 | 2 | 1 | 4 | 2 | 1 |

### Config map + env var index (quick reference)
- Config root in `backend/shared/config.ts`: `runtime`, `planeA`, `planeB`, `planeC`, `fxRates`, `redis`, `queues`, `exports`, `marketing`, `alerts`, `observability`, `db`, `storage`, `auditLogs`, `geo`, `auth`, `billing`, `newsletter`.
- Plane A keys: port + rate limits + API key/JWT settings + admin emails + `planeA.b2c` cache controls + `planeA.cors` list controls.
- Plane B keys: sweep cadence, circuit breaker timings, B2C refresh batch/concurrency, `b2cQueueInSweep`, `b2cLiveRpm`, `b2cLivePerCorridorRpm`.
- Queue config: `QUOTE_REFRESH_QUEUE_URL`, `QUOTE_REFRESH_DLQ_URL`, `QUOTE_REFRESH_QUEUE_MODE`, `QUOTE_REFRESH_DB_FALLBACK`; `FX_RATE_REFRESH_QUEUE_URL`, `FX_RATE_REFRESH_DLQ_URL`, `FX_RATE_REFRESH_QUEUE_MODE`, `FX_RATE_REFRESH_DB_FALLBACK`; nested queue blocks for `EXPORT_JOB_QUEUE_URL`, `PLANE_B_INGEST_FANOUT_QUEUE_URL`, `PLANE_B_NOTIFICATIONS_QUEUE_URL`, `PLANE_B_OPS_ALERT_QUEUE_URL`.
- SQS client: `SQS_LONG_POLL_SECONDS` default 20 in `backend/shared/sqs.ts`.
- FX rate config: `FX_RATE_OANDA_FALLBACK`, `FX_RATE_REFRESH_ENABLED`, `FX_RATE_CACHE_TTL_SECONDS`, `FX_RATE_HISTORY_CACHE_TTL_SECONDS`, `FX_RATE_DB_FRESHNESS_HOURS`, `FX_RATE_HISTORY_DAYS`, `OANDA_SYNC_INTERVAL_MINUTES`.
- Storage config: `BRONZE_S3_BUCKET`, `BRONZE_S3_PREFIX`, `EXPORTS_S3_BUCKET`, `EXPORTS_S3_PREFIX`.
- Export limits: `EXPORT_JOB_MAX_ACTIVE_PER_USER` (default 2).
- Alerts config: `ALERT_SLACK_WEBHOOK_URL`, `ALERT_UNSUBSCRIBE_SECRET`, `ALERT_UNSUBSCRIBE_BASE_URL`, `ALERT_UNSUBSCRIBE_TOKEN_TTL_HOURS`, `ALERT_EMAIL_*`, `ALERT_EVALUATION_*`, `ALERTS_WEEKLY_SEND_DOW`, `ALERTS_WEEKLY_SEND_HOUR`, `SMART_ALERTS_LOOKBACK_DAYS`, `SMART_ALERTS_MIN_PROVIDERS`, `SMART_ALERTS_MIN_SAMPLE_DAYS`, `SMART_ALERTS_MIN_CONFIDENCE`, `SMART_ALERTS_WEEKLY_SEND_HOUR`.
- Observability: `CLOUDWATCH_METRICS_ENABLED`, `CLOUDWATCH_NAMESPACE`, `CLOUDWATCH_METRICS_FLUSH_INTERVAL_MS`, `CLOUDWATCH_HIGH_CARDINALITY_METRICS`, `TRACING_EXPORTER`, `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Auth/Supabase: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWKS_URL`, `SUPABASE_AUTH_VERIFY_MODE`, `SUPABASE_AUTH_REMOTE_VERIFY_CACHE_TTL_SECONDS`, plus `SUPABASE_MOCK_*` for dev.
- Billing/Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PLUS`, `STRIPE_PRICE_ID_PLUS_ANNUAL`, `STRIPE_TRIAL_DAYS`, `STRIPE_MOCK`, `FRONTEND_BASE_URL`.
- Newsletter: `NEWSLETTER_EMAIL_ENABLED`, `NEWSLETTER_EMAIL_FROM`, `NEWSLETTER_EMAIL_FROM_NAME`, `NEWSLETTER_BASE_URL`, `NEWSLETTER_TOKEN_EXPIRY_HOURS`, `NEWSLETTER_WELCOME_ENABLED`, `SES_FROM_ADDRESS`.
- Geo: `GEO_COUNTRY_HEADER` (default `cf-ipcountry`).

### Plane B provider override knobs (all providers)
- Providers with overrides: `alansari`, `bossmoney`, `dahabshiil`, `instarem`, `intermex`, `koronapay`, `mukuru`, `orbitremit`, `pangea`, `paysend`, `placid`, `remitbee`, `remitly`, `ria`, `sendwave`, `singx`, `transfergo`, `westernunion`, `wirebarley`, `wise`, `worldremit`, `xe`, `xoom`.
- Shared keys per provider: `delayMs`, `jitterMs`, `rateLimitBackoffMs`, `rateLimitJitterMs`, `rateLimitMaxRetries`, `corridorDelayMs`, `corridorJitterMs`, `b2bAmount`, `blockCooldownMs`, `sweepShardIndex`, `sweepShardCount`, `freshnessSloMinutes`, `freshnessSloEnabled`.
- BossMoney extra: `stateCode` (state filter for quotes).

## Deep dive appendix (LLM operator notes)

### Auth, roles, entitlements (Plane A)
Canonical route-level mapping lives in "Route auth map" below; keep this section in sync with that table.
- Auth plugin: `backend/plane-a/src/plugins/auth-plugin.ts` parses `Authorization` header, verifies Supabase JWT, attaches `request.user` or `request.authError`.
- Global auth gate: `backend/plane-a/src/app.ts` enforces `requireAuth()` for route prefixes like `/api/v1/me`, `/api/v1/billing`, `/api/v1/pulse`, `/api/v1/watchlist`, `/api/v1/alerts`, `/api/v1/history`, `/api/v1/exports`, `/api/v1/data`, `/api/v1/account`, `/api/v1/sessions`. `/api/v1/billing/webhook` is explicitly bypassed.
- `requireAuth()`: returns 401 with `error`, `code`, `message` when JWT missing/invalid.
- `requireAdmin()`: allows Supabase roles `admin`/`super_admin`, configured admin emails, or `silver.user_account.app_role` in Plane A DB. Otherwise 403.
- `requireEntitlement(entitlement)`: loads user plan and checks entitlements for `pulse`, `exports`, `alerts`, `history`.
- Entitlement mapping: `pulse` -> `/pulse/*` + `/pulse/status`; `exports` -> `/exports/*`; `history` -> `/history/corridor`; `alerts` -> alert creation limits.
- Plan entitlements (`backend/plane-a/src/services/entitlements.ts`):
  - Alerts max enforced in `backend/plane-a/src/routes/alerts.ts`.
  - Watchlist items enforced in `backend/plane-a/src/routes/watchlist.ts`.
  - History max days enforced in `backend/plane-a/src/routes/history.ts`.

| plan | pulse_access | exports_enabled | alerts_max | history_max_days | watchlist_items |
| --- | --- | --- | --- | --- | --- |
| free | none | false | 3 | 30 | 3 |
| plus | full | true | null | 365 | null |
| enterprise | full | true | null | null | null |

### Route auth map (summary)
- Admin-only: `/api/v1/admin/*`, `/api/v1/analytics/*`, `/api/v1/audit/logs*`, `/api/v1/telemetry/analytics`, `/api/v1/ops/*`, `/api/v1/admin/ads*`.
- Auth-required (user): `/api/v1/me`, `/api/v1/account/*`, `/api/v1/sessions/*`, `/api/v1/alerts/*` (except `/alerts/unsubscribe`), `/api/v1/watchlist/*`, `/api/v1/recent-searches/*`, `/api/v1/notifications/*`, `/api/v1/provider-visits/pending-feedback`, `/api/v1/provider-visits/:id/feedback`, `/api/v1/billing/*` (except webhook), `/api/v1/stripe/create-checkout`, `/api/v1/data/export*`.
- Entitlement-required: `/api/v1/pulse/*`, `/api/v1/pulse/status`, `/api/v1/exports/*`, `/api/v1/history/corridor`.

### API versioning + compatibility
- Versioned routes are mounted at `/api/v1/*` in `backend/plane-a/src/app.ts`.
- `backend/plane-a/src/plugins/api-versioning.ts` adds deprecation headers for unversioned `/api/*`. Unversioned routes are registered for backward compatibility (no path rewriting).
- Deprecation headers: `X-API-Version`, `X-API-Deprecation-Warning`, `Sunset`.

### Core domain primitives (IDs, buckets, methods)
- Corridor ID: `SRC-DEST-SRC_CCY-DEST_CCY` format in `backend/shared/corridor.ts`, e.g. `US-MX-USD-MXN`.
- Amount buckets: `DEFAULT_AMOUNT_BUCKETS = [50, 100, 500, 1000, 3000, 10000]` in `backend/shared/amount-bucket.ts`.
- Canonical payin methods: `bank_transfer`, `debit_card`, `credit_card`, `apple_pay`, `google_pay`, `cash`, `other` in `backend/plane-b/src/normalize/canonical.ts`.
- Canonical payout methods: `bank_deposit`, `cash_pickup`, `mobile_wallet`, `airtime`, `other` in `backend/plane-b/src/normalize/canonical.ts`.
- Method profiles (DB enum): `standard_bank`, `standard_card`, `cash_pickup` in `backend/plane-b/src/normalize/method-profile.ts`.
- Quality flags (stored in `silver.quote_record.quality_flags`): `parse_error`, `partial_data`, `bucket_approx`, `blocked`, `stale`, `estimated_delivery`, `min_send_violation`, `unknown_method`, `unsupported_corridor`, `invalid_method_profile` in `backend/plane-b/src/normalize/quality-flags.ts`.

### Pulse cache keys + chart catalog
- Cache key format: `pulse:<base>|corridor=<...>|timeframe=<...>|range=<...>|amount=<...>|payin=<...>|payout=<...>` in `backend/shared/pulse-cache-keys.ts`.
- Timeframes: `24h`, `7d`, `30d`, `1y`, `max`; ranges: `7d`, `30d`, `90d`, `365d`; amounts: `100`, `200`, `500`, `1000`.
- Chart IDs: `all-in-cost`, `fx-markup`, `fee-vs-markup`, `spread-distribution`, `provider-winner`, `leader-change-frequency`, `leader-edge`, `pass-through-latency`, `volatility-pulse`, `quote-anomalies`, `spread-volatility`, `quote-success`, `provider-availability`, `data-freshness`, `corridor-liquidity`.

### Health corridors (ops + probes)
- Canonical probe corridors per provider are defined in `backend/shared/health-corridors.ts` and used by ops routes and `*-probe` jobs.

### Plane A request lifecycle (high-level)
- Request hooks: auth plugin, session tracker, CORS config, rate limits, payload-size monitor, timeout monitor, RDS proxy monitor.
- Response hooks: API metrics + tracing + security headers in `backend/plane-a/src/app.ts`.
- Read-only mode: if `READ_ONLY_MODE=1`, non-GET/HEAD/OPTIONS (except health/metrics) return 503.

### Alerts (Plane A)
- Alert rule schema: `metric` in `rate`, `recipientGets`, `totalCost`, `fee`, `index`, `midMarketRate`, `sendScore`; `comparator` in `gt`, `gte`, `lt`, `lte`, `crosses_above`, `crosses_below`.
- Frequencies: `weekly`, `daily`; cooldown minutes map to 10080, 1440 in `backend/plane-a/src/routes/alerts.ts`.
- Plus soft cap: `PLUS_ALERTS_SOFT_LIMIT = 16` even when entitlements are unlimited.
- `sendScore` alerts require Plus, run weekly only, and are gated by `silver.corridor_signals.best_window_start/best_window_end` plus confidence and sample-days thresholds.
- Unsubscribe flow updates `silver.notification_pref` and uses `ALERT_UNSUBSCRIBE_SECRET` for token verification.

### Watchlist (Plane A)
- Watchlist targets: `corridor` {from, to, method}, `fxPair` {base, quote}, `pulseChart` {chartId}, `guide` {slug}.
- Corridor target payload normalizes to uppercase and defaults `method` to `bank`.
- Free plan default limit 3; Plus soft cap `PLUS_WATCHLIST_SOFT_LIMIT = 16` in `backend/plane-a/src/routes/watchlist.ts`.
- Storage: `silver.watchlist_item` (`target_type`, `target_payload`, `label`).

### Notification settings (Plane A)
- Settings schema: `emailEnabled`, `smsEnabled`, `pushEnabled`, `rateAlerts`, `weeklySummary`, `marketUpdates`, `productUpdates`, `promotional`.
- Defaults: email enabled, sms disabled, push disabled, rate alerts + weekly summary true, marketing false.
- Tables: `silver.notification_settings`, `silver.notification_pref`, `silver.notification_device`, `silver.notification_opt_in_event`.
- Push subscribe: platform `web|ios|android`, requires token or subscription endpoint; inserts device and flips `pushEnabled` on.
- Push unsubscribe: deactivates device, recalculates active device count, flips `pushEnabled` off when zero.

### Telemetry (Plane A)
- Event schemas (see `backend/plane-a/src/routes/telemetry.ts`):
  - Search: `session_id`, `corridor_id`, `amount` or `amount_bucket`, optional `anon_id`, `payin`, `payout`, `utm`, `gclid`, `fbclid`, `msclkid`, `page_path`.
  - Click: `session_id`, `provider_id`, optional `anon_id`, `corridor_id`, `target_url`, `quoted_rate`, `quoted_fee`, `is_affiliate`, `utm`, `gclid`, `fbclid`, `msclkid`, `page_path`.
  - Conversion: `session_id`, `provider_id`, optional `anon_id`, `corridor_id`, `conversion_value`, `conversion_currency`, `offer_id`, `source`, `page_path`, `utm`, `gclid`, `fbclid`, `msclkid`.
  - Session: `session_id` (optional), `anon_id`, `referrer`, `first_page`, `utm`, `gclid`, `fbclid`, `msclkid`.
- Rate limits per session (Redis): search 100/min, click 50/min, conversion 40/min. Keys: `telemetry:search:<session_id>`, `telemetry:click:<session_id>`, `telemetry:conversion:<session_id>`.
- Privacy: telemetry skipped if user `analytics_enabled` is false in `silver.user_account`.

### Exports pipeline (Plane A + worker)
- Request payload: `dataType` in `history|watchlist|alerts|all`, `format` in `csv|pdf`, optional `dateFrom`, `dateTo`, `itemIds`.
- Job types: `history_csv`, `history_pdf`, `watchlist_csv`, `watchlist_pdf`, `alerts_csv`, `alerts_pdf`, `all_csv`, `all_pdf`.
- Config: `config.exports.maxActivePerUser` default 2; queue config `EXPORT_JOB_QUEUE_URL` + mode.
- Export worker (`backend/scripts/export-worker.ts`) modes: `queue` (SQS), `shadow`, `off` (DB polling).
- Worker knobs: `EXPORT_QUEUE_BATCH_SIZE` default 5, `EXPORT_QUEUE_IDLE_SLEEP_MS` 2000, `EXPORT_QUEUE_LOCK_TTL_SECONDS` 120, `EXPORT_JOB_EXPIRY_DAYS` 7.
- Storage: S3 `config.storage.exports.bucket` + `config.storage.exports.prefix`.

### B2C quotes flow (detailed)
- `/api/v1/quotes/current` (`backend/plane-a/src/routes/quotes.ts`):
  - Validates `corridor_id`, `amount`/`amount_bucket`, `payin`, `payout`; parses corridor ID.
  - Computes bucket selection, applies corridor capability filtering and rights matrix (B2C providers).
  - Reads latest quotes from `silver.latest_quote_by_provider` via `LatestQuoteRepository`.
  - Determines freshness using volatility-based TTL (via `VolatilityService`) and provider-level `collected_at`.
  - If `live=true` or `amount` present and cache is stale, enqueues refresh requests (per provider) via `QuoteRefreshRepository` and returns `refresh` metadata (request_ids, providers).
  - Adds affiliate URLs, ETag caching, and metrics (`recordQuoteRequest`, `recordSearch`).
- `/api/v1/quotes/refresh-status`:
  - Accepts `request_ids` and returns counts by status (`pending`, `processing`, `completed`, `failed`, `blocked`, `skipped`) and `done` flag.

### Quote normalization pipeline (Plane B)
- Parser output -> normalize:
  - Canonicalize payin/payout methods.
  - Compute amount buckets.
  - Derive `method_profile`.
  - Merge parser flags and add normalization flags.
  - Compute `implied_fx_rate` and `total_debit_amount`.
  - Persist to `silver.quote_record` and upsert `silver.latest_quote_by_provider`.
- Implementation: `backend/plane-b/src/normalize/quote-normalizer.ts`, `backend/plane-b/src/repositories/implementations/quote-record-repository.ts`.

### Queue contracts (SQS + DB fallback)
- Quote refresh message (`backend/plane-b/src/quote-refresh.ts`):
```json
{
  "requestId": "uuid",
  "providerId": "remitly",
  "corridorId": "US-MX-USD-MXN",
  "amountBucket": 500,
  "payinMethod": "bank_transfer",
  "payoutMethod": "bank_deposit"
}
```
- FX rate refresh message (`backend/plane-b/src/fx-rate-refresh.ts`):
```json
{
  "requestId": "uuid",
  "baseCurrency": "USD",
  "quoteCurrency": "MXN"
}
```
- Alert evaluation message (`backend/scripts/alert-evaluation-worker.ts`):
```json
{
  "frequency": "realtime|hourly|daily",
  "timeBucket": 1690000000
}
```
- Ingest fanout message (`backend/plane-b/src/ingest.ts`, `backend/scripts/b2b-sweep-scheduler.ts`):
```json
{
  "providerId": "wise",
  "collectorType": "b2b_full_sweep|b2b_tier_1_alpha|b2b_tier_2_reference|b2b_tier_3_discovery|b2c_live",
  "corridors": ["US-MX-USD-MXN"],
  "amountBuckets": [500],
  "payinMethod": "bank_transfer",
  "payoutMethod": "bank_deposit",
  "freshnessSloMinutes": 30,
  "freshnessSloEnabled": true,
  "rpmOverride": 10,
  "perCorridorRpmOverride": 2,
  "priorityTier": "tier_1_alpha",
  "shardIndex": 0,
  "requestedAt": "2024-01-01T00:00:00.000Z"
}
```
- Export job message (`backend/plane-a/src/routes/exports.ts`):
```json
{
  "jobId": "uuid",
  "jobType": "history_csv|history_pdf|watchlist_csv|watchlist_pdf|alerts_csv|alerts_pdf|all_csv|all_pdf",
  "userId": "uuid"
}
```
- Notifications queue message (`backend/plane-b/src/notifications/dispatcher.ts`):
```json
{
  "signalType": "ARBITRAGE_SIGNAL",
  "corridorId": "US-MX-USD-MXN",
  "providerId": "remitly",
  "anomaly": {
    "zScore": 2.5,
    "currentRate": 19.85,
    "avg24h": 19.2,
    "stdDev24h": 0.26,
    "direction": "above"
  },
  "requestedAt": "2024-01-01T00:00:00.000Z"
}
```
- Ops alerts queue message (`backend/scripts/ops-alerts-queue-worker.ts`):
```json
{
  "alertId": "uuid",
  "providerId": "remitly",
  "corridorId": "US-MX-USD-MXN",
  "amountBucket": 500,
  "httpStatus": 429,
  "blockReason": "rate_limited",
  "bronzeObjectKey": "bronze/remitly/US-MX-USD-MXN/...",
  "requestId": "uuid",
  "payload": {},
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```
- Queue modes: `off` (no SQS), `queue` (worker consumes SQS), `shadow` (worker consumes DB; SQS may still receive enqueue events). DB fallback toggles via `QUOTE_REFRESH_DB_FALLBACK` and `FX_RATE_REFRESH_DB_FALLBACK`.

### Queue worker behavior (refresh + alerts)
- Quote refresh worker (`backend/plane-b/src/quote-refresh.ts`):
  - Checks freshness using volatility TTL; if fresh -> `skipped` with reason `quote_already_fresh`.
  - Unsupported provider -> `failed`; otherwise runs provider with `collectorType: 'b2c_live'`.
  - Statuses: `pending`, `processing`, `completed`, `failed`, `blocked`, `skipped`.
  - RPM overrides: `config.planeB.b2cLiveRpm` and `config.planeB.b2cLivePerCorridorRpm` if > 0.
- FX rate refresh worker (`backend/plane-b/src/fx-rate-refresh.ts`):
  - Checks freshness using `config.fxRates.dbFreshnessHours`; if fresh -> `skipped`.
  - Fetches via `OandaRateFetcher`, writes `gold.fx_rates`, invalidates cache keys.
  - Statuses: `pending`, `processing`, `completed`, `failed`, `skipped`.
- Alert evaluation worker (`backend/scripts/alert-evaluation-worker.ts`):
  - Uses `WorkerLock` to avoid parallel runs; extends SQS visibility.
  - Evaluates alerts via `evaluateAlertsForFrequency`, retries with backoff, sends failures to DLQ.

### Redis key map (selected)
- Token buckets: `token_bucket:<provider>[:scope][:locale]`, `token_bucket:corridor:<provider>[:scope]:<corridor>[:locale]` in `backend/plane-b/src/collectors/scheduler.ts`.
- Circuit breakers: `circuit:provider:<provider>` and `circuit:provider:<provider>:corridor:<corridor>` in `backend/plane-b/src/lib/redis-circuit-breaker.ts`.
- RPM penalties: `rpm_penalty:<provider>` storing `{ factor, expires_at }`, TTL uses `config.planeB.circuitOpenMs`.
- Worker locks: `worker:lock:<name>` with TTL default 60s in `backend/plane-b/src/lib/worker-lock.ts` (local fallback in non-prod).
- Repository caches: `fx_rate:*`, `fx_rate_history:*`, `pulse_cache:*`, `queue_depth:*` with TTLs 300s, 3600s, 3600s, 30s in `backend/shared/repository-cache.ts`.
- Telemetry rate limits: `telemetry:search:<session_id>`, `telemetry:click:<session_id>`, `telemetry:conversion:<session_id>`.

### Block detection + ops alerts (Plane B)
- Blocked if HTTP status 403 or 429, or body text contains keywords (`captcha`, `access denied`, `bot`, `challenge`, `forbidden`, `too many requests`, `rate limit`, `quota exceeded`, `suspended`, `banned`, `blocked`, `unauthorized`, `service unavailable`).
- Body scan capped at 10KB for performance in `backend/plane-b/src/collectors/block-detection.ts`.
- Ops alerts routing in `backend/plane-b/src/collectors/alert-routing.ts` uses Slack webhook and/or SMTP if enabled.
- If `config.queues.opsAlerts.mode === 'queue'`, alerts are enqueued and routed by `backend/scripts/ops-alerts-queue-worker.ts`.

### Signals + notifications (Plane B)
- Anomaly detection uses Z-score in `backend/plane-b/src/signals/anomaly-detector.ts`:
  - Threshold default 2.0 (`ANOMALY_Z_SCORE_THRESHOLD`), min samples 10 (`ANOMALY_MIN_SAMPLES`), baseline window 24h (`ANOMALY_BASELINE_HOURS`).
- Signal types: only `ARBITRAGE_SIGNAL` in `backend/plane-b/src/notifications/config.ts`.
- Webhook dispatch:
  - Payload fields: `type`, `corridor`, `provider`, `current_rate`, `avg_24h`, `deviation_sigma`, `direction`, `timestamp`.
  - HMAC-SHA256 signature header `X-RemitScout-Signature` with `X-RemitScout-Timestamp`.
  - Retry policy from `backend/plane-b/src/notifications/config-aws.ts`: max retries 3, timeout 5000ms, backoff base 1000ms, max backoff 8000ms.
  - Concurrency defaults: parallel dispatch enabled, max 10 in `NOTIFICATION_CONFIG`.
- Channels: webhook only today; email/SMS/push are scaffolded but not implemented yet.
- Notification env vars (Plane B): `EMAIL_PROVIDER`, `SES_REGION`, `SES_FROM_ADDRESS`, `SES_FROM_NAME`, `SES_REPLY_TO`, `SENDGRID_API_KEY`, `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME`, `EMAIL_MAX_RETRIES`; `SMS_PROVIDER`, `SNS_REGION`, `SNS_TOPIC_ARN`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `SMS_MAX_RETRIES`; `WEBHOOK_MAX_RETRIES`, `WEBHOOK_TIMEOUT_MS`, `WEBHOOK_BACKOFF_BASE_MS`, `WEBHOOK_MAX_BACKOFF_MS`; `NOTIFICATION_PARALLEL`, `MAX_CONCURRENT_DISPATCHES`; `PUSH_PROVIDER`, `FIREBASE_SERVER_KEY`, `PUSH_MAX_RETRIES`.

### Collector lifecycle (Plane B)
- `BaseCollector.initialize` sets corridors, buckets, payin/payout, locale, collector type, freshness SLO, and resolves RPMs from defaults -> DB overrides -> runtime overrides -> Redis penalty.
- Scheduler uses token buckets (provider + corridor) with base delay + jitter, per-locale buckets, and Redis-backed rate limiting when available.
- `applyRpmRamp` auto-adjusts RPM for sweep collectors based on block rate and HTTP success rate; persists new RPM to DB.
- Per-collector RPM scope: `resolveRateLimitScope` returns `b2c` for b2c collectors; otherwise null.

### B2B sweep + ingest planning
- Priority tiers loaded from `silver.corridor_priority` (interval and SLO minutes).
- `b2b-sweep-scheduler.ts` runs frequently, partitions corridors, and enqueues ingest fanout messages based on tier cadence.
- Per-provider B2B amount and payin/payout overrides live in `backend/plane-b/src/ingest.ts` and `backend/scripts/b2b-sweep-scheduler.ts`.
  - Payin overrides: `koronapay`, `paysend`, `remitbee`, `sendwave`, `intermex`, `placid` -> `debit_card`.
  - Payout overrides: `koronapay`, `paysend`, `remitbee`, `intermex` -> `bank_deposit`.

### Bronze storage details
- Bronze writes compress JSON payloads to `s3://<bucket>/<prefix>/<provider>/<corridor>/<timestamp>-<uuid>.json.gz`.
- Storage config: `config.storage.bronze.bucket` + `config.storage.bronze.prefix` in `backend/shared/config.ts`.

### Gold publisher (Plane C) internals
- Aggregates `silver.latest_quote_by_provider` into 4-hour buckets and writes `gold_export.corridor_rates`.
- Gate rules (`backend/plane-c/src/services/publisher-gates.ts`):
  - `contributor_count >= 3`.
  - `top_provider_share <= 0.5`.
  - `top_two_share <= 0.75`.
- Job batches 10 corridors at a time; logs published/withheld counts.

### Scheduled job cadence map (CDK)

| Job | Schedule | Entry point |
| --- | --- | --- |
| gold-fx-rates | every 15 min | `backend/scripts/aws/gold-fx-rates-lambda.ts` |
| export-worker | every 1 min | `backend/scripts/aws/export-worker-lambda.ts` |
| alert-evaluation scheduler | every 5 min (realtime), hourly, hourly (daily buckets) | `backend/scripts/aws/alert-evaluation-scheduler-lambda.ts` |
| alert-evaluation worker | every 1 min | `backend/scripts/aws/alert-evaluation-worker-lambda.ts` |
| telemetry-analytics | hourly | `backend/scripts/aws/telemetry-analytics-job-lambda.ts` |
| session-cleanup | daily 02:00 | `backend/scripts/aws/session-cleanup-lambda.ts` |
| bank-vs-specialist refresh | every 30 min | `backend/scripts/aws/bank-vs-specialist-refresh-lambda.ts` |
| audit-log cleanup | monthly day 1 03:00 | `backend/scripts/aws/audit-log-cleanup-lambda.ts` |
| oanda sync | hourly | `backend/scripts/aws/oanda-sync-lambda.ts` |
| gold-popular-corridors | hourly | `backend/scripts/aws/gold-popular-corridors-lambda.ts` |
| gold-pulse-cache | hourly | `backend/scripts/aws/gold-pulse-cache-lambda.ts` |
| gold-publisher | every 30 min | `backend/scripts/aws/gold-publisher-lambda.ts` |
| b2c-retry-failed | every 15 min | `backend/scripts/aws/b2c-retry-failed-lambda.ts` |
| b2c-queue-cleanup | daily 02:30 | `backend/scripts/aws/quote-refresh-queue-cleanup-lambda.ts` |
| stoplist-auto-resume | daily 02:00 | `backend/scripts/aws/stoplist-auto-resume-lambda.ts` |
| rights-matrix-sync-countries | dev: hourly, others: every 6h | `backend/scripts/aws/rights-matrix-sync-countries-lambda.ts` |
| b2c-refresh (ECS task) | dev: every 1 min, prod: every 2 min | `backend/scripts/aws/b2c-refresh-worker-ecs.ts` |
| provider probes | every 5 min per provider | `backend/scripts/aws/*-probe-lambda.ts` |

## Critical pipelines
- B2C refresh: Plane A enqueues -> SQS `quote-refresh` -> Plane B `processQuoteRefreshQueue`.
- B2B ingest: Plane B ingestion service crawls providers, writes Silver + Bronze.
- Gold jobs: `backend/scripts/gold-*.ts` scheduled via EventBridge.
- FX rates: `backend/scripts/oanda-rates-sync.ts` + `FxRateRepository`.

## Definitions
### Works
- `/api/v1/quotes/current` returns quotes for Tier-1 corridors after explicit Compare.
- `/api/v1/quotes/refresh-status` completes with `completed|skipped` and zero pending.
- B2C refresh queue drains; DB queue depth stable.
- Plane B ingest writes fresh Silver quotes.
- Gold jobs succeed on schedule; Plane C serves published outputs.
- Guardrails: Plane A cannot access Bronze (see guardrail scripts/tests).
- UI: amount changes do not trigger quote refresh until Compare is pressed.

### Flawless
- 0% 5xx on core endpoints; p95 < 200ms for search/compare.
- Tier-1 freshness <= 15m, Tier-3 freshness <= 4h.
- Provider coverage >= 3 in published datasets.
- No DLQ growth for refresh queues; no sustained queue backlog.
- Hidden markup math consistent: mid-rate present or explicit fallback.

### Production-ready
- Infra: VPC, SGs, API GW, ECS, Lambda, SQS, RDS Proxy, Redis all deployed.
- Secrets/SSM wired; least privilege IAM, X-Ray + CloudWatch metrics/alarms.
- Golden Rule enforced at runtime (Plane A no Bronze access).
- CI/CD + rollback defined; migration cutover runbook exists.

## B2B tiers + indices (RVI/TEER/RCI)
### Best-practice tiering (do this before edits)
- Avoid a "free" public tier for pro data; offer a limited trial with hard caps and strict cache/latency.
- Separate tiers by: corridor coverage, freshness cadence, history depth, and export volume.
- Make Tier-1 the fastest cadence + most volatile/new corridors; Tier-2 broader + slower; Tier-3 slower + stable.
- Use usage-based overage on top of base subscription; include per-tenant rate limits and burst controls.
- Sell "indices as product" first: RVI/TEER/RCI should have dedicated SLAs and dashboards.
- Launch sequencing: ship B2C/B2B core product first, then enable indices exports after 2-3 months of history.

### Recommended tier model (non-free)
- **Tier-3 (Baseline)**: stable corridors only, 15–60 min cadence, daily aggregates, limited history.
- **Tier-2 (Expanded)**: Tier-3 + volatile corridors, 5–15 min cadence, richer history, export jobs.
- **Tier-1 (Real-time)**: Tier-2 + new/high-volatility corridors, 1–5 min cadence, webhooks, custom SLAs.
- Everything in higher tiers includes lower tiers; tier gating is additive.

### AWS architecture for fast indices
- **Plane B** computes RVI/TEER/RCI into Silver/Gold tables.
- **Plane C** publishes Gold outputs (scheduled jobs).
- **Plane A** serves B2B API + token issuance + exports + audit logs.
- **Cache layer** for indices: Redis for hot corridor keys (p95 < 200ms).
- **Optional ClickHouse** for high-QPS historical slices and fast aggregate windows.

### Access tokens + enterprise accounts
- Use tenant-scoped API keys + short-lived JWT access tokens.
- Provide refresh tokens via Plane A endpoints and rotate regularly.
- Enforce scopes: `indices.read`, `indices.export`, `indices.history`, `webhooks.manage`.
- Store tenant entitlements and rate limits in Plane A DB; apply in auth plugin.

### Export/reporting pattern
- Async export jobs -> S3 artifacts + presigned URLs.
- Enterprise can receive delivery to their S3 (cross-account role).
- Provide embeddable chart endpoints (signed tokens, limited TTL).

### AWS + repo changes (concrete targets)
- New Plane A routes:
  - `backend/plane-a/src/routes/indices.ts` (RVI/TEER/RCI API).
  - `backend/plane-a/src/routes/exports/indices.ts` (export jobs).
- New Plane A services:
  - `backend/plane-a/src/services/indices.ts` (fetch + cache + entitlements).
  - `backend/plane-a/src/services/token-service.ts` (tenant tokens/rotation).
- Repositories:
  - `backend/plane-a/src/repositories/interfaces/indices-repository.interface.ts`
  - `backend/plane-a/src/repositories/implementations/indices-repository.ts`
- Gold jobs:
  - `backend/scripts/gold-indices-job.ts`
  - `backend/scripts/aws/gold-indices-job-lambda.ts`
- Caching:
  - `backend/shared/pulse-cache-keys.ts` extended for indices keys.
- Infra/CDK:
  - `infrastructure/cdk/lib/scheduled-jobs.ts` add indices job lambda.
  - `infrastructure/cdk/lib/api.ts` expose indices API.

## Verification checklist
### B2C refresh
- API check:
  - `GET /api/v1/quotes/current?corridor_id=US-MX-USD-MXN&amount=500&payin=bank_transfer&payout=bank_deposit`
  - Expect: `refresh.enqueued=true`, then `quotes.count>0` within ~1-2 min.
- Status check:
  - `GET /api/v1/quotes/refresh-status?request_ids=...`
  - Expect: `done=true`, `pending=0`.
- Logs:
  - `/remit-scout/dev/b2c-refresh-worker` should show `queue_processed` with non-zero counts.

### B2B ingest
- ECS service running: `remit-scout-dev-PlaneBIngestService...` desired=1/running=1.
- Logs:
  - `/remit-scout/dev/plane-b-ingest` shows `quote_attempt_finish` with `status=success`.

### Silver/Gold
- Gold FX rates up-to-date:
  - OANDA sync log group `/aws/lambda/*OandaSyncJob*` shows `sync_complete`.
- Gold publisher jobs:
  - CloudWatch metrics in `RemitScout` namespace: `gold_*_job_last_success_age_seconds`.

### Guardrails
- `backend/scripts/bronze-access-check.js` must return forbidden for Plane A.
- `backend/tests/guardrails.test.ts` must pass when `RUN_BRONZE_GUARDRAIL_TEST=1`.

## Known failure modes + fixes
- ECS tasks show `exec format error`: image built for arm64. Rebuild with `--platform linux/amd64` and redeploy.
- B2C refresh stuck pending:
  - Check SQS depth, worker logs, and DB queue depth.
  - Verify `QUOTE_REFRESH_QUEUE_MODE=queue` and URL present in Plane A + Plane B.
- FX rate missing:
  - OANDA sync job failed or currency unsupported. Consider fallback logic in `FxRateRepository`.

## Files that matter for B2B/B2C correctness
- B2C refresh loop:
  - `backend/scripts/b2c-refresh-worker.ts`
  - `backend/scripts/aws/b2c-refresh-worker-ecs.ts`
  - `backend/plane-b/src/quote-refresh.ts`
  - `backend/plane-a/src/routes/quotes.ts`
- B2B ingest:
  - `backend/plane-b/src/ingest.ts`
  - `backend/plane-b/src/providers/*/collector.ts`
  - `backend/plane-b/src/collectors/http-client.ts`
- FX rates / hidden markup:
  - `backend/scripts/oanda-rates-sync.ts`
  - `backend/plane-a/src/repositories/implementations/fx-rate-repository.ts`
  - `backend/plane-a/src/routes/bank-vs-specialist.ts`
- Queue/SQS config:
  - `backend/shared/config.ts`
  - `backend/shared/sqs.ts`
- AWS entrypoints:
  - `backend/scripts/aws/plane-b-ingest-ecs.ts`
  - `backend/scripts/aws/*-probe-lambda.ts`

## Deployment notes (local build)
- On Apple Silicon, build ECS images with:
  - `docker buildx build --platform linux/amd64 -f backend/Dockerfile -t <repo>:<tag> --push .`
- ECS uses tags from CDK context `backendImageTag`.

## B2B/B2C sweep mechanics + tiering (decisions)
### Current decisions (agreed)
- **Tier stability**: tier assignments are versioned and never rewritten.
- **Tier snapshots**: lock corridor tiers per period (monthly/quarterly).
- **Tier change cadence**: promotions/demotions only on period boundaries with a change log.
- **Normalization**: exports normalize to **$500 USD equivalent** in send currency; always include destination currency equivalent.
- **Option B now**: hot cache from Silver + batch Gold jobs. Event-driven Gold is Phase 2.
- **Alerts**: Silver for real-time triggers; Gold for aggregate/long-window alerts.

### Volatility (how we compute it)
- OANDA does **not** provide volatility directly.
- We derive volatility from FX history (rolling log-return stddev, range/ATR proxy, percentile rank).
- Volatility bands are deterministic initially; re-evaluated weekly.

### Tier model (labels vs reality)
- **Tier-1 label** = Tier-2 cadence (5–15 min), **coming soon** for true 1–2 min.
- **Tier-2 label** = Tier-3 cadence (15–60 min).
- **Tier-3 label** = daily aggregates only.
- Higher tiers include lower tiers; gating is additive.

### Coverage gating for Gold publish
- Use weighted coverage: sum(provider reliability scores) ≥ **3.75**.
- Enforce minimum provider count ≥ **3**.
- If below threshold: publish with low-confidence flags (not hard-blocked).

### Option B wiring (now)
- Plane B writes Silver normalized quotes.
- Hot cache keys in Redis for Tier-1/2 corridors updated directly from Silver.
- Gold jobs remain authoritative for history and nightly aggregates.
- Plane A reads Redis first, falls back to Gold/Silver as needed.

### Option A wiring (future)
- Emit events on Silver writes (SQS/EventBridge).
- Gold publisher consumes events to update aggregates in near real time.
- Redis stays as hot cache for fastest reads.

### Alerts wiring (smart + scheduled)
- Weekly/daily alert evaluations: triggered off Silver (latest normalized quotes + corridor signals).
- Scheduled/aggregate alerts: use Gold (weekly/monthly thresholds).
- Smart alerts should reference tier snapshot version for historical consistency.

### AWS architecture (fast indices)
- ECS Plane B ingest runs 24/7 in private subnets.
- SQS/EventBridge for refresh + future event-driven Gold.
- Redis for hot index cache; RDS for Silver/Gold.
- Optional ClickHouse for high-QPS historical slices and analytics.

### Study + dashboard strategy
- Internal: Ops dashboard for pipeline freshness, queue depth, publish readiness.
- External: export jobs to S3 + presigned URLs for enterprise clients.
- Always store: `tier_version`, `effective_from`, `effective_to`, and `coverage_score` in exports.

## Volatility computation (source of truth)
- OANDA does **not** return volatility directly.
- Compute volatility using FX history (rolling log-return stddev, range/ATR proxy, percentile rank).
- Re-evaluate weekly; only apply tier changes at period boundaries.

## Silver -> Gold strategy (current + future)
- **Option B (current)**: Redis hot cache fed directly from Silver for Tier-1/2 corridors; Gold batch jobs for history.
- **Option A (future)**: event-driven Gold updates via SQS/EventBridge on Silver writes; Redis remains the hot cache.

## Alerting sources (real-time vs aggregate)
- Weekly/daily alerts: Silver (latest normalized quotes + corridor signals).
- Aggregate alerts: Gold (weekly/monthly trends).
- All alert payloads must include tier snapshot version and coverage score.

## Export readiness checklist
- Minimum provider coverage >= 3 and weighted score >= 3.75.
- Freshness within tier SLO.
- Gold job success age within schedule window.
- Export contains normalized $500 USD send amount + destination equivalent.

## Glossary (short)
- **Bronze**: raw provider payloads (Plane B only).
- **Silver**: normalized quotes + refresh statuses.
- **Gold**: curated outputs (indices, pulse cache, publisher).
- **Tier snapshot**: frozen corridor tier assignment for a period.
