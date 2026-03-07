---
feedback_source:
  - chat transcript
  - .context/attachments/image-v10.png
  - .context/attachments/image-v11.png
  - .context/attachments/image-v12.png
  - .context/attachments/image-v13.png
  - .context/attachments/image-v14.png
  - .context/attachments/image-v15.png
  - .context/attachments/image-v16.png
  - .context/attachments/image-v17.png
  - .context/attachments/image-v18.png
user_goal: "Design a release-blocking correctness gate for staging and production that proves Remit-Scout business logic, protects data during deploys, and blocks unsafe releases."
environment:
  - staging
  - prod
mode: review only
chosen_agents:
  - Cloud Architect
  - SLO Police
  - Triangulation Engine
  - Data Lineage
  - Agent Orchestration
  - Index Governance
  - Auth & Entitlements
  - Frontend-API Contract
risk_tier: critical
risk_level: critical
owner_assignment:
  status: proposed
  ownership_tag: release.correctness-gate@v1
  primary_owner: engineering
  supporting_owners:
    - platform
    - frontend
    - backend
    - data
    - qa
audit_window:
  utc: "2026-03-07T02:10:00Z to 2026-03-07T03:05:00Z"
  note: "Audit combines repo/workflow review, screenshot review, prior staging AWS inspection, and current release-readiness inventory."
traceability:
  task_lifecycle_version: audit-plan.v1
  parallelizable_tag: parallel.serial_only@v1
  spec_refs:
    - ARCHITECTURE.md
    - agents/AGENT-MATCH.md
    - agents/rag/cloud-architect.md
    - agents/rag/slo-police.md
    - agents/rag/triangulation-engine.md
    - agents/rag/data-lineage.md
    - agents/rag/agent-orchestration.md
    - agents/rag/index-governance.md
    - agents/rag/auth-entitlements.md
    - agents/rag/frontend-api-contract.md
    - docs/runbooks/agent-deploy-promotion-checklist.md
    - .github/workflows/ci.yml
    - .github/workflows/deploy.yml
    - .github/workflows/staging-go-live-readiness.yml
    - backend/scripts/ci/staging-go-live-readiness.ts
    - backend/scripts/ci/integration-smoke.ts
    - backend/scripts/ci/alerts-watchlists-smoke.ts
    - backend/scripts/ci/admin-surface-smoke.ts
    - backend/scripts/triangulation-job.ts
    - backend/plane-b/src/triangulation/engine.ts
    - backend/plane-a/src/routes/indices.ts
    - frontend/playwright.config.ts
    - docs/plans/2026-03-04-cicd-data-safety-hardening-design.md
  runtime_stage_gates:
    - task_cluster: cluster.coverage-inventory@v1
      bounded_evidence_note: "The first deliverable is a truthful inventory of what is already tested, what is mocked, and what is promotion-blocking today."
      rollback_evidence_note: "Do not replace existing working checks until their coverage is mapped into the new gate."
    - task_cluster: cluster.staging-truth@v1
      bounded_evidence_note: "A paused or degraded staging environment cannot be treated as release truth for exports, workers, embeddings, or index freshness."
      rollback_evidence_note: "If staging cannot remain live, the release gate must explicitly resume it, run proof, and return it to the approved paused state."
    - task_cluster: cluster.business-correctness@v1
      bounded_evidence_note: "Every business-critical flow must have at least one live proof path in staging and one post-deploy canary or smoke path in production."
      rollback_evidence_note: "No feature should be promoted on mocked proof alone when the live downstream side effects are unverified."
    - task_cluster: cluster.triangulation-truth@v1
      bounded_evidence_note: "If triangulation is enabled, release proof must validate observation dual-write, composite confidence, API semantics, and stress-event emission using the deployed schema and feature flags."
      rollback_evidence_note: "If triangulation proof is missing or schema docs drift from runtime truth, the feature must be treated as disabled or unreleasable rather than assumed healthy."
    - task_cluster: cluster.migration-safety@v1
      bounded_evidence_note: "Migration automation must prove reversibility, backup freshness, and no unexpected data loss before a release is marked healthy."
      rollback_evidence_note: "Destructive or contract-breaking schema changes must not ship without explicit waiver, backup evidence, and rollback steps."
    - task_cluster: cluster.observability-gate@v1
      bounded_evidence_note: "New Relic and CloudWatch must expose enough per-feature truth to explain failures rather than just infra noise."
      rollback_evidence_note: "A release cannot be approved when the monitoring surface for that feature is missing or ambiguous."
