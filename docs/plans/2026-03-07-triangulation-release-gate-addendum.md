---
feedback_source:
  - chat transcript
user_goal: "Double down on triangulation and define what must be investigated and proven before release."
environment:
  - staging
  - prod
mode: review only
chosen_agents:
  - Triangulation Engine
  - Data Lineage
  - SLO Police
  - Agent Orchestration
risk_tier: critical
risk_level: critical
owner_assignment:
  status: proposed
  ownership_tag: triangulation.release-gate@v1
  primary_owner: data-platform
  supporting_owners:
    - backend
    - platform
    - qa
traceability:
  task_lifecycle_version: audit-plan.v1
  parallelizable_tag: parallel.serial_only@v1
  spec_refs:
    - ARCHITECTURE.md
    - agents/rag/triangulation-engine.md
    - agents/rag/data-lineage.md
    - agents/rag/slo-police.md
    - agents/rag/agent-orchestration.md
    - backend/scripts/ci/staging-go-live-readiness.ts
    - backend/scripts/triangulation-job.ts
    - backend/plane-b/src/triangulation/engine.ts
    - backend/plane-b/src/triangulation/stress-events.ts
    - backend/plane-a/src/routes/indices.ts
    - backend/plane-a/src/repositories/implementations/triangulated-index-repository.ts
    - backend/db/migrations/091_partner_entitlements_factors.sql
    - backend/db/migrations/103_fk_constraints_weight_snapshot_triangulated_index.sql
    - backend/db/migrations/104_observation_module_registry_triangulation_hardening.sql
  runtime_stage_gates:
    - task_cluster: cluster.triangulation-contract@v1
      bounded_evidence_note: "Triangulation must be proven from observation ingest through API delivery, not just by unit tests."
      rollback_evidence_note: "If the end-to-end proof is incomplete, triangulation should be treated as disabled or non-releasable."
    - task_cluster: cluster.triangulation-schema-truth@v1
      bounded_evidence_note: "Code, migrations, and docs must agree on the active triangulation storage contract before release."
      rollback_evidence_note: "If schema truth is ambiguous, the release gate must fail rather than infer the wrong source."
acceptance_proof:
  source_note: "This addendum is grounded in the triangulation RAG, data-lineage RAG, current code paths, migrations, and release-readiness validation rules."
  acceptance_note: "This addendum is complete when triangulation has a clear audit scope, explicit blockers, and a staging/prod proof model."
  bounded_evidence_note: "Planning only; no code or workflow implementation in this turn."
  rollback_evidence_note: "All proposed triangulation gates are additive and can be layered in before becoming hard blockers."
plan_snapshots:
  - at: "2026-03-07T03:30:00Z"
    summary: "Triangulation-specific release-gate addendum created after deeper audit of observations, composite indices, and stress-event paths."
    bounded_evidence_note: "Snapshot captures current triangulation scope and drift."
    rollback_evidence_note: "If implementation sequencing changes, this addendum still preserves the required proof domains."
---

# Triangulation Release-Gate Addendum

## 1. What We Need To Cover

Triangulation is not one thing. It is five linked proof domains:

1. Observation ingest
   - `silver.observation` must be populated for the corridors and signal layers we claim to support.

2. Composite computation
   - the triangulation job must compute deterministic TEER/RCI/RVI composites and stress scores without fabricating missing signals.

3. Gold storage truth
   - the runtime write/read path must agree on the active table and schema.

4. API and product semantics
   - `/api/v1/indices/triangulated/:corridorId` must return confidence and contributing signals, not just a number.

5. Stress-event downstream effects
   - threshold crossings must emit events and produce observable responder behavior.

If any of those are missing, triangulation is not release-ready.

## 2. Current Investigation Findings

### 2.1 What exists today

- Triangulation is already a real code path, not just a roadmap artifact.
- `backend/scripts/triangulation-job.ts` runs the engine and optional stress detection.
- `backend/scripts/ci/staging-go-live-readiness.ts` already enforces triangulation config prerequisites:
  - `TRIANGULATION_ENABLED`
  - `EMIT_OBSERVATIONS`
  - queue-mode compatibility
  - stress responder enabled
- There are meaningful backend tests:
  - `backend/tests/triangulation-engine.test.ts`
  - `backend/tests/triangulation-composite-confidence.test.ts`
  - `backend/tests/triangulation-historical-inputs.test.ts`
  - `backend/tests/stress-responder.test.ts`

### 2.2 What is not yet proven live

- that seeded corridors actually produce fresh rows in `silver.observation`
- that the triangulation job is executing successfully in staging
- that fresh rows appear in the runtime triangulation table
- that the API is serving fresh values with correct confidence semantics
- that stress events are emitted and consumed end-to-end
- that prod canary can validate triangulation without unsafe mutations

### 2.3 Important contract drift

There is a real schema/documentation mismatch:

- docs and RAGs still describe `gold.triangulated_index`
- code, routes, repositories, and migrations are using `gold_export.triangulated_index`

