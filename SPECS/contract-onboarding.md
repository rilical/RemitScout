# Project Contract Onboarding for Loop Entries

## Purpose

This document is the onboarding guide for any Ralph loop iteration (human or automated)
that needs to discover, load, and adhere to the Remit-Scout project contract system.

Read this before your first iteration. Subsequent iterations should reference this
document when encountering unfamiliar contracts.

## Contract inventory

| Contract | Canonical location | SPECS mirror | Governs |
|---|---|---|---|
| System invariants | `ARCHITECTURE.md` | `SPECS/architecture.md` | Plane boundaries, index semantics, data-tier rules, agent invariants, security constraints |
| Agent registry + run requirements | `AGENTS.md` | `SPECS/agents.md` | Load order, agent match protocol, environment handling, operational prompt template |
| Agent routing | `agents/AGENT-MATCH.md` | `SPECS/agent-match.md` | Domain-to-agent routing rules, RAG file selection |
| IssueOps contracts | `.remit-scout/AGENTS.md` | `SPECS/remit-scout.agents.md` | PRD/Plan/Run contract rules, acceptance_proof shards, lifecycle transitions, do-not-break rules |
| PRD schema | `.remit-scout/schema/prd.schema.json` | `SPECS/schema.prd.json` | Case PRD structure: severity, domain, risk, owner_assignment, acceptance_proof, traceability |
| Plan schema | `.remit-scout/schema/plan.schema.json` | `SPECS/schema.plan.json` | Execution plan structure: steps, skills, plan_snapshots, traceability |
| Run schema | `.remit-scout/schema/run.schema.json` | `SPECS/schema.run.json` | Run artifact structure: decision_record, human_in_loop, evidence, feedback_source, user_goal |
| Skill catalog | `.remit-scout/skills/catalog.yaml` | `SPECS/skills.catalog.yaml` | Registered skills for Brain dispatch |
| Reason codes catalog | `.remit-scout/reason-codes/catalog.yaml` | `SPECS/reason-codes.catalog.yaml` | Evidence reason codes for findings and escalations |
| Provider catalog | `.remit-scout/providers/catalog.json` | `SPECS/providers.catalog.json` | Canonical provider list, slugs, metadata |
| Module catalog | `.remit-scout/modules/catalog.json` | — | Signal module definitions: normalization_strategy, repair_strategy_override |
| Deploy promotion checklist | `docs/runbooks/agent-deploy-promotion-checklist.md` | `SPECS/agent-deploy-promotion-checklist.md` | Staging/prod promotion stages, hard blocks, evidence bundles |
| Agent-native platform spec | `docs/architecture/agent-native-platform-spec.md` | — | Master spec for types, migrations, agent system design |
| Source-of-truth matrix | `SPECS/source-of-truth-matrix.json` | (canonical) | Canonical files, CI validators, ownership mapping |
| Ralph loop runbook | `docs/runbooks/ralph-codex-loop.md` | `SPECS/ralph-codex-loop.md` | Loop behavior, environment overrides, recovery |
| Ralph verifier contract | `docs/runbooks/ralph-verifier.md` | `SPECS/ralph-verifier.md` | Verification protocol for completed tasks |

## Mandatory load order (every iteration)

Before touching code, each loop entry must load these files in order:

1. `ARCHITECTURE.md` — system invariants and navigation
2. `agents/AGENT-MATCH.md` — route the task domain to correct agent(s)
3. `docs/runbooks/agent-deploy-promotion-checklist.md` — mandatory for deploy/promotion tasks
4. `.remit-scout/AGENTS.md` — IssueOps contract rules and do-not-break constraints
5. Agent-specific RAG file from `agents/rag/` as selected by AGENT-MATCH
6. Task `spec_refs` from the backlog item

## Contract adherence checklist

Every loop entry must verify these constraints before marking a task done:

### Foundation contracts
- [ ] Changes respect plane boundaries (A never reads Bronze, etc.)
- [ ] Changes respect index semantic rules (TEER/RVI/RCI separation)
- [ ] Triangulation invariants preserved (confidence, contributing_signals)
- [ ] Agent scope constraints respected (parse.ts/fetch.ts only for self-healing)
- [ ] Tool Gateway enforcement rules not bypassed

### IssueOps contracts
- [ ] PRD/Plan `acceptance_proof` shards populated (source_note, acceptance_note, bounded_evidence_note, rollback_evidence_note)
- [ ] PRD `risk_level` aligned with `risk_tier`
- [ ] PRD `owner_assignment` populated with status + versioned ownership tag
- [ ] PRD/Plan `traceability.spec_refs` are repo-relative, existing links
- [ ] PRD/Plan `traceability.parallelizable_tag` versioned (default: `parallel.serial_only@v1`)
- [ ] PRD/Plan `traceability.task_lifecycle_version` pinned to `v1` with documented transitions only
- [ ] Run `decision_record.human_in_loop` populated with v1 escalation envelope

### Evidence contracts
- [ ] Bounded evidence: max 5 key bullets, max 3 command outputs, max 5 changed files
- [ ] Rollback evidence: explicit revert command, impacted files list, risk statement
- [ ] Evidence blobs stored as pointers (Actions artifacts/S3), not in git
- [ ] Reason codes used from `.remit-scout/reason-codes/catalog.yaml`

### Environment contracts
- [ ] Dev: speed > rigor, short TTLs, lower capacity
- [ ] Staging: mirrors production networking/security
- [ ] Prod: high SLOs, zero-risk changes, full auditability
- [ ] No secrets in logs, notes, or committed files

## How to discover which contracts apply to a task

1. Read the task's `spec_refs` field — these are the primary contracts.
2. Use `agents/AGENT-MATCH.md` to determine which agent domain(s) the task falls under.
3. Load the agent RAG file(s) from `agents/rag/` — these contain domain-specific constraints.
4. Check `SPECS/source-of-truth-matrix.json` for canonical file ownership if modifying shared surfaces.
5. If the task touches CI/deploy, also load `docs/runbooks/agent-deploy-promotion-checklist.md`.

## Adding a new contract

When creating a new contract file:

1. Place the canonical version in the appropriate directory (`.remit-scout/`, `agents/rag/`, `docs/`).
2. Add a copy rule in `scripts/ralph/plan.mjs` so it syncs to `SPECS/` on plan build.
3. Update `SPECS/source-of-truth-matrix.json` with canonical file, CI validator, and owner.
4. Add the contract to the inventory table above.
5. Ensure CI validates the contract (add to `.github/workflows/ci.yml` if needed).
