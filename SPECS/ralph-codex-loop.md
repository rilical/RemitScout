# Ralph loop on Codex (Remit-Scout)

This runbook wires a Codex-native iteration loop that keeps planning state in:

- `prd.json` (task source)
- `IMPLEMENTATION_PLAN.md` (current executable task list)
- `progress.txt` (status snapshots)
- `SPECS/` (copied governance + instruction bundle)

## Files added

- `scripts/ralph/plan.mjs`
- `scripts/ralph-loop.sh`
- `package.json` scripts: `ralph:plan`, `ralph:sync-specs`, `ralph:next`, `ralph:loop`, `ralph:loop:forever`, `ralph:loop:plan`
- `docs/runbooks/ralph-codex-loop.md` (this file)

The following `SPECS` artifacts are copied on every plan build:

- `AGENTS.md`
- `.remit-scout/AGENTS.md`
- `agents/AGENT-MATCH.md`
- `ARCHITECTURE.md`
- `.remit-scout/skills/catalog.yaml`
- `.remit-scout/reason-codes/catalog.yaml`
- `.remit-scout/providers/catalog.json`
- `.remit-scout/modules/catalog.json` (module catalog — normalization_strategy, repair_strategy_override)
- `.remit-scout/schema/*.json`
- `docs/runbooks/agent-deploy-promotion-checklist.md`
- `docs/runbooks/ralph-verifier.md`
- `docs/architecture/agent-native-platform-spec.md` (authoritative agent-native platform spec)
- All repository `AGENTS.md` files and `agents/rag/*.md` files under `agents-bundle/**`
- All `.codex` skill instructions from `~/.codex/skills/**/SKILL.md` under `skills-bundle/**`

## Required prerequisites

- Node + npm/pnpm workspace.
- Codex CLI available on PATH.
- Read/write permissions on repo.
- Optional: `ralph` binary installed if you want dashboard usage only.

## Quick setup (Codex native loop)

1. Ensure the contract files exist:

```bash
pnpm ralph:sync-specs
pnpm ralph:plan
```

2. Create or update `prd.json` with your tasks, for example:

```json
{
  "project": "Remit-Scout",
  "items": [
    {
      "id": "RS-001",
      "title": "Document new agent handoff contract",
      "status": "todo",
      "priority": 10,
      "parallelizable_tag": "parallel.serial_only@v1",
      "spec_refs": "SPECS/agent-match.md, SPECS/architecture.md",
      "notes": "Use existing AGENTS guidance."
    }
  ]
}
```

3. Optional: review what was synced into `SPECS` for this iteration:

```bash
sed -n '1,140p' SPECS/README.md
```

4. Run one iteration loop:

```bash
pnpm ralph:loop
```

5. Run continuously until no todo tasks remain (recommended for long jobs):

```bash
pnpm ralph:loop:forever
```

6. Force just planning without code edits:

```bash
pnpm ralph:loop:plan
```

7. Run a single iteration only:

```bash
RALPH_MAX_ITERATIONS=1 pnpm ralph:loop
```

## Continuous operator profile for long tasks

Use this profile when tasks are expected to run for multiple hours and you want deterministic recovery.

1. Start continuous mode with explicit timeout and retention:

```bash
RALPH_MAX_ITERATIONS=0 \
RALPH_CODEX_TIMEOUT_SECONDS=5400 \
RALPH_LOOP_SLEEP_SECONDS=2 \
RALPH_LOOP_BACKOFF_INITIAL_SECONDS=4 \
RALPH_LOOP_BACKOFF_MAX_SECONDS=45 \
RALPH_LOG_RETENTION_DAYS=21 \
pnpm ralph:loop
```

2. Collect bounded evidence snapshots during execution:

```bash
# planning state (bounded)
node scripts/ralph/plan.mjs next
tail -n 120 progress.txt

# latest loop artifacts (bounded)
latest_log="$(ls -1t .ralph/loop/iteration-*.log | head -n 1)" && tail -n 120 "$latest_log"
latest_msg="$(ls -1t .ralph/loop/iteration-*.last-message.txt | head -n 1)" && tail -n 40 "$latest_msg"
latest_handoff="$(ls -1t .ralph/loop/iteration-*.handoff.md | head -n 1)" && tail -n 80 "$latest_handoff"
```