This is not cosmetic. It means the release gate must treat code plus migrations as the current source of truth until the docs are corrected.

## 3. Triangulation Audit Scope

### 3.1 Data-plane questions

We need hard answers for:

1. Which signal layers are actually active in staging?
2. Are quote observations dual-written for the corridors we test?
3. Are non-quote modules contributing any real observations yet?
4. What is the recent observation count by:
   - corridor
   - signal_layer
   - module_id
5. What percentage of canonical corridors have:
   - quote-only confidence
   - multi-layer confidence
   - no triangulation output at all

### 3.2 Computation questions

We need hard answers for:

1. Does the triangulation job run on schedule?
2. Does it write fresh rows for canonical corridors and amount/method combinations?
3. Does confidence drop when signals are missing, or are values silently overconfident?
4. Are methodology versions consistent?
5. Are historical queries deterministic for fixed inputs?

### 3.3 Event and automation questions

We need hard answers for:

1. Are stress thresholds firing?
2. Are events being emitted to the expected queue or pipeline?
3. Is the stress responder consuming them?
4. Does the responder write evidence back to `silver.observation`?
5. Are adaptive actions bounded by guardrails and TTLs?

## 4. Required Release Proof

### 4.1 Staging proof

For triangulation to be releasable in staging, the gate must prove:

1. `TRIANGULATION_ENABLED=1` implies `EMIT_OBSERVATIONS=1`.
2. Fresh observation rows exist for seeded corridors during the run window.
3. The triangulation job completes successfully.
4. Fresh rows exist in `gold_export.triangulated_index`.
5. `/api/v1/indices/triangulated/:corridorId` returns:
   - series
   - confidence
   - contributingSignals
   - methodology
6. At least one low-signal corridor shows degraded confidence instead of fabricated certainty.
7. Stress-event emission is observable.
8. Stress responder consumption is observable.

### 4.2 Production canary

Prod canary should remain read-only or evidence-only.

It must prove:

1. recent triangulated rows exist
2. API serves expected canonical corridors
3. confidence and contributing signals are present
4. no unexplained freshness lag exists
5. observability metrics/logs exist for the last cycle

## 5. Triangulation-Specific Blockers

Release must be blocked when any of the following is true:

1. Triangulation is enabled but `silver.observation` is not receiving fresh rows.
2. Triangulation job runs but `gold_export.triangulated_index` is stale or empty for canonical corridors.
3. API omits `confidence` or `contributingSignals`.
4. Methodology version is missing or inconsistent.
5. Stress events are expected but no downstream evidence exists.
6. Docs, code, and migrations disagree on the active storage contract and the gate cannot resolve it.
7. Observability exists only at infra level and not at triangulation-feature level.

## 6. Specific Investigation Work To Double Down On

### Workstream A: Observation truth

Investigate:

- actual row volume into `silver.observation`
- signal-layer mix
- corridor coverage
- freshness distribution

Deliverable:

- one SQL-backed observation health report for staging and prod

### Workstream B: Runtime storage truth

Investigate:

- active table and indexes for triangulation output
- migration lineage
- API/repository dependency on `gold_export.triangulated_index`
- stale documentation referring to `gold.triangulated_index`

Deliverable:

- reconciled schema contract note plus source-of-truth update plan

### Workstream C: Composite semantics

Investigate:

- confidence behavior on sparse-signal corridors
- contributing-signals ranking
- methodology version consistency
- historical determinism

Deliverable:

- canonical corridor expectation matrix with low, medium, and high confidence examples

### Workstream D: Stress events and responder

Investigate:

- queue wiring
- emitted event counts
- responder logs and evidence rows
- guardrail behavior on high-stress conditions

Deliverable:

- stress-event proof artifact with emitted event id to downstream evidence trace

## 7. Metrics We Must Have

Triangulation needs its own mandatory metric family. Minimum signals:

- `observation_write_success`
- `observation_write_failure`
- `triangulation_job_success`
- `triangulation_job_failure`
- `triangulated_index_write_success`
- `triangulated_index_write_failure`
- `triangulated_index_api_success`
- `triangulated_index_api_empty`
- `triangulated_index_confidence_low`
- `stress_event_emitted`
- `stress_event_consumed`
- `stress_responder_processed`

Without these, triangulation is not observable enough to be a release blocker.

## 8. What This Means For The Main Release Plan

The main release gate should treat triangulation as a top-tier business domain, not a sub-bullet under indices.

Priority should be:

1. enterprise
2. auth/account
3. exports/embeds/indices
4. triangulation/observations
5. alerts/smart alerts/emails
6. corridor matrix
7. agent self-healing

## 9. Immediate Decision

Do you want triangulation treated as active release scope right now?

If yes:

- it becomes a hard staging blocker
- it gets a prod canary
- docs/schema drift must be fixed

If no:

- the release gate must explicitly assert triangulation is disabled
- any partial data or UI references must be treated as non-contractual