acceptance_proof:
  source_note: "Findings come from architecture/runbook review, workflow audit, current test inventory, screenshot review of enterprise/account surfaces, and previously verified staging AWS/New Relic evidence."
  acceptance_note: "This plan is complete when every named business workflow has a target proof path, every release gate is sequenced, migration/data-loss controls are explicit, and staging/prod promotion blockers are defined."
  bounded_evidence_note: "This is a planning artifact only. It intentionally does not implement workflows or tests in this turn."
  rollback_evidence_note: "The resulting program must preserve current deploy safety primitives while tightening correctness gates; rollout should be additive and reversible."
plan_snapshots:
  - at: "2026-03-07T03:05:00Z"
    summary: "Initial audit-based release correctness program drafted from repo, screenshots, staging evidence, and current workflow inventory."
    bounded_evidence_note: "Snapshot captures the current gate inventory before any restructuring."
    rollback_evidence_note: "If the new gate rollout stalls, the team can still fall back to the current deploy + readiness + smoke sequence while gaps remain explicitly documented."
---

# Staging/Prod Release Correctness Gate Plan

## 1. Executive Summary

Remit-Scout already has meaningful CI and release plumbing:

- PR CI runs backend tests, migration dry-runs, migration immutability, and local Playwright.
- Staging deploy auto-runs migrations, seeds launch users, runs entitlement/admin smoke, and dispatches staging readiness.
- Production deploy is already blocked on a successful staging readiness run for the exact SHA.
- Infra/data safety has improved materially: protected buckets are versioned, Redis snapshots exist for protected environments, KMS keys have a pending deletion window, and migration edits are blocked in PRs.

That is the good news.

The bad news is that the current gate still proves deploy mechanics better than product correctness.

Today the release path is strongest on:

- config validation
- migration execution
- admin bootstrap
- alerts/watchlists API smoke
- generic API reachability

It is materially weak on:

- enterprise live behavior
- exports finishing and downloading
- published embeds
- sign-up and email verification
- forgot/reset-password email flow
- alert delivery and smart-alert delivery
- live API-key-authenticated enterprise usage
- TEER/RCI/RVI export artifacts
- triangulated corridor indices and observation-pipeline truth
- agent self-healing closed-loop proof
- per-feature observability completeness

The core conclusion is simple:

**You do not need "more tests" in the abstract. You need a single release-correctness program that proves live business outcomes, not just route reachability or mocked UI.**

## 2. Current-State Audit

### 2.1 What is already strong

1. PR migration hygiene is real.
   - `.github/workflows/ci.yml` blocks edits to historical migrations and runs `pnpm -C backend db:migrate` against a scratch Postgres instance.

2. Deploy-time migration automation already exists.
   - `.github/workflows/deploy.yml` runs an ECS migration task in both staging and prod and fails deployment if the migration task exits non-zero.

3. Staging and prod already have a promotion contract.
   - `docs/runbooks/agent-deploy-promotion-checklist.md` and `.github/workflows/deploy.yml` already require exact-SHA readiness before prod.

4. Admin has the best live proof today.
   - `backend/scripts/ci/admin-surface-smoke.ts` plus remote Playwright `frontend/tests/e2e/admin-surface.spec.ts` prove admin sign-in, admin exchange, observer/discovery/modules visibility, and reversible enterprise grant/revoke.

5. Alerts/watchlists have better live API coverage than most product areas.
   - `backend/scripts/ci/alerts-watchlists-smoke.ts` exercises `/me`, `/watchlist`, `/alerts`, and smart-alert eligibility against a real environment.

### 2.2 What is partially covered but not release-safe

1. Enterprise is covered mostly at unit and route level.
   - There are backend route/service tests for API keys, exports, enterprise gating, and published embeds.
   - There are frontend unit tests for `EnterpriseTab`.
   - There is no current promotion-blocking live enterprise browser/API suite.

2. Corridor/B2C flows are covered, but not with enough live matrix proof.
   - `backend/scripts/ci/integration-smoke.ts` checks a small corridor set against `/corridor-currencies` and `/providers`.
   - Frontend E2E has corridor UI specs.
   - This does not yet prove enough supported/unsupported/refresh-pending states across the corridor catalog.

3. Reset password has a browser test, but it is mocked.
   - `frontend/tests/e2e/reset-password.spec.ts` stubs Supabase endpoints.
   - Good for UI logic.
   - Not enough for release confidence on real email-based recovery.

