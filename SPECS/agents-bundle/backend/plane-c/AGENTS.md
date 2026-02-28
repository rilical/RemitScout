---
entrypoints:
  - "backend/plane-c/src/services/AGENTS.md"
  - "backend/scripts/evidence/indices-readiness-evidence.ts"
evidence_skills:
  - "evidence.indices_readiness.github_actions"
common_reason_codes:
  - "indices.missing_corridors"
  - "indices.fx_stale"
---
# Plane C (Gold publish) (AGENTS)

What this directory is:
Gold publish services and gates (indices readiness, live publisher, export snapshots).

Entrypoints:
- `backend/plane-c/src/services/AGENTS.md`
- `backend/scripts/evidence/indices-readiness-evidence.ts`

Common failure modes:
- FX staleness and suppression gates making indices unavailable.
- Gold lag that doesn't surface in Plane A until user traffic hits it.

Evidence skills to run:
- `evidence.indices_readiness.github_actions`

Do-not-break rules:
- Missing data should be treated as a failure in prod/staging gates.

