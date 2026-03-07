# Staging Go-Live Checklist (Operator Tick List)

Mark each item as complete (`[x]`) before promoting staging as ready.

## 0) Ownership + access
- [ ] AWS staging account access confirmed (IAM, RDS/Aurora, SQS, S3, CloudWatch, Secrets Manager).
- [ ] IAM principal for `make status-ops-permissions` passes with `ecs:ListClusters`, `ecs:ListServices`, `ecs:UpdateService`, `cloudformation:ListStacks`, and CloudWatch Logs read permissions.
- [ ] GitHub admin access confirmed for repository Environment settings.
- [ ] Supabase staging project access confirmed.
- [ ] Stripe test-mode account access confirmed.
- [ ] Slack workspace app management access confirmed.
- [ ] DNS/TLS access confirmed for staging hostnames.

## 1) DNS + endpoints
- [ ] `https://staging.remit-scout.com` resolves and serves TLS.
- [ ] `https://staging-api.remit-scout.com` resolves and serves TLS.
- [ ] Stripe webhook endpoint hostname is reachable over HTTPS.
- [ ] CDN/image staging origin configured (if used).

## 2) GitHub Environment: `staging` (Variables)
- [ ] `AWS_REGION`
- [ ] `AWS_ROLE_TO_ASSUME`
- [ ] `STACK_NAME` (contains `staging`)
- [ ] `SES_IDENTITY_ARNS`
- [ ] `SNS_TOPIC_ARNS`
- [ ] `PUBLIC_SITE_URL`
- [ ] `PUBLIC_API_BASE`
- [ ] `PLANE_A_DOMAIN_NAME`
- [ ] `PLANE_A_CERT_ARN`
- [ ] `PUBLIC_SUPABASE_URL`
- [ ] `PUBLIC_SUPABASE_ANON_KEY`
- [ ] `COMPLIANCE_SOC2_TYPE_II_STATUS`
- [ ] `COMPLIANCE_SOC2_TYPE_II_REPORT_STATE`
- [ ] `COMPLIANCE_SOC2_TYPE_II_REPORT_DATE`
- [ ] `COMPLIANCE_SOC2_TYPE_II_EXPIRES_ON`
- [ ] `COMPLIANCE_SOC2_TYPE_II_REPORT_URL`
- [ ] `PUBLIC_GA4_MEASUREMENT_ID`
- [ ] `PUBLIC_GOOGLE_ADS_CONVERSION_ID`
- [ ] Optional: `PUBLIC_ENABLE_ADS` (set to `1` when ad provider is onboarded; default `0` for initial launch)
- [ ] `SLACK_CASES_CHANNEL_ID`
- [ ] `BRAIN_DISPATCH_GITHUB_ACTIONS=1`
- [ ] `BRAIN_INGEST_GITHUB_ACTIONS=1`
- [ ] `BRAIN_SLACK_POST_CASE_CARDS=1`
- [ ] Optional: `SLACK_WEBHOOK_URL`

## 3) GitHub Environment: `staging` (Secrets)
- [ ] `SHARED_SECRET_ARN`
- [ ] `DATABASE_URL_PLANE_B`
- [ ] `REDIS_URL`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_PUBLISHABLE_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `STRIPE_SECRET_KEY` (`sk_test_*`)
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `STRIPE_PRICE_ID_PLUS`
- [ ] `STRIPE_PRICE_ID_PLUS_ANNUAL`
- [ ] `SLACK_BOT_TOKEN`
- [ ] `SLACK_APP_TOKEN`
- [ ] `SLACK_SIGNING_SECRET`
- [ ] `SENTRY_AUTH_TOKEN`
- [ ] `SENTRY_ORG`
- [ ] `SENTRY_PROJECT`
- [ ] `ALERT_SLACK_WEBHOOK_URL`

## 4) Backend env (staging profile)
Source template:
- `backend/.env.staging.example`

- [ ] `ENVIRONMENT=staging`
- [ ] `NODE_ENV=staging`
- [ ] `STRICT_CONFIG=1`
- [ ] `READ_ONLY_MODE=0`
- [ ] `E2E_MOCK_API` is unset (`0`/empty)
- [ ] Staging DB URLs set (no prod DB values).
- [ ] Staging Redis URL set.
- [ ] Staging S3 buckets set (`BRONZE_S3_BUCKET`, `EXPORTS_S3_BUCKET`).
- [ ] Supabase staging keys set.
- [ ] Stripe test keys set (`sk_test_*` + webhook + both price ids).
- [ ] Queue modes validated for staging (`queue`/`shadow` as intended).

## 5) Frontend env (staging profile)
Source template:
- `frontend/.env.staging.example`