4. Local Playwright is useful but intentionally mock-backed.
   - `frontend/playwright.config.ts` forces `E2E_MOCK_API=1` for local runs unless a remote base URL is provided.
   - That is appropriate for fast CI feedback.
   - It is not sufficient as a release gate for live business logic.

5. Triangulation has real implementation depth but only partial release coverage.
   - There are dedicated tests for `triangulation-engine`, `triangulation-composite-confidence`, `triangulation-historical-inputs`, and `stress-responder`.
   - There is a scheduled job in `backend/scripts/triangulation-job.ts`.
   - `backend/scripts/ci/staging-go-live-readiness.ts` already validates that `TRIANGULATION_ENABLED` implies `EMIT_OBSERVATIONS` and compatible queue/service settings.
   - There is still no promotion-blocking live proof that observations are flowing, `gold_export.triangulated_index` is fresh, confidence degrades correctly when signals are sparse, or stress events emit end-to-end.

### 2.3 What is currently missing or non-blocking

1. No release-blocking live enterprise workflow currently proves:
   - account billing UX truth
   - API key creation plus actual authenticated enterprise API usage
   - published embed publish/list/revoke/download
   - export completion and artifact correctness
   - TEER/RCI/RVI export semantics

2. No release-blocking auth workflow currently proves:
   - sign-up
   - email verification
   - real forgot-password email
   - long-session persistence
   - MFA truth across browser, `/me`, and admin exchange

3. No release-blocking delivery workflow currently proves:
   - alert email delivery
   - smart-alert delivery
   - billing/account email delivery
   - export notification delivery

4. No release-blocking self-healing workflow currently proves:
   - failure bundle creation
   - tool-gateway allow/deny correctness
   - contract-test validation
   - PR/escalation behavior
   - safe no-op behavior when auto-fix is not allowed

5. Observability gates exist, but they are not yet complete enough for feature truth.
   - New Relic hard gates are environment-configurable.
   - Prior staging evidence already showed missing custom metric families for indices/worker truth.

6. Triangulation documentation is drifting from runtime truth.
   - The RAG/spec docs still describe `gold.triangulated_index`.
   - The code, routes, repositories, and migrations are using `gold_export.triangulated_index`.
   - The release gate must anchor to code plus migrations as the source of truth until documentation is reconciled.

### 2.4 Staging truth problem

The current staging operating model is itself a blocker for reliable proof.

Previously verified AWS evidence showed:

- staging pause control is real
- business-hours scheduler auto-pauses staging after-hours
- exports/workers/queues can remain non-operational while the UI still accepts user actions

That means this plan must solve one policy question up front:

**Either staging becomes a truthy, always-on QA environment, or the release workflow must explicitly resume staging, verify worker readiness, run proof, and then return staging to the approved paused state.**

Anything weaker will keep making enterprise, exports, and index delivery appear randomly broken.

## 3. Coverage Matrix

| Business Area | Current Evidence | Current Verdict | Gap That Blocks Release Confidence | Required Promotion-Blocking Proof |
|---|---|---|---|---|
| Enterprise dashboard | Frontend unit tests, backend route tests, screenshots, prior staging audit | Partial | No live browser/API release gate | Live staging enterprise suite plus prod canary |
| Admin dashboard | API smoke, admin-surface smoke, remote admin Playwright | Good | Narrow path only; observer truth not cross-checked deeply | Keep and extend |
| Sign-up | Some service/user-account tests, checkout redirect behavior | Weak | No real sign-up + verify + first-login proof | Live staged sign-up flow with reversible cleanup |
| Forgot/reset password | Mocked Playwright reset flow | Weak | No real email or token recovery proof | Remote inbox-backed reset flow |
| Emails | Some unit coverage like billing email generation | Weak | No delivery proof | Inbox/assertion gate for verification, reset, alert, billing, export emails |
| Alerts | Live API smoke creates alerts, local UI state tests | Partial | No trigger + delivery + history proof | Live alert creation, evaluation, dispatch, receipt |
| Smart alerts | Eligibility smoke + evaluator tests | Partial | No end-to-end firing proof | Live eligible corridor + sendScore delivery proof |
| Watchlists | Live API smoke writes watchlists, local/local-storage UI specs | Partial | No live browser persistence proof | Live add/edit/remove and persistence proof |
| Corridor lookup B2C | Integration smoke on a small corridor set, corridor E2E UI | Partial | Matrix too small; not enough supported/unsupported/degraded proofs | Corridor catalog smoke matrix |
| Exports of all types | Route/unit tests, jobs can be created | Weak | No completion/download/content proof | End-to-end export artifact suite |
| API keys | Route/service tests, prior live manual validation | Partial | No promotion-blocking live API-key usage suite | Create/rotate/revoke + use key against live endpoint |
| Embeddings | Route/unit tests, prior staging audit found live failures | Weak | No live publish/list/download/revoke proof | End-to-end published embed suite |
| TEER/RCI/RVI exports | Index tests and some embed/page unit tests | Weak | No artifact proof or semantic assertions | Index export artifact suite |
| Triangulation and observation pipeline | Engine/confidence/history/stress-responder tests, real job wiring, API route | Partial | No live proof of observation dual-write, `gold_export.triangulated_index`, stress events, or confidence semantics | End-to-end triangulation suite |
| Agent self-healing | Unit tests, config validation, contract files | Weak | No live closed-loop canary or escalation proof | Synthetic failure-bundle canary |
| New Relic + CloudWatch truth | Existing workflows and scripts | Partial | Missing per-feature metric families and feature-level blockers | Mandatory feature observability map |
| Migrations + data safety | Migration dry-run, immutability, auto-run deploy, bucket versioning, Redis snapshots | Good but incomplete | Missing row-count reconciliation, migration classification, destructive-migration gate | Data-safe migration gate |

