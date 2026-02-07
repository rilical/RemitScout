# Backend Refactor Plan (10–20 Slices With Measurable Wins)

Feedback source: chat transcript

Goal (1 phrase): refactor plan slices (incremental DDD modularization + slop reduction)

Primary reference: `ARCHITECTURE.md` (plane invariants + Bronze/Silver/Gold rules)

This plan is intentionally incremental. Each slice is scoped to be (a) reviewable, (b) testable, and (c) low-regression, while still compounding toward the target bounded-context layout defined in `docs/refactor/backend-ddd-domain-map.md`.

Related evidence sources:

- Hotspots + duplication: `docs/refactor/backend-slop-inventory.md`
- Bounded contexts + dependency rules: `docs/refactor/backend-ddd-domain-map.md`
- Runtime/infra baseline: `docs/refactor/backend-baseline.md`

---

## 0) Constraints + release safety (non-negotiable)

- **No big-bang folder move.** Start by introducing stable module boundaries, then migrate callers.
- **No public API contract breaks** without versioning (see `agents/rag/delta-drift.md`).
- **Plane A must never read Bronze directly** (`ARCHITECTURE.md` invariant; guardrail exists: `backend/scripts/bronze-access-check.js`).
- Every slice should include at least one of:
  - a regression test, or
  - a contract snapshot check, or
  - an operational “canary” check (health/readiness) to reduce deploy risk.

---

## 1) Slice list (ordered by ROI / risk reduction)

Each slice includes: intent, evidence (paths), and a concrete “win” you can measure.

| Slice | Outcome | Primary evidence / targets |
|---:|---|---|
| 1 | Enforce dependency boundaries (lint-level) | Boundary violations called out in `docs/refactor/backend-ddd-domain-map.md` (cross-plane imports; domain/platform coupling) |
| 2 | Establish `platform/` vs `shared-kernel/` split (conceptual first) | `backend/shared/**` currently mixes domain primitives + AWS/DB (`docs/refactor/backend-ddd-domain-map.md`) |
| 3 | Standardize request validation + 400 error mapping | Duplicated `safeParse` patterns across routes (`backend/plane-a/src/routes/**`) |
| 4 | Standardize error model + HTTP mapping | “Inconsistent errors/logging” slop definition; repeated ad-hoc error shapes in routes |
| 5 | Centralize entitlements checks (one policy surface) | Duplication in `backend/plane-a/src/routes/{alerts,history,watchlist,me}.ts` + `backend/plane-a/src/plugins/auth-plugin.ts` |
| 6 | Consolidate Redis rate limiting | Duplication in `backend/plane-a/src/utils/rate-limit.ts`, `backend/plane-a/src/plugins/rate-limit-redis.ts`, `backend/plane-a/src/plugins/auth-plugin.ts` |
| 7 | Introduce Plane A “composition root” (DI-ish) for DB pools + repos | Repeated `getPool(config.db.planeAUrl)` in route modules (`docs/refactor/backend-slop-inventory.md`) |
| 8 | Break up `providers.ts` route module (keep response stable) | Hotspot: `backend/plane-a/src/routes/providers.ts` (~1460 LOC) |
| 9 | Split pulse formatting vs storage/caching | Hotspot: `backend/plane-b/src/repositories/implementations/pulse-cache-repository.ts` (~1292 LOC) and `backend/plane-a/src/routes/pulse.ts` (~1032 LOC) |
| 10 | Extract Plane B ingest defaults/config from orchestration | Hotspot: `backend/plane-b/src/ingest.ts` (~1666 LOC), mixes provider defaults + fanout + DB |
| 11 | Standardize provider HTTP fetch plumbing (timeouts/retries/proxy) | Duplication across `backend/plane-b/src/providers/*/fetch.ts` |
| 12 | Shrink collector “base” surface; clarify ports/adapters | Hotspot: `backend/plane-b/src/collectors/base.ts` (~1029 LOC) |
| 13 | De-couple indices jobs from Plane B internals + dedupe SQL allowlist | Violation: `backend/scripts/gold-indices-job.ts` imports `../plane-b/src/lib/worker-lock`; duplicated allowlist SQL in scripts |
| 14 | Align runtime versions (Node 18 vs 20) with an explicit rollout | Risk called out in `docs/refactor/backend-baseline.md` (backend Node 20 vs Lambda Node 18) |

---

## 2) Slice details (what changes + how to verify)

### Slice 1 — Boundary enforcement (lint / build-time)

**Why now (business)**: prevents *new* slop while we clean up old slop; reduces merge conflicts and future regressions.

- Evidence:
  - Cross-plane import violation: `backend/scripts/gold-indices-job.ts` → `../plane-b/src/lib/worker-lock` (`docs/refactor/backend-ddd-domain-map.md`).
- Work:
  - Add lint rules to prevent new cross-plane imports (start with scripts importing plane internals).
  - Add “domain cannot import platform” rule once `shared-kernel` vs `platform` is introduced.
- Win metric:
  - CI fails fast on new boundary violations.
