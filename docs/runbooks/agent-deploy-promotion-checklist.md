# Agent Deploy Promotion Checklist (Develop -> Staging Minimal -> Staging Full -> Prod)

Last updated: 2026-02-26

Purpose:
- This is the canonical promotion checklist for agents.
- Read this before any deploy/promotion task.
- Do not invent alternative flow unless explicitly approved.

## Source of truth
- Deploy workflow: `.github/workflows/deploy.yml`
- Readiness workflow: `.github/workflows/staging-go-live-readiness.yml`
- Runtime readiness checks: `backend/scripts/ci/staging-go-live-readiness.ts`
- Runtime config validation: `backend/scripts/ci/validate-runtime-config.ts`
- Architecture invariants: `ARCHITECTURE.md`
- Nested-stack migration runbook: `docs/runbooks/cdk-nested-stack-migration.md`

## Promotion invariants (all stages)
- Promote by immutable commit SHA, not by branch name alone.
- Never promote if staging readiness failed for the same SHA.
- Keep environment isolation explicit:
  - staging values must include `staging`
  - production values must include `prod` or production hostnames
- Do not skip evidence:
  - smoke
  - alarm gate
  - last-known-good image update

## Stage 0: Preflight (required every time)
- [ ] Confirm feedback source (chat/file) and one-line user goal.
- [ ] Confirm target SHA:
  - `git rev-parse --short=7 <ref>`
- [ ] Confirm required staging/prod env contracts exist (vars + secrets in GitHub Environment).
- [ ] Confirm AWS caller identity and region are correct for target env.
- [ ] Confirm no active critical alarms in current target env before changing anything.
- [ ] If this is the first deploy after CDK stack split:
  - run nested-stack migration procedure from `docs/runbooks/cdk-nested-stack-migration.md`
  - require zero replacement before normal deploy

## Stage 1: Develop -> Staging Minimal

Definition:
- Staging minimal is bootstrap validation for deploy path and public surfaces.
- It is not sufficient for production promotion.

Execution:
- [ ] Trigger staging deploy from develop SHA:
  - `gh workflow run deploy.yml -f env=staging -f ref="<develop_sha>"`
- [ ] Wait for workflow completion and capture run URL.
- [ ] Confirm deploy completed (infra/backend/frontend steps succeeded).
- [ ] Confirm public route checks passed (no 401 on:
  - `/api/v1/quotes/refresh-status`
  - `/api/v1/sessions/track`
  - `/api/v1/billing/pricing`)
- [ ] Confirm staging smoke passed.
- [ ] Confirm alarm rollback gate passed:
  - `remit-scout-staging-api-error-rate-high`
  - `remit-scout-staging-api-p99-latency-high`
- [ ] Confirm `/remit-scout/staging/last-good-image` exists and was updated.

Exit criteria:
- [ ] Deployment mechanics are healthy.
- [ ] Public unauth API surfaces are reachable and stable.
- [ ] No critical alarms.

## Stage 2: Staging Minimal -> Staging Full

Definition:
- Staging full is prod-like validation for auth, data pipeline, migrations, and release gates.
- This is the required state before production promotion.

Execution:
- [ ] Run staging readiness gate (must be green):
  - `gh workflow run staging-go-live-readiness.yml --ref "<sha>" -f run_runtime_config_validation=true`
- [ ] Confirm readiness run conclusion is `success`.
- [ ] Run/confirm DB migrations for staging:
  - `make db-migrate-staging` (or equivalent ECS migration task path)
- [ ] Seed/verify launch users and roles:
  - `backend/scripts/seed-launch-users.ts` or equivalent controlled provisioning path
- [ ] Validate authenticated API path (not only public path):
  - Supabase token exchange/login works
  - `/api/v1/me` works
  - admin gating works for allowlisted admin users
- [ ] Verify queue workers and refresh paths are operational:
  - corridor/provider data returns non-empty for known supported lanes
  - no sustained queue backlog or DLQ growth
