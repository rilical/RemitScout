# Backend Golden Patterns (3 Standards)

Feedback source: chat transcript.
Goal: define 3 enforceable backend patterns so slop doesn’t regrow.

This doc is intentionally pragmatic: each pattern is (1) tied to observed slop/duplication, (2) designed to be incrementally adoptable, and (3) oriented around business outcomes (fewer incidents + faster feature shipping + lower AWS ops risk).

## Scope

- Applies to all backend planes (`backend/plane-a`, `backend/plane-b`, `backend/plane-c`) and `backend/shared/**`.
- This is **not** a refactor-by-itself; it’s a specification to execute via slices in `docs/refactor/backend-refactor-plan.md`.

## Golden Pattern #1: Unified Errors + Validation (Single Contract)

### Business outcome

- Stabilize the frontend contract (consistent error shapes/codes across endpoints).
- Reduce regression risk: shared validation + error mapping means fewer “one-off” response formats.
- Improve observability: errors become queryable by `code`, not by free-form message.

### Evidence (current drift)

- Central error handler exists but route modules still hand-roll error payloads:
  - `backend/plane-a/src/plugins/error-handler.ts` returns `createApiError(...)` for many classes of errors.
  - `backend/plane-a/src/routes/exports.ts` returns `{ error: 'bad_request', details: ... }` for Zod failures (manual shaping).
- Repeated Zod `safeParse` + ad-hoc 400 responses:
  - `backend/plane-a/src/routes/exports.ts`
  - `backend/plane-a/src/routes/quotes.ts`
  - `backend/plane-a/src/routes/rates.ts`
  - `backend/plane-a/src/routes/notifications.ts`
  - (also outside Plane A) `backend/plane-b/src/notifications/config-aws.ts`
  - Captured as duplication hotspot in `docs/refactor/backend-slop-inventory.md` (“Duplication map: Route input validation + ad-hoc 400 error shaping”).

### Contract (what “good” looks like)

Define one canonical error response for all HTTP endpoints (Plane A + Plane C):

```ts
type ApiErrorResponse = {
  error: string;              // stable machine code, e.g. 'validation_error'
  message?: string;           // human-safe
  details?: unknown;          // structured details for debugging/UI
  request_id?: string;        // for support/debugging; from Fastify request.id
}
```

Standardize **validation** failures as:

- HTTP: `400`
- `error = 'validation_error'`
- `details = [{ field?, message, code? }, ...]` (matches intent of `backend/plane-a/src/types/errors.ts`)

### Implementation pattern (incremental)

1) Create a small shared helper for Zod parsing used by all routes:
   - Suggested location: `backend/plane-a/src/utils/parse.ts` (Plane A) and/or `backend/shared/http/parse.ts` (if shared across planes)
   - API: `parseOr400(reply, schema, input)` returning typed data or sending a standardized 400.

2) Establish a small, explicit set of error codes (start with what exists today):
   - Source of truth suggestion: `backend/plane-a/src/types/errors.ts` (or new `backend/shared/http/errors.ts` once DDD modules exist)
   - Avoid free-form additions; new codes require a doc + tests.

3) Ensure the global error handler always returns the canonical shape:
   - Update policy (not necessarily code in this slice): `backend/plane-a/src/plugins/error-handler.ts` should include `request_id` on all error responses.

### Enforcement

- Add a small route-level contract test that checks:
  - Zod parse failure always returns `error='validation_error'` (not `bad_request`).
  - Every error response includes `request_id`.
- Add a lightweight lint rule later (optional): forbid returning raw `{ error: ... }` objects from routes unless via the helper.

## Golden Pattern #2: Request Context + Structured Logging (One “Context Object”)

### Business outcome

- Faster incident response: every log line can be joined by `request_id` / `trace_id`.
- Lower AWS risk: makes Lambda/ECS concurrency issues diagnosable (timeouts, cold starts, retries).
- Enables reliable audit/compliance events (who did what, from where).

### Evidence (current partial implementations)

- Plane A generates/stabilizes request IDs:
  - `backend/plane-a/src/app.ts` uses `genReqId` with `x-request-id` fallback to UUID.
- Shared logger supports OTel trace ID and AWS context fields:
  - `backend/shared/logger.ts` emits `trace_id` and Lambda/ECS metadata.
- Request context extraction exists but is local/one-off:
  - `backend/plane-a/src/services/audit-log.ts` exports `getRequestContext(request)` extracting `ipAddress`, `userAgent`, `requestId`, `sessionId`.

### Contract (what “good” looks like)

Define a single `RequestContext` shape and ensure it is:

- Constructed once at the edge (Fastify hook / worker entrypoint)
- Passed through application/services
- Logged on every meaningful log line

