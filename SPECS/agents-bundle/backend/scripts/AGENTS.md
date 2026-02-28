---
entrypoints:
  - "backend/scripts/brain/brain.ts"
  - "backend/scripts/frontdesk/slack-frontdesk.ts"
  - "backend/scripts/evidence/exports-health-evidence.ts"
  - "backend/scripts/evidence/freshness-slo-evidence.ts"
  - "backend/scripts/evidence/db-health-evidence.ts"
evidence_skills:
  - "evidence.exports_health.github_actions"
  - "evidence.freshness_slo.github_actions"
  - "evidence.db_health.github_actions"
common_reason_codes:
  - "evidence.error"
---
# Backend Scripts (AGENTS)

What this directory is:
Operational scripts (Brain control plane, Slack front desk, evidence packs, probes, workers).

Entrypoints:
- `backend/scripts/brain/brain.ts`
- `backend/scripts/frontdesk/slack-frontdesk.ts`
- `backend/scripts/evidence/`
- `backend/scripts/ci/`

Common failure modes:
- Evidence scripts outputting unbounded JSON/logs.
- Workflows dispatching but evidence not being ingested (dispatch_id mismatch).

Evidence skills to run:
- `evidence.*.github_actions` (EvidenceResult JSON)

Do-not-break rules:
- Every evidence script must output exactly one bounded EvidenceResult JSON object.
