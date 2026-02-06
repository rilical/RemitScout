# Backend Slop Inventory (Evidence-Based)

Feedback source: chat transcript.
Goal: slop hotspot inventory (largest backend files by LOC).

## Method (reproducible)

- Scope: tracked files under `backend/**`
- File types counted: `.ts`, `.tsx`, `.js`, `.mjs`, `.cjs`, `.mts`, `.cts`
- Excluded: `**/node_modules/**`, `**/dist/**`, `**/build/**`, `**/coverage/**`, `**/tmp/**`, and `**/*.d.ts`
- LOC definition: raw line count (including blanks/comments)

Note: the method intentionally uses `git ls-files` so untracked local artifacts (for example provider payload snapshots under `backend/tmp/`) don’t pollute the hotspot list.

Reproduce locally:

```bash
python3 - <<'PY'
import subprocess
from pathlib import Path

out = subprocess.check_output(['git','ls-files','backend'], text=True)
paths = [p.strip() for p in out.splitlines() if p.strip()]

EXTS = {'.ts','.tsx','.js','.mjs','.cjs','.mts','.cts'}

def allowed(p: str) -> bool:
    if '/node_modules/' in p or p.endswith('/node_modules'):
        return False
    if '/dist/' in p or p.endswith('/dist'):
        return False
    if '/build/' in p or p.endswith('/build'):
        return False
    if '/coverage/' in p:
        return False
    if '/tmp/' in p or p.endswith('/tmp'):
        return False
    if p.endswith('.d.ts'):
        return False
    return Path(p).suffix in EXTS

rows = []
for p in paths:
    if not allowed(p):
        continue
    data = Path(p).read_bytes()
    loc = data.count(b'\n') + (0 if data.endswith(b'\n') or len(data)==0 else 1)
    rows.append((loc, p))

rows.sort(reverse=True)
for i, (loc, p) in enumerate(rows[:20], start=1):
    print(f"{i}\t{loc}\t{p}")

big = [(loc, p) for loc, p in rows if loc > 400]
print("\n>400 LOC:", len(big))
PY
```

## Hotspots: Top 20 largest backend files

Note: there are **75** backend files over the 400-LOC “god module” threshold (per the script above). The table below focuses on the biggest 20.

| Rank | Path | LOC | Category | Why it’s a hotspot |
| ---: | --- | ---: | --- | --- |
| 1 | `backend/plane-b/src/ingest.ts` | 1666 | Plane B ingest | Mixes config validation, tracing/error reporting, SQS fanout, rights-matrix filtering, provider dispatch, and DB writes (hard to test/change safely). |
| 2 | `backend/plane-a/src/routes/providers.ts` | 1460 | Plane A route | Combines Fastify routes, zod validation, DB/caching, provider weighting, and response shaping; likely multiple concerns per endpoint. |
| 3 | `backend/scripts/b2b-sweep-scheduler.ts` | 1298 | Batch scheduler | Scheduler blends DB reads, eligibility filtering, sharding/locking, queue stats, and SQS enqueueing; any ops change risks correctness. |
| 4 | `backend/plane-b/src/repositories/implementations/pulse-cache-repository.ts` | 1292 | Repository | Repository also does cache policy + dynamic SQL + UI formatting (chart series/colors), implying an unclear domain boundary. |
| 5 | `backend/plane-a/src/routes/alerts.ts` | 1126 | Plane A route | Routes mix entitlements/billing guards, schemas, repository calls, usage snapshot updates, and audit logging (business logic spread across HTTP layer). |
| 6 | `backend/plane-b/src/providers/remitbee/collector.ts` | 1062 | Provider collector | Orchestrates proxy/rate-limit/circuit-breaker, raw writes, parsing, normalization, persistence, and metrics (duplicated across many providers). |
| 7 | `backend/plane-a/src/routes/pulse.ts` | 1032 | Plane A route | Routes mix entitlement gating, cache-key derivation, repo calls, and chart payload formatting; likely a “god route module”. |
| 8 | `backend/plane-b/src/collectors/base.ts` | 1029 | Collector base | “Base” collector contains queue publishing, stoplist/circuit-breaker controls, repository interactions, and metrics (large shared surface area). |
| 9 | `backend/plane-b/src/providers/ria/collector.ts` | 1002 | Provider collector | Fetch/parsing, retry/backoff, block detection, normalization, persistence, and metrics bundled together (hard to reuse/standardize). |
| 10 | `backend/plane-b/src/providers/westernunion/collector.ts` | 959 | Provider collector | Similar collector orchestration surface (fetch/parsing + detection + persistence + rate-limit control) encourages copy/paste drift. |
| 11 | `backend/scripts/export-worker.ts` | 958 | Worker script | SQS consumption + DB job state + formatting + PDF rendering + archive + S3 upload in one file (failure handling becomes brittle). |
| 12 | `backend/plane-b/src/providers/sendwave/collector.ts` | 914 | Provider collector | Provider-specific orchestration + parsing + normalization + persistence in one unit; likely repeated across providers. |
| 13 | `backend/plane-b/src/providers/mukuru/collector.ts` | 913 | Provider collector | Similar to other collectors; high LOC suggests missing shared parsing/normalization utilities. |
| 14 | `backend/scripts/ingest-fanout-worker.ts` | 907 | Worker script | Worker handles SQS consumption, provider registry dispatch, DB updates, tracing, and retry/visibility-extension logic (complex operational behavior). |
| 15 | `backend/plane-b/src/providers/dahabshiil/collector.ts` | 904 | Provider collector | Large collector surface (fetch → parse → normalize → persist), likely includes provider quirks interleaved with platform logic. |
| 16 | `backend/plane-a/src/repositories/implementations/analytics-repository.ts` | 891 | Repository | Wide analytics query surface + in-module aggregation/shaping; hard to evolve schemas or add tests incrementally. |
| 17 | `backend/plane-b/src/providers/koronapay/collector.ts` | 880 | Provider collector | Similar “all-in-one” collector; growing risk of inconsistent retry/timeout/circuit-breaker policy. |
| 18 | `backend/plane-b/src/providers/index.ts` | 877 | Provider registry | Central registry imports all providers + dispatch wiring + metadata; high churn and merge-conflict risk, encourages tight coupling. |
| 19 | `backend/plane-b/src/providers/remitly/collector.ts` | 865 | Provider collector | Similar collector pattern; likely a good candidate for extracting shared adapter scaffolding. |
| 20 | `backend/plane-b/src/providers/worldremit/collector.ts` | 851 | Provider collector | Similar collector pattern; suggests standard “port/adapter” interface would reduce repeated code. |