```ts
type RequestContext = {
  request_id: string;
  trace_id?: string;
  user_id?: string;
  actor_type?: 'user' | 'admin' | 'api_key' | 'system';
  ip?: string;
  user_agent?: string;
}
```

Field naming note: standardize on one naming convention in logs. Today `backend/shared/logger.ts` emits `trace_id`, while many route logs use `user_id` already; stick with `snake_case` for log keys.

### Implementation pattern (incremental)

1) Create `getRequestContext(request)` as the shared utility:
   - Suggested location: `backend/shared/request-context.ts` or `backend/plane-a/src/utils/request-context.ts`.
   - Use the existing extraction logic as starting point (`backend/plane-a/src/services/audit-log.ts`).

2) Add a Fastify hook to attach `request.ctx` (typed via `fastify.d.ts`) so handlers don’t re-derive it.

3) Update `createLogger` usage guidelines:
   - Every `logger.*(event, {...})` includes `request_id` when available.
   - For Plane B collectors/workers: include `provider_id`, `corridor_id`, and `attempt_id` consistently (these are the “join keys” for operational debugging).

### Enforcement

- Add a thin test around one Plane A endpoint that asserts:
  - Response headers preserve `x-request-id` (or exposes request id in payload for errors).
  - Logs include `request_id` for a known error.
- Add a PR checklist item: “Does every new log line include `request_id`/join keys?”

## Golden Pattern #3: Ports & Adapters for External I/O (Providers, DB, Queues)

### Business outcome

- Faster provider onboarding: less copy/paste in collectors; fewer subtle drift bugs.
- Higher data integrity: parsing/normalization is testable without AWS/DB.
- Lower ops toil: consistent retries/timeouts/circuit-breaker behavior.

### Evidence (current coupling + god modules)

- Provider collectors bundle orchestration + fetch + parsing + normalization + persistence:
  - `backend/plane-b/src/providers/remitbee/collector.ts` (representative; other providers similar)
  - Many other >800 LOC provider collectors listed in `docs/refactor/backend-slop-inventory.md` Top-20 hotspots.
- Shared collector “base” concentrates many responsibilities:
  - `backend/plane-b/src/collectors/base.ts` mixes queue enqueueing, ops alerting, persistence, anomaly detection wiring, and metrics.
- Provider registry centralizes imports/wiring (merge-conflict + coupling risk):
  - `backend/plane-b/src/providers/index.ts` called out in `docs/refactor/backend-slop-inventory.md`.

### Contract (what “good” looks like)

For each provider integration, enforce a 3-layer split:

1) **Domain/pure logic** (testable): parse provider payload → canonical “raw quote” → normalized quote
2) **Application/orchestration**: decide what to fetch, when, and how to retry
3) **Infrastructure/adapters**: HTTP client, proxy routing, Redis circuit breaker, Postgres repositories, SQS

Minimum interface (example):

```ts
type ProviderCollector = {
  provider_id: string;
  collect(request: CollectorRequest, deps: CollectorDeps): Promise<CollectorResult>;
}
```

And split “deps” explicitly so the collector doesn’t import concrete implementations:

```ts
type CollectorDeps = {
  http: HttpPort;
  bronze: BronzeWriterPort;
  quotes: QuoteRepositoryPort;
  clock: ClockPort;
  logger: Logger;
}
```

### Implementation pattern (incremental)

Start with one provider as the template (highest ROI tends to be a high-volume provider with frequent failures).

- Move provider-specific parsing and normalization behind pure functions:
  - Example starting points (already present but not universally enforced):
    - `backend/plane-b/src/providers/remitbee/parse.ts`
    - `backend/plane-b/src/normalize/quote-normalizer.ts`
- Wrap external calls via ports:
  - HTTP fetchers like `backend/plane-b/src/providers/remitbee/fetch.ts` become adapter implementations of `HttpPort`.
- Introduce a thin “collector runner” that applies the standard envelope:
  - retries/backoff
  - circuit breaker
  - block detection
  - metrics
  - persistence

This reduces each provider collector file to “wiring” + provider specifics, instead of re-implementing the full lifecycle.

### Enforcement

- Unit tests for provider parsing/normalization can run without Postgres/Redis.
- Add a rule-of-thumb gate: new provider collectors must stay below a LOC cap (e.g. 300–400 LOC) by pushing shared behavior into the runner.

## Non-golden (candidate next patterns)

These are valuable but should follow after the first three patterns are enforced:

- **Entitlements gating / plan limits**: currently scattered across routes (see `docs/refactor/backend-slop-inventory.md` duplication item “Entitlements + plan-limit enforcement”).
- **Rate limiting**: duplicated Redis `incr/expire` patterns across Plane A (see `docs/refactor/backend-slop-inventory.md`).