- [ ] Verify frontend staging host + TLS + API base are correct.
- [ ] Verify New Relic staging observability:
  - `node ops/newrelic/bootstrap-dashboards.mjs`
  - `NEW_RELIC_STAGING_AWS_ROLE_ARN=<staging_role_arn> NEW_RELIC_PROD_AWS_ROLE_ARN=<prod_role_arn> node ops/newrelic/sync-cloud-links.mjs`
  - `node ops/newrelic/sync-alerts.mjs`
  - `NEW_RELIC_TARGET_ENV=staging NEW_RELIC_STAGING_AWS_ACCOUNT_ID=<staging_account_id> node ops/newrelic/verify-signals.mjs`
  - Confirm New Relic dashboard pages include `Indices (TEER/RCI/RVI)`, `Exports Health`, `API Health`, and `Provider Health (Per Provider)`.
- [ ] Re-run staging smoke after migration/user seeding.
- [ ] Re-check critical alarms are still clear.

Exit criteria:
- [ ] Readiness workflow green for exact SHA.
- [ ] Authenticated + unauthenticated critical flows pass.
- [ ] Migrations applied.
- [ ] Data pipeline is returning expected quotes for supported corridors.
- [ ] No critical alarms.

## Stage 3: Staging Full -> Production

Execution:
- [ ] Ensure staging full passed on exact commit SHA to be promoted.
- [ ] Verify successful `staging-go-live-readiness` run exists for that same SHA.
- [ ] Confirm enterprise mode controls are production-ready when applicable:
  - `PLANE_A_REQUIRE_API_KEY=1`
  - `COMPLIANCE_SOC2_TYPE_II_REPORT_STATE=audited`
  - `COMPLIANCE_SOC2_TYPE_II_REPORT_DATE` is set
  - `COMPLIANCE_SOC2_TYPE_II_REPORT_URL` is set
  - `COMPLIANCE_SOC2_TYPE_II_EXPIRES_ON` is set and future-dated
- [ ] Create/push release tag from that SHA:
  - `git tag vX.Y.Z <sha>`
  - `git push origin vX.Y.Z`
- [ ] Confirm prod deploy workflow started from tag push.
- [ ] Complete required manual approvals for GitHub Environment `prod`.
- [ ] Verify prod gates:
  - security evidence gate
  - full backend lint + tests
  - migration task success
  - post-deploy smoke success
  - alarm rollback gate clear
  - `/remit-scout/prod/last-good-image` updated
- [ ] Verify New Relic prod observability:
  - `node ops/newrelic/bootstrap-dashboards.mjs`
  - `NEW_RELIC_STAGING_AWS_ROLE_ARN=<staging_role_arn> NEW_RELIC_PROD_AWS_ROLE_ARN=<prod_role_arn> node ops/newrelic/sync-cloud-links.mjs`
  - `node ops/newrelic/sync-alerts.mjs`
  - `NEW_RELIC_TARGET_ENV=prod NEW_RELIC_PROD_AWS_ACCOUNT_ID=<prod_account_id> node ops/newrelic/verify-signals.mjs`
  - Confirm New Relic dashboard pages include `Indices (TEER/RCI/RVI)`, `Exports Health`, `API Health`, and `Provider Health (Per Provider)`.

Exit criteria:
- [ ] Prod deployment successful for tagged SHA.
- [ ] No critical alarms.
- [ ] Last-known-good image recorded.
- [ ] Evidence artifacts retained.

## Hard block conditions (do not promote)
- Staging readiness missing or failed for target SHA.
- Migration failure in target env.
- Smoke failure in target env.
- Critical alarm active in target env.
- Auth/JWT validation broken on staging full.
- Environment contract drift (missing required vars/secrets).
- Enterprise path is active (`PLANE_A_REQUIRE_API_KEY=1`) but `COMPLIANCE_SOC2_TYPE_II_REPORT_STATE` is not `audited`.

## Evidence bundle to attach in every promotion handoff
- Target SHA and tag (if prod).
- Deploy workflow run URL(s).
- Staging readiness run URL.
- Smoke output summary.
- Alarm gate query result.
- Last-known-good SSM parameter value.
- Any temporary override used (must be explicitly listed).
