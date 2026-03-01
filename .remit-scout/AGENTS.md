---
entrypoints:
  - ".remit-scout/README.md"
  - ".remit-scout/skills/catalog.yaml"
  - ".remit-scout/reason-codes/catalog.yaml"
  - ".remit-scout/providers/catalog.json"
  - ".remit-scout/schema/prd.schema.json"
  - ".remit-scout/schema/plan.schema.json"
  - ".remit-scout/schema/run.schema.json"
evidence_skills:
  - "evidence.provider_health.github_actions"
  - "evidence.queue_backlog.github_actions"
  - "evidence.exports_health.github_actions"
  - "evidence.freshness_slo.github_actions"
common_reason_codes:
  - "evidence.error"
---
# IssueOps Contracts + Catalogs (.remit-scout) (AGENTS)

What this directory is:
Repo-native, durable contracts and registries that make automation deterministic.

Entrypoints:
- `.remit-scout/skills/catalog.yaml`
- `.remit-scout/reason-codes/catalog.yaml`
- `.remit-scout/providers/catalog.json`
- `.remit-scout/schema/prd.schema.json`
- `.remit-scout/schema/plan.schema.json`
- `.remit-scout/schema/run.schema.json`

Common failure modes:
- Skill/workflow drift: workflow inputs renamed but catalog not updated.
- Evidence drift: scripts emit unregistered reason codes.
- Provider drift: provider folders and catalog disagree.

Evidence skills to run:
- Any `evidence.*.github_actions` skill (see `.remit-scout/skills/catalog.yaml`).

Progress state semantics and idempotency (v1):
- **Dual-write atomicity**: `plan.mjs mark` updates both IMPLEMENTATION_PLAN.md and progress.txt together. Neither file is considered authoritative alone.
- **Same-state writes are no-ops**: Writing the same status to a task produces no file changes and logs `No-op <id> -> <status> (idempotent)`.
- **Note merging**: Notes are semicolon-delimited segments. `mergeNotesIdempotent()` deduplicates by case-insensitive fingerprint, preserving first occurrence. Repeated mark calls with the same note do not create duplicates.
- **Progress file format**: `progress.txt` uses `id|status|note` pipe-delimited lines. Lines starting with `#` are comments. CI validates this format.
- **Single in_progress constraint**: At most one task may be `in_progress` across the entire plan. Attempting to mark a second task as `in_progress` is a hard error.
- **Reconcile on refresh**: `reconcile-progress` resets stale `in_progress` to `todo` with rollback evidence appended to notes. Blocked tasks are NOT auto-recovered.

Blocked-state recovery semantics (v1 lifecycle):
- **Blocked -> todo**: Re-queue the task after blocker is resolved. The task enters the scheduling queue from scratch.
- **Blocked -> in_progress**: Directly resume the task when the blocker clears. Only one task may be `in_progress` at a time.
- **Reconcile behavior**: `reconcile-progress` resets stale `in_progress` tasks to `todo` but does NOT auto-recover `blocked` tasks. Blocked tasks require explicit manual transition via `plan.mjs mark <id> todo|in_progress <reason>`.
- **Mark note format for blocked tasks**: `reason: <why blocked>; bounded evidence: <what was attempted>; rollback evidence: <how to recover>`.
- **Done is terminal**: No transitions from `done`. Same-state writes are idempotent no-ops.

Priority and run-order policy:
- **Priority**: Integer >= 0. Lower number = higher priority. Default: 100. PRD items should assign unique priority values (1-based from most urgent).
- **Run order**: Integer >= 0. Determines execution order within same priority. Auto-assigned from PRD array index if not explicit.
- **Sort algorithm** (used by `plan.mjs next`): dependency_depth ASC > priority ASC > run_order ASC > id alphabetical.
- **At most one task** may be `in_progress` at any time (single-threaded execution model).
- **Dependency depth**: Tasks with `depends_on` references are deferred until dependencies are `done`. Depth = max(dependency depths) + 1.

