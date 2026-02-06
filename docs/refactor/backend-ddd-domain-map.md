# Backend DDD Domain Map (Bounded Contexts + Target Module Layout)

Feedback source: chat transcript

Goal: DDD modularization map (bounded contexts + target module layout + dependency rules) grounded in repo evidence, so the follow-on refactor slices are coherent and low-regression.

Primary reference: `ARCHITECTURE.md` (planes, tier invariants, Bronze/Silver/Gold responsibilities).

---

## Method (reproducible)

Commands used to ground this doc in file evidence:

```bash
# current physical layout
ls -la backend
find backend/plane-a/src/routes -maxdepth 2 -type f -name '*.ts'
find backend/plane-a/src/services -maxdepth 2 -type f -name '*.ts'
find backend/plane-a/src/repositories -maxdepth 3 -type f -name '*.ts'
find backend/plane-b/src -maxdepth 2 -type d
find backend/plane-b/src/providers -maxdepth 2 -type d
find backend/plane-c/src -maxdepth 2 -type f -name '*.ts'

# boundary violations / coupling signals
rg -n "getPool\(config\.db\.planeAUrl\)" backend/plane-a/src/routes
rg -n "safeParse\(" backend/plane-a/src/routes
rg -n "from '../plane-b/src" backend/scripts
```

---

## 1) Current shape (what we actually have)

### Planes (deployment/composition roots)

- **Plane A (public API on Fastify/Lambda)**: `backend/plane-a/src/**`
  - Routes: `backend/plane-a/src/routes/**`
  - “Services”: `backend/plane-a/src/services/**`
  - Repositories (Postgres): `backend/plane-a/src/repositories/**`

- **Plane B (ingest + workers on ECS/Fargate + Lambdas)**: `backend/plane-b/src/**`
  - Collectors (HTTP + anti-bot + scheduler): `backend/plane-b/src/collectors/**`
  - Provider adapters (fetch/parse per provider): `backend/plane-b/src/providers/**`
  - Normalization: `backend/plane-b/src/normalize/**`
  - Workers: e.g. `backend/plane-b/src/ingest.ts`, `backend/plane-b/src/quote-refresh.ts`, `backend/plane-b/src/fx-rate-refresh.ts`

- **Plane C (internal publisher API on Fastify/Lambda)**: `backend/plane-c/src/**`
  - Publisher routes: `backend/plane-c/src/routes/publisher.ts`
  - Publisher services: `backend/plane-c/src/services/gold-publisher.ts`, `backend/plane-c/src/services/gold-publisher-live.ts`

### Shared code (currently mixes “domain-ish” + “platform”) — important for the DDD plan

- **Shared platform + cross-cutting**: `backend/shared/**` (DB, Redis, AWS context/params, retry, tracing, metrics, config).
  - Examples: `backend/shared/db.ts`, `backend/shared/redis.ts`, `backend/shared/tracing.ts`, `backend/shared/config.ts`.

- **Also contains domain-ish primitives** that are imported directly from route handlers today:
  - Corridor + tiering: `backend/shared/corridor.ts`, `backend/shared/corridor-tiers.ts`, `backend/shared/macro-corridors.ts`.
  - Amount buckets: `backend/shared/amount-bucket.ts`.

### Scripts (batch jobs) are “domain logic without a home”

- Indices + weighting jobs live as scripts, mixing SQL + job wiring + domain math:
  - `backend/scripts/gold-indices-job.ts`
  - `backend/scripts/provider-weighting-job.ts`
  - `backend/scripts/gold-indices-live.ts`

---

## 2) Proposed bounded contexts (5–8) tied to real flows

This is a pragmatic domain map: contexts are chosen to (a) match real business workflows, (b) match how code is already clustered, and (c) minimize cross-context chatter.

### Context A — Identity, Sessions & Entitlements

**Business capability**: who is calling, what can they do, and under what plan.

**Key concepts**: session, API key, entitlement, plan usage.

**Current evidence (ownership candidates)**:
- HTTP surface: `backend/plane-a/src/routes/sessions.ts`, `backend/plane-a/src/routes/me.ts`, `backend/plane-a/src/routes/account.ts`
- Entitlements: `backend/plane-a/src/services/entitlements.ts`, `backend/plane-a/src/services/user-plan.ts`, `backend/plane-a/src/services/plan-usage.ts`
- Persistence: `backend/plane-a/src/repositories/implementations/session-repository.ts`, `backend/plane-a/src/repositories/implementations/api-key-repository.ts`, `backend/plane-a/src/repositories/implementations/user-plan-repository.ts`

