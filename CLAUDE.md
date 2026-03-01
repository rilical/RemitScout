# CLAUDE.md — Remit-Scout V2

Remit-Scout is a remittance price comparison platform. It aggregates real-time quotes from 20+ money transfer providers (Wise, Remitly, Western Union, etc.), normalizes them into a bronze/silver/gold data pipeline, and serves them via a B2B API (Plane A) and B2C frontend. The system includes self-healing agents that detect and repair collector failures autonomously.

## Architecture

Three backend planes + frontend + CDK infrastructure:

| Plane | Purpose | Entry point | Port |
|-------|---------|-------------|------|
| **Plane A** | B2B/B2C API (Fastify) | `backend/plane-a/src/server.ts` | 4000 |
| **Plane B** | Collectors, agents, workers | `backend/plane-b/src/ingest.ts` | — |
| **Plane C** | Gold publisher API | `backend/plane-c/src/server.ts` | 4100 |
| **Frontend** | Nuxt 3 + Vue + Tailwind | `frontend/app.vue` | 3000 |
| **CDK** | AWS infrastructure | `infrastructure/cdk/bin/app.ts` | — |

Planes communicate via SQS queues and shared Postgres — never direct imports across planes. The only shared import path is `backend/shared/`.

## Commands

### Install
```bash
pnpm install                    # Root (installs all workspaces)
cd frontend && pnpm install     # Frontend-specific (if needed)
cd infrastructure/cdk && npm install  # CDK (uses npm, not pnpm)
```

### Run locally
```bash
pnpm dev:all                    # Start all planes + frontend
pnpm dev:backend                # Backend only (no frontend)
cd backend && pnpm dev:plane-a  # Plane A only (tsx watch)
cd backend && pnpm dev:plane-c  # Plane C only (tsx watch)
cd backend && pnpm dev:plane-b:once  # Plane B single ingest run
cd frontend && pnpm dev         # Frontend only (Nuxt, port 3000)
```

### Test
```bash
cd backend && pnpm test         # Backend unit tests (vitest + coverage)
cd backend && pnpm test:watch   # Watch mode
cd backend && pnpm test:mutation  # Mutation testing (Stryker)
cd frontend && pnpm test        # Frontend unit tests (vitest)
cd frontend && pnpm test:e2e    # E2E tests (Playwright)
```

### Type check
```bash
cd backend && pnpm build        # Compiles plane-a, plane-c, plane-b, scripts
cd frontend && pnpm type-check  # Nuxt typecheck
cd infrastructure/cdk && npx tsc --noEmit  # CDK type check
```

### Lint
```bash
pnpm lint                       # Root ESLint (backend)
cd frontend && pnpm lint        # Frontend ESLint
```

### CDK
```bash
cd infrastructure/cdk && npx cdk synth --quiet  # Synthesize CloudFormation
cd infrastructure/cdk && npx cdk diff           # Show pending changes
cd infrastructure/cdk && npx cdk deploy         # Deploy (requires AWS creds)
```

### Database
```bash
cd backend && pnpm db:migrate   # Run migrations (backend/db/migrations/)
cd backend && pnpm db:seed      # Seed data via ingest run
```

### Guardrails
```bash
cd backend && pnpm guardrail:sql                  # SQL injection scan (all planes)
cd backend && pnpm guardrail:sql:unsafe-interpolation  # Find string-concatenated SQL
cd backend && pnpm guardrail:test                 # Bronze layer access check
```

## File Conventions

| What | Location | Pattern |
|------|----------|---------|
| Tests | `backend/tests/*.test.ts` | Colocated test directory, not next to source |
| Migrations | `backend/db/migrations/NNN_*.sql` | Sequential numbering (currently 000-093) |
| CDK constructs | `infrastructure/cdk/lib/*.ts` | 4 nested stacks: Foundation, Runtime, Edge, Ops |
| Routes | `backend/plane-a/src/routes/*.ts` | Registered in `app.ts` with `/api/v1` prefix |
| Collectors | `backend/plane-b/src/collectors/*.ts` | One file per provider |
| Agents | `backend/plane-b/src/agents/*.ts` | Self-healing pipeline components |
| Shared code | `backend/shared/*.ts` | Cross-plane utilities, config, DB, Redis |
| Frontend pages | `frontend/pages/**/*.vue` | Nuxt file-based routing |
| Frontend components | `frontend/components/**/*.vue` | Auto-imported by Nuxt |

