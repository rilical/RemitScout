# Architecture + Security Checklist (Target: 10/10)

Feedback source: chat transcript (Feb 12, 2026).

This file tracks the user-provided checklist so we can land changes incrementally without losing state.

## Status key
- ✅ Done
- 🟨 In progress
- ⛔ Not started
- 💤 N/A (confirmed no inputs)

## Architecture

### A1. Eliminate Duplicate Types
- A1.1 PulseCacheFilters extraction + corridorId/corridor mismatch — ✅
- A1.2 Publisher types extraction (AggregatedData/GateResult/PublisherResult) — ✅
- A1.3 getB2bAmountBucket into `shared/amount-bucket.ts` — ✅

### A2. Eliminate Duplicated Business Logic
- A2.1 Payin/payout normalization: Plane A reuse canonical normalization — ✅
- A2.2 normalizeProviderId into `shared/provider-utils.ts` — ✅
- A2.3 normalizeCorridorFilter/Ids into `shared/corridor.ts` — ✅

### A3. Break Up God Files
- A3.1 Split `plane-a/src/routes/providers.ts` — ⛔
- A3.2 Split `plane-a/src/routes/alerts.ts` — ✅
- A3.3 Split `scripts/b2b-sweep-scheduler.ts` — ⛔
- A3.4 Split `scripts/export-worker.ts` — ⛔
- A3.5 Split `shared/oanda-rate-fetcher.ts` — ⛔
- A3.6 Split `shared/config.ts` into modules — ⛔

### A4. Add Missing Repository Interface
- A4.1 `gold-indices-repository.interface.ts` + implement — ✅

### A5. Introduce Dependency Injection
- A5.1 Plane A container — ✅
- A5.2 Inject via Fastify decorate/register — 🟨 (container is decorated on Fastify and route files now use shared container instance; full `app.container` route-local access refactor still pending)
- A5.3 Plane B container + inject into collectors/services — ⛔

### A6. Add Missing Barrel Exports
- A6.1 `plane-a/src/services/index.ts` — ✅
- A6.2 `plane-a/src/plugins/index.ts` — ✅
- A6.3 `shared/index.ts` — ✅

### A7. Config Validation and Fail-Fast
- A7.1 Validate required env vars per plane; list ALL missing — ✅
- A7.2 Call validation unconditionally + AWS connectivity validation + `--validate` — ✅
- A7.3 Reject `PLANE_C_BASE_URL=localhost` in AWS — ✅

### A8. Extract Magic Numbers into Constants
- A8.1 Add `shared/constants.ts` — ✅
- A8.2 Replace hardcoded 500 buckets — ✅
- A8.3 Replace hardcoded 3600 TTLs — ✅
- A8.4 Replace hardcoded 200 limits — ✅

### A9. Improve Module Boundaries
- A9.1 ESLint restricted imports by plane — ✅
- A9.2 Move canonical normalization to `shared/normalize/` — ✅

## Security

### S1. Input Validation
- S1.1 `billing/checkout-session.ts` Zod schema — ✅
- S1.2 `billing/verify-session.ts` UUID schema — ✅
- S1.3 Route validation checklist — ✅ (`docs/security/route-validation-audit.md`)
- S1.4 `billing/portal.ts` Zod schema — 💤 (verify no body params)
- S1.5 `billing/pricing.ts` Zod schema — 💤 (verify no query params)

### S2. Rate limiting
- S2.1 Remove bypass for `/analytics`/`/audit`/`/ops` (use higher cap) — ✅
- S2.2 Per-endpoint limits for auth-sensitive paths — ✅
- S2.3 Fail-closed posture in prod (no skipOnError) — ✅
- S2.4 Stripe webhook limit — ✅
- S2.5 Log warning on in-memory fallback — ✅

### S3. Security headers
- S3.1 CSP default-src none; frame-ancestors none — ✅
- S3.2 Permissions-Policy — ✅
- S3.3 Cache-Control no-store for authenticated — ✅
- S3.4 X-Content-Type-Options on Plane C — ✅

### S4. IP allowlisting
- S4.1 Stripe webhook IP allowlist env — ✅
- S4.2 Admin/ops allowlist env — ✅
- S4.3 WAF IP set rules for Stripe/admin paths — ✅

### S5. API key security
- S5.1 Constant-time comparison in app code — ✅
- S5.2 Rotation grace period — ✅
- S5.3 Scope enforcement — ✅
- S5.4 Last-used tracking + ops view — ✅

### S6. Webhook security
- S6.1 Stripe replay protection in Redis — ✅
- S6.2 webhook_secret rotation for outbound dispatch — ✅

### S7. Sensitive data protection
- S7.1 log redaction module integrated — ✅
- S7.2 audit request.body logging in routes — ✅ (no route logger calls include raw request bodies)
- S7.3 PII classification comments — 🟨 (email done; DB/schema pending)

### S8. SQL safety
- S8.1 Remove `SELECT * FROM ${table}` in export worker — ✅
- S8.2 Guardrail for unsafe query interpolation — ✅
- S8.3 Parameterize gold indices interpolations — ✅

### S9. Auth hardening
- S9.1 Test ensuring all routes guarded or allowlisted — ✅
- S9.2 Document auth bypass paths — ✅
- S9.3 Max token age — ✅
- S9.4 JWT audience validation — ✅

### S10. HTTPS/Transport
- S10.1 HSTS 1 year includeSubDomains preload — ✅ (Plane A)
- S10.2 Plane C HSTS — ✅

### S11. Dependency security
- S11.1 pnpm audit in CI — ✅
- S11.2 pin @aws-sdk/* versions — ✅
- S11.3 move dotenv to devDependencies — ✅
