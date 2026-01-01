# Sprint 2 Prompt Pack - Identity and Entitlements

## Status check
- All tasks in this prompt pack are crossed out.
- db:migrate failed in this environment due to no local Postgres; see docs/local-dev-notes.md.
- Tests ran with skips (guardrails, api-me, billing-webhook) due to missing env/DB; see docs/local-dev-notes.md.
- AWS env var list for deployment: docs/aws/env-vars.md.

## Execution protocol (must follow)
1. Do tasks in order, one at a time.
2. After finishing a task, edit this file and wrap the entire task line in ~~ ~~ to cross it out. Do not delete tasks.
3. Make the smallest diff that satisfies each task's AC.
4. Do not rename files unless a task explicitly says so.
5. Do not introduce new dependencies unless a task explicitly requires it.
6. Do not change database grants in ways that allow Plane A to read bronze.*.
7. Do not add non-ASCII characters to docs.
8. If a file path is ambiguous, search the repo and choose the Plane-specific file by context.
9. Do not add code that bypasses blocks (no CAPTCHA solving, no proxy rotation loops).

## RSE anchors (use when unsure)
- RSE-271225-022936.txt L340-L358: identity, billing, entitlements, /api/me.
- RSE-271225-022936.txt L358, L981-L996: /api/me contract and entitlements.
- RSE-271225-022936.txt L900-L903, L2150-L2153: billing endpoints.
- RSE-271225-022936.txt L957-L958, L2056-L2071: server-side entitlements enforcement, JWKS caching, no client trust.
- RSE-271225-022936.txt L2663-L2694: user_plan and billing_webhook_event tables.

## Sprint 2 outcome (target)
- Plane A verifies Supabase JWTs with JWKS first and remote fallback.
- /api/me is the source of truth for plan and entitlements.
- Stripe upgrade flow works end-to-end (checkout + webhook updates).
- Premium endpoints are enforced server-side.
- Tests prove auth and gating cannot be bypassed.

---

## S2.0 Docs and catalogs (system of record)

~~- [ ] S2.0.1 Create docs/sprints/S2-identity-entitlements.md~~
  Prompt:
  "Create docs/sprints/S2-identity-entitlements.md. Add sections: Goals, RSE Anchors, Endpoints, Data Tables, Exit Criteria, Non-goals. Include the exact /api/me JSON response contract and list which endpoints require auth and which require Plus. Keep it concise and ASCII only."
  Files: docs/sprints/S2-identity-entitlements.md
  AC: file exists with all sections and /api/me response shape.
  Command: cat docs/sprints/S2-identity-entitlements.md

~~- [ ] S2.0.2 Update API catalog for Sprint 2 endpoints~~
  Prompt:
  "Update docs/catalogs/api-catalog.md to add rows for GET /api/me, POST /api/billing/checkout-session, GET /api/billing/portal, POST /api/billing/webhook. Set Auth and Entitlement columns explicitly. Point OpenAPI to docs/openapi/auth.yaml for /api/me and docs/openapi/billing.yaml for billing endpoints."
  Files: docs/catalogs/api-catalog.md
  AC: rows exist with correct auth and OpenAPI references.
  Command: rg -n "/api/me|/api/billing" docs/catalogs/api-catalog.md

~~- [ ] S2.0.3 Update service catalog for auth and billing~~
  Prompt:
  "Update docs/catalogs/service-catalog.md to add services: Entitlements/Auth (Plane A) and Billing Webhook Handler (Plane A). Keep descriptions short and factual."
  Files: docs/catalogs/service-catalog.md
  AC: new services listed.
  Command: rg -n "Entitlements/Auth|Billing Webhook" docs/catalogs/service-catalog.md

~~- [ ] S2.0.4 Create OpenAPI file for /api/me~~
  Prompt:
  "Create docs/openapi/auth.yaml with OpenAPI skeleton and a path for GET /api/me. Include auth header requirement and response schema fields. Keep minimal."
  Files: docs/openapi/auth.yaml
  AC: file exists and includes /api/me path.
  Command: rg -n "/api/me" docs/openapi/auth.yaml

~~- [ ] S2.0.5 Create OpenAPI file for billing endpoints~~
  Prompt:
  "Create docs/openapi/billing.yaml with paths for POST /api/billing/checkout-session, GET /api/billing/portal, POST /api/billing/webhook. Include auth requirement for checkout and portal, and Stripe signature for webhook. Keep minimal."
  Files: docs/openapi/billing.yaml
  AC: file exists and includes all three paths.
  Command: rg -n "checkout-session|billing/portal|billing/webhook" docs/openapi/billing.yaml