**Boundaries**:
- Should not own Stripe billing flows (Context B).
- Should not own quote computation (Context D/E).

### Context B — Billing & Monetization

**Business capability**: paid plans, checkout, portal, billing history, webhook ingestion.

**Current evidence**:
- HTTP surface: `backend/plane-a/src/routes/billing/*` (e.g. `backend/plane-a/src/routes/billing/webhook.ts`, `backend/plane-a/src/routes/billing/portal.ts`)
- Stripe integration: `backend/plane-a/src/services/stripe-client.ts`, `backend/plane-a/src/services/stripe-admin.ts`
- Persistence: `backend/plane-a/src/repositories/implementations/billing-webhook-event-repository.ts`

**Boundaries**:
- Owns “who paid for what”, but not “what data exists” (Context H) and not “how quotes are computed” (Context D/E).

### Context C — Catalog & Governance (Corridors, Providers, Rights Matrix)

**Business capability**: define which corridors exist, which providers support them, and which providers are allowed for B2C/B2B/indices (governance).

**Key concepts**: corridor, provider, provider capability, rights-matrix allow/stoplist, index eligibility.

**Current evidence**:
- HTTP surface:
  - Provider/corridor endpoints: `backend/plane-a/src/routes/providers.ts`, `backend/plane-a/src/routes/corridor-currencies.ts`, `backend/plane-a/src/routes/corridor-limits.ts`, `backend/plane-a/src/routes/provider-metadata.ts`
- Persistence + business rules:
  - Rights matrix (read): `backend/plane-a/src/repositories/implementations/rights-matrix-repository.ts`
  - Rights matrix (write/governance): `backend/plane-b/src/repositories/implementations/rights-matrix-repository.ts`
  - Provider/corridor capability: `backend/plane-a/src/repositories/implementations/corridor-capability-repository.ts`, `backend/plane-b/src/repositories/implementations/provider-capability-repository.ts`
- Domain-ish primitives currently in shared: `backend/shared/corridor.ts`, `backend/shared/countries-currencies.ts`, `backend/shared/currency-limits.ts`

**Boundaries**:
- Owns “eligibility” decisions, used by Indices (Context F), Serving (Context D) and Ingest (Context E).

### Context D — Quote Serving (B2C API + caching + refresh orchestration)

**Business capability**: serve “current quotes” quickly, with accurate freshness semantics and truthful “warming up” behavior.

**Current evidence**:
- HTTP surface: `backend/plane-a/src/routes/quotes.ts`
- Persistence: `backend/plane-a/src/repositories/implementations/latest-quote-repository.ts`, `backend/plane-a/src/repositories/implementations/quote-refresh-repository.ts`
- Domain-ish primitives used directly in handlers:
  - Amount buckets: `backend/shared/amount-bucket.ts`
  - Corridor parsing + tier/freshness: `backend/shared/corridor.ts`, `backend/shared/corridor-tiers.ts`
- Related business metrics: `backend/shared/business-metrics.ts`

**Boundary note (important)**: today `backend/plane-a/src/routes/quotes.ts` mixes HTTP validation (`zod`), DB wiring (`getPool(config.db.planeAUrl)`), caching (`createTtlCache`), and corridor/bucket logic in one module. This is a prime “application layer extraction” candidate.

### Context E — Quote Intake (Collectors, Provider Adapters, Normalization)

**Business capability**: collect raw quotes from providers, detect blocks, normalize into canonical quotes, write to Silver (and Bronze for debugging).

**Current evidence**:
- Provider adapters: `backend/plane-b/src/providers/**` (e.g. `backend/plane-b/src/providers/remitly/**`, `backend/plane-b/src/providers/wise/**`)
- Collector platform: `backend/plane-b/src/collectors/**` (e.g. `backend/plane-b/src/collectors/http-client.ts`, `backend/plane-b/src/collectors/scheduler.ts`, `backend/plane-b/src/collectors/bronze-writer.ts`)
- Normalization: `backend/plane-b/src/normalize/quote-normalizer.ts`, `backend/plane-b/src/normalize/canonical.ts`, `backend/plane-b/src/normalize/quality-flags.ts`
- Entry/workers: `backend/plane-b/src/ingest.ts`, `backend/plane-b/src/quote-refresh.ts`

**Boundaries**:
- Owns provider-specific weirdness; exports a stable “canonical quote record” contract to downstream contexts (Indices, Exports, Serving).

### Context F — Indices & Scoring (RCI/RVI/TEER + provider weighting)

