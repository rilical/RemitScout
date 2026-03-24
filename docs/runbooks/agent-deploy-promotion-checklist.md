# Agent Deploy Promotion Checklist (Develop -> Staging Minimal -> Staging Full -> Prod)

Last updated: 2026-03-17

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
- Treat readiness evidence as valid only when the workflow was dispatched with `deploy_sha=<exact_sha>` and completed green for that exact commit; branch-head/manual runs without the exact SHA are non-evidence.
- Treat the cross-workflow artifact contract as deploy-critical:
  - `staging-readiness-admin-smoke-evidence`
  - `staging-go-live-release-evidence`
- Deploy-critical artifact uploads must stage visible `artifacts/**` bundles before `actions/upload-artifact`; `.smoke-artifacts` is scratch space only and must not be uploaded directly.
- Any change to deploy/readiness artifact names or upload paths must update the workflow guardrails and contract tests in `infrastructure/cdk/tests/*workflow-contract.test.ts`.
- Keep environment isolation explicit:
  - staging values must include `staging`
  - production values must include `prod` or production hostnames
- Do not skip evidence:
  - smoke
  - alarm gate
  - New Relic hard observability gate
  - last-known-good image update
- In staging/prod, privileged admin evidence is valid only when it comes from verified admin-session coverage of the real admin surfaces; Supabase-auth-only fallback or skipped page-surface checks do not satisfy the gate.

## Frontend release-evidence contract (staging/prod)
- The deploy workflow builds and prerenders the frontend (`pnpm -C frontend build` + `pnpm -C frontend generate`) and publishes `frontend/.output/public` to the web bucket/CDN path; staging/prod do not deploy `frontend/server/**` as a live Nitro hop today.
- Valid staging/prod frontend evidence comes from the real public entrypoints the workflows probe:
  - `PUBLIC_SITE_URL` for CloudFront-served page/UI smoke
  - `PUBLIC_API_BASE` or the resolved Plane A public API host for `/api*` integration/admin smoke
- Do not count tests, curl output, or handler behavior from `frontend/server/**` as staging/prod release evidence unless the AWS runtime topology is explicitly changed first and this checklist is updated for that new path.
- Protections implemented only in `frontend/server/**` are local/dev or non-AWS SSR protections today; staging/prod proof must come from the live CloudFront and Plane A request path instead.

## Stage 0: Preflight (required every time)
- [ ] Confirm feedback source (chat/file) and one-line user goal.
- [ ] Confirm target SHA:
  - `git rev-parse --short=7 <ref>`
- [ ] Confirm all readiness/deploy evidence you will cite is tied to that exact SHA, not just the branch/tag name resolved at run time.
- [ ] Confirm required staging/prod env contracts exist (vars + secrets in GitHub Environment).
- [ ] Confirm AWS caller identity and region are correct for target env.
- [ ] Confirm no active critical alarms in current target env before changing anything.
- [ ] Confirm latest successful rollback drill evidence for target env is fresh (completed within the last 14 days) and attach run URL + artifact ref.
- [ ] Confirm agent LLM connector contract is complete for target env:
  - `AGENT_LLM_CONNECTOR`, `AGENT_LLM_MODEL`, `AGENT_LLM_PROMPT_VERSION`
  - If `bedrock`: `AGENT_BEDROCK_REGION` + `AGENT_BEDROCK_MODEL_ID`
  - If `anthropic`: `AGENT_ANTHROPIC_API_KEY_SECRET_ARN` (staging/prod)
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
  - frontend evidence here means the build/generate + S3/CloudFront publish path completed; it does not mean `frontend/server/**` was deployed into staging/prod.
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
  - `gh workflow run staging-go-live-readiness.yml --ref "<ref-containing-sha>" -f deploy_sha="<sha>" -f run_runtime_config_validation=true`
  - The readiness workflow is responsible for resolving the current staging migration tip, applying the exact-SHA pending SQL migrations inside the staging ECS/VPC DbMigrate runtime, and proving post-migration tip sync before smoke evidence is accepted.
  - The readiness workflow is also responsible for resuming staging operational services before export-dependent enterprise and worker evidence is accepted.
- [ ] Confirm readiness run conclusion is `success`.
- [ ] Confirm the readiness run title/logs show the exact `deploy_sha` under validation; do not accept branch-head readiness for a different resolved commit.
- [ ] Confirm the readiness run published both required artifacts before accepting it as promotion evidence:
  - `staging-readiness-admin-smoke-evidence`
  - `staging-go-live-release-evidence`
- [ ] Run/confirm DB migrations for staging:
  - `make db-migrate-staging` (or equivalent controlled migration path) only when you are rerunning migrations outside the readiness/deploy workflows.
- [ ] Seed/verify launch users and roles:
  - `backend/scripts/seed-launch-users.ts` or equivalent controlled provisioning path
