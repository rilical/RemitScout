---
entrypoints:
  - "backend/scripts/frontdesk/slack-frontdesk.ts"
  - "ops/frontdesk/README.md"
  - "ops/frontdesk/launchd"
evidence_skills:
  - "evidence.provider_health.github_actions"
  - "evidence.exports_health.github_actions"
common_reason_codes:
  - "evidence.error"
---
# Slack Front Desk (AGENTS)

What this directory is:
Slack Socket Mode UI for Case cards and button-driven operator actions.

Entrypoints:
- `backend/scripts/frontdesk/slack-frontdesk.ts`
- `ops/frontdesk/README.md`
- `ops/frontdesk/launchd/`

Common failure modes:
- Socket mode tokens/scopes missing (actions not delivered).
- Buttons write inbox events but Brain lacks permission to read/process.

Evidence skills to run:
- Buttons request `dispatch_evidence` which Brain mediates into GitHub Actions dispatch.

Do-not-break rules:
- Slack should never execute directly; it only writes inbox events.

