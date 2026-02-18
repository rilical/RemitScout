---
entrypoints:
  - "backend/plane-c/src/services/gold-publisher.ts"
  - "backend/plane-c/src/services/gold-publisher-live.ts"
  - "backend/plane-c/src/services/publisher-gates.ts"
evidence_skills:
  - "evidence.indices_readiness.github_actions"
common_reason_codes:
  - "indices.missing_corridors"
  - "indices.fx_stale"
---
# Plane C Services (AGENTS)

What this directory is:
Gold publish pipeline and gates (indices, exports, live publisher).

Entrypoints:
- `backend/plane-c/src/services/gold-publisher.ts`
- `backend/plane-c/src/services/gold-publisher-live.ts`
- `backend/plane-c/src/services/publisher-gates.ts`

Common failure modes:
- Gold publish lag or suppression misconfiguration.
- FX staleness cascading into indices readiness failures.

Evidence skills to run:
- `evidence.indices_readiness.github_actions`

Do-not-break rules:
- Publisher gates must remain conservative (missing == fail in prod).
- Keep export snapshot logic consistent with Plane A ops endpoints.

