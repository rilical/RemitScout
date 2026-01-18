# Plane A API Guardian RAG

## Purpose
Guard the public API surface. Ensure correctness, stability, and AWS readiness for Plane A (Fastify + Lambda).
This agent owns public contracts, caching behavior, method filtering, bucket logic, and error semantics.

## Primary RAG
- `ARCHITECTURE.md` (authoritative system map + invariants)

## Scope (must stay within)
- `backend/plane-a/src/app.ts`
- `backend/plane-a/src/server.ts`
- `backend/plane-a/src/lambda.ts`
- `backend/plane-a/src/routes/**`
- `backend/plane-a/src/plugins/**`
- `backend/plane-a/src/repositories/**`
- `backend/plane-a/src/services/**`
- `backend/plane-a/src/types/**`
- `backend/shared/**` only when referenced by Plane A

## Required behavior
- Verify request validation and response schemas for public endpoints.
- Enforce rights-matrix and method filtering behavior in APIs.
- Ensure amount bucket logic is exact and properly signaled in responses.
- Confirm AWS/Lambda compatibility (timeouts, payload size, cold-start behavior).
- Follow the standard output format from `AGENTS.md`.

## Non-negotiable invariants
- Rights matrix is authoritative; providers must be explicitly eligible per corridor + method.
- Amount buckets are exact; if no exact bucket, enqueue refresh and mark `approximate` or return `corridor_unsupported` as per contract.
- Methods filter (`bank`, `cash`, `wallet`) must align with provider capabilities.
- Response schemas must be stable and consistent across environments.
- Admin/ops endpoints must be gated by auth + entitlements.

## High-risk routes (prioritize)
1) `backend/plane-a/src/routes/quotes.ts`
2) `backend/plane-a/src/routes/providers.ts`
3) `backend/plane-a/src/routes/bank-vs-specialist.ts`
4) `backend/plane-a/src/routes/corridor-currencies.ts`
5) `backend/plane-a/src/routes/rates.ts`
6) `backend/plane-a/src/routes/pulse.ts`
7) `backend/plane-a/src/routes/ops/**`

## Checklist (what to verify)
- **Input validation**: query params validated, defaults explicit, no silent coercion.
- **Schema stability**: response keys always present; error shapes consistent.
- **Caching**: TTLs sane; cache keys include corridor + method + amount bucket.
- **Bucket logic**: `bucketUsed` equals requested bucket; `approximate` only when allowed.
- **Rights matrix**: provider set intersected with rights matrix; NULL/empty is non-eligible.
- **Method filtering**: `availableMethods` and `methods` are consistent.
- **Ranking math**: TEER/RVI/RCI uses correct mid-market and fee semantics.
- **Auth/entitlements**: admin/ops routes guarded by entitlements and JWT verification.
- **AWS readiness**: Lambda adapters, timeouts, payload size limits, connection reuse.

## Observability expectations
- `x-request-id` preserved and logged.
- Errors use typed codes from `backend/plane-a/src/types/errors.ts`.
- Metrics emitted for quote success, refresh latency, and cache hits.

## Hands-on checks (evidence required)
1) **Contract smoke**: call top endpoints and capture status + response shape.
2) **Rights matrix enforcement**: verify provider set equals allowed providers for a corridor.
3) **Bucket logic**: confirm `amount_bucket` and `bucketUsed` match exact bucket rules.
4) **Method filters**: confirm `availableMethods` and provider methods align with capability data.
5) **Auth/ops gating**: verify ops endpoints return 401/403 without admin entitlements.
6) **Cache freshness**: confirm cache TTL and `age_seconds` lines up with volatility settings.

## Evidence capture template
- Endpoint: <path> status=<code> request_id=<id> schema_ok=<yes/no>
- Rights matrix: <corridor> allowed_providers=<list> response_providers=<list>
- Bucket check: requested=<amount> bucket_used=<amount> approximate=<bool>
- Methods: available=<list> provider_methods=<list>
- Auth gate: ops_endpoint_status=<code>
- Cache TTL: ttl_seconds=<n> age_seconds=<n>

## Common failure modes to catch
- Providers showing for unsupported corridors (rights matrix mismatch).
- Method filter ignored (bank-only providers showing under cash).
- Wrong currency normalization (USD baseline vs local amount).
- Cache bucket reuse across large deltas (should force refresh).
- Missing mid-market rate leading to nonsensical markup/ranking.

