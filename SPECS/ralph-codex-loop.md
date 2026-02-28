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
- `.remit-scout/schema/*.json`
- `docs/runbooks/agent-deploy-promotion-checklist.md`
- `docs/runbooks/ralph-verifier.md`
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

## Loop behavior

- `ralph-loop.sh run` refreshes `SPECS/` and regenerates `IMPLEMENTATION_PLAN.md`.
- It reads the next `todo` row from `IMPLEMENTATION_PLAN.md`.
- It runs a single task with Codex using one-shot prompt context.
- It expects Codex to emit exactly one completion token in the final message:
  - `<promise>DONE</promise>`
  - `<promise>BLOCKED</promise>`
- The script updates `progress.txt` status automatically (`done` / `blocked`).
- It continues until no `todo` tasks remain or max iterations is reached.

## Task ownership + traceability tags (v1)

`IMPLEMENTATION_PLAN.md` rows now include two versioned columns:

- `ownership_tag`
- `traceability_tag`

Conventions:

- `ownership_tag` format: `<owner-scope>@v1` (example: `owner.foundation.control_plane@v1`)
- `traceability_tag` format: `<trace-scope>@v1` (example: `trace.foundation.source+spec_refs+bounded_evidence+rollback_evidence@v1`)
- If a task omits either tag in `prd.json`, plan generation defaults to:
  - `owner.unassigned@v1`
  - `trace.spec_refs+bounded_evidence+rollback_evidence@v1`

These tags are injected into Codex task prompts to keep ownership and audit links stable across retries.

## Useful environment overrides

- `RALPH_MAX_ITERATIONS`
  - Set to `0` for continuous run until tasks finish.
- `RALPH_LOOP_SLEEP_SECONDS`
- `RALPH_LOG_DIR`
- `RALPH_PLAN_SCRIPT`
- `RALPH_PLAN_FILE`
- `RALPH_PROGRESS_FILE`
- `CODEX_SANDBOX`
- `RALPH_CODEX_SKILLS_DIR` (defaults to `~/.codex/skills`)
- `RALPH_SKILL_FILTER` (comma-separated subset of skill names to sync, e.g. `remit-scout-provider-health-probe,claude-ralph-loop-runner`)

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

## Recovery and troubleshooting

- If Codex returns no token, the task is marked `blocked`.
- Check:
  - `LOG_DIR` logs (`.ralph/loop/iteration-*.log`)
  - last message file (`.ralph/loop/iteration-*.last-message.txt`)
  - `IMPLEMENTATION_PLAN.md` and `progress.txt`