Tag versioning conventions (all tags use pattern `[a-z0-9._:+-]+@v[0-9]+`):
- **Ownership tags** (`owner.*@v1`): `owner.unassigned@v1`, `owner.human.slack@v1`, `owner.foundation.control_plane@v1`, `owner.agent_platform.*@v1`. Source-of-truth concerns use `ops.*@v1` namespace.
- **Traceability tags** (`trace.*@v1`): Must include `bounded_evidence` and `rollback_evidence` markers. Format: `trace.[source]+[spec_section]+bounded_evidence+rollback_evidence@v1`.
- **Parallelizable tags** (`parallel.*@v1`): Default `parallel.serial_only@v1`. Future values may include `parallel.fan_out@v2` etc.
- **Cluster tags** (`cluster.*@v1`): Group stage gates. Current: `cluster.issueops.contract@v1`, `cluster.issueops.execution@v1`.
- **Gate tags** (`gate.*@v1`): `gate.intake_ready@v1`, `gate.spec_refs_resolved@v1`, `gate.bounded_evidence_captured@v1`, `gate.rollback_evidence_captured@v1`, `gate.change_reviewed@v1`.
- **Snapshot tags** (`snapshot.*@v1`): `snapshot.plan_created@v1`, `snapshot.[trigger]@v1`.
- Tags are immutable once used. To introduce changes, create a new tag with incremented version (`@v2`) and support both during migration.

Human-in-the-loop boundaries for agent self-healing (v1):
- **Invariant** (`agent-self-healing-approval`): Agent self-healing (parser patches) requires human approval via GitHub PR in propose-only mode. Auto-deploy requires explicit `AGENT_AUTO_DEPLOY=true` flag.
- **Propose-only mode (v1, current)**: All agent-proposed patches are deployed via GitHub PR. The patch-deployer creates a branch (`agent/repair-<bundleId>`), commits the proposed changes, opens a PR, and notifies Slack. A human must review and merge the PR before changes reach production.
- **Auto-deploy mode (v2, future, behind `AGENT_DIRECT_DEPLOY=true`)**: Direct application is gated behind `AGENT_DIRECT_DEPLOY=true` AND `autoHealEnabled=true` in the module's policy AND `confidence=high` on the proposal. Auto-deploy uses canary rollout (10% -> 50% -> 100% over 90 min) with auto-rollback if error rate > 2x baseline.
- **Safe edit scope policy (propose-only v1)**: Agents can ONLY modify files in the safe edit scope. Enforced at three layers:
  - **Directory allowlist**: `backend/plane-b/src/providers/`, `backend/plane-b/src/agents/`. Files outside these directories are rejected.
  - **File allowlist**: Only `backend/plane-b/src/providers/<provider>/parse.ts` and `backend/plane-b/src/providers/<provider>/fetch.ts` are editable. Other files (for example `backend/plane-b/src/providers/<provider>/collector.ts`, `backend/plane-b/src/providers/<provider>/catalog.ts`) are rejected even within allowed directories.
  - **Path traversal protection**: Any path containing `..` segments is rejected.
  - **Enforcement points**: patch-validator `checkAffectedFilesExist()` (compile-time validation), tool-gateway `executeFileRead()` (runtime read-scope), ARCHITECTURE.md invariant (design-time constraint).
- **Agent config default**: `requiresApproval` defaults to `true` for all agents (`backend/plane-b/src/agents/agent-config.ts`). Set via `AGENT_{ID}_REQUIRES_APPROVAL=false` to override (not recommended for production).
- **Escalation triggers (human required)**: (1) Evidence execution failure. (2) `sev3` or `evidence.error` findings. (3) Actionable findings with no non-manual next skills. (4) Triage timebox exceeded (`triage.timebox_exceeded`). (5) Incident timeline reconstruction failure (`triage.timeline_reconstruction_failed`). (6) Close-case rationale missing (`triage.close_case_rationale_missing`).
- **Escalation handoff contract** (`decision_record.human_in_loop` v1): When `decision=escalate`, set `required=true`, `status=pending_human_triage`. When decision is not escalation, set `required=false`, `status=not_required`. Escalation routing is deterministic: `escalation_channel=slack_frontdesk`, `route_skill_id=manual.human_triage`, `escalation_owner_tag=owner.issueops.oncall@v1`, default SLA=30 minutes.
- **Privileged action routing**: PRs, deploys, Slack notifications, and GitHub issue creation route through Brain/executor pipeline only, never through the untrusted agent runtime.
- **Audit trail**: All agent actions logged to `silver.agent_action`. All tool requests logged to `silver.agent_tool_request`. Failure bundles tracked in `silver.failure_bundle` with repair status progression (`pending` -> `proposed` -> `applied`/`rejected`/`failed`).
- **Patch safety gates**: ALL patches must pass contract tests against 20+ stored payloads before any deployment. Proposed parser patches must type-check via `tsc --noEmit`.