~~- [ ] S2.0.6 Update docs/INDEX.md to link Sprint 2 docs~~
  Prompt:
  "Add links to docs/sprints/S2-identity-entitlements.md, docs/openapi/auth.yaml, and docs/openapi/billing.yaml in docs/INDEX.md. Keep it as a simple bullet list."
  Files: docs/INDEX.md
  AC: links are present.
  Command: rg -n "S2-identity-entitlements|auth.yaml|billing.yaml" docs/INDEX.md

---

## S2.1 Env and config

~~- [ ] S2.1.1 Add Supabase env vars to backend/.env.example~~
  Prompt:
  "Update backend/.env.example to include SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_JWKS_URL (optional), SUPABASE_AUTH_VERIFY_MODE (auto|jwks|remote), SUPABASE_AUTH_REMOTE_VERIFY_CACHE_TTL_SECONDS. Add short comments for each."
  Files: backend/.env.example
  AC: env vars present and documented.
  Command: rg -n "SUPABASE_" backend/.env.example

~~- [ ] S2.1.2 Add Stripe env vars to backend/.env.example~~
  Prompt:
  "Update backend/.env.example to include STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID_PLUS, FRONTEND_BASE_URL. Keep examples simple."
  Files: backend/.env.example
  AC: env vars present.
  Command: rg -n "STRIPE_|FRONTEND_BASE_URL" backend/.env.example

~~- [ ] S2.1.3 Extend backend/shared/config.ts with auth and billing config~~
  Prompt:
  "Update backend/shared/config.ts to add config.auth.supabase and config.billing.stripe. Derive SUPABASE_JWKS_URL from SUPABASE_URL when not provided. Validate SUPABASE_AUTH_VERIFY_MODE with default 'auto'. Add STRIPE_PRICE_ID_PLUS and FRONTEND_BASE_URL. Do not break existing config users."
  Files: backend/shared/config.ts
  AC: config loads and exports new fields.
  Command: rg -n "supabase|stripe|FRONTEND_BASE_URL" backend/shared/config.ts

---

## S2.2 Supabase JWT verification (JWKS first, remote fallback)

~~- [ ] S2.2.1 Add auth types~~
  Prompt:
  "Create backend/plane-a/src/auth/types.ts defining AuthUser, AuthClaims, AuthError, and AuthErrorCode types. Keep it small and reusable."
  Files: backend/plane-a/src/auth/types.ts
  AC: file exists with types.
  Command: cat backend/plane-a/src/auth/types.ts

~~- [ ] S2.2.2 Add JWKS cache helper~~
  Prompt:
  "Create backend/plane-a/src/auth/jwks-cache.ts. Implement an in-memory cache with TTL. Export getCachedJwks() and setCachedJwks(). Use config.auth.supabase.jwksUrl and a ttlSeconds setting."
  Files: backend/plane-a/src/auth/jwks-cache.ts
  AC: cache helper exists with TTL logic.
  Command: cat backend/plane-a/src/auth/jwks-cache.ts

~~- [ ] S2.2.3 Add JWKS fetch and parse~~
  Prompt:
  "Create backend/plane-a/src/auth/jwks-fetch.ts to fetch JWKS JSON from SUPABASE_JWKS_URL. Validate shape minimally (keys array). Return empty array if invalid. Do not throw for network errors; return empty array."
  Files: backend/plane-a/src/auth/jwks-fetch.ts
  AC: fetch helper returns keys array or empty.
  Command: cat backend/plane-a/src/auth/jwks-fetch.ts

~~- [ ] S2.2.4 Add remote verify helper with cache~~
  Prompt:
  "Create backend/plane-a/src/auth/remote-verify.ts to call GET {SUPABASE_URL}/auth/v1/user with apikey and Authorization headers. Add in-memory TTL cache keyed by token to reduce latency. Return user id and claims when status 200; otherwise return null."
  Files: backend/plane-a/src/auth/remote-verify.ts
  AC: helper exists and caches per token.
  Command: cat backend/plane-a/src/auth/remote-verify.ts