## Architecture Rules

**These are hard rules. Violations will cause problems.**

1. **Plane isolation**: Plane A never imports from Plane B/C directly. Communication is via SQS queues or shared database. The ONLY cross-plane import allowed is from `backend/shared/`.

2. **Config through config.ts**: All configuration reads go through `backend/shared/config.ts`. Never use raw `process.env` in application code. Config uses `toBoolean()`, `toNumber()`, `toOptionalNumber()` helpers.

3. **Parameterized SQL only**: Use `$1, $2` placeholders with `pool.query(sql, [params])`. Never concatenate user input into SQL strings. Run `pnpm guardrail:sql:unsafe-interpolation` to verify.

4. **Structured logging**: Use `createLogger('module-name')` from `backend/shared/logger.ts`. Never use `console.log` in production code. Logger emits JSON with correlation IDs.

5. **Typed errors**: Use error classes from `backend/shared/errors.ts`. Never throw raw `new Error()` in route handlers.

6. **Auth on all routes**: Admin routes use `requireAdmin()` preHandler. Account routes use `requireAuth()`. B2B routes use API key validation. Auth bypass paths are explicitly declared in `PLANE_A_AUTH_BYPASS_ROUTE_POLICIES`.

7. **Repository pattern**: All database access goes through repository classes in `backend/plane-*/src/repositories/`. No direct `pool.query()` in route handlers or services.

8. **Queue wiring**: Queue URLs flow CDK -> ECS task env vars -> `config.ts`. Workers read from `config.queues.*`. Never hardcode queue URLs.

## Key Domain Concepts

- **Corridor**: A remittance route defined by `source_country + destination_country + currency_pair` (e.g., US->MX USD/MXN)
- **Observation**: Raw data point from a provider collector (bronze layer, stored in S3 + Postgres)
- **Quote**: Normalized provider quote with amount buckets and fees (silver layer)
- **Gold index**: Aggregated market index computed from silver quotes across providers
- **Triangulation**: Combining multiple provider quotes to derive fair market rates (engine at `backend/plane-b/src/triangulation/engine.ts`)
- **Provider weighting**: Quality-adjusted weighting model for aggregation (model at `backend/shared/weighting-model.ts`)
- **Stress signal**: Detected anomaly in corridor pricing data (triggers stress-responder agent)
- **Amount bucket**: Discrete transfer amounts used for comparison (e.g., $200, $500, $1000)

## Agent System

Self-healing pipeline in `backend/plane-b/src/agents/`:

```
failure-detector -> orchestrator -> patch-proposer -> patch-validator -> patch-deployer
```

- **failure-detector**: Scans for collector failures, creates failure bundles
- **orchestrator**: Prioritizes bundles (MAX_BUNDLES_PER_CYCLE=6), dispatches repairs. Uses `pg_try_advisory_lock(999001)` to prevent duplicate scans
- **patch-proposer**: Uses LLM (Anthropic/Bedrock) to generate fix proposals
- **patch-validator**: Validates proposed patches before deployment
- **patch-deployer**: Applies validated patches
- **stress-responder**: Handles corridor stress signals (anomalous pricing)
- **tool-gateway**: Mediates all agent I/O with per-agent least-privilege policies (`backend/plane-b/src/agents/tool-gateway.ts`)
- **LLM circuit breaker**: 3-state (closed/open/half-open), trips after 5 failures in 60s, 120s cooldown
- **Correlated failure detection**: >=10 simultaneous failures triggers escalation instead of repair

## Environment Setup

Copy `backend/.env.example` to `backend/.env` for local development. Key variables:

| Variable | Purpose | Default |
|----------|---------|---------|
| `DATABASE_URL` | Main Postgres connection | `postgres://remit:remit@localhost:5432/remit` |
| `DATABASE_URL_PLANE_A` | Plane A DB (row-level security) | See `.env.example` |
| `REDIS_URL` | Redis/ElastiCache | `redis://localhost:6379/0` |
| `PLANE_A_PORT` | API server port | `4000` |
| `PLANE_C_PORT` | Gold publisher port | `4100` |
| `SUPABASE_URL` | Auth provider | Required |
| `STRIPE_SECRET_KEY` | Billing | `sk_test_*` for dev |
| `AGENT_LLM_CONNECTOR` | Agent LLM backend | `anthropic` (local) / `bedrock` (prod) |