**Business capability**: compute aggregated indices from Silver into Gold exports, respecting rights-matrix allowlists and methodology versions.

**Current evidence**:
- Indices batch computation: `backend/scripts/gold-indices-job.ts`
- Provider weights job: `backend/scripts/provider-weighting-job.ts`
- Shared methodology constants: `backend/shared/weighting-model.ts`
- API surface (read-side): `backend/plane-a/src/routes/indices.ts`, `backend/plane-a/src/repositories/implementations/gold-indices-repository.ts`

**Boundary note**:
- The scripts import Plane B internals (e.g. `WorkerLock`): `backend/scripts/gold-indices-job.ts` → `../plane-b/src/lib/worker-lock`. That’s a dependency inversion violation (jobs should depend on shared “job platform” ports, not app internals).

### Context G — Alerts, Watchlists & Notifications

**Business capability**: users set watchlists/alerts; system evaluates against Silver freshness/quality and notifies.

**Current evidence**:
- HTTP surface: `backend/plane-a/src/routes/alerts.ts`, `backend/plane-a/src/routes/watchlist.ts`, `backend/plane-a/src/routes/notifications.ts`
- Application logic: `backend/plane-a/src/services/alert-evaluator.ts`, `backend/plane-a/src/services/alert-notifications.ts`, `backend/plane-a/src/services/alert-unsubscribe.ts`
- Persistence: `backend/plane-a/src/repositories/implementations/alert-repository.ts`, `backend/plane-a/src/repositories/implementations/watchlist-repository.ts`
- Worker-side support: `backend/plane-b/src/repositories/implementations/ops-alert-repository.ts`, `backend/plane-b/src/notifications/**`

### Context H — Publishing & Exports (Gold outputs, data exports, pulse)

**Business capability**: package curated outputs (Gold) and provide export mechanisms for customers/internal ops.

**Current evidence**:
- Plane A export APIs: `backend/plane-a/src/routes/exports.ts`, `backend/plane-a/src/routes/data-export.ts`
- Export job persistence: `backend/plane-a/src/repositories/implementations/export-job-repository.ts`
- Plane C publisher APIs/services: `backend/plane-c/src/routes/publisher.ts`, `backend/plane-c/src/services/gold-publisher.ts`, `backend/plane-c/src/services/gold-publisher-live.ts`
- Cross-cutting cache keys used by publish/serve: `backend/shared/pulse-cache-keys.ts`

---

## 3) Target module layout (DDD layers) — what we should converge to

The goal is not a big-bang move. The goal is to create **stable module boundaries and a small public API per context**, then migrate route/worker entrypoints to call into those modules.

### Recommended physical structure

Create a new top-level module area and treat planes as composition roots:

```text
backend/
  apps/
    plane-a/                 # HTTP + auth + request context wiring (composition root)
    plane-b/                 # workers + schedulers wiring (composition root)
    plane-c/                 # internal publisher API wiring (composition root)

  modules/
    identity/
      domain/
      application/
      infrastructure/
      interfaces/http/

    billing/
      domain/
      application/
      infrastructure/
      interfaces/http/
      interfaces/webhooks/

    catalog/
      domain/
      application/
      infrastructure/
      interfaces/http/

    quote-serving/
      domain/
      application/
      infrastructure/
      interfaces/http/

    quote-intake/
      domain/
      application/
      infrastructure/
      interfaces/workers/
      interfaces/providers/

    indices/
      domain/
      application/
      infrastructure/
      interfaces/jobs/
      interfaces/http/

    alerts/
      domain/
      application/
      infrastructure/
      interfaces/http/
      interfaces/workers/

    publishing/
      domain/
      application/
      infrastructure/
      interfaces/http/
      interfaces/jobs/

  shared-kernel/
    domain/                  # pure value objects + invariants only
    types/

  platform/
    db/
    redis/
    aws/
    observability/
```

### Pragmatic mapping from current code → target modules

- `backend/plane-a/src/routes/*` becomes mostly thin controllers under `backend/apps/plane-a/**` calling module `application`.
- `backend/plane-b/src/providers/**` becomes `backend/modules/quote-intake/interfaces/providers/**`.
- `backend/scripts/*indices*` becomes `backend/modules/indices/interfaces/jobs/**`.
- `backend/shared/*` splits:
  - **Shared-kernel**: `amount-bucket.ts`, `corridor.ts`, `currency-limits.ts` (and other *pure* domain utilities).
  - **Platform**: `db.ts`, `redis.ts`, `retry.ts`, `tracing.ts`, `aws-params.ts`, `config.ts`.