- [ ] Validate authenticated API path (not only public path):
  - Supabase token exchange/login works
  - `/api/v1/me` works
  - staging authenticated smoke asserts `omar@remit-scout.com` resolves to `app_role=super_admin` and `plan_effective.plan_code=enterprise`
  - staging admin surface smoke exchanges `/api/v1/sessions/admin/exchange`, reads `/api/v1/ops/observer/summary` + `/api/v1/audit/logs`, grants enterprise to `support@remit-scout.com`, then revokes it back to free
  - treat the privileged smoke as passing only when the verified admin session is established and those admin page/API surfaces are exercised successfully; a plain Supabase login or any run that skips those surface checks is non-evidence for staging/prod promotion
  - treat Redis/revocation-store availability as part of admin auth readiness in prod-like envs; with fail-closed revocation active, store failure blocks privileged admin bootstrap/refresh
  - admin gating works for allowlisted admin users and allowlisted runner IPs
  - the GitHub-hosted runner must already be present in `ADMIN_IP_ALLOWLIST` / `WAF_ADMIN_ALLOWLIST_IPS`; readiness/deploy smoke proves real reachability and does not self-whitelist or bypass the network control
- [ ] Verify queue workers and refresh paths are operational:
  - corridor/provider data returns non-empty for known supported lanes
  - no sustained queue backlog or DLQ growth
- [ ] Verify Ralph loop telemetry for provider healing:
  - `agent_heal_attempt_count`, `agent_heal_success_count`, `agent_heal_blocked_count`
  - `agent_llm_latency_ms`, `agent_prompt_schema_validation_failures`
  - Per-provider evidence in the canary window (`agent_provider_healable_event`) covers all 24 canonical providers.
- [ ] Verify provider onboarding loop telemetry and review payload routing:
  - CloudWatch namespace `RemitScout/Onboarding` contains `provider_onboarding_run_count`, `provider_onboarding_provider_count`, `provider_onboarding_provider_status`, `provider_onboarding_remit_score`.
  - Latest onboarding artifact `artifacts/provider-onboarding/<run_id>/provider-onboarding-run.json` has non-empty `ci_ref`, `review_card`, and `reason_codes`.
  - Blocker reason mapping is visible in admin observer and triage flow (`provider_onboarding.input_invalid`, `provider_onboarding.scaffold_fail`, `provider_onboarding.probe_timeout`, `provider_onboarding.smoke_fail`, `provider_onboarding.score_below_threshold`, `provider_onboarding.review_blocked`).
- [ ] Verify frontend staging host + TLS + API base are correct.
  - `PUBLIC_SITE_URL` must resolve to the live staging site the UI smoke hits.
  - `PUBLIC_API_BASE` must resolve to the live Plane A public API host used by the staging integration/admin smokes, whether that is a shared staging hostname or the Plane A CloudFront domain.
  - treat `staging-public-ui-smoke.log`, `staging-public-integration-smoke.log`, and `staging-public-integration-post-ui-smoke.log` as the frontend-path evidence; do not substitute `frontend/server/**` local handler checks.
- [ ] Verify New Relic staging observability:
  - `node ops/newrelic/bootstrap-dashboards.mjs`
  - `node ops/newrelic/sync-alerts.mjs`
  - `node ops/newrelic/sync-notifications-workflows.mjs`
  - `NEW_RELIC_STAGING_AWS_ROLE_ARN=<staging_role_arn> NEW_RELIC_PROD_AWS_ROLE_ARN=<prod_role_arn> node ops/newrelic/sync-cloud-links.mjs`
  - `NEW_RELIC_TARGET_ENV=staging NEW_RELIC_STAGING_AWS_ACCOUNT_ID=<staging_account_id> REQUIRE_ACCOUNT_PINNING=1 REQUIRE_LOGS=1 REQUIRE_SPANS=1 REQUIRE_SQS_METRICS=1 node ops/newrelic/verify-signals.mjs`
  - Confirm New Relic dashboard pages include `Indices (TEER/RCI/RVI)`, `Exports Health`, `API Health`, and `Provider Health (Per Provider)`.
  - Treat passing `verify-signals` output as required delivery proof for staging: logs + spans must land in the pinned staging account, and SQS metrics must also be present while staging is `push_only`.
  - Note: deploy/readiness workflows now run this as a hard gate; this manual run is for incident/debug confirmation.
