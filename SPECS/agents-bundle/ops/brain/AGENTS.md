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

