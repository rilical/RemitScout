# Staging go-live (A->Z integration checklist)

Use this runbook to connect staging end-to-end across AWS, Stripe, Supabase, analytics/ads, Slack Front Desk, and Brain automation.

## Scope + defaults
- Staging is isolated from production (infra, credentials, data).
- Stripe in staging must use test mode (`sk_test_*`).
- Brain/OpenClaw is additive and must not block app uptime.
- Staging ads/analytics are enabled with live IDs, but traffic must be clearly separable.

## 1) Access prerequisites (owner actions)
- AWS access to staging account for IAM OIDC role, Secrets Manager, CloudWatch, SQS/S3/RDS resources.
- GitHub admin access for `staging` Environment vars/secrets.
- Supabase staging project credentials (URL, anon key, service role key).
- Stripe test-mode credentials (secret key, webhook secret, monthly/annual price IDs).
- Slack app credentials for Socket Mode (`xoxb`, `xapp`, signing secret) + ops channel id.
- GA/Ads IDs and confirmation staging tracking is intentional.
- DNS/TLS control for staging hosts.

## 2) GitHub Environment `staging` contract

### Required vars
- `AWS_REGION`
- `AWS_ROLE_TO_ASSUME`
- `STACK_NAME` (must include `staging`)
- `SES_IDENTITY_ARNS`
- `SNS_TOPIC_ARNS`
- `PUBLIC_SITE_URL`
- `PUBLIC_API_BASE`
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `PUBLIC_GA4_MEASUREMENT_ID`
- `PUBLIC_GOOGLE_ADS_CONVERSION_ID`
- Optional: `PUBLIC_ENABLE_ADS` (default `0` for initial launch)
- `SLACK_CASES_CHANNEL_ID`
- `BRAIN_DISPATCH_GITHUB_ACTIONS=1`
- `BRAIN_INGEST_GITHUB_ACTIONS=1`
- `BRAIN_SLACK_POST_CASE_CARDS=1`
- Optional: `SLACK_WEBHOOK_URL`

### Required secrets
- `SHARED_SECRET_ARN`
- `DATABASE_URL_PLANE_B`
- `REDIS_URL`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY` (`sk_test_*`)
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_PLUS`
- `STRIPE_PRICE_ID_PLUS_ANNUAL`
- `SLACK_BOT_TOKEN`
- `SLACK_APP_TOKEN`
- `SLACK_SIGNING_SECRET`
- Optional: `SENTRY_AUTH_TOKEN`

## 3) Local env templates to fill
- Backend: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/backend/.env.staging.example`
- Frontend: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/frontend/.env.staging.example`
- Front desk: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/.env.frontdesk.example`
- Brain: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/.env.brain.example`

## 4) Run readiness checks
1. Run GitHub workflow:
   - `.github/workflows/staging-go-live-readiness.yml`
2. Expect pass from:
   - `backend/scripts/ci/staging-go-live-readiness.ts`
   - `backend/scripts/ci/validate-runtime-config.ts` (optional gate in workflow)

## 5) Deploy + verify
1. Trigger `.github/workflows/deploy.yml` with `env=staging`.
2. Verify infra + backend + frontend deployment complete.
3. Validate evidence workflows produce artifacts (provider/queue/http/freshness/exports/db).

## 6) Functional acceptance
- Stripe test checkout succeeds and webhook updates state.
- Supabase auth + protected routes work (admin and non-admin paths).
- Slack Case cards appear, actions write inbox events, and Brain dispatch/ingestion closes loop.
- Analytics + ads events appear in dashboards and are tagged as staging traffic.
- Staging pages are non-indexable by default (`PUBLIC_ALLOW_SEARCH_INDEXING=0`).
- 24-hour burn-in: uptime and alarm baselines are healthy.

## 7) Failure policy
- If Brain/frontdesk fails, core Plane A/B/C uptime must remain unaffected.
- If readiness workflow fails, do not deploy until missing keys/policies are fixed.
- Do not reuse production secrets in staging.

## 8) Operator command shortcuts
```bash
# Local readiness check (uses current shell env)
pnpm -C backend ci:staging-go-live-readiness

# Backend schema validation for staging profile
ENVIRONMENT=staging NODE_ENV=staging pnpm -C backend ci:config-validate

# Validate worker-control IAM permissions (required before resume)
make status-ops-permissions

# Verify staging migration state before applying
DATABASE_URL_PLANE_B="<staging-credential>" pnpm -C "/Users/omarghabyen/Desktop/Remit-Scout Production V2/backend" db:migrate --dry-run
DATABASE_URL_PLANE_B="<staging-credential>" make db-migrate-staging-dry-run

# Front desk runtime
pnpm -C backend frontdesk:slack

# Brain loop
pnpm -C backend brain:loop
```