## Duplication map: cross-cutting concerns

Scope: this section is **evidence-only**. It lists duplicated patterns observed in 3+ places and why they matter (business risk + delivery speed). Fixes/pattern standardization belong in `docs/refactor/backend-golden-patterns.md` and `docs/refactor/backend-refactor-plan.md`.

### 1) Route input validation + ad-hoc 400 error shaping (Zod `safeParse`)

- What’s duplicated: the pattern `const parsed = schema.safeParse(...)` + `if (!parsed.success) { reply.code(400); return { ... } }` is repeated across many Plane A routes (and some non-route config loaders).
- Why it matters: inconsistent `error` payload shapes/codes across endpoints increases frontend contract drift risk and makes it harder to introduce shared error analytics / metrics; every new endpoint reimplements the same validation + response policy.
- File-path examples:
  - `backend/plane-a/src/routes/exports.ts`
  - `backend/plane-a/src/routes/quotes.ts`
  - `backend/plane-a/src/routes/rates.ts`
  - `backend/plane-a/src/routes/notifications.ts`
  - `backend/plane-b/src/notifications/config-aws.ts`
- Reproduce:

```bash
rg -n "safeParse\\(" backend/plane-a/src/routes
rg -n "parsed\\.success" backend/plane-a/src/routes
```

### 2) Entitlements + plan-limit enforcement scattered across routes/plugins

- What’s duplicated: resolving an “effective plan code”, calling `getEntitlementsForPlan(effectivePlanCode)`, and then manually enforcing limits/guards (sometimes via `requireEntitlement`, sometimes inline).
- Why it matters: plan changes (pricing/limits) become multi-touch edits and it’s easy to miss a path (revenue leakage or accidental over-restriction); also increases risk of inconsistent user experience between endpoints.
- File-path examples:
  - `backend/plane-a/src/routes/alerts.ts`
  - `backend/plane-a/src/routes/history.ts`
  - `backend/plane-a/src/routes/watchlist.ts`
  - `backend/plane-a/src/routes/me.ts`
  - `backend/plane-a/src/plugins/auth-plugin.ts`
- Reproduce:

```bash
rg -n "getEntitlementsForPlan\\(" backend/plane-a/src
rg -n "requireEntitlement\\(" backend/plane-a/src/routes
```

