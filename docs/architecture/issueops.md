# IssueOps Architecture (Brain / Executors / Judge)

## One-screen quick map (operator + agent)
Entrypoints:
- Brain loop: `backend/scripts/brain/brain.ts`
- Skill catalog: `.remit-scout/skills/catalog.yaml`
- Case contracts: `.remit-scout/cases/<case_id>/`
- Slack front desk runner: `backend/scripts/frontdesk/slack-frontdesk.ts`
- Front desk docs: `ops/frontdesk/README.md`

Primary flow:
1. Signals arrive (CloudWatch/Sentry/manual Slack).
2. Brain creates/refreshes a Case (PRD + Plan).
3. Skills run via Executors (GitHub Actions, AWS scheduled jobs, local).
4. Evidence is written as bounded `EvidenceResult` JSON + artifact pointers.
5. Judge gate decides iterate/escalate/close (human or automated later).

## Contracts
Repo-native durable artifacts:
- PRD: `.remit-scout/cases/<case_id>/prd.yaml`
- Plan: `.remit-scout/cases/<case_id>/plan.yaml`
- Run: `.remit-scout/cases/<case_id>/runs/run-*.json` (includes `decision_record` template with bounded and rollback evidence)
- Case index: `.remit-scout/cases/index.json` (tracks `open|blocked|closed` lifecycle status + `updated_at`)

Case folder lifecycle + deterministic naming contract:
- Case IDs must be deterministic for the same normalized incident fingerprint so repeated signals refresh the same folder.
- Repeated signals should refresh PRD/Plan in-place and preserve prior links/ownership metadata.
- Judge outcomes should update lifecycle status in the case index (`iterate|open_pr -> open`, `escalate -> blocked`, `close_case -> closed`).
- Brain must emit per-loop case-index retention observability events (`issueops_case_index_retention@v1`) with bounded counts and refs for index drift + retention drift.
- Case-index retention policy thresholds are measured from `BRAIN_CASE_INDEX_RETENTION_DAYS` (closed-case age) and `BRAIN_CASE_RUN_RETENTION_DAYS` (run-file age).
- Retention policy measurement is observe-only by default: no automatic deletion, and rollback-safe refs must be included in observability output.

Triage simulation mode contract (`BRAIN_TRIAGE_MODE`):
- Allowed modes are `live` (default) and `dry_run` (`dry-run`, `dryrun`, `simulation`, `simulate` aliases normalize to `dry_run`).
- `dry_run` simulates GitHub Actions dispatches while still writing deterministic outbox records for replay/audit.
- Deterministic outbox records must use timestamp-first filenames and deterministic `route_order` metadata so lexicographic file scans and ingestion order remain stable.
- Simulated outbox entries must use status `simulated` (not `failed`) to keep triage simulation separate from execution failures.
- Simulated dispatch records must include explicit bounded-evidence and rollback-evidence notes so operators can audit what was simulated and how to replay in `live` mode.

Judge decision model contract (`iterate` vs `escalate`):
- Judge uses canonical reason-code severities from `.remit-scout/reason-codes/catalog.yaml` when available so informational `*.stats` findings stay non-actionable.
- `close_case` is allowed only when findings are informational (`sev0`), evidence execution succeeded, and closure rationale includes at least one informational reason code from bounded findings.
- If closure rationale is missing (for example, empty informational findings/reason codes), Judge must escalate with reason code `triage.close_case_rationale_missing` and preserve bounded + rollback evidence refs in the decision record.
- `iterate` requires actionable findings plus at least one non-manual next skill recommendation.
- `escalate` is required when evidence execution fails, when escalation findings are present (`sev3` or `evidence.error`), or when actionable findings exist without a non-manual next skill.
- `escalate` is also required when repeated `iterate` outcomes exceed the triage timebox (`BRAIN_TRIAGE_TIMEBOX_MAX_ITERATE_LOOPS`, `BRAIN_TRIAGE_TIMEBOX_MAX_MINUTES`), with `triage.timebox_exceeded` added to reason codes.
- `escalate` is required when incident timeline reconstruction from bounded Case events fails (for example missing/invalid inbox/outbox/run timestamp anchors), with `triage.timeline_reconstruction_failed` added to reason codes.
- Timebox escalations must preserve bounded-evidence + rollback-evidence pointers in `decision_record` so operators can replay and reverse decisions deterministically.
- Timeline-reconstruction escalations must preserve bounded event refs (`evidence_refs.kind=log`) and rollback pointers for deterministic operator replay.

Human-in-loop escalation contract (`decision_record.human_in_loop`):
- Every Run decision record must include `human_in_loop` with `contract_version='v1'`.
- Contract fields are always present: `required`, `status`, `escalation_channel`, `route_skill_id`, `reason_codes`, `handoff_summary`, `bounded_evidence_note`, `rollback_evidence_note`.
- `escalation_channel` is fixed to `slack_frontdesk` and `route_skill_id` is fixed to `manual.human_triage` for deterministic handoff routing.
- When `decision=escalate`, set `required=true`, `status=pending_human_triage`, and populate escalation `reason_codes` for operator triage.
- When decision is not escalation, set `required=false`, `status=not_required`, and keep escalation `reason_codes` empty.
- `bounded_evidence_note` and `rollback_evidence_note` are mandatory note shards for escalation handoff auditability.