Manual override and emergency stop policy:
- **Agent kill switches** (per-agent):
  - `AGENT_ORCHESTRATOR_ENABLED=false`: Disables the orchestrator polling loop. No failure detection cycles, no dispatch processing.
  - `AGENT_{ID}_ENABLED=false`: Disables any individual agent (e.g., `AGENT_STRESS_RESPONDER_ENABLED=false`).
  - `AGENT_DIRECT_DEPLOY=false` (default): Blocks all auto-deploy; forces PR-only flow.
- **Collection kill switches**:
  - `PLANE_B_DISABLE_TIER1=true`: Stops all Tier 1 collector runs.
  - Provider stoplist (`silver.rights_matrix.stoplisted=true`): Halts collection for a specific provider. Resume via `backend/scripts/stoplist-auto-resume.ts` or manual `UPDATE silver.rights_matrix SET stoplisted=false`.
  - Circuit breaker (`silver.circuit_breaker`): Automatically trips after sustained failure threshold; resets after cooldown or manual reset.
- **Platform emergency stop**:
  - `make ops-pause-dev` / `make ops-pause-staging` / `make ops-pause-prod`: Fast emergency stop via OpsPause Lambda. Stops ECS services and disables EventBridge rules without a full CDK deploy.
  - `make pause-dev`: Standard dev pause via CDK deploy with `devPaused=true`.
  - Nightly auto-pause (dev only): EventBridge Scheduler triggers OpsPause at 12:00am ET.
  - Cost guardrail auto-pause: SNS budget/anomaly notifications trigger OpsPause.
- **Cadence overrides** (agent-managed, with safety rails):
  - Stress responder can adjust probe frequency via `silver.dispatch_queue` cadence-override items.
  - Mandatory TTL: max 60 minutes. Maximum multiplier: 4x baseline.
  - To cancel all active overrides: `UPDATE silver.dispatch_queue SET status='completed' WHERE queue_name='cadence-override' AND status='pending'`.
- **Reconciliation after emergency stop**:
  - OpsPause is intentional drift. To reconcile, re-deploy CDK with the correct `devPaused` value.
  - Do not use AWS Console to manually toggle ECS services or EventBridge rules.
- **Runbook references**: `docs/runbooks/dev-pause-resume.md`, `docs/runbooks/agent-operations.md`, `docs/runbooks/ops-pause-iam-reconciliation.md`.