- [ ] `NODE_ENV=staging`
- [ ] `PUBLIC_SITE_URL` points to staging host.
- [ ] `PUBLIC_API_BASE` points to staging API.
- [ ] `PUBLIC_API_BASE` host matches `PLANE_A_DOMAIN_NAME`.
- [ ] Supabase public staging keys set.
- [ ] `PUBLIC_ALLOW_SEARCH_INDEXING=0` (noindex safeguard).
- [ ] GA4 and Ads IDs set for staging test tracking.
- [ ] `PUBLIC_ENABLE_ADS` set intentionally (`0` for initial launch without ads).

## 6) Slack Front Desk setup
- [ ] Slack app created.
- [ ] Socket Mode enabled.
- [ ] Scopes set: `chat:write`, `commands`.
- [ ] Bot invited to ops channel.
- [ ] `.env.frontdesk` created from `.env.frontdesk.example`.
- [ ] Front desk process starts cleanly (`pnpm -C backend frontdesk:slack`).

## 7) Brain setup
- [ ] `.env.brain` created from `.env.brain.example`.
- [ ] `GITHUB_REPOSITORY` and `GITHUB_TOKEN` set with required permissions.
- [ ] Brain loop starts cleanly (`pnpm -C backend brain:loop`).
- [ ] Brain dispatch + ingestion flags enabled for staging.
- [ ] Brain can post case cards to Slack channel.

## 8) AWS / OIDC / deploy wiring
- [ ] OIDC trust policy matches repo + `staging` environment.
- [ ] Deploy role can assume and access required AWS resources.
- [ ] Secrets Manager/SSM references resolve in staging deploy jobs.
- [ ] CloudWatch alarms and dashboards exist for staging.
- [ ] Run `make status-ops-permissions` (or `AWS_PROFILE=... OPS_ENV=staging make status-ops-permissions`) before worker resume operations.

## 9) Readiness and deployment gates
- [ ] Run workflow: `.github/workflows/staging-go-live-readiness.yml` (PASS).
- [ ] Run workflow: `.github/workflows/deploy.yml` with `env=staging` (PASS).
- [ ] Runtime config validation passes (`ci:config-validate` in staging profile).
- [ ] Public integration smoke passes (`pnpm -C backend ci:integration-smoke`) against `PUBLIC_API_BASE`.
- [ ] Authenticated watchlist/alerts smoke passes (`pnpm -C backend ci:alerts-watchlists-smoke` in deploy pipeline).
- [ ] Authenticated smoke for `omar@remit-scout.com` confirms `/api/v1/me` returns `app_role=super_admin` and enterprise entitlements.
- [ ] Enterprise + triangulation smoke passes (`pnpm -C backend ci:enterprise-triangulation-smoke`) and leaves artifact logs in workflow evidence.
- [ ] Admin surface smoke passes (`pnpm -C backend ci:admin-surface-smoke`) and leaves artifact logs in workflow evidence.
- [ ] Current GitHub runner IP is inside `ADMIN_IP_ALLOWLIST` / `WAF_ADMIN_ALLOWLIST_IPS`; admin smoke must not bypass network controls.
- [ ] Agent pipeline E2E health passes (`backend/scripts/e2e-agent-health-check.ts`) with recent detection cycles and dispatch activity.
- [ ] For enterprise-mode staging (`PLANE_A_REQUIRE_API_KEY=1`), SOC 2 report state is allowed (`in_progress`/`audited`) and not expired/revoked in readiness checks.

## 10) Functional checks after deploy
- [ ] Plane A health and key API routes respond.
- [ ] Provider evidence workflows run and upload artifacts.
- [ ] Queue/freshness/exports/db evidence workflows run and upload artifacts.
- [ ] Burp manual security session completed using `docs/security/burp-manual-security-session.md`.
- [ ] Claude STRIDE output reviewed and triaged; artifacts updated:
  - `docs/security/stride-threat-model-2026-02.md`
  - `docs/security/security-findings-register-2026-02.md`
- [ ] Stripe test checkout succeeds.
- [ ] Stripe webhook signature verification succeeds.
- [ ] Supabase login + protected route behavior verified.
- [ ] Slack case card flow verified end-to-end (signal -> dispatch -> ingest -> update).
- [ ] Analytics/ads events visible and identified as staging traffic.

## 11) Burn-in (24 hours)
- [ ] Uptime stable for 24h.
- [ ] No sev2/sev3 unresolved alarms.
- [ ] No runaway queue age / DLQ growth.
- [ ] No unbounded error spikes in API/worker logs.
- [ ] Brain/frontdesk downtime test confirms core app remains functional.

## 12) Final go/no-go
- [ ] All sections above complete.
- [ ] Open risks documented and accepted.
- [ ] Staging marked READY in ops channel.

## References
- `docs/runbooks/staging-go-live.md`
- `docs/runbooks/github-actions-cicd-v2.md`
- `ops/frontdesk/README.md`
- `ops/brain/README.md`