- [ ] Re-run staging smoke after migration/user seeding.
- [ ] Upload/review staged admin smoke artifacts:
  - `staging-omar-entitlement-smoke.log`
  - `staging-admin-surface-smoke.log`
  - `staging-admin-ui-smoke.log`
  - `staging-sentry-release-scope.json`
  - `staging-sentry-release-scope.json` must exist for the exact readiness run; `status=pass` is preferred, and `status=warn` is acceptable only when it records an explicit stale/invalid Sentry release-credential warning because deploy already treats sourcemap upload as non-blocking.
  - uploaded artifact bundle `staging-readiness-admin-smoke-evidence` (includes `.smoke-artifacts` plus `frontend/playwright-report` and `frontend/test-results` when present)
  - verify the privileged artifact shows successful admin-session exchange plus exercised observer/audit/admin-entitlement surfaces; reject artifacts that show fallback-only auth coverage or omitted surface checks
  - verify the admin UI smoke did not skip privileged coverage and completed the reversible `support@remit-scout.com` grant/revoke path
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
- [ ] Confirm the production promotion decision still matches the deployed frontend topology:
  - CloudFront is serving the public site/assets.
  - `/api*` evidence is coming from the Plane A public API path, not `frontend/server/**`.
  - any guard that exists only in `frontend/server/**` remains documented as local/dev or non-AWS SSR only and is not cited as prod protection evidence.
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
- [ ] Verify agent LLM startup checks passed in logs:
  - connector config completeness
  - secret-backed auth path validated
  - no prompt schema validation failures in canary synthetic runs
- [ ] Verify New Relic prod observability:
  - `node ops/newrelic/bootstrap-dashboards.mjs`
  - `node ops/newrelic/sync-alerts.mjs`
  - `node ops/newrelic/sync-notifications-workflows.mjs`
  - `NEW_RELIC_STAGING_AWS_ROLE_ARN=<staging_role_arn> NEW_RELIC_PROD_AWS_ROLE_ARN=<prod_role_arn> node ops/newrelic/sync-cloud-links.mjs`
  - `NEW_RELIC_TARGET_ENV=prod NEW_RELIC_PROD_AWS_ACCOUNT_ID=<prod_account_id> REQUIRE_ACCOUNT_PINNING=1 REQUIRE_LOGS=1 REQUIRE_SPANS=1 REQUIRE_SQS_METRICS=0 node ops/newrelic/verify-signals.mjs`
  - Confirm New Relic dashboard pages include `Indices (TEER/RCI/RVI)`, `Exports Health`, `API Health`, and `Provider Health (Per Provider)`.
  - Treat passing `verify-signals` output as required delivery proof for prod: logs + spans must land in the pinned prod account before last-known-good image update can count as valid deploy evidence.
  - Note: deploy workflow blocks promotion before last-known-good write if this gate fails.

Exit criteria:
- [ ] Prod deployment successful for tagged SHA.
- [ ] No critical alarms.
- [ ] Last-known-good image recorded.
- [ ] Evidence artifacts retained.

## Hard block conditions (do not promote)
- Staging readiness missing or failed for target SHA.
- Staging readiness evidence exists only for a branch head / different resolved SHA, not the exact promoted commit.
- Migration failure in target env.
- Smoke failure in target env.
- Critical alarm active in target env.
- New Relic observability gate failure (dashboards/alerts/cloud links/verify-signals).
- Auth/JWT validation broken on staging full.
- Privileged admin smoke evidence is based only on Supabase auth fallback or omits required admin surface coverage.
- Admin smoke required a temporary runner allowlist mutation during the workflow instead of proving preconfigured network reachability.
- Frontend release evidence relies on `frontend/server/**` handler behavior or a supposed deployed Nitro/BFF hop instead of `PUBLIC_SITE_URL` plus Plane A public API smoke from the real staging/prod path.
- Environment contract drift (missing required vars/secrets).
- Agent LLM contract drift (`AGENT_*` connector/model/prompt/env mismatch).
- Missing provider healing coverage evidence for any of the 24 canonical providers in the canary window.
- Rollback drill evidence for target env is older than 14 days.
- Enterprise path is active (`PLANE_A_REQUIRE_API_KEY=1`) but `COMPLIANCE_SOC2_TYPE_II_REPORT_STATE` is not `audited`.

## Evidence bundle to attach in every promotion handoff
- Target SHA and tag (if prod).
- Deploy workflow run URL(s).
- Staging readiness run URL.
- Explicit confirmation that readiness was dispatched with `deploy_sha=<target_sha>` and passed for that exact commit.
- Smoke output summary.
- Alarm gate query result.
- Admin evidence artifact refs:
  - `staging-omar-entitlement-smoke.log`
  - `staging-admin-surface-smoke.log`
  - `staging-admin-ui-smoke.log`
  - `staging-sentry-release-scope.json`
  - `staging-readiness-admin-smoke-evidence`
- Frontend/public-path evidence artifact refs:
  - `staging-public-ui-smoke.log`
  - `staging-public-integration-smoke.log`
  - `staging-public-integration-post-ui-smoke.log`
  - `staging-go-live-release-evidence.json`
- New Relic delivery proof summary:
  - dashboards/alerts/notifications/cloud-links sync status
  - `verify-signals` verdict with account pinning and required signal classes
- Last-known-good SSM parameter value.
- Any temporary override used (must be explicitly listed).