PRD/Plan acceptance proof contract:
- `acceptance_proof.source_note` captures source lineage for the task/request.
- `acceptance_proof.acceptance_note` captures what qualifies the change as complete.
- `acceptance_proof.bounded_evidence_note` captures bounded evidence expectations.
- `acceptance_proof.rollback_evidence_note` captures rollback evidence expectations.

Incident-to-task conversion contract:
- Signal intake (`signal_id` + `signal_sources`) must be preserved in PRD/Plan `acceptance_proof.source_note` to keep case lineage auditable.
- Conversion must always emit at least one executable Plan skill; fallback is `manual.human_triage` when deterministic routing produces no runnable skills.
- Skill selections must resolve against `.remit-scout/skills/catalog.yaml`; unknown skill IDs must trigger manual triage escalation and remain visible in the Plan decision rationale.
- Conversion-generated PRD/Plan artifacts must include `traceability` metadata with explicit bounded and rollback evidence gates.
- PRD generation must consume optional `case_hints.suspected_components` and deterministic text hints (`signal_id`, `signal_sources`, `symptoms`) to seed `suspected_components` when explicit component fields are missing.

Incoming signal domain classification contract:
- Canonical domains are `provider_health`, `queue`, `api_latency`, `freshness`, `indices`, `pulse`, `exports`, `infra_drift`, `security`, `other`.
- Signal intake must normalize alias domain tokens (for example `provider`, `queue_backlog`, `http_latency`, `export`) into canonical domain values before PRD/Plan write.
- If a signal omits `domain`, classification should infer from deterministic cues (`queue_kind`, `provider_id`, `target_url`) and fallback text hints (`signal_id`, `signal_sources`, `symptoms`).
- Unclassified signals must be routed as `other` while preserving source context for bounded evidence and rollback-evidence review.

PRD risk + owner assignment contract:
- PRD must include both `risk_tier` and `risk_level`; required mapping is `0=low`, `1=medium`, `2=high`, `3=critical`.
- PRD must include `owner_assignment.status` (`unassigned|assigned`) and a versioned `owner_assignment.ownership_tag`.
- When `owner_assignment.status=assigned`, PRD must include `owner_assignment.owner` for deterministic escalation/accountability.
- Legacy `human_owner` and `ownership_tags` remain compatibility fields; `owner_assignment` is the canonical assignment envelope.

PRD/Plan task lifecycle contract:
- `traceability.task_lifecycle_version` pins task lifecycle semantics to a versioned contract (`v1`).
- `v1` task statuses are `todo`, `in_progress`, `blocked`, and `done`.
- `v1` transitions are `todo -> in_progress|blocked`, `in_progress -> done|blocked|todo`, and `blocked -> todo|in_progress`.
- Repeated writes that keep the same task state (for example `in_progress -> in_progress`) are idempotent no-ops and must not duplicate progress notes.
- `done` is terminal for a given task row; rollback/retry evidence must create a new iteration path via `todo`.

PRD/Plan traceability contract:
- `traceability.spec_refs` entries are repository-relative links (files or directories), not free-form labels.
- `traceability.spec_refs` entries must be unique and must resolve to existing paths at validation time.
- Prefer `SPECS/` mirrors for agent iteration inputs when available; include non-SPECS paths only when no mirror exists.
- `traceability.runtime_stage_gates` must segment runtime gates by versioned task-cluster tag (for example `cluster.issueops.execution@v1`).
- Every `traceability.runtime_stage_gates` cluster must list one or more versioned gate tags (for example `gate.bounded_evidence_captured@v1`).
- Runtime stage gates are contract metadata only in the current runner; they document expected gates per cluster without overriding one-task-per-iteration safety.
- `traceability.parallelizable_tag` (when present) must use a versioned tag (for example `parallel.serial_only@v1`) so future runners can safely infer concurrency intent.
- Iteration execution must enforce one-task-per-iteration: only one `IMPLEMENTATION_PLAN.md` row may be `in_progress` at a time.
- `parallelizable_tag` is metadata-only in the current runner and must not bypass one-task-per-iteration safety invariants.
- Plan artifacts may include `plan_snapshots` for historical audit replay; when present the list must remain bounded (maximum 25 snapshots) and each snapshot must carry explicit `bounded_evidence_note` and `rollback_evidence_note` shards.
- `plan_snapshots` entries should store pointer-style references (`spec_refs`, artifact handles) instead of raw logs to preserve bounded evidence behavior.

Evidence packs:
- Schema: `.remit-scout/schema/evidence.schema.json`
- Output library: `backend/scripts/lib/evidence.ts`

## Security posture (Claw Cage)
- The model process must not hold AWS credentials.
- Prefer no GitHub write token in model process; Brain wrapper enforces allowlists.
- Slack is UI-only; button clicks write inbox events, not direct execution.

## Close the loop (GitHub Actions -> Evidence -> Run)
To make IssueOps end-to-end (signal -> plan -> execute -> ingest -> next action):
- Evidence workflows accept `dispatch_id` and include it in the run name and artifact name.
- The brain can ingest completed dispatches when `BRAIN_INGEST_GITHUB_ACTIONS=1`:
  - finds the matching Actions run by `dispatch_id`
  - downloads the artifact zip and extracts `evidence.json`
  - writes a durable Run record under `.remit-scout/cases/<case_id>/runs/` with filename ordering based on workflow `finished_at`
  - posts Slack thread updates and GitHub Issue comments (if configured)
  - redacts failure-bundle archive URLs/paths from Slack finding summaries; operators use Run `decision_record.rollback_evidence.refs` for replay pointers