### Feature flags

Feature flags use CDK context + env vars + `config.ts` `toBoolean()`:
- `toBoolean()` returns `true` for `1`, `true`, `yes` (case-insensitive). Everything else is `false`.
- CDK context: `this.node.tryGetContext('flagName')` with env var fallback
- Example: `ENABLE_TELEMETRY=1` enables OTEL sidecars (default: off)

### Secrets

- **Local dev**: `.env.local` (gitignored) for sensitive values
- **Staging/prod**: AWS Secrets Manager via ARN references (e.g., `AGENT_ANTHROPIC_API_KEY_SECRET_ARN`)
- **CDK**: Secrets referenced via `Secret.fromSecretCompleteArn()`, never hardcoded

### Telemetry

| Variable | Purpose | Default |
|----------|---------|---------|
| `ENABLE_TELEMETRY` | OTEL sidecar for X-Ray traces | `0` (opt-in) |
| `NEW_RELIC_LOGS_ENABLED` | Log export to New Relic | `1` in staging/prod |
| `CLOUDWATCH_METRICS_ENABLED` | CloudWatch custom metrics | `1` |
| `CLOUDWATCH_HIGH_CARDINALITY_METRICS` | Agent metrics with run_id dims | `0` (off) |

## What NOT to Do

- **Never commit `.env` or `.env.local`** — they contain secrets. Check `.gitignore`.
- **Never use `console.log`** — use `createLogger()` from `backend/shared/logger.ts`
- **Never bypass auth** — all new routes need `requireAdmin()`, `requireAuth()`, or API key check. If a route truly needs no auth, add it to `PLANE_A_AUTH_BYPASS_ROUTE_POLICIES` with a documented reason.
- **Never concatenate SQL** — always use parameterized queries (`$1, $2`). Run `pnpm guardrail:sql:unsafe-interpolation` to verify.
- **Never import across planes** — only `backend/shared/` is allowed as cross-plane import.
- **Never hardcode provider URLs** — use config. Providers change endpoints frequently.
- **Never add high-cardinality CloudWatch dimensions** (like `run_id`, `correlation_id`) without setting `highCardinality: true` on the metric call. This flag gates emission behind `CLOUDWATCH_HIGH_CARDINALITY_METRICS`.
- **Never add ECS tasks without health checks and log groups** — see existing patterns in `infrastructure/cdk/lib/ecs-tasks.ts`.
- **Never skip pre-commit hooks** (`--no-verify`) — they run lint-staged and audit checks.
- **Never use `git add -A`** — stage specific files to avoid committing secrets or binaries.

## Commit & PR Conventions

### Commit format
```
type(scope): description

Co-Authored-By: ...
```

**Types**: `feat`, `fix`, `chore`, `test`, `docs`, `refactor`
**Scopes**: `cost`, `plane-a`, `plane-b`, `plane-c`, `cdk`, `shared`, `frontend`

### Branch naming
`feature/`, `fix/`, `chore/` prefixes. Example: `feature/aws-cost-optimization`

### PR format
```
## Summary
- Bullet points of what changed

## Test Plan
- [ ] Verification steps
```

## CI/CD

35+ GitHub Actions workflows in `.github/workflows/`:
- `ci-main.yml` / `ci-pr.yml` — main CI pipeline
- `deploy.yml` — deployment with environment gates
- `security-scan.yml` / `secret-scanning.yml` — security checks
- `infra-synth.yml` — CDK synthesis validation
- `staging-go-live-readiness.yml` — pre-production gate
- `evidence-*.yml` — SLO evidence collection (freshness, latency, health)
- `rollback.yml` — production rollback procedure

## OpenAPI Spec

- **Swagger UI**: `GET /api-docs` (runtime, Plane A)
- **JSON endpoint**: `GET /api-docs/json`
- **Export to file**: `cd backend && pnpm ci:export-openapi` → `artifacts/openapi.json`
- **Plugin**: `backend/plane-a/src/plugins/swagger.ts` (uses `@fastify/swagger` + `@fastify/swagger-ui`)
- **Format**: OpenAPI 3.0.3, auth scheme: Bearer JWT

