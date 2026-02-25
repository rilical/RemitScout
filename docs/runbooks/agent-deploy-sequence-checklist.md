# Agent Deploy Sequence Checklist

Use this when handing off to the next agent or running a deployment runbook in a hurry.

## 1) Develop -> Staging Minimal

- Confirm branch baseline:
  - Working tree clean on the source branch.
  - PR merged into `develop` with required docs/tests linked.
- Preflight:
  - `git checkout develop`
  - `git pull --ff-only`
  - Verify `AWS_PROFILE=rs-staging` and `AWS_REGION=us-east-1`.
- Runtime contract:
  - `ENVIRONMENT=staging`, `NODE_ENV=staging`
  - `STACK_NAME` contains `staging`
  - staging API/frontend hostnames and keys are set to staging equivalents.
- Infra/secret prerequisites:
  - GitHub environment `staging` vars: SES/SNS, `AWS_REGION`, `AWS_ROLE_TO_ASSUME`, `STACK_NAME`, public and admin flags.
  - Secrets: `SHARED_SECRET_ARN`, `DATABASE_URL_PLANE_B`, `REDIS_URL`, `SUPABASE_*`, `STRIPE_*`, Slack + optional webhook.
  - `PLANE_A_REQUIRE_API_KEY=1` and API keys created for internal testing.
- Execute minimal deploy:
  - `gh workflow run cd/deploy --ref develop -f env=staging`
  - In `deploy.yml`, confirm minimal/staging profile values are used for the run (reduced worker footprint, WAF/minimal feature set).
- Verify:
  - Readiness job for the same SHA succeeds.
  - `staging.remit-scout.com` serves frontend.
  - `staging-api.remit-scout.com` serves API and auth challenge is expected (API key/JWT where configured).
  - Provider queues/services are up and not failing image pull.

## 2) Staging Minimal -> Staging Full

- Precondition:
  - Latest staging minimal run passed, alarm surfaces clean, and no stack image pull failures.
  - Latest successful readiness run artifact available for exact SHA.
- Preflight:
  - Confirm `PLANE_A_REQUIRE_API_KEY`, WAF allowlist, API key policy, admin allowlist are set for full.
  - Confirm `PUBLIC_*` tracking flags and secrets expected by marketing/contracts.
- Execute full promote:
  - Trigger staging deploy with full-context values (current `deploy.yml` staging job).
  - Ensure `minimalInfra=false`, queue/worker modes are full profile, and workers scaled out.
- Post-checks:
  - Post-deploy smoke + API smoke pass for key routes.
  - Provider queue/backlog signals acceptable for staging.
  - `aws cloudwatch describe-alarms ... api-error-rate-high` and `...api-p99-latency-high` not in ALARM.
  - `aws ssm get-parameter --name "/remit-scout/staging/last-good-image"` returns non-empty.
  - Capture deployment notes in the incident run artifact.

## 3) Staging Full -> Production (Final)

- Precondition:
  - Staging full has burned in for operational windows with no high-severity regressions.
  - Legal/compliance gates recorded (SOC2 state, contract payload checks, provider coverage).
- Preflight:
  - Verify branch/tag is immutable for promotion (`release tag` or signed commit pointer).
  - Verify evidence bundle for last staging full cycle is attached (smoke, evidence jobs, alarm history, queue health, exports health).
  - Verify Stripe, Supabase, Slack, Sentry, SES/SNS, and DNS/tls for production are valid and active.
- Execute prod deploy:
  - Run production workflow path from `cd/deploy` with the exact promoted commit.
  - Keep audit mode strict (no bypass flags).
- Final gates:
  - Readiness run for exact SHA required and green.
  - Staging alarms and synthetic smoke remain healthy during the first 24h of prod life.
  - Confirm production endpoint and TLS, then handoff with rollback strategy and rollback owner.
