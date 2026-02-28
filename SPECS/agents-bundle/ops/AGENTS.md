---
entrypoints:
  - "ops/brain/AGENTS.md"
  - "ops/frontdesk/AGENTS.md"
  - "ops/brain/README.md"
  - "ops/frontdesk/README.md"
evidence_skills:
  - "evidence.provider_health.github_actions"
  - "evidence.exports_health.github_actions"
common_reason_codes:
  - "evidence.error"
---
# Ops (AGENTS)

What this directory is:
IssueOps control-plane runtime directories (Brain inbox/outbox/state) and operator docs.

Entrypoints:
- `ops/brain/README.md`
- `ops/frontdesk/README.md`

Common failure modes:
- Dedupe state lost after restart (re-post spam).
- Front desk writes events but Brain does not ingest them (permissions/config).

Evidence skills to run:
- Use Slack front desk buttons to request evidence; Brain mediates dispatch/ingestion.

Do-not-break rules:
- Do not commit runtime state; keep `ops/brain/inbox/`, `ops/brain/outbox/`, `ops/brain/state/`, and `ops/frontdesk/state/` gitignored.
