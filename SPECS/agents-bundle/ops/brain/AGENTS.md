---
entrypoints:
  - "backend/scripts/brain/brain.ts"
  - "ops/brain/README.md"
  - ".remit-scout/cases"
evidence_skills:
  - "evidence.provider_health.github_actions"
  - "evidence.queue_backlog.github_actions"
common_reason_codes:
  - "evidence.error"
---
# Brain (Ops Control Plane) (AGENTS)

What this directory is:
Brain inbox/outbox/state for IssueOps control plane (Mac mini 24/7 loop).

Entrypoints:
- `backend/scripts/brain/brain.ts`
- `ops/brain/README.md`
- `.remit-scout/cases/`

Common failure modes:
- Workflows dispatched but not ingested (dispatch_id mismatch / artifact name drift).
- Slack mapping missing so thread updates fail.

Evidence skills to run:
- Brain dispatches skills from `.remit-scout/skills/catalog.yaml` and ingests EvidenceResult artifacts.

Do-not-break rules:
- Prod must remain evidence-only by default (no direct mutation).
- Run records must populate `decision_record.human_in_loop` using the v1 escalation contract (including `escalation_sla_minutes` + `escalation_owner_tag`) for deterministic human triage routing.
- Repeated `iterate` loops must respect the triage timebox policy and escalate with `triage.timebox_exceeded` when loop/time limits are breached.
- Close-case decisions must include informational reason-coded rationale from bounded findings; otherwise escalate with `triage.close_case_rationale_missing` and preserve rollback-evidence refs.
- Incident timeline reconstruction from bounded inbox/outbox/run events must escalate with `triage.timeline_reconstruction_failed` when anchors are missing/invalid, preserving bounded log refs and rollback pointers.
