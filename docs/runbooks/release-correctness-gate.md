# Release Correctness Gate

Purpose:
- catch release-critical regressions before a push or staging run burns time
- keep local, CI, and staging checks aligned from one manifest

Catalog:
- `.remit-scout/release-correctness-gates.json`

Primary commands:
- `pnpm release:checklist`
- `pnpm release:gate:prepush`
- `pnpm release:gate:local`
- `pnpm release:gate:ci`
- `pnpm release:gate:staging`
- `pnpm release:b2c:local`

Profiles:
- `prepush`: fast local gate from the Husky `pre-push` hook; no staging dependency
- `local`: broader local gate with builds
- `ci`: same critical release suite plus migration and API smoke against CI Postgres
- `staging`: authenticated remote smoke for auth, enterprise, admin, alerts, B2C, exports, triangulation, queue resilience, and observability

What `prepush` covers:
- secret placeholder and generated-artifact guards
- migration numbering and changed-file SQL interpolation guard
- frontend API type drift
- dedicated B2C backend coverage for forgot-password, newsletter, welcome email, Plus billing, watchlists, smart alerts, account deletion, and plan-tier gating
- dedicated B2C frontend coverage for sign-in/up, forgot-password, newsletter signup, Plus success, watchlist/alert UX, and account deletion
- release backend suites for auth, enterprise, admin, alerts, exports, TEER, RCI, RVI, pulse APIs, embeds, charts, provider weighting, triangulation, and self-healing
- release backend suites for queue health, worker resilience, CloudWatch/New Relic exporters, OpenAPI drift, config safety, and migration governance
- release frontend suites for auth, enterprise, admin, watchlists, corridors, pulse embeds, pulse charts, and chart export surfaces
- frontend typecheck

Local B2C browser smoke:
- `pnpm release:b2c:local` runs the B2C backend suite, B2C frontend suite, and focused Playwright browser checks for send-money corridor flows, watchlist actions, action-state persistence, and welcome-back UX
- CI already exercises these new unit specs via `backend test:coverage`, `frontend test:coverage`, and browser coverage via `frontend test:e2e`

What `staging` covers:
- `ci:integration-smoke`
- `ci:auth-surface-smoke`
- `ci:alerts-watchlists-smoke`
- `ci:admin-surface-smoke`
- `ci:enterprise-triangulation-smoke`
- `ci:worker-resilience-smoke`
- `frontend test:e2e:release:auth-remote`
- `frontend test:e2e:release:admin-remote`
- runtime config validation
- observability gate
- business-signal observability gate (`ci:observability-business-gate`)

Required env for remote smoke:
- `SMOKE_BASE_URL`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY` or `SUPABASE_ANON_KEY`
- `SMOKE_USER_EMAIL`
- `SMOKE_USER_PASSWORD`
- `PLAYWRIGHT_BASE_URL`
- `E2E_AUTH_EMAIL`
- `E2E_AUTH_PASSWORD`
- `NEW_RELIC_USER_API_KEY`
- `NEW_RELIC_ACCOUNT_ID`
- `NEW_RELIC_REGION`
- `AWS_REGION`

Optional remote overrides:
- `SMOKE_EXPECT_MFA=1`
- `SMOKE_REQUIRE_EMAIL_CONFIRMATION=1`
- `SMOKE_EXPECT_OPS_ACTIVE=1`
- `SMOKE_ENTERPRISE_CORRIDOR_ID`
- `SMOKE_ENTERPRISE_AMOUNT_BUCKET`
- `SMOKE_ENTERPRISE_METHOD_PROFILE`
- `SMOKE_ALLOW_EMPTY_TRIANGULATION=1`
- `SMOKE_ALLOW_EXPORT_PIPELINE_DEGRADED=1`
- `OBS_GATE_WINDOW_MINUTES=1440`
- `OBS_GATE_REQUIRE_EXPORT_WORKER_METRIC=1`
- `OBS_GATE_REQUIRE_ALERT_WORKER_METRIC=1`
- `OBS_GATE_REQUIRE_SIGNUP_METRIC=1`
- `OBS_GATE_REQUIRE_AGENT_METRIC=1`

Notes:
- `prepush` is intentionally local-first. It does not require staging to be resumed.
- `ci` is the profile to wire into GitHub Actions because it proves the same critical flows with a disposable Postgres service.
- `staging` should run after deploy/readiness when you need environment truth, not just code truth.