This split is high ROI because it stops accidental imports of AWS/DB into domain code.

---

## 4) Dependency rules (hard) + enforcement ideas

### Rules (what “good” looks like)

1. **Interfaces → Application → Domain**
   - `interfaces/*` (Fastify routes, SQS handlers, provider adapters) may depend on `application` and `domain`.
   - `application` may depend on `domain` and on *ports* (interfaces) defined within the module.
   - `domain` depends only on `shared-kernel/domain` (no DB, no AWS, no Fastify, no `pg`, no Redis).

2. **Infrastructure implements ports; it is replaceable**
   - `infrastructure` depends on `platform/*` and external libraries.
   - `application` depends on interfaces/types, not implementations.

3. **No plane-to-plane imports**
   - Planes should not import each other’s internals.
   - Example existing violation: `backend/scripts/gold-indices-job.ts` imports `../plane-b/src/lib/worker-lock`.

4. **Shared-kernel must stay small**
   - Only value objects, invariants, and stable types.
   - Anything with AWS/DB/time/retry/caching belongs in `platform`.

### Enforcement (low friction, TypeScript-friendly)

- **ESLint `no-restricted-imports`**: disallow `backend/apps/**` importing `backend/platform/**` directly except within `infrastructure/**`.
- **`eslint-plugin-boundaries`** (or `dependency-cruiser`): enforce the layer rules (`domain` cannot import `infrastructure`, etc.).
- **TS path aliases**: add `@modules/*`, `@platform/*`, `@kernel/*` to make imports obvious and grep-able.

---

## 5) Current boundary violations (concrete evidence)

These are not “bugs”; they’re **refactor map markers** showing where DDD boundaries are currently crossed.

### Violation: route modules wire DB + repositories directly

- Evidence: `backend/plane-a/src/routes/quotes.ts` constructs a pool and repositories in-module:
  - `const planeAPool = getPool(config.db.planeAUrl)` (see `backend/plane-a/src/routes/quotes.ts`)
- Similar pattern appears across many routes:
  - Repro: `rg -n "getPool\(config\.db\.planeAUrl\)" backend/plane-a/src/routes`

**Why it matters (business)**: makes it hard to test application behavior without HTTP + DB, increases regression risk when adding a new endpoint or changing cache semantics.

### Violation: HTTP validation + error mapping is duplicated ad-hoc

- Evidence: pervasive `zod.safeParse` with hand-rolled 400 responses in routes.
  - Repro: `rg -n "safeParse\(" backend/plane-a/src/routes`

**Why it matters**: inconsistent errors break frontend expectations and reduce SLO reliability (clients retry differently).

### Violation: “rights matrix” business rules exist in multiple planes

- Read-side in Plane A: `backend/plane-a/src/repositories/implementations/rights-matrix-repository.ts`
- Write-side/governance in Plane B: `backend/plane-b/src/repositories/implementations/rights-matrix-repository.ts`

**Why it matters**: governance changes can drift from serving behavior if we don’t centralize the policy surface.

### Violation: jobs/scripts depend on app internals

- Evidence: `backend/scripts/gold-indices-job.ts` imports `WorkerLock` from Plane B (`../plane-b/src/lib/worker-lock`).

**Why it matters**: makes it easy to break batch jobs when refactoring Plane B; reduces deploy safety.

---

## 6) Questions / assumptions (to validate before locking boundaries)

1. **Catalog vs Governance**: should “rights matrix” be owned by Catalog (Context C) or by Indices (Context F) as a policy dependency? Evidence suggests it’s a shared governance layer used by both.
2. **Quote serving vs intake coupling**: confirm the canonical quote record contract (fields + invariants) currently lives in Plane B normalization (`backend/plane-b/src/normalize/**`) and is the right place to standardize.
3. **Gold export contract**: confirm which module should own the “export schema” (likely Publishing/Exports Context H) so Plane A doesn’t infer it ad-hoc.

---

## 7) Recommended additions (pragmatic, high ROI)

These aren’t required for this doc’s deliverable, but they are strong “next step” candidates because they reduce refactor risk.

- **Split `backend/shared/**` into `shared-kernel/` + `platform/`** (even if the code physically stays put initially, create the conceptual split + lint rules).
- **Create module public surfaces**: each bounded context should export from a single `index.ts` so planes only depend on that stable API.
- **Add a dependency rule gate in CI**: fail PRs that introduce new cross-plane imports or domain→platform imports.