~~- [ ] S2.2.5 Add JWKS-based JWT verification~~
  Prompt:
  "Create backend/plane-a/src/auth/jwks-verify.ts to verify JWT signature and exp using JWKS keys. Use jose if needed. Return claims on success or null on failure."
  Files: backend/plane-a/src/auth/jwks-verify.ts
  AC: helper exists and returns claims or null.
  Command: cat backend/plane-a/src/auth/jwks-verify.ts

~~- [ ] S2.2.6 Add verifySupabaseJwt orchestrator~~
  Prompt:
  "Create backend/plane-a/src/auth/verify-supabase-jwt.ts. Logic: parse Bearer token; if mode allows jwks, try jwks verify first; if jwks unavailable or verify fails, try remote verify; if mode is remote-only, skip jwks. Return AuthUser or AuthError."
  Files: backend/plane-a/src/auth/verify-supabase-jwt.ts
  AC: orchestrator returns structured result.
  Command: cat backend/plane-a/src/auth/verify-supabase-jwt.ts

~~- [ ] S2.2.7 Add jose dependency if needed~~
  Prompt:
  "If backend/package.json does not already include jose, add it and update pnpm-lock.yaml. Only add if required by jwks-verify implementation."
  Files: backend/package.json, pnpm-lock.yaml
  AC: dependency added only if used.
  Command: rg -n "jose" backend/package.json

---

## S2.3 Plane A auth plugin and app refactor

~~- [ ] S2.3.1 Extract app builder for tests~~
  Prompt:
  "Create backend/plane-a/src/app.ts that exports buildApp(). Move Fastify setup, pool creation, health/ready routes, and route registrations into buildApp(). Keep behavior identical."
  Files: backend/plane-a/src/app.ts, backend/plane-a/src/server.ts
  AC: server.ts uses buildApp() and still starts the server.
  Command: rg -n "buildApp" backend/plane-a/src/server.ts

~~- [ ] S2.3.2 Add request.user typing~~
  Prompt:
  "Create backend/plane-a/src/types/fastify.d.ts to extend FastifyRequest with user?: AuthUser and authError?: AuthError. Ensure tsconfig picks it up."
  Files: backend/plane-a/src/types/fastify.d.ts
  AC: type file exists under src.
  Command: cat backend/plane-a/src/types/fastify.d.ts

~~- [ ] S2.3.3 Add auth plugin~~
  Prompt:
  "Create backend/plane-a/src/plugins/auth-plugin.ts. It should parse Authorization header, call verifySupabaseJwt, and attach request.user. Export helpers requireAuth and requireEntitlement. Do not block requests by default."
  Files: backend/plane-a/src/plugins/auth-plugin.ts
  AC: plugin and helpers exist.
  Command: cat backend/plane-a/src/plugins/auth-plugin.ts

~~- [ ] S2.3.4 Register auth plugin in app~~
  Prompt:
  "Update backend/plane-a/src/app.ts to register the auth plugin once and make helpers available to routes. Do not change existing public endpoints."
  Files: backend/plane-a/src/app.ts
  AC: app registers plugin without breaking routes.
  Command: rg -n "auth" backend/plane-a/src/app.ts

---

## S2.4 Silver tables for identity and billing

~~- [ ] S2.4.1 Create migration 003_identity_entitlements.sql~~
  Prompt:
  "Create backend/db/migrations/003_identity_entitlements.sql with IF NOT EXISTS patterns. Add tables: silver.user_account, silver.user_plan, silver.plan_usage_counter, silver.billing_webhook_event. Add indexes: user_plan(plan_code,status), plan_usage_counter(user_id,scope,window_start)."
  Files: backend/db/migrations/003_identity_entitlements.sql
  AC: migration contains all tables and indexes, no DROP statements.
  Command: rg -n "user_account|user_plan|plan_usage_counter|billing_webhook_event" backend/db/migrations/003_identity_entitlements.sql

~~- [ ] S2.4.2 Add grants for Plane A~~
  Prompt:
  "In the same migration, add GRANT statements so plane_a can read/write the new Silver tables. Do not grant bronze.* access. Plane C should not be granted by default."
  Files: backend/db/migrations/003_identity_entitlements.sql
  AC: grants exist for plane_a only.
  Command: rg -n "GRANT" backend/db/migrations/003_identity_entitlements.sql

---

## S2.5 Plan and entitlement services

