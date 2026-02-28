---
entrypoints:
  - "backend/plane-a/src/services/volatility-service.ts"
  - "backend/plane-a/src/services/alert-evaluator.ts"
  - "backend/plane-a/src/services/provider-metadata.ts"
evidence_skills:
  - "evidence.freshness_slo.github_actions"
common_reason_codes:
  - "freshness.p95_high"
  - "freshness.missing_quotes"
---
# Plane A Services (AGENTS)

What this directory is:
Plane A domain services used by route handlers (business logic, adapters, caching).

Entrypoints:
- `backend/plane-a/src/services/volatility-service.ts`
- `backend/plane-a/src/services/alert-evaluator.ts`
- `backend/plane-a/src/services/provider-metadata.ts`

Common failure modes:
- Cache TTL mismatches causing stale reads.
- Service calls that fan out to DB without paging/caps.
- Entitlements/authorization bypassed by accidental direct access.

Evidence skills to run:
- `evidence.freshness_slo.github_actions`

Do-not-break rules:
- Keep DB queries bounded and indexed.
- Enforce entitlements in route layer; services should not silently downgrade access.