- Verification:
  - `pnpm -C backend lint`

### Slice 2 — Establish `platform/` vs `shared-kernel/` (conceptual split first)

**Why now**: it’s the foundation for DDD; without it, “domain code” will keep importing AWS/DB.

- Evidence: `backend/shared/**` mixes concerns (examples in `docs/refactor/backend-ddd-domain-map.md`).
- Work:
  - Introduce new folders and re-export gradually (avoid massive move).
  - First candidates for `shared-kernel` (pure logic):
    - `backend/shared/amount-bucket.ts`
    - `backend/shared/corridor.ts`
    - `backend/shared/corridor-tiers.ts`
    - `backend/shared/macro-corridors.ts`
  - First candidates for `platform` (I/O):
    - `backend/shared/db.ts`, `backend/shared/redis.ts`, `backend/shared/aws-params.ts`, `backend/shared/tracing.ts`, `backend/shared/config.ts`
- Win metric:
  - “No domain imports of AWS/DB” becomes enforceable.
- Verification:
  - Typecheck + lint: `pnpm -C backend build` and `pnpm -C backend lint`

### Slice 3 — Route validation helper (Zod `safeParse` → one shared pattern)

**Why now**: reduces frontend contract drift and speeds up endpoint work.

- Evidence: duplicated `safeParse` + ad-hoc 400 responses across:
  - `backend/plane-a/src/routes/quotes.ts`
  - `backend/plane-a/src/routes/rates.ts`
  - `backend/plane-a/src/routes/exports.ts`
  - `backend/plane-a/src/routes/notifications.ts`
  - (`docs/refactor/backend-slop-inventory.md`)
- Work:
  - Add a small utility (or Fastify preHandler) that:
    - validates request inputs
    - produces a stable 400 error shape
  - Migrate 2–3 endpoints first (prove pattern).
- Win metric:
  - Fewer bespoke 400 responses; fewer frontend edge-case branches.
- Verification:
  - Add/extend route tests for the migrated endpoints (Vitest).

### Slice 4 — Unified error model (typed errors + HTTP mapping)

**Why now**: makes observability and SLO enforcement tractable.

- Evidence: slop definition includes inconsistent errors/logging across endpoints (`docs/refactor/backend-slop-inventory.md`).
- Work:
  - Introduce canonical error envelope and mapping (especially for 400/401/403/429/500).
  - Ensure Sentry/error tracker receives consistent tags (request id, user id, api key id).
- Win metric:
  - Stable error payloads + better alerting dimensions.
- Verification:
  - Route tests assert stable error envelope.

### Slice 5 — Entitlements policy surface (one place)

**Why now**: reduces revenue leakage risk (missing enforcement) and reduces over-restriction risk.

- Evidence: entitlements/plan-limit enforcement duplicated across:
  - `backend/plane-a/src/routes/alerts.ts`
  - `backend/plane-a/src/routes/history.ts`
  - `backend/plane-a/src/routes/watchlist.ts`
  - `backend/plane-a/src/routes/me.ts`
  - `backend/plane-a/src/plugins/auth-plugin.ts`
  - (`docs/refactor/backend-slop-inventory.md`)
- Work:
  - Create a single “entitlements guard” API that routes call.
  - Add a small “policy test suite” that enumerates plan codes → expected entitlements.
- Win metric:
  - Plan changes become 1-touch edits.
- Verification:
  - Targeted tests in `backend/plane-a/**` for the guard.

### Slice 6 — Consolidate Redis rate limiting

- Evidence: duplicated Redis `incr/expire/ttl` patterns across:
  - `backend/plane-a/src/utils/rate-limit.ts`
  - `backend/plane-a/src/plugins/rate-limit-redis.ts`
  - `backend/plane-a/src/plugins/auth-plugin.ts`
  - `backend/plane-a/src/routes/recent-searches.ts`
- Work:
  - Make `rateLimit(redis, key, ttl)` the only primitive.
  - Standardize logging when Redis is unavailable (avoid silent “best effort” drift).
- Win metric:
  - Fewer abuse bugs and clearer on-call diagnosis.
- Verification:
  - Unit tests for TTL/key derivation.

### Slice 7 — Plane A composition root for DB pools + repositories

**Why now**: unlocks testing and stops “route owns DB” coupling.

- Evidence: repeated `getPool(config.db.planeAUrl)` in route modules (`docs/refactor/backend-slop-inventory.md`).
- Work:
  - Construct pools and repositories once (app bootstrap) and inject into routes.
  - Keep route handler signatures stable.
- Win metric:
  - Enables swapping repo implementations in tests; reduces connection lifecycle bugs.
- Verification:
  - Run a small set of route tests under Vitest.

### Slice 8 — Split `backend/plane-a/src/routes/providers.ts`