~~- [ ] S2.5.1 Add entitlements mapping~~
  Prompt:
  "Create backend/plane-a/src/services/entitlements.ts mapping plan_code to entitlements. Include fields: pulse_access, exports_enabled, alerts_max, history_max_days. Add types and a function getEntitlementsForPlan()."
  Files: backend/plane-a/src/services/entitlements.ts
  AC: deterministic mapping exists.
  Command: cat backend/plane-a/src/services/entitlements.ts

~~- [ ] S2.5.2 Add user account upsert~~
  Prompt:
  "Create backend/plane-a/src/services/user-account.ts with upsertUserAccount(pool, user). Ensure it inserts or updates email and last_seen_at." 
  Files: backend/plane-a/src/services/user-account.ts
  AC: function exists and uses SQL upsert.
  Command: cat backend/plane-a/src/services/user-account.ts

~~- [ ] S2.5.3 Add user plan helpers~~
  Prompt:
  "Create backend/plane-a/src/services/user-plan.ts with: ensureUserPlan(pool, userId), getUserPlan(pool, userId), updatePlanFromStripe(pool, event). Keep SQL simple and use defaults for new users (free/active)."
  Files: backend/plane-a/src/services/user-plan.ts
  AC: helpers exist and use silver.user_plan.
  Command: cat backend/plane-a/src/services/user-plan.ts

~~- [ ] S2.5.4 Add usage counter helper (stub)~~
  Prompt:
  "Create backend/plane-a/src/services/plan-usage.ts with a minimal read helper that returns usage counters for a user. If no counters exist, return empty object."
  Files: backend/plane-a/src/services/plan-usage.ts
  AC: helper exists.
  Command: cat backend/plane-a/src/services/plan-usage.ts

---

## S2.6 /api/me endpoint

~~- [ ] S2.6.1 Add /api/me route module~~
  Prompt:
  "Create backend/plane-a/src/routes/me.ts. Implement GET /api/me with requireAuth. Use user_account and user_plan helpers to upsert and fetch plan. Return success, timestamp, user, plan, entitlements, and usage."
  Files: backend/plane-a/src/routes/me.ts
  AC: route returns documented response.
  Command: cat backend/plane-a/src/routes/me.ts

~~- [ ] S2.6.2 Register /api/me route~~
  Prompt:
  "Update backend/plane-a/src/app.ts to register meRoutes before listen. Do not change other middleware."
  Files: backend/plane-a/src/app.ts
  AC: /api/me is registered.
  Command: rg -n "meRoutes" backend/plane-a/src/app.ts

---

## S2.7 Stripe billing endpoints

~~- [ ] S2.7.1 Add Stripe dependency (if missing)~~
  Prompt:
  "If backend/package.json does not already include stripe, add it and update pnpm-lock.yaml."
  Files: backend/package.json, pnpm-lock.yaml
  AC: stripe dependency added only if used.
  Command: rg -n "stripe" backend/package.json

~~- [ ] S2.7.2 Add Stripe client helper~~
  Prompt:
  "Create backend/plane-a/src/services/stripe-client.ts to initialize Stripe with STRIPE_SECRET_KEY. Export getStripeClient()."
  Files: backend/plane-a/src/services/stripe-client.ts
  AC: helper exists and reads config.
  Command: cat backend/plane-a/src/services/stripe-client.ts

~~- [ ] S2.7.3 Add checkout session route~~
  Prompt:
  "Create backend/plane-a/src/routes/billing/checkout-session.ts for POST /api/billing/checkout-session. Require auth. Create Stripe customer if missing, store stripe_customer_id, then create checkout session for STRIPE_PRICE_ID_PLUS. Return session URL or id."
  Files: backend/plane-a/src/routes/billing/checkout-session.ts
  AC: route creates session and updates user_plan.
  Command: cat backend/plane-a/src/routes/billing/checkout-session.ts

~~- [ ] S2.7.4 Add billing portal route~~
  Prompt:
  "Create backend/plane-a/src/routes/billing/portal.ts for GET /api/billing/portal. Require auth. Create Stripe portal session for stripe_customer_id and return URL."
  Files: backend/plane-a/src/routes/billing/portal.ts
  AC: route returns portal URL.
  Command: cat backend/plane-a/src/routes/billing/portal.ts

~~- [ ] S2.7.5 Add webhook route with raw body verification~~
  Prompt:
  "Create backend/plane-a/src/routes/billing/webhook.ts for POST /api/billing/webhook. Use raw request body to verify Stripe signature (STRIPE_WEBHOOK_SECRET). Persist every event to silver.billing_webhook_event and make processing idempotent. Update user_plan from subscription events."
  Files: backend/plane-a/src/routes/billing/webhook.ts
  AC: route verifies signature and is idempotent.
  Command: cat backend/plane-a/src/routes/billing/webhook.ts