### 3.1 Expanded endpoint and side-effect inventory

The gate needs to cover more than a route returning `200`. It must prove the adjacent side effects, downstream artifacts, and reversible cleanup paths around each route family.

Auth/account:

- UI entry points:
  - `/sign-up`
  - `/sign-in`
  - `/reset-password`
  - `/account/security`
- Required proof:
  - sign-up succeeds
  - verification email is delivered
  - verification link completes
  - sign-in succeeds
  - MFA challenge and verification succeed when required
  - forgot-password email is delivered
  - reset-password token flow succeeds
  - session persists across reload and refresh boundaries
- Side effects to prove:
  - account row exists
  - verification state changes
  - `/api/v1/me` reflects auth and MFA truth
  - stale or invalid sessions fail closed

Enterprise:

- Routes and artifacts:
  - `/api/v1/me`
  - `/api/v1/me/api-keys`
  - `/api/v1/me/published-embeds`
  - `/api/v1/me/published-embeds/:id/revoke`
  - `/api/v1/indices/published-embeds`
  - `/api/v1/public/indices/published-embeds/:id`
  - `/api/v1/exports`
  - `/api/v1/exports/:id`
  - `/api/v1/exports/:id/download`
  - `/api/v1/billing/history`
  - `/api/v1/notifications/preferences`
- Required proof:
  - `/me` plan and entitlement truth
  - API key list/create/rotate/revoke
  - API key authenticates live enterprise reads
  - published embed create/list/public-resolve/revoke
  - export create/list/status/download
  - billing history error semantics are truthful
  - notification preferences read/write persist
- Side effects to prove:
  - public embed URL resolves real artifact
  - export artifact lands in bucket with expected schema
  - revoked API keys and revoked embeds stop working

Admin:

- Routes and adjacent proof:
  - `/api/v1/sessions/admin/exchange`
  - `/api/v1/ops/observer/summary`
  - `/api/v1/audit/logs`
  - `/api/v1/audit/logs/export`
  - enterprise grant/revoke flow
- Required proof:
  - admin exchange only works for approved admin user
  - observer summary loads and matches backend truth
  - audit logs are readable and include admin mutations
  - grant/revoke is reversible

Alerts/watchlists:

- Routes:
  - `/api/v1/watchlist`
  - `/api/v1/watchlist/:id`
  - `/api/v1/alerts`
  - `/api/v1/alerts/:id`
  - `/api/v1/alerts/corridor-eligibility`
  - `/api/v1/alerts/unsubscribe`
- Required proof:
  - watchlist list/create/update/delete
  - alert list/create/update/delete
  - smart-alert eligibility response semantics
  - unsubscribe and delivery preference behavior when applicable
- Side effects to prove:
  - alert evaluation occurs
  - delivery happens
  - delivery history or audit evidence exists

B2C/corridor:

- Routes:
  - `/api/v1/corridor-currencies`
  - `/api/v1/providers`
- Required proof:
  - supported corridor returns currencies and providers
  - unsupported corridor returns truthful contract state
  - refresh-pending or quotes-unavailable state stays explicit
  - method changes affect provider set correctly

Indices/exports:

- Routes and artifacts:
  - `/api/v1/exports`
  - `/api/v1/exports/:id`
  - `/api/v1/exports/:id/download`
  - `/api/v1/indices/published-embeds`
  - `/api/v1/public/indices/published-embeds/:id`
- Required proof:
  - TEER/RCI/RVI export completion
  - CSV/PDF/PNG/SVG artifact validation
  - download contents, headers, timestamps, and methodology fields

Triangulation:

- Routes and stores:
  - `/api/v1/indices/triangulated/:corridorId`
  - `silver.observation`
  - `gold_export.triangulated_index`
- Required proof:
  - fresh observations
  - fresh triangulated rows
  - confidence and contributing signals
  - stress-event emission
  - responder evidence

Agent/self-healing:

- Paths and evidence:
  - synthetic failure bundle creation
  - contract-test path
  - patch validation
  - propose-only escalation
- Required proof:
  - safe behavior when healing is possible
  - safe escalation when healing is blocked
  - audit trail for every step

## 4. Release-Correctness Target State

The target program has five layers.

### Layer 0: Static and local confidence

Purpose:

- fail fast on code defects
- keep developer feedback quick
- avoid wasting staging time

Must include:

- lint
- typecheck
- backend unit/integration tests
- frontend unit tests
- local Playwright with mocks
- OpenAPI/type drift checks
- migration dry-run
- migration immutability
- mutation testing on critical business logic

Important rule:

Local mocked Playwright remains valuable, but it is explicitly **not** a release truth source.

### Layer 1: Staging environment truth gate

Purpose:

- confirm staging is actually capable of proving the workflows we care about

Must include:

- staging pause-state check
- if paused, controlled resume step
- worker/scheduler readiness
- DLQ = 0 for blocking queues or time-bounded waiver
- gold freshness ready enough for enterprise/index proof
- New Relic and CloudWatch signal presence for features under test

If this layer fails, **all downstream business correctness tests are invalid**.

### Layer 2: Live staging business correctness suite

Purpose:

- prove user-facing business outcomes on the actual stack

Must include seeded users and reversible mutations for:

- free
- plus
- enterprise
- enterprise super admin
- support target user for admin grant/revoke

This layer becomes the main release blocker for staging full.

### Layer 3: Migration and data safety gate

Purpose:

- prove schema changes and deploy sequencing are not silently damaging data

Must include:

- migration classification
- pre/post row-count and null-rate probes for touched tables
- backup freshness check
- expand/contract sequencing policy
- last-known-good linkage
- rollback instructions per migration class

### Layer 4: Production post-deploy canary

Purpose:

- prove the deployed SHA behaves correctly in prod without causing harmful mutations

Must include read-only or reversible proofs only:

- public corridor/B2C proof
- enterprise API-key read proof
- admin read-only observer proof
- export/indices freshness proof
- alerting/observability proof

Any irreversible business mutation stays in staging only.

## 5. Proposed Business-Correctness Suites

### 5.1 Enterprise suite

Goal:

- make enterprise a first-class promotion blocker

Required staging proofs:

1. Sign in as enterprise user and reach `/dashboard?tab=enterprise`.
2. Validate session persistence across reload and inactivity window.
3. Read billing/account state with truthful error mapping.
4. Create API key.
5. Use API key against a live enterprise endpoint.
6. Rotate API key.
7. Revoke API key.
8. Publish embed for a seeded corridor.
9. List published embeds.
10. Resolve public embed URL and verify artifact loads.
11. Revoke embed.
12. Create each export type:
    - quote history
    - watchlist/alerts history if supported by contract
    - TEER/RCI/RVI export
13. Wait for completion.
14. Download artifact.
15. Validate artifact schema and non-empty content.

Must fail release if:

- API key create succeeds but authenticated usage fails
- embed publish/list/revoke fails
- export remains queued past SLO
- downloaded artifact is empty, malformed, or stale

### 5.2 Admin suite

Goal:

- preserve current good coverage and make it broader

Required staging proofs:

1. Sign in as admin.
2. Complete MFA when required.
3. Exchange admin session.
4. Open observer summary.
5. Open audit logs.
6. Open discovery/modules/enterprise control planes.
7. Grant enterprise to seeded support account.
8. Verify downstream plan view reflects the change.
9. Revoke enterprise.
10. Verify audit log entries exist for both actions.

Prod canary:

- read-only observer and audit-log proof
- no grant/revoke mutation in prod canary

### 5.3 Auth/account suite

Goal:

- stop releasing auth regressions that only show up live

