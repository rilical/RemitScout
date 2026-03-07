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
user_goal: "Audit enterprise-first staging issues and produce a remediation plan grounded in backend and infra truth."
audit_window:
  utc: "2026-03-07T01:20:00Z to 2026-03-07T01:29:59Z"
  note: "Staging evidence was captured on March 7, 2026 UTC (March 6, 2026 US Eastern)."
traceability:
  task_lifecycle_version: audit-plan.v1
  parallelizable_tag: parallel.serial_only@v1
  spec_refs:
    - ARCHITECTURE.md
    - agents/AGENT-MATCH.md
    - agents/rag/frontend-api-contract.md
    - agents/rag/auth-entitlements.md
    - agents/rag/queues-workers.md
    - agents/rag/observability-alerts.md
    - agents/rag/data-quality-sentinel.md
    - agents/rag/index-governance.md
    - docs/runbooks/agent-deploy-promotion-checklist.md
  runtime_stage_gates:
    - task_cluster: cluster.enterprise-truth@v1
      bounded_evidence_note: "Do not redesign enterprise UX as if staging is healthy. Restore or explicitly surface paused-state truth first."
      rollback_evidence_note: "If staging must remain paused, enterprise UI must clearly declare non-operational worker/export/embed state."
    - task_cluster: cluster.enterprise-polish@v1
      bounded_evidence_note: "Only polish enterprise UI after contract and infra defects are either fixed or represented honestly in the product."
      rollback_evidence_note: "UI changes must be reversible without masking backend regressions."
acceptance_proof:
  source_note: "Findings come from screenshot review, code audit, direct staging API checks, AWS staging inspection, Playwright browser validation, and New Relic signal verification."
  acceptance_note: "This plan is complete when enterprise fixes are ordered by dependency, each major defect has a root-cause hypothesis, and validation gates exist for backend truth, UX truth, and rollback."
  bounded_evidence_note: "This document audits staging, not production. Any recommendation that changes runtime state must respect staging OpsPause invariants."
  rollback_evidence_note: "If worker/schedule resume introduces drift or cost risk, revert to paused state and keep the enterprise UI explicitly non-operational rather than silently queued/broken."
---

# Enterprise Staging Audit & Remediation Plan

## 1. Executive Summary

The enterprise surface is failing for two different reasons at the same time:

1. The enterprise UX is weak even when contracts are healthy.
2. Staging is currently paused/degraded in ways that make the UI actively misleading.

As of the audit window above:

- Enterprise API keys work at the backend contract level.
- Notification preference reads/writes work.
- Billing history returns a precise backend error, but the frontend degrades it into generic copy.
- Published embeds are genuinely broken server-side.
- Export jobs can be created, but they remain queued because the export worker is effectively non-operational.
- Quote refresh, FX refresh, ingest, and gold-related workers/schedules are partially disabled or set to zero desired count.
- Browser-auth/session behavior is unstable enough to block reliable enterprise E2E.

The correct sequence is not "make the enterprise tab prettier first." The correct sequence is:

1. Restore or clearly represent staging truth.
2. Fix broken enterprise contracts.
3. Fix session persistence and MFA truth.
4. Redesign the enterprise IA and copy around actual business tasks.
5. Only then move to admin cleanup.

## 2. Evidence Snapshot

### 2.1 Direct staging API evidence

Using a live staging enterprise user token on March 7, 2026 UTC:

- `GET /api/v1/me`
  - Returned `plan_code=enterprise`, `status=active`, `app_role=super_admin`.
  - Returned `mfa_verified=false`.
- `GET /api/v1/me/api-keys`
  - Returned `200` with a valid keys list.
- `POST /api/v1/me/api-keys`
  - Returned `200` and issued a real key token.
- `POST /api/v1/me/api-keys/:id/rotate`
  - Returned `200` and issued a rotated token.
- `DELETE /api/v1/me/api-keys/:id`
  - Returned `200`.