3. Validate rollback evidence after interruptions or crashes:

```bash
rg -n "rollback evidence" IMPLEMENTATION_PLAN.md progress.txt
```

Notes:
- `pnpm ralph:loop:forever` is equivalent to `RALPH_MAX_ITERATIONS=0`.
- On unexpected exits, the loop reverts active `in_progress` tasks to `todo` with rollback evidence notes.
- On restart, `run_plan` and stale-task recovery re-apply rollback notes before the next iteration.

## Loop behavior

- `ralph-loop.sh run` refreshes `SPECS/` and regenerates `IMPLEMENTATION_PLAN.md`.
- `ralph-loop.sh` acquires an iteration lock (`RALPH_LOCK_DIR`, default `.ralph/lock/iteration.lock`) before `plan` or `run`; concurrent invocations fail fast with holder PID metadata.
- The loop emits run lifecycle observability events on start/stop and can invoke optional shell hooks for external telemetry.
- Run lifecycle observability events include traceability-tag coverage counters (`traceability_total`, `traceability_missing_bounded`, `traceability_missing_rollback`) for loop visibility.
- If a lock owner PID is no longer live, the loop reclaims the stale lock and records rollback evidence in the loop log.
- Plan refresh reconciles stale `in_progress` rows in `progress.txt` back to `todo` with rollback evidence notes and bounded trace output.
- Plan refresh auto-recovers stale `in_progress` rows in `IMPLEMENTATION_PLAN.md` back to `todo` with rollback evidence notes.
- It enforces one-task-per-iteration selection: resume exactly one existing `in_progress` row when present; otherwise pick the next `todo` row.
- If multiple `in_progress` rows exist, task selection fails fast so operators can reconcile stale state before continuing.
- Unexpected loop exits roll the active task back to `todo` (rollback evidence) to avoid stale-state deadlocks.
- Per-iteration `last-message` files are truncated before Codex execution to prevent stale token reuse.
- Codex stdout/stderr and `last-message` artifacts are persisted through a built-in secret redaction pass by default.
- Each iteration writes a redacted handoff artifact (`iteration-*.handoff.md`) with bounded evidence pointers and rollback evidence notes for human audit.
- Iteration log artifacts are pruned automatically from `RALPH_LOG_DIR` using day-based retention.
- Task run-order policy is deterministic: `priority ASC`, then `run_order ASC`, then `id ASC`.
- `run_order` defaults to the original `prd.json` item index (1-based) when not explicitly provided.
- Deterministic ordering preserves bounded evidence collection windows and rollback/resume reproducibility.
- It runs a single task with Codex using one-shot prompt context.
- Each Codex invocation is bounded by `RALPH_CODEX_TIMEOUT_SECONDS` (default `1800`); timed out tasks are marked `blocked` and the loop continues.
- Between tasks, the loop applies base throttling (`RALPH_LOOP_SLEEP_SECONDS`) plus bounded exponential backoff after blocked tasks (`RALPH_LOOP_BACKOFF_*`), and resets backoff after successful (`DONE`) tasks.
- It expects Codex to emit exactly one completion token in the final message:
  - `<promise>DONE</promise>`
  - `<promise>BLOCKED</promise>`
- Promise validation is strict: exactly one valid `<promise>` token outside fenced code blocks, and it must be the final non-empty line.
- Promise validation failures mark the task `blocked`; with `RALPH_PROMISE_VALIDATION_HARD_FAIL=1` (default) the loop exits non-zero immediately after handoff capture.
- The script updates `progress.txt` status automatically (`done` / `blocked`).
- It continues until no `todo` tasks remain or max iterations is reached.
- If max iterations is reached with no remaining `todo` tasks, the loop exits cleanly as `DONE`; otherwise it exits non-zero.

## Task execution + ownership + traceability tags (v1)