- Evidence: Top hotspot (Rank #2) `backend/plane-a/src/routes/providers.ts` (~1460 LOC) (`docs/refactor/backend-slop-inventory.md`).
- Work:
  - Keep API stable; split by sub-route responsibility (list, detail, weighting, eligibility).
  - Push DB queries and response shaping into a `providers` module surface (aligned with Context C — Catalog & Governance).
- Win metric:
  - Reduced merge conflicts; smaller reviewable diffs.
- Verification:
  - Route tests + contract snapshot of response shape.

### Slice 9 — Pulse: separate formatting from cache/repository

- Evidence:
  - Hotspot: `backend/plane-b/src/repositories/implementations/pulse-cache-repository.ts` (~1292 LOC)
  - Hotspot: `backend/plane-a/src/routes/pulse.ts` (~1032 LOC)
  - Both mix data access/caching + chart formatting (`docs/refactor/backend-slop-inventory.md`).
- Work:
  - Make a pure formatting layer that converts canonical pulse rows → chart series.
  - Keep cache policy in one place.
- Win metric:
  - Formatting becomes testable without Redis/DB.
- Verification:
  - Unit tests for formatter.

### Slice 10 — Plane B ingest: extract provider defaults/config

- Evidence: `backend/plane-b/src/ingest.ts` mixes provider-specific defaults maps + fanout + DB (`docs/refactor/backend-slop-inventory.md`).
- Work:
  - Extract B2B defaults (`b2bAmountByProvider`, `b2bPayinMethodByProvider`, `b2bPayoutMethodByProvider`) into a dedicated module.
  - Add tests for default resolution functions.
- Win metric:
  - Provider changes stop being “global ingest changes”.
- Verification:
  - Unit tests for resolution; targeted ingest integration smoke test.

### Slice 11 — Provider HTTP fetch plumbing standardization

- Evidence: duplicated `proxyTier?: ProxyTier` / `jitterMs` / timeout logic across multiple `backend/plane-b/src/providers/*/fetch.ts` (`docs/refactor/backend-slop-inventory.md`).
- Work:
  - Introduce a shared fetch client with standard retry/backoff/timeouts and proxy selection.
  - Migrate 2–3 large collectors first (e.g. `backend/plane-b/src/providers/ria/**`, `backend/plane-b/src/providers/remitbee/**`, `backend/plane-b/src/providers/sendwave/**`).
- Win metric:
  - Reliability improvements become 1-touch; lower proxy spend from consistent policy.
- Verification:
  - Provider unit tests + fixture-based parsing tests.

### Slice 12 — Collector base surface reduction

- Evidence: hotspot `backend/plane-b/src/collectors/base.ts` (~1029 LOC) (`docs/refactor/backend-slop-inventory.md`).
- Work:
  - Split base into smaller “ports”: queue publishing, bronze writing, metrics, circuit breaker.
  - Make collectors depend on interfaces instead of concrete helpers.
- Win metric:
  - Less copy/paste across provider collectors; easier to add a provider.
- Verification:
  - Unit tests for new ports + a single provider regression run.

### Slice 13 — Indices jobs: remove plane-internal dependencies + dedupe allowlist SQL

- Evidence:
  - Cross-plane import: `backend/scripts/gold-indices-job.ts` → `../plane-b/src/lib/worker-lock` (`docs/refactor/backend-ddd-domain-map.md`).
  - Duplicated rights-matrix allowlist SQL in:
    - `backend/scripts/provider-weighting-job.ts`
    - `backend/scripts/gold-indices-job.ts`
    - `backend/scripts/gold-indices-live.ts`
    - (`docs/refactor/backend-slop-inventory.md`)
- Work:
  - Move lock primitive to shared platform (or a dedicated “job platform”) so scripts do not import plane internals.
  - Centralize the allowlist predicate (shared SQL builder or view) to uphold `ARCHITECTURE.md` invariant.
- Win metric:
  - Lower indices correctness drift risk.
- Verification:
  - Script-level dry-run / integration check and a small SQL unit test.

### Slice 14 — Node runtime alignment (planned rollout)

**Why now**: reduces “works on Node 20 tests, fails on Node 18 Lambda” regressions.

- Evidence: baseline mismatch documented in `docs/refactor/backend-baseline.md`:
  - Backend tooling: Node `20.19.x` (`backend/package.json`)
  - Lambda runtime: `Runtime.NODEJS_18_X` (`infrastructure/cdk/lib/api.ts`, `infrastructure/cdk/lib/scheduled-jobs.ts`)
- Work:
  - Plan a staged bump: dev → staging → prod, with canary endpoints and rollback.
  - Confirm AWS Lambda runtime support and any bundling assumptions.
- Win metric:
  - Fewer runtime-only regressions.
- Verification:
  - Deploy to dev + run `GET /healthz`, `GET /readyz`, and a small set of API canaries.

---

## 3) What this plan unlocks (business terms)

- **Faster feature delivery**: smaller modules and unified patterns reduce “new endpoint tax”.
- **Lower correctness risk**: indices/rights-matrix logic becomes harder to accidentally drift.
- **Lower incident cost**: stable error model + request context improves triage.

Next doc to implement in parallel with these slices: `docs/refactor/backend-golden-patterns.md` (the 3 patterns we enforce so slop doesn’t re-grow).