- `GET /api/v1/me/published-embeds`
  - Returned `500` with `{"error":"internal_error"}`.
- `POST /api/v1/indices/published-embeds`
  - Returned `500` with `{"error":"database_error","message":"A database error occurred"}`.
- `GET /api/v1/exports`
  - Returned queued jobs only.
- `POST /api/v1/exports`
  - Returned `200` and created additional queued export jobs.
- `GET /api/v1/exports/:id/download`
  - Returned `409 export_not_ready`.
- `GET /api/v1/billing/history`
  - Returned `validation_error` with `details.error=customer_not_found`.
- `GET` and `PUT /api/v1/notifications/preferences`
  - Both behaved correctly.

### 2.2 Browser evidence

Playwright/browser validation reproduced two auth defects:

- A valid Supabase session was present in browser storage, but navigation to `/dashboard?tab=enterprise` still redirected to `/sign-in?redirect=/dashboard`.
- Forcing the Supabase session back into the client and pushing to the dashboard route resulted in a blank dashboard shell instead of a usable enterprise page.

This means enterprise QA is currently blocked by auth/session instability in addition to enterprise contract failures.

### 2.3 AWS staging evidence

As of the audit window above:

- SSM `/remit-scout/staging/ops/paused` was `true`.
- Disabled EventBridge rules included:
  - `remit-scout-staging-export-worker`
  - `remit-scout-staging-b2c-refresh-worker`
  - `remit-scout-staging-fx-rate-refresh-worker`
  - `remit-scout-staging-b2b-sweep-scheduler`
  - `remit-scout-staging-gold-fx-rates`
  - `remit-scout-staging-gold-publisher`
  - `remit-scout-staging-gold-reconciliation`
  - `remit-scout-staging-provider-weighting`
  - `remit-scout-staging-oanda-sync`
- ECS services at zero desired count included:
  - `B2cRefreshWorker`
  - `FxRateRefreshWorker`
  - `ExportWorker`
  - `GoldLiveWorker`
  - `NotificationsQueueWorker`
  - `OpsAlertsQueueWorker`
  - `AlertEvaluationWorker`
  - `IngestFanoutTier1Worker`
  - `IngestFanoutTier2Worker`
- Queue backlogs included:
  - `quote-refresh`: 33 visible
  - `fx-rate-refresh`: 60 visible
  - `export-job`: 1 visible before audit-created jobs
  - `ingest-fanout-tier2`: 8938 visible
  - `gold-live`: 67721 visible, DLQ 3
  - `ingest-fanout` DLQ: 120

### 2.4 New Relic evidence

`ops/newrelic/verify-signals.mjs` for staging failed on March 7, 2026 UTC with:

- Missing custom metric family: `core_slo_indices`
- No worker custom metric family
- No agent custom metric family

This means New Relic currently has enough infrastructure noise to look alive, but it is missing key custom signals needed to trust enterprise/index health.

## 3. Findings

### 3.1 Enterprise UI/UX findings

1. The enterprise surface is not organized around enterprise tasks.
   - API keys, embeds, and exports are mixed into one overloaded tab.
   - There is no clear separation between "access," "distribution," "data delivery," and "billing/account operations."

2. Corridor input design is not enterprise-grade.
   - A free-text corridor ID field is fragile and unfriendly.
   - The indices export flow uses a raw textarea of corridor IDs.
   - The UI assumes users already know internal corridor ID formatting.

3. Export UX is weak and misleading.
   - Export types are implementation-centric (`history`, `all`, `indices`) instead of business-centric.
   - A queued export appears as a generic row with no operational explanation.
   - The product does not tell the user that staging workers are paused or that the export pipeline is not processing.

4. Error messaging is low-quality even when the backend is precise.
   - Billing shows `Invalid request` instead of actionable recovery language.
   - Embed failures show a raw database-style error string.
   - Push notifications show `Missing push VAPID key.` directly in the UI.