Required staging proofs:

1. Sign up new user.
2. Verify email delivery.
3. Follow verification link.
4. First sign-in succeeds.
5. Forgot password email is delivered.
6. Reset password via live token.
7. Old password fails, new password works.
8. Session persists across reload.
9. Session refreshes correctly after idle threshold.
10. `/api/v1/me` MFA truth matches browser/admin truth.

Must fail release if:

- sign-up works only partially
- email verification does not complete
- reset email arrives but token flow fails
- stored session still bounces to sign-in

### 5.4 Alerts/watchlists/notifications suite

Goal:

- prove creation, evaluation, and delivery rather than just row insertion

Required staging proofs:

1. Create watchlist item for FX pair.
2. Create watchlist item for corridor.
3. Create standard alert.
4. Create smart alert on eligible corridor.
5. Validate smart-alert rejection on not-offered corridor.
6. Trigger or simulate evaluation on a known condition.
7. Verify alert record transitions and evaluation timestamps.
8. Verify delivery:
   - email
   - optional push/browser notification if product-critical
9. Verify notification preference changes persist and are respected.

Must fail release if:

- alerts can be created but never evaluated
- smart alerts are offered on unsupported corridors
- delivery path is broken or unobservable

### 5.5 Corridor/B2C suite

Goal:

- prove the public comparison core, not just page render

Required staging proofs:

1. Supported corridor returns currencies.
2. Supported corridor returns non-empty providers.
3. Unsupported corridor returns contract-correct state.
4. Refresh-pending corridor returns truthful status.
5. Method switch changes provider set appropriately.
6. Watchlist/alert controls reflect real auth state, not local-only state.
7. Known popular corridors across tier mix remain green.

Recommended matrix:

- 6 to 10 canonical supported corridors
- at least one unsupported corridor
- at least one smart-not-offered corridor
- at least one wallet/cash method corridor

### 5.6 Exports and indices suite

Goal:

- make export delivery and index correctness first-class blockers

Required staging proofs:

1. Quote history export completes and downloads.
2. TEER/RCI/RVI CSV export completes and downloads.
3. TEER/RCI/RVI image/embed artifacts render.
4. Export file includes expected headers, rows, timestamps, and methodology fields.
5. Export freshness is within SLO.
6. Export bucket object exists with expected metadata and checksum.

Semantic assertions:

- TEER export must not contain non-price signals
- RVI export must represent dispersion/volatility fields, not incident counts
- RCI export must represent constraint/friction fields, not raw FX pricing
- methodology version must be present where contract requires it

### 5.7 Triangulation and observation suite

Goal:

- make the observation pipeline and composite corridor indices releasable on evidence instead of faith

Required staging proofs:

1. When `TRIANGULATION_ENABLED=1`, verify `EMIT_OBSERVATIONS=1` and the required queue/service modes are on.
2. Verify fresh rows land in `silver.observation` for seeded corridors during the test window.
3. Verify quote-layer observations are present and non-empty for canonical corridors.
4. Verify `backend/scripts/triangulation-job.ts` runs successfully in staging.
5. Verify fresh rows land in `gold_export.triangulated_index` for canonical corridors and amount/method combinations.
6. Verify `/api/v1/indices/triangulated/:corridorId` returns:
   - series
   - confidence
   - contributingSignals
   - methodology
7. Verify missing signal layers degrade confidence instead of fabricating values or crashing.
8. Verify stress-event thresholds emit events to the configured queue or pipeline.
9. Verify the stress responder records the corresponding observation/escalation evidence without unsafe side effects.
10. Verify historical query behavior is deterministic for a fixed `as_of`, `amount_bucket`, `method_profile`, and `methodology`.

Triangulation-specific release blockers:

- no fresh `silver.observation` rows when triangulation is enabled
- no fresh `gold_export.triangulated_index` rows for canonical corridors
- API returns data without confidence or contributing signals
- docs and runtime schema drift is unresolved and the gate cannot determine the active source of truth
- stress-event or stress-responder evidence is missing while the feature is enabled

Recommended verification probes:

- DB:
  - recent observation count by `signal_layer`
  - latest `gold_export.triangulated_index.created_at` by corridor
  - latest stress-event observation rows
- API:
  - `/api/v1/indices/triangulated/:corridorId`
- Queue/worker:
  - stress-event queue depth
  - responder processing evidence

### 5.8 Agent self-healing suite

Goal:

- prove the agent layer is safe, observable, and non-magical

Required staging proofs:

1. Inject a synthetic failure bundle or use a dedicated canary module/provider.
2. Verify failure detector creates the bundle.
3. Verify tool-gateway allowlist behavior.
4. Verify contract-test invocation path.
5. Verify propose-only behavior produces the expected escalation/PR artifact path.
6. Verify blocked or non-healable failures escalate instead of mutating production logic.
7. Verify metrics and logs exist for attempt/success/blocked/escalated.

Must fail release if:

- self-healing path is enabled but cannot be observed
- disallowed tools/actions are not blocked
- canary failure disappears without evidence

## 6. Observability Contract

The release gate should not only check "is there telemetry?" It should check "is there telemetry for the business flow we just proved?"

Required feature-level metric families:

- auth:
  - sign_up_attempt
  - sign_up_success
  - email_verification_sent
  - email_verification_success
  - password_reset_sent
  - password_reset_success
  - session_refresh_success
  - admin_exchange_success
- enterprise:
  - enterprise_api_key_created
  - enterprise_api_key_rotated
  - enterprise_api_key_revoked
  - published_embed_created
  - published_embed_revoked
  - export_job_created
  - export_job_completed
  - export_job_failed
- alerts/watchlists:
  - watchlist_item_created
  - alert_created
  - alert_evaluated
  - alert_dispatched
  - smart_alert_rejected_not_offered
  - smart_alert_dispatched
- corridor/index:
  - b2c_provider_response_ok
  - b2c_provider_response_empty
  - gold_indices_fresh
  - teer_export_completed
  - rvi_export_completed
  - rci_export_completed
- triangulation:
  - observation_write_success
  - triangulation_job_success
  - triangulated_index_write_success
  - triangulated_index_api_success
  - triangulated_index_confidence_low
  - stress_event_emitted
  - stress_responder_processed
- agent:
  - agent_heal_attempt_count
  - agent_heal_success_count
  - agent_heal_blocked_count
  - agent_heal_escalated_count

Release rule:

- If a feature is in the release scope and its metric family is missing in New Relic or CloudWatch, treat that feature as **not releasable**.

Operational recommendation:

- keep CloudWatch as the source of raw runtime truth
- keep New Relic as the cross-service release dashboard and alert gate
- require consistent dimensions: `environment`, `feature`, `service`, `result`

## 7. Migration and Data Safety Plan

### 7.1 Current baseline already in place

Confirmed in repo:

- migration immutability in PR CI
- migration dry-run in CI
- deploy-time ECS migration task in staging and prod
- versioned protected S3 buckets
- Redis snapshot retention in protected environments
- KMS pending deletion window

This is a solid baseline.

### 7.2 Missing safety controls

Still needed before calling deploys data-safe:

1. Migration classification
   - additive
   - expand/contract
   - backfill-required
   - destructive

2. Pre-deploy backup evidence
   - RDS backup freshness
   - rollback drill freshness

3. Post-migration data probes
   - row counts for touched tables
   - null-rate checks on newly required columns
   - index/constraint presence checks
   - contract queries against critical routes

4. Destructive migration waiver path
   - explicit owner
   - rollback plan
   - approved downtime/impact statement

5. Expand/contract policy
   - no dropping columns in the same release that stops writing them
   - dual-write or compatibility window where needed

### 7.3 Required migration gate sequence

For any release containing schema changes:

1. PR gate
   - migration immutability
   - migration dry-run
   - migration classification file or metadata
   - reviewer acknowledgement for destructive/backfill migrations

2. Staging deploy gate
   - pre-migration snapshot/backup freshness check
   - run migration task
   - run post-migration probes
   - run business correctness suite

3. Prod deploy gate
   - exact SHA already green in staging
   - backup freshness within allowed window
   - migration class approved
   - post-deploy row-count/health probes pass before last-good-image update

### 7.4 Data-loss rules

Release must be blocked when any of the following is true:

- migration changes historical files
- backup freshness is stale
- destructive migration has no waiver
- post-migration row counts drift unexpectedly
- null-rate explodes on touched tables
- export/index artifacts for existing data become empty
- rollback evidence is missing

## 8. Recommended Workflow Shape

### 8.1 Replace fragmented release proof with one manifest-driven gate

Recommendation:

- keep existing CI jobs
- keep existing staging readiness workflow
- add a new manifest-driven release correctness workflow that owns feature proof

Why:

- today the logic is split across CI, deploy, staging readiness, ad hoc smokes, and local Playwright
- the problem is not lack of assets, it is lack of one authoritative proof matrix