### 3) Redis rate limiting pattern duplicated (key construction + `incr/expire/ttl`)

- What’s duplicated: repeated Redis rate-limit implementations that follow the same structure: `getRedisClient()` → degrade when unavailable → `redis.incr(key)` → `redis.expire(key, ttl)` → sometimes `redis.ttl(key)`.
- Why it matters: inconsistent TTLs/key shapes can cause noisy false positives/negatives; abuse-prevention becomes hard to reason about (especially for enterprise/API-key paths), and logging becomes fragmented.
- File-path examples:
  - `backend/plane-a/src/utils/rate-limit.ts`
  - `backend/plane-a/src/plugins/rate-limit-redis.ts`
  - `backend/plane-a/src/plugins/auth-plugin.ts`
  - `backend/plane-a/src/routes/recent-searches.ts`
- Reproduce:

```bash
rg -n "redis\\.incr\\(" backend/plane-a/src
rg -n "redis\\.expire\\(" backend/plane-a/src
```

### 4) Exports S3 bucket config + “not configured” handling duplicated

- What’s duplicated: multiple Plane A entrypoints re-derive the exports bucket from config and return/record `exports_bucket_not_configured` in slightly different ways.
- Why it matters: operationally painful (one path may succeed while another silently degrades); makes it harder to guarantee exports reliability across create/list/download/delete and account deletion flows.
- File-path examples:
  - `backend/plane-a/src/routes/exports.ts`
  - `backend/plane-a/src/routes/data-export.ts`
  - `backend/plane-a/src/services/account-deletion.ts`
- Reproduce:

```bash
rg -n "exports_bucket_not_configured" backend/plane-a/src
```

### 5) Rights-matrix indices allowlist filtering duplicated in multiple scripts (SQL snippets)

- What’s duplicated: the eligibility filter `AND (rm.allowed_in_rvi = true OR rm.allowed_in_rci = true OR rm.allowed_in_teer = true)` appears in multiple jobs/scripts.
- Why it matters: a subtle drift here creates mismatched “who counts” between provider weighting and indices computation, which directly impacts customer-facing indices correctness and violates the `ARCHITECTURE.md` invariant that indices must respect rights-matrix allowlists.
- File-path examples:
  - `backend/scripts/provider-weighting-job.ts`
  - `backend/scripts/gold-indices-job.ts`
  - `backend/scripts/gold-indices-live.ts`
- Reproduce:

```bash
rg -n "rm\\.allowed_in_rvi = true OR rm\\.allowed_in_rci = true OR rm\\.allowed_in_teer = true" backend/scripts
```

### 6) Provider HTTP fetch plumbing duplicated (proxy tier + jitter + per-provider wrappers)

- What’s duplicated: each provider tends to carry its own `fetch.ts` wrapper with a very similar input shape (`proxyTier?: ProxyTier`, `jitterMs`, timeouts, etc.) and similar orchestration responsibilities.
- Why it matters: any resilience change (timeouts/retries/proxy routing/circuit breakers) becomes an N-provider patch; this is a reliability + cost risk (inconsistent retry storms, inconsistent proxy use).
- File-path examples:
  - `backend/plane-b/src/providers/ria/fetch.ts`
  - `backend/plane-b/src/providers/remitbee/fetch.ts`
  - `backend/plane-b/src/providers/sendwave/fetch.ts`
  - `backend/plane-b/src/providers/worldremit/fetch.ts`
- Reproduce:

```bash
rg --files-with-matches "proxyTier\\?: ProxyTier" backend/plane-b/src/providers
rg --files-with-matches "jitterMs" backend/plane-b/src/providers
```

### 7) Plane A route modules instantiate DB pools directly (`getPool(config.db.planeAUrl)`) 

- What’s duplicated: many route modules declare `const planeAPool = getPool(config.db.planeAUrl)` (or `const pool = ...`) at file/module scope.
- Why it matters: pushes connection lifecycle into leaf modules (testing friction), encourages “route owns DB” coupling, and makes it harder to enforce transactions / unit-of-work boundaries later.
- File-path examples:
  - `backend/plane-a/src/routes/providers.ts`
  - `backend/plane-a/src/routes/quotes.ts`
  - `backend/plane-a/src/routes/indices.ts`
  - `backend/plane-a/src/routes/watchlist.ts`
- Reproduce:

```bash
rg -n "getPool\\(config\\.db\\.planeAUrl\\)" backend/plane-a/src/routes
```
