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
- Human escalation handoffs must follow Run `decision_record.human_in_loop` (`contract_version=v1`, `escalation_channel=slack_frontdesk`, `route_skill_id=manual.human_triage`, explicit `escalation_sla_minutes`, and versioned `escalation_owner_tag`).
- Repeated triage-loop escalations must preserve `triage.timebox_exceeded` reason context for deterministic operator routing.
- Closure-condition escalations must preserve `triage.close_case_rationale_missing` reason context so operators can audit bounded evidence and rollback pointers before closing.
- Timeline reconstruction escalations must preserve `triage.timeline_reconstruction_failed` reason context so operators can audit bounded event refs and rollback pointers before closure.