Recommended workflow outputs:

- feature-by-feature PASS/FAIL
- artifact links
- environment truth summary
- migration safety summary
- prod-canary verdict

### 8.2 Separate fast feedback from release truth

Keep:

- local mock-backed Playwright in CI

Add:

- remote staging feature suites
- post-deploy prod canary suites

Rule:

- mocked tests can block merges for UI regressions
- only live suites can approve release correctness

### 8.3 Manage staging pause explicitly

Two viable options:

Option A: dedicated always-on staging QA window

- best for correctness
- highest cost
- simplest mental model

Option B: workflow-managed resume/pause

- lower cost
- more operational moving parts
- still acceptable if the workflow proves worker readiness before feature tests

Recommended option:

- Option B immediately
- Option A later if enterprise QA load justifies it

## 9. Tooling Additions and Replacements

These are recommendations only.

1. Email proof
   - Preferred: Mailosaur or equivalent inbox testing SaaS
   - Lower-cost fallback: SES receipt rule to S3 plus assertion script

2. Feature manifest
   - Add a single machine-readable release-proof manifest mapping each business area to:
     - seeded account
     - required endpoint/page
     - expected artifact
     - required observability metric
     - reversible cleanup

3. Export artifact verifier
   - Add a verifier that checks:
     - S3 object existence
     - checksum
     - CSV/header/schema validity
     - PNG/SVG/PDF render sanity

4. Synthetic self-healing canary
   - Use a dedicated canary module/provider or synthetic failure injector instead of risking real provider mutation paths

5. Promotion ledger
   - Persist one release evidence bundle per SHA:
     - staging run URLs
     - feature verdicts
     - migration verdicts
     - canary verdicts
     - rollback references

## 10. Phase Plan

### Phase 0: Make staging a valid truth source

Exit criteria:

- staging pause policy is decided
- release workflow can reliably obtain a live worker-ready staging window
- worker/export/index/triangulation prerequisites are explicit

### Phase 1: Inventory and close top-risk proof gaps

Priority order:

1. enterprise
2. auth/account
3. exports/embeds/indices
4. alerts/smart alerts/emails
5. corridor matrix
6. triangulation and observation pipeline
7. agent self-healing

Exit criteria:

- every top-risk workflow has a live staging proof path and reversible cleanup

### Phase 2: Turn feature proof into a hard staging gate

Exit criteria:

- staging full cannot pass without enterprise/auth/export/alert/index/triangulation proof
- gate output is a single artifact bundle

### Phase 3: Add migration/data-loss hardening

Exit criteria:

- migration classification exists
- post-migration probes exist
- destructive migration waiver path exists
- rollback evidence is attached per release

### Phase 4: Add production canary and observability lock

Exit criteria:

- exact-SHA prod canary exists
- per-feature metric families are mandatory
- missing observability blocks release

## 11. Immediate Decisions Required

1. Should staging remain business-hours paused, or should the release workflow own resume/pause automatically?
2. What email verification strategy do you want for release proof?
   - Mailosaur-style SaaS
   - SES to S3 inbox capture
3. Is triangulation in active release scope for staging/prod now, or should the gate treat it as disabled until observation/data-layer proof is ready?
4. Which prod canary mutations are acceptable?
   - read-only only
   - reversible admin mutations on seeded accounts
5. Do you want enterprise/admin/triangulation proof to run on every staging deploy, or only on protected branches/tags?

## 12. Non-Negotiable Release Rules

1. No production release on mocked UI proof alone.
2. No production release when staging truth is paused/degraded and the workflow did not explicitly restore it.
3. No production release when enterprise exports/embeds/API keys are unproven for the target SHA.
4. No production release when sign-up/reset/email flows are unproven.
5. No production release when TEER/RCI/RVI artifacts are unproven or methodologically ambiguous.
6. No production release when triangulation is enabled but observation flow, composite confidence, and stress-event evidence are unproven.
7. No production release when self-healing is enabled but not canary-proven and observable.
8. No production release when migration/data-loss evidence is incomplete.
9. No production release when New Relic/CloudWatch do not expose per-feature truth.

## 13. Recommended Next Planning Artifact

After approval of this plan, the next artifact should be a machine-readable release proof matrix with one row per business workflow:

- workflow id
- environment
- seeded actor
- setup requirements
- action steps
- expected API result
- expected UI result
- expected downstream artifact
- expected metrics/logs
- cleanup path
- release severity

That matrix should become the source of truth for future implementation work.