5. Enterprise polish is inconsistent with the rest of the dashboard.
   - Sparse layout, weak information hierarchy, and implementation-language copy create low trust.
   - The screenshots show empty-state panels and broken sections dominating the experience.

### 3.2 Enterprise backend contract findings

1. Published embeds are broken server-side.
   - `GET /api/v1/me/published-embeds` returns `500 internal_error`.
   - `POST /api/v1/indices/published-embeds` returns `500 database_error`.
   - Most likely root cause is schema/migration drift around `silver.published_chart_embed` and the published embed repository.

2. Billing history backend is behaving correctly, but the frontend contract is not.
   - Backend returns structured `customer_not_found`.
   - Frontend collapses this into `Invalid request`.
   - This is a frontend error-mapping defect, not a billing-route defect.

3. API key management is mostly healthy.
   - Create, rotate, revoke, and API-key-authenticated reads all worked.
   - This is the strongest enterprise subsystem today.
   - It still needs UX cleanup, usage guidance, and clearer rate-limit copy.

4. Notifications preference persistence is healthy.
   - Read and write behavior worked.
   - The push browser flow is still blocked at the frontend config layer.

5. Exports are only partially healthy.
   - The create/list/download contracts are alive.
   - The pipeline behind them is not finishing jobs because worker/schedule state is degraded.

### 3.3 Auth, MFA, and session findings

1. Session persistence is not trustworthy enough for enterprise users.
   - Live browser validation reproduced sign-in bounce despite a valid stored session.
   - The dashboard also hit a blank-shell state after forced client rehydration.

2. Current session refresh strategy is too fragile for "stay signed in longer."
   - The frontend refresh logic is gated by token age and recent activity.
   - This makes longer-lived enterprise sessions vulnerable to inactivity/visibility edge cases.

3. MFA truth is inconsistent.
   - The staging user had a verified TOTP factor in Supabase.
   - `GET /api/v1/me` still reported `mfa_verified=false`.
   - Middleware contains a client fallback for this exact inconsistency, which is a sign that backend MFA truth is not reliable enough yet.

4. Enterprise auth flows are mismatched.
   - The app supports Google sign-in in the main auth flow.
   - Passwordless/magic-link-style validation did not produce a stable enterprise dashboard experience in browser E2E.

### 3.4 Workers, queues, and staging runtime findings

1. Staging is paused in a way that breaks enterprise truth.
   - Workers are disabled or scaled to zero.
   - Schedules are disabled.
   - Backlogs continue to exist.

2. The UI does not disclose paused-state dependencies.
   - Users can create exports even though the worker is not effectively processing them.
   - Quote refresh requests remain pending because the refresh workers are off.
   - This makes the product look broken instead of intentionally paused.

3. Queue and worker health is already degraded beyond cosmetic tolerance.
   - `gold-live`, `ingest-fanout-tier2`, and several other queues show real backlog.
   - Some DLQs are non-zero.

### 3.5 B2B exports, indices, and suppressions findings

1. Enterprise/B2B export delivery is degraded.
   - Export jobs queue successfully.
   - Export worker and related schedule state are not healthy enough to complete delivery.

2. Gold indices are only partially trustworthy in staging.
   - `indices/health` reported healthy recent data during the audit.
   - But supporting jobs for FX rates, publisher, reconciliation, and popular corridors were disabled.
   - This means the visible health signal is incomplete and can mask downstream enterprise breakage.

3. Suppression analysis is under-instrumented.
   - The codebase has strong suppression logic and a clear `suppressed_ratio` SLO threshold (`<= 0.20`).
   - New Relic is missing the core custom metric family that should expose indices SLO signals cleanly.
   - Without restored custom metrics or direct DB query evidence, suppressions are not operationally explainable enough in staging.