`IMPLEMENTATION_PLAN.md` rows include these versioned columns:

- `parallelizable_tag`
- `ownership_tag`
- `traceability_tag`

`IMPLEMENTATION_PLAN.md` also includes:

- `run_order`

Conventions:

- `parallelizable_tag` format: `<parallel-scope>@v1` (example: `parallel.serial_only@v1`)
- `ownership_tag` format: `<owner-scope>@v1` (example: `owner.foundation.control_plane@v1`)
- `traceability_tag` format: `<trace-scope>@v1` (example: `trace.foundation.source+spec_refs+bounded_evidence+rollback_evidence@v1`)
- If a task omits these tags in `prd.json`, plan generation defaults to:
  - `parallel.serial_only@v1`
  - `owner.unassigned@v1`
  - `trace.spec_refs+bounded_evidence+rollback_evidence@v1`

These tags are injected into Codex task prompts to keep execution intent, ownership, and audit links stable across retries.

## Useful environment overrides

- `RALPH_MAX_ITERATIONS`
  - Set to `0` for continuous run until tasks finish.
- `RALPH_CODEX_TIMEOUT_SECONDS`
  - Per-task Codex timeout in seconds (`1800` default, `0` disables timeout).
- `RALPH_LOOP_SLEEP_SECONDS`
  - Base inter-task throttle in seconds (`0` default).
- `RALPH_LOOP_BACKOFF_ON_BLOCKED`
  - Enable bounded backoff on blocked tasks (`1` default).
- `RALPH_LOOP_BACKOFF_INITIAL_SECONDS`
  - Initial blocked-task backoff delay in seconds (`2` default).
- `RALPH_LOOP_BACKOFF_MAX_SECONDS`
  - Max blocked-task backoff delay in seconds (`30` default).
- `RALPH_LOOP_BACKOFF_MULTIPLIER`
  - Exponential growth multiplier for blocked-task backoff (`2` default).
- `RALPH_LOG_DIR`
- `RALPH_LOG_RETENTION_DAYS` (default `14`; set `0` to disable pruning)
- `RALPH_LOG_REDACTION_ENABLED` (default `1`; set `0` only for local debugging)
- `RALPH_PROMISE_VALIDATION_HARD_FAIL` (default `1`; set `0` to continue after invalid/missing promise tokens)
- `RALPH_RUN_START_HOOK` (optional shell command executed at run start; receives `RALPH_HOOK_*` metadata env vars)
- `RALPH_RUN_STOP_HOOK` (optional shell command executed at run stop; receives `RALPH_HOOK_*` metadata env vars, including exit context)
- `RALPH_HOOK_TRACEABILITY_TOTAL_TASKS`, `RALPH_HOOK_TRACEABILITY_TASKS_WITH_TAG`, `RALPH_HOOK_TRACEABILITY_DISTINCT_TAGS`
- `RALPH_HOOK_TRACEABILITY_MISSING_TAGS`, `RALPH_HOOK_TRACEABILITY_MISSING_BOUNDED_EVIDENCE`, `RALPH_HOOK_TRACEABILITY_MISSING_ROLLBACK_EVIDENCE`
- `RALPH_LOCK_DIR` (default `.ralph/lock/iteration.lock`)
- `RALPH_PLAN_SCRIPT`
- `RALPH_PLAN_FILE`
- `RALPH_PROGRESS_FILE`
- `CODEX_SANDBOX`
- `RALPH_GATE_CMD` (post-task hard gate, e.g. `pnpm lint && pnpm test`)
- `RALPH_AUTO_COMMIT` (`1` to auto-commit each successful iteration)
- `RALPH_COMMIT_PREFIX` (default `ralph`)
- `RALPH_CODEX_SKILLS_DIR` (defaults to `~/.codex/skills`)
- `RALPH_SKILL_FILTER` (comma-separated subset of skill names to sync, e.g. `remit-scout-provider-health-probe,claude-ralph-loop-runner`)

## Strict batch mode (recommended)

Run the loop with a hard quality gate and atomic commits per successful task:

```bash
RALPH_GATE_CMD="pnpm lint && pnpm test" \
RALPH_AUTO_COMMIT=1 \
pnpm ralph:loop:forever
```

Behavior:
- If Codex marks task `DONE`, the gate command must pass before the task is marked done.
- If the gate fails, the task is marked `blocked` and the loop exits non-zero.
- With `RALPH_AUTO_COMMIT=1`, successful iterations are committed as:
  - `ralph: iteration N (<task-id>)`

## Skill bundle filtering

Use `RALPH_SKILL_FILTER` to reduce how much skill context is copied into `SPECS/skills-bundle` for smaller iterations.

Example:

```bash
RALPH_SKILL_FILTER="remit-scout-provider-health-probe,remit-scout-daily-ops-report" pnpm ralph:sync-specs
```

## Optional dashboard / UI options

This project uses two kinds of instruction libraries:

1. **Internal AGENTS/Architecture libraries (copied into `SPECS/`)**
   - `SPECS/agents.md` from `AGENTS.md`
   - `SPECS/remit-scout.agents.md` from `.remit-scout/AGENTS.md`
   - `SPECS/agent-match.md` from `agents/AGENT-MATCH.md`
   - `SPECS/architecture.md` from `ARCHITECTURE.md`
   - `SPECS/agents-bundle/**/*.md` for all repo `AGENTS.md` and `agents/rag/*.md` files

2. **Remit-Specific skill registries**
   - `SPECS/skills.catalog.yaml` from `.remit-scout/skills/catalog.yaml`
   - `SPECS/reason-codes.catalog.yaml` from `.remit-scout/reason-codes/catalog.yaml`

If you want to add more codified instructions for Codex loops, add files to the same copy list in `scripts/ralph/plan.mjs`.

If you want to keep the whole `.codex/skills` tree in sync and stable, you can inspect `SPECS/README.md` after each sync.

## PRD task ranges and spec mapping

The `prd.json` contains 382 AI-SH tasks (AI-SH-0001 through AI-SH-0382), plus AUDIT-RS and FIX-RS tasks:

| ID Range | Category | Source |
|----------|----------|--------|
| AI-SH-0001–0024 | Foundation & Control-plane Contracts | Original PRD |
| AI-SH-0025–0054 | Ralph Loop Bootstrap & Execution | Original PRD |
| AI-SH-0055–0082 | PRD/Plan Artifact Expansion | Original PRD |
| AI-SH-0083–0118 | Collector Failure Detection & Parser Reliability | Original PRD |
| AI-SH-0119–0156 | Agent Self-Healing Workflow | Original PRD |
| AI-SH-0157–0190 | Adaptive Probing & Stress-Response | Original PRD |
| AI-SH-0191–0220 | Infrastructure, Queues, and Deployment Safety | Original PRD |
| AI-SH-0221–0257 | Observability, SLOs, and Evidence Plumbing | Original PRD |
| AI-SH-0258–0291 | Security, Compliance, and Runtime Guardrails | Original PRD |
| AI-SH-0292–0325 | IssueOps Case & Triage System | Original PRD |
| AI-SH-0326–0356 | Delivery, Validation, and Knowledge Loop | Original PRD |
| **AI-SH-0357–0363** | **Factor Normalization Plane** | **Gemini feedback → spec section 6.5** |
| **AI-SH-0364–0366** | **Human Sensor Pipeline** | **Gemini feedback → spec migration 092, section 19** |
| **AI-SH-0367–0373** | **Agent Customization / Repair Profiles** | **Gemini feedback → spec section 2.6, section 7** |
| **AI-SH-0374–0382** | **Fetch.ts Repair Scope Expansion** | **Scope expansion → spec section 7, invariant 15** |

### Gemini feedback tasks detail (AI-SH-0357–0373)

These 17 tasks were added based on Gemini's architectural review of the agent-native platform spec. They address six gaps:

1. **Pluggable Repair Profiles** (AI-SH-0367–0371): RepairStrategy interface with DomScraper, StructuredApi, and DocumentExtractor strategies. HeavyToolGatewayTask ECS definition.
2. **Factor Normalization Plane** (AI-SH-0357–0363): FactorExtractor interface with VolumePriceExtractor, ZScoreExtractor, StepFunctionExtractor, LlmSemanticExtractor. NormalizationRouter, normalization-queue SQS, NormalizationWorkerTask ECS, z-score-baseline-job.
3. **Human Sensor Network** (AI-SH-0364–0366): human_sensor_profile table, Human Audit API, cryptographic proof storage, calibration hook.
4. **Architectural Hardening** (AI-SH-0372–0373): Schema pre-flight validation, contract test edge case curation.

### Fetch.ts repair scope expansion (AI-SH-0374–0382)

These 9 tasks expand the self-healing agent's scope from parse.ts-only to parse.ts + fetch.ts, enabling autonomous repair of fetch-level breaks (endpoint changes, new headers, session flow changes):

1. **FailureBundle expansion** (AI-SH-0374): `fetcher_source` field, `fetch_contract_change`/`session_flow_break` failure types, failure layer classification.
2. **Fetch diagnostic tools** (AI-SH-0375): 4 new Tool Gateway tools — `http_request_replay`, `endpoint_discovery`, `session_flow_tracer`, `header_diff`.
3. **RepairStrategy fetch context** (AI-SH-0376): Each strategy now assembles both fetch-layer and parse-layer diagnostic context.
4. **Failure layer routing** (AI-SH-0377): Orchestrator routes to fetch-first or parse-first LLM context based on classified failure layer.
5. **Fetch safety validation** (AI-SH-0378): Static analysis pass — no credentials, URL allowlist, no TLS changes, no rate-limit removal.
6. **Fetch integration tests** (AI-SH-0379): HTTP fixture replay framework for validating fetch.ts patches.
7. **Knowledge Plane indexing** (AI-SH-0380): Index all 24 provider fetch.ts files alongside parse.ts.
8. **PR labeling/review routing** (AI-SH-0381): `requires-fetch-review` label, excluded from future auto-deploy.
9. **HTTP fixture capture** (AI-SH-0382): Store request+response pairs for all 24 providers (10 recent + 3 edge cases each).

All tasks reference specific sections of `docs/architecture/agent-native-platform-spec.md` and the relevant RAG documents.

## Contract onboarding for loop entries

New loop participants should read `SPECS/contract-onboarding.md` for a complete guide to:
- All project contracts (inventory table with canonical locations and SPECS mirrors)
- Mandatory load order per iteration
- Contract adherence checklist (foundation, IssueOps, evidence, environment)
- How to discover which contracts apply to a given task
- How to add new contracts to the system

## Key spec documents for loop context

When implementing tasks, the following documents form the authoritative spec bundle:

| Document | Scope |
|----------|-------|
| `docs/architecture/agent-native-platform-spec.md` | Master spec — types, migrations, all system sections |
| `SPECS/agents-bundle/agents/rag/agent-orchestration.md` | Repair Agent, self-healing, LLM client, Tool Gateway |
| `SPECS/agents-bundle/agents/rag/signal-modules.md` | Module catalog, observation payloads, human sensor network |
| `SPECS/agents-bundle/agents/rag/triangulation-engine.md` | Factor normalization, composite indices, calibration hook |
| `SPECS/agents-bundle/agents/rag/data-lineage.md` | Bronze/Silver/Gold data flow |
| `SPECS/agents-bundle/agents/rag/queues-workers.md` | SQS queues, ECS tasks |

## Recovery and troubleshooting

- If Codex returns no token, the task is marked `blocked`.
- Check:
  - `LOG_DIR` logs (`.ralph/loop/iteration-*.log`, redacted + retention-pruned)
  - last message file (`.ralph/loop/iteration-*.last-message.txt`, redacted)
  - iteration handoff file (`.ralph/loop/iteration-*.handoff.md`, redacted)
  - lock metadata (`.ralph/lock/iteration.lock/owner` by default)
  - `IMPLEMENTATION_PLAN.md` and `progress.txt`