## Database Schema

~70 tables across 5 schemas. Schema defined in 94 sequential migration files (`backend/db/migrations/001_*.sql` through `093_*.sql`).

| Schema | Tables | Purpose |
|--------|--------|---------|
| `bronze` | 1 | Raw provider payloads before parsing |
| `silver` | ~45 | Core operational data: quotes, providers, corridors, users, agents, alerts, telemetry, ads |
| `gold` | 6 | Published indices: FX rates, popular corridors, pulse cache, provider weights, webhooks |
| `gold_export` | 3 | External data products: CDP daily metrics, index corrections, EDV residual logs |
| `public` | 5 | Cross-plane: institutional clients, API usage, feature flags, account deletion |

**Key silver tables**: `quote_record`, `provider`, `corridor`, `ingestion_run`, `user_account`, `user_plan`, `alert_rule`, `module_registry`, `agent_action`, `dispatch_queue`

**Views**: `silver.corridor_tier` (current tier), `silver.corridor_priority` (tier-to-SLO mapping)

## Providers

25 remittance providers, each with a probe script in `backend/scripts/[provider]-probe.ts`:

Al Ansari, Boss Money, Dahabshiil, Instarem, Intermex, KoronaPay, Mukuru, OrbitRemit, Pangea, Paysend, Placid, Remitbee, Remitly, RIA, Sendwave, SingX, TransferGo, Wells Fargo, Western Union, WireBarley, Wise, WorldRemit, XE, Xoom

```bash
cd backend && pnpm probe:wise      # Probe single provider
cd backend && pnpm probe:all       # Probe all providers
cd backend && pnpm probe:provider  # Generic provider probe
```

Provider catalog: `.remit-scout/providers/catalog.json`

## Runbooks & Operational Docs

| Category | Location | Key files |
|----------|----------|-----------|
| **Runbooks** (26) | `docs/runbooks/` | `disaster-recovery.md`, `rollback.md`, `provider-outage.md`, `staging-go-live-checklist.md`, `production-launch-ultimate.md`, `cost-spike.md` |
| **Incident response** | `docs/security/incident-response-plan.md` | Primary IR plan |
| **Security** (10) | `docs/security/` | `pentest-playbook.md`, `stride-threat-model-2026-02.md`, `auth-bypass-paths.md`, `security-findings-register-2026-02.md` |
| **Architecture** (8) | `docs/architecture/` | `agent-native-platform-spec.md` (84KB), `observability.md`, `security.md`, `triangulation-roadmap.md` |
| **Ops** | `docs/ops/` | `capacity-planning.md`, `feature-flag-inventory.md`, `status-page-and-escalation.md` |
| **Agent runbooks** (21) | `.opencode/agents/` | Per-agent operational guides |
| **Specs** | `SPECS/` | `architecture.md`, `agents.md`, `providers.catalog.json`, `reason-codes.catalog.yaml` |
| **Rollback** | `.github/workflows/rollback.yml` | Automated rollback (manual trigger, env-gated, SSM fallback for last-known-good image) |

## Key Files Quick Reference

| File | Purpose |
|------|---------|
| `backend/shared/config.ts` | All configuration (1200+ lines) |
| `backend/shared/db.ts` | Database pool management |
| `backend/shared/redis.ts` | Redis client |
| `backend/shared/logger.ts` | Structured JSON logger |
| `backend/shared/errors.ts` | Typed error classes |
| `backend/shared/cloudwatch-metrics.ts` | CloudWatch metric recording |
| `backend/shared/sqs.ts` | SQS client and helpers |
| `backend/plane-a/src/app.ts` | Route registration (40+ route modules) |
| `backend/plane-b/src/triangulation/engine.ts` | Quote triangulation engine |
| `backend/plane-b/src/agents/tool-gateway.ts` | Agent tool execution gateway |
| `infrastructure/cdk/lib/remit-scout-stack.ts` | Main CDK stack |
| `infrastructure/cdk/lib/ecs-tasks.ts` | ECS task definitions |
| `infrastructure/cdk/lib/ecs-services.ts` | ECS service definitions |
| `infrastructure/cdk/lib/vpc.ts` | VPC, NAT, security groups |
| `infrastructure/cdk/lib/queues.ts` | SQS queue definitions |