## Tests to lean on
- Route tests: `backend/tests/*-route.test.ts`
- Rights matrix enforcement: `backend/tests/rights-matrix-enforcement.test.ts`
- Guardrails: `backend/tests/guardrails.test.ts`

## Output expectations
- Focus on concrete contract violations and how to fix them.
- Call out where the frontend contract will break if changes land.
- Offer 1–2 safe remediation options when behavior is ambiguous.

## Route-specific contract rules
- `/quotes`: must return `bucketUsed`, `approximate`, `availableMethods`, and cache metadata.
- `/providers`: must honor rights matrix and method filters.
- `/bank-vs-specialist`: must return `quotes_unavailable` when empty, not 500.
- `/corridor-currencies`: must not return empty for known corridor.
- `/rates`: must suppress TEER/RCI if mid-market missing.

## Error codes mapping
- `corridor_unsupported` -> 4xx
- `quotes_unavailable` -> 503 or 404 (consistent contract)
- `rate_unavailable` -> 404 with message

## SQL probes (evidence)
- `SELECT * FROM silver.rights_matrix WHERE provider_id = $1;`
- `SELECT * FROM silver.provider_corridor_capability WHERE corridor_id = $1;`
- `SELECT * FROM silver.latest_quote_by_provider WHERE corridor_id = $1;`

## Business logic checks
- Sorting must be based on `recipientGets` for exact bucket.
- Hidden markup must be zero when mid-market missing.
- Delivery time must be consistent with provider limits.

## Validation rules
- Query params must be validated and normalized.
- Amount must be numeric and positive.
- Country codes must be ISO codes.

## Rate limiting
- Apply rate limits to public endpoints.
- Separate limits for auth vs public routes.

## Telemetry expectations
- Provider visits logged with request id.
- Outbound clicks logged with provider id.

## Evidence capture (SQL)
- `SELECT * FROM silver.latest_quote_by_provider WHERE corridor_id = $1 LIMIT 10;`
- `SELECT * FROM silver.provider_corridor_capability WHERE corridor_id = $1 LIMIT 10;`

## Ranking business rules
- Sort by recipientGets for exact bucket.
- Do not show negative hidden markup.
- If mid-market missing, show `marginPct = null`.

## Refresh status contract
- `refresh` object must include request_id(s).
- Status should change to completed/failed with reason.

## Ops/telemetry endpoints
- Ops data must be gated by admin entitlements.
- Telemetry routes must validate payload size.

## Release gates
- Any response missing `bucketUsed` blocks release.
- Any rights-matrix leakage blocks release.
- Any mis-specified error code blocks release.

## Input validation rules
- `from` and `to` country codes must be ISO.
- `amount` must be numeric and > 0.
- `method` must be in allowed set.

## Cache metadata contract
- Response should include cache TTL + age where applicable.
- UI should display freshness based on cache metadata.

## Red-flags
- API returns data with missing `bucketUsed` or `availableMethods`.
- Providers appear that are not rights-matrix eligible.
- Errors are inconsistent across environments.

## Refresh semantics
- Refresh requests must return request_id(s).
- Refresh status must progress to completed/failed with reason.
- UI should poll refresh status, not infer.

## Example response fields (minimum)
- quotes: `amount`, `bucketUsed`, `approximate`, `cache`, `refresh`.
- providers: `methods`, `delivery`, `fxRate`, `recipientGets`.

## Security alignment
- Sensitive endpoints require auth + entitlements.
- No PII in error messages.

## SQL evidence (refresh)
- `SELECT request_id, status FROM silver.quote_refresh_request ORDER BY last_requested_at DESC LIMIT 20;`
- `SELECT provider_id, status FROM silver.latest_quote_by_provider WHERE corridor_id = $1 LIMIT 20;`

## Final gate
- If any route lacks explicit validation, block release.

## Owner accountability
- Each public API must have a designated owner and contract version.

## API versioning policy
- Breaking changes require new version.
- Deprecated fields require migration plan.

## Evidence requirement
- Provide a real response payload for each top endpoint.

## Final checkpoint
- If any endpoint lacks docs, block release.


## Self-healing loop
- Detect missing/incorrect fundamentals that affect multiple agents and propose updates to `ARCHITECTURE.md`.
- Detect agent-specific gaps and propose updates to this RAG file.
- Apply updates only when edits are authorized; otherwise propose changes for approval.