~~- [ ] S2.7.6 Register billing routes and raw body handling~~
  Prompt:
  "Add a billing routes index file to register checkout-session, portal, and webhook routes. Update backend/plane-a/src/app.ts to register billing routes. Add any raw-body parser needed for Stripe webhook without affecting other routes."
  Files: backend/plane-a/src/routes/billing/index.ts, backend/plane-a/src/app.ts
  AC: billing routes are registered and webhook can access raw body.
  Command: rg -n "billing" backend/plane-a/src/app.ts

---

## S2.8 Entitlement enforcement

~~- [ ] S2.8.1 Implement requireEntitlement to query plan~~
  Prompt:
  "Update backend/plane-a/src/plugins/auth-plugin.ts to implement requireEntitlement. It should load the user plan from silver.user_plan, compute entitlements, and reject with 403 if missing."
  Files: backend/plane-a/src/plugins/auth-plugin.ts
  AC: requireEntitlement enforces plan-based access.
  Command: rg -n "requireEntitlement" backend/plane-a/src/plugins/auth-plugin.ts

~~- [ ] S2.8.2 Add a protected stub endpoint for gating tests~~
  Prompt:
  "Create backend/plane-a/src/routes/pulse-status.ts with GET /api/pulse/status. Use requireEntitlement('pulse'). Return { status: 'ok' }. This is a stub to validate gating."
  Files: backend/plane-a/src/routes/pulse-status.ts, backend/plane-a/src/app.ts
  AC: endpoint exists and is gated.
  Command: rg -n "pulse/status" backend/plane-a/src/routes/pulse-status.ts

---

## S2.9 Tests

~~- [ ] S2.9.1 Unit tests for entitlements mapping~~
  Prompt:
  "Create backend/tests/entitlements.test.ts. Assert each plan_code returns expected entitlements and that unknown plans default to free."
  Files: backend/tests/entitlements.test.ts
  AC: tests pass.
  Command: pnpm -C backend test

~~- [ ] S2.9.2 Unit tests for JWT verification~~
  Prompt:
  "Create backend/tests/supabase-jwt.test.ts. Mock JWKS fetch and remote verify. Cover: missing token, jwks success, jwks empty -> remote success, remote failure."
  Files: backend/tests/supabase-jwt.test.ts
  AC: tests pass.
  Command: pnpm -C backend test

~~- [ ] S2.9.3 Integration tests for /api/me~~
  Prompt:
  "Create backend/tests/api-me.test.ts. Spin up buildApp(), inject a request with a mocked verifySupabaseJwt that returns a user. Assert /api/me returns plan and entitlements. If DB env is missing, skip tests."
  Files: backend/tests/api-me.test.ts
  AC: tests pass or skip with clear message.
  Command: pnpm -C backend test

~~- [ ] S2.9.4 Integration tests for entitlement gating~~
  Prompt:
  "Create backend/tests/entitlement-gating.test.ts. Spin up buildApp(), mock plan to free and plus. Assert /api/pulse/status returns 403 for free and 200 for plus."
  Files: backend/tests/entitlement-gating.test.ts
  AC: tests cover both cases.
  Command: pnpm -C backend test

~~- [ ] S2.9.5 Webhook idempotency test (minimal)~~
  Prompt:
  "Create backend/tests/billing-webhook.test.ts. Use a dummy Stripe event and ensure that posting the same event_id twice does not double-update user_plan. Skip if STRIPE_WEBHOOK_SECRET is missing."
  Files: backend/tests/billing-webhook.test.ts
  AC: idempotency validated or skipped with clear message.
  Command: pnpm -C backend test

---

## S2.10 Validation and run steps

~~- [ ] S2.10.1 Run migrations~~
  Prompt:
  "Run pnpm -C backend db:migrate and confirm 003_identity_entitlements.sql applies. Capture any errors in local-dev-notes.md."
  Files: docs/local-dev-notes.md
  AC: notes updated with results.
  Command: pnpm -C backend db:migrate

~~- [ ] S2.10.2 Run tests~~
  Prompt:
  "Run pnpm -C backend test and note failures in local-dev-notes.md."
  Files: docs/local-dev-notes.md
  AC: test results recorded.
  Command: pnpm -C backend test