4. "Why are our codes not working?" remains ambiguous.
   - The audit did not find a single enterprise subsystem literally named "codes."
   - Possible interpretations are:
     - auth/login codes
     - API keys
     - export job identifiers
     - promotional or billing codes
   - This needs explicit clarification before implementation work.

## 4. Root Cause Map

### Root cause A: staging is paused but the enterprise UI behaves as if it is live

Impact:

- queued exports that never finish
- pending quote refreshes
- misleading health perception
- false-negative enterprise QA

### Root cause B: enterprise embed storage path is broken at the backend/data layer

Impact:

- published embeds list 500s
- publish action fails with database error
- screenshoted embed section looks broken because it is broken

### Root cause C: frontend error mapping is flattening important business errors

Impact:

- billing shows generic failure
- recovery actions are hidden from users
- support/debug burden increases

### Root cause D: auth/session bootstrap is too fragile for enterprise workflows

Impact:

- sign-in bounce after valid session
- blank dashboard states
- inability to trust "stay signed in longer"
- MFA truth mismatch between backend and client

### Root cause E: observability is incomplete where enterprise risk is highest

Impact:

- suppressions cannot be explained quickly
- worker failures are harder to prove from New Relic alone
- index-health confidence is overstated

## 5. Enterprise-First Remediation Plan

### Phase 0. Re-establish staging truth before redesign

Priority: P0

Tasks:

1. Decide whether staging should be auditable-live or intentionally paused.
2. If paused, add a staging-only enterprise banner and per-feature paused-state messaging.
3. If live, resume the required workers and schedules in dependency order:
   - export worker
   - B2C refresh worker
   - FX refresh worker
   - ingest fanout workers
   - gold publisher/reconciliation/provider-weighting/OANDA sync as needed
4. Add a hard product truth state for export jobs:
   - `Queued because export worker is paused`
   - `Processing delayed due to staging environment`
5. Add an operator-only checklist tied to OpsPause invariants before any resume.

Acceptance gate:

- Either the UI explicitly declares paused-state limits, or export/refresh workers actually process backlog.

### Phase 1. Fix broken enterprise backend contracts

Priority: P0

Tasks:

1. Fix published embeds end to end.
   - Verify staging schema for `silver.published_chart_embed`.
   - Confirm required migration(s) were applied.
   - Run route-level smoke for:
     - `GET /me/published-embeds`
     - `POST /indices/published-embeds`
     - `POST /me/published-embeds/:id/revoke`
2. Fix billing error propagation.
   - Preserve `customer_not_found` and render actionable UI copy.
   - Show enterprise billing states explicitly:
     - custom billed
     - no Stripe customer on file
     - inactive plan recoverable
3. Fix public push-key wiring.
   - Ensure frontend public env receives the web VAPID key.
   - Replace raw missing-key text with a controlled product message.
4. Verify export worker configuration and job completion path.
   - Confirm queue mode, queue URL, worker runtime, and S3 bucket are aligned.
   - Clear queued-job ambiguity in the UI and in logs.

Acceptance gate:

- Enterprise embed publish/list/revoke works on staging.
- Billing history either loads invoices or shows precise recovery UI.
- Notification UI no longer exposes raw config errors.

### Phase 2. Fix auth/session reliability for enterprise

Priority: P0

Tasks:

1. Make dashboard auth hydration deterministic.
   - Reproduce and fix the redirect-to-sign-in path when a valid session exists in storage.
2. Revisit long-session behavior.
   - Refresh on visibility regain and route transitions, not only on recent activity.
   - Consider a more stable server-aware auth bootstrap for protected routes.
3. Align MFA truth.
   - Make `/me.user.mfa_verified` consistent with real verified factors.
   - Remove the need for middleware to second-guess backend MFA state.
4. Add enterprise auth E2E coverage for:
   - reload while signed in
   - idle tab return
   - MFA-enabled enterprise account
   - enterprise dashboard deep-link load

Acceptance gate:

- A signed-in enterprise user can reload `/dashboard?tab=enterprise` without bouncing to sign-in.
- Session survives realistic inactivity windows expected by enterprise users.

### Phase 3. Redesign enterprise IA and user flow

Priority: P1

Tasks:

1. Split the current enterprise surface into explicit sections:
   - API Access
   - Embeds
   - Data Exports
   - Billing
   - Notifications
2. Replace raw corridor ID fields with a searchable corridor picker/autocomplete.
3. Replace export type implementation terms with business terms.
   - `Quote history`
   - `Alerts data`
   - `Watchlist data`
   - `Indices dataset (TEER / RCI / RVI)`
4. Add enterprise-grade job status language:
   - queued
   - processing
   - available to download
   - failed with reason
   - delayed due to staging pause
5. Add guided empty states and help text:
   - what an API key unlocks
   - what an embed is
   - what corridor IDs mean
   - what export window limits mean

Recommended replacements/additions:

- Replace corridor ID textareas with corridor search + chip selection.
- Replace the single enterprise tab with sub-navigation.
- Add explicit copy that differentiates API keys from auth sessions/tokens.
- Add a "last successful export" and "pipeline status" row for enterprise trust.

Acceptance gate:

- A first-time enterprise user can understand how to create a key, publish an embed, and request an export without knowing internal IDs or backend vocabulary.

### Phase 4. Repair indices, suppressions, and export observability

Priority: P1

Tasks:

1. Restore or re-emit `core_slo_indices` custom metrics in New Relic.
2. Add worker metric families for paused/failing workers.
3. Add one operator view that answers:
   - are TEER/RCI/RVI fresh?
   - what is the suppressed ratio?
   - why are points suppressed?
   - are enterprise exports landing in S3?
4. Validate gold support jobs collectively, not only `gold-indices`.
   - FX sync
   - provider weighting
   - publisher
   - reconciliation
   - export tables
5. Add explicit staging evidence jobs or smoke scripts for:
   - indices readiness
   - export readiness
   - embed readiness

Acceptance gate:

- Suppression spikes and export degradation can be explained from New Relic plus one staging smoke report without manual log archaeology.

## 6. Test Plan

### 6.1 Backend/API tests to add or harden

- Contract test: `GET /me/published-embeds` returns `200` with empty list when no embeds exist.
- Contract test: `POST /indices/published-embeds` succeeds against migrated schema.
- Contract test: billing `customer_not_found` maps cleanly to frontend UI copy.
- Contract test: export create returns `503` or explicit paused-state error when workers are intentionally disabled.
- Contract test: notification preferences persist and round-trip.

### 6.2 Frontend tests to add or harden

- E2E: enterprise dashboard deep-link reload with persisted session.
- E2E: session survives inactivity/visibility change.
- E2E: paused export state renders truthful UI copy.
- Unit: billing-history error rendering for `customer_not_found`.
- Unit/E2E: push notification section when public VAPID key is absent.

### 6.3 Ops checks to automate

- Daily staging gate for paused/resumed worker truth.
- Queue backlog threshold check for enterprise-affecting queues.
- Gold job dependency check, not only top-level indices health.
- New Relic custom metric family presence check in CI or deployment gates.

## 7. Open Questions

1. What exactly did "our codes are not working" mean in this request?
2. Should staging remain intentionally paused for cost control, or should it be brought to a true enterprise QA state?
3. Are enterprise users expected to use Google-only sign-in, or should passwordless/magic-link flows be first-class?
4. Is Omar’s enterprise/account access supposed to require fully verified MFA on every dashboard load, or only on security-sensitive actions?

## 8. Recommended Immediate Actions

Do these first, in order:

1. Decide paused-vs-live staging and make the product truthful either way.
2. Fix published embed schema/runtime failure.
3. Fix billing error mapping in the frontend.
4. Fix session persistence and dashboard deep-link hydration.
5. Wire the public push VAPID key correctly.
6. Only then redesign the enterprise UI and copy.