Documentation-to-SPECS sync contract:
- **Sync mechanism**: `plan.mjs build` calls `buildSpecCatalog()` which copies canonical files into `SPECS/` for loop-facing consumption. SPECS is regenerated from scratch on every build (agents-bundle and skills-bundle are `rm -rf`'d first).
- **Three sync strategies** (defined in `SPECS/source-of-truth-matrix.json`):
  - `single-source`: No derived copies. The canonical file IS the only source of truth (e.g., `backend/plane-b/src/agents/agent-config.ts`, `backend/plane-b/src/agents/tool-gateway.ts`, `.remit-scout/providers/catalog.json`).
  - `derived-copy`: Canonical file is replicated verbatim into `SPECS/`. CI validates that derived copies exist AND content matches the canonical source. Run `node scripts/ralph/plan.mjs build` to re-sync after editing a canonical file.
  - `manual-review`: Copies exist in SPECS but are not automatically validated for content match (e.g., operational runbooks that may diverge intentionally).
- **Static copy mapping** (canonical -> SPECS):
  - `AGENTS.md` -> `SPECS/agents.md`
  - `.remit-scout/AGENTS.md` -> `SPECS/remit-scout.agents.md`
  - `agents/AGENT-MATCH.md` -> `SPECS/agent-match.md`
  - `ARCHITECTURE.md` -> `SPECS/architecture.md`
  - `.remit-scout/skills/catalog.yaml` -> `SPECS/skills.catalog.yaml`
  - `.remit-scout/reason-codes/catalog.yaml` -> `SPECS/reason-codes.catalog.yaml`
  - `.remit-scout/providers/catalog.json` -> `SPECS/providers.catalog.json`
  - `.remit-scout/schema/prd.schema.json` -> `SPECS/schema.prd.json`
  - `.remit-scout/schema/plan.schema.json` -> `SPECS/schema.plan.json`
  - `.remit-scout/schema/run.schema.json` -> `SPECS/schema.run.json`
  - `docs/runbooks/agent-deploy-promotion-checklist.md` -> `SPECS/agent-deploy-promotion-checklist.md`
  - `docs/runbooks/ralph-codex-loop.md` -> `SPECS/ralph-codex-loop.md`
- **Bundle copies**: All `AGENTS.md` files (excluding `.remit-scout/`) -> `SPECS/agents-bundle/`. All files under `agents/rag/` -> `SPECS/agents-bundle/agents/rag/`. Codex skills -> `SPECS/skills-bundle/`.
- **CI enforcement** (`backend/scripts/ci/validate-source-of-truth-matrix.ts`): Validates canonical_path exists, derived_copies exist, content matches for `derived-copy` strategy, owner_tag pattern, bounded/rollback evidence notes present, SPECS/README.md manifest count consistency.
- **Max file size**: Files > 1MB (`MAX_SYNC_BYTES`) are skipped during sync and listed in `SPECS/README.md` under "Skipped due to file-size limit".
- **SPECS/README.md governance manifest**: Auto-generated by `plan.mjs build`. Includes: generation timestamp, total synced count, governance references (`.remit-scout/AGENTS.md`, `SPECS/source-of-truth-matrix.json`), non-manifest files list, and per-source-group artifact mappings. CI validates the `Total synced` header matches the actual manifest entry count.

Do-not-break rules:
- Treat these files as APIs; CI enforces consistency.
- Keep evidence blobs out of git; store pointers (Actions artifacts/S3/etc).
- PRD/Plan contracts must preserve sharded `acceptance_proof` notes (`source_note`, `acceptance_note`, `bounded_evidence_note`, `rollback_evidence_note`).
- PRD contracts must keep canonical `risk_level` aligned with `risk_tier` and must include `owner_assignment` metadata (status + versioned ownership tag).
- PRD/Plan contracts must keep `traceability.task_lifecycle_version` aligned with documented lifecycle transitions, and repeated same-state progress writes must be idempotent no-ops.
- PRD/Plan contracts must segment `traceability.runtime_stage_gates` by versioned task-cluster tags and keep bounded/rollback evidence gates explicit for execution clusters.
- Plan contracts should keep `plan_snapshots` bounded (max 25 entries) and include explicit per-snapshot `bounded_evidence_note` + `rollback_evidence_note` shards for historical audit replay.
- PRD/Plan contracts should set `traceability.parallelizable_tag` with a versioned value (`parallel.serial_only@v1` default) to annotate future-runner concurrency intent.
- PRD/Plan `traceability.spec_refs` entries must be repo-relative links that resolve to existing files/directories.
- Run contracts should populate `decision_record.human_in_loop` with the v1 escalation handoff envelope (`contract_version`, `required`, `status`, `escalation_channel`, `route_skill_id`, `escalation_sla_minutes`, `escalation_owner_tag`, `reason_codes`, `handoff_summary`, `bounded_evidence_note`, `rollback_evidence_note`).
- Environment-specific invariants: when PRD `env` is `prod` or `staging`, the paired Plan must have `guardrails.prod_read_only=true` and constraints must include `prod_read_only=true`. Prod plans must have `max_diff_lines=0`.
- Case-index entries must use the same `env` value as the paired PRD. The `domain` field must match the PRD domain enum. The `owner` field must follow the versioned ownership tag pattern (`[a-z0-9._:+-]+@v[0-9]+`).
- Case directory names must match the `case_id` field in all contained artifacts (prd.yaml, plan.yaml, run JSON files).
