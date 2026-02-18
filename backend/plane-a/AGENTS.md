---
entrypoints:
  - "backend/plane-a/src/routes/AGENTS.md"
  - "backend/plane-a/src/services/AGENTS.md"
  - "backend/plane-a/src/repositories/AGENTS.md"
  - "backend/plane-a/src/routes/quotes.ts"
  - "backend/plane-a/src/routes/pulse.ts"
evidence_skills:
  - "evidence.http_latency.github_actions"
  - "evidence.freshness_slo.github_actions"
common_reason_codes:
  - "http.p95_high"
  - "freshness.p95_high"
---
# Plane A (API + UI-facing surfaces) (AGENTS)

What this directory is:
Plane A is the product-facing API surface (Fastify routes) and its domain services/repositories.

Entrypoints:
- `backend/plane-a/src/routes/AGENTS.md`
- `backend/plane-a/src/services/AGENTS.md`
- `backend/plane-a/src/repositories/AGENTS.md`

Common failure modes:
- Contract drift between frontend expectations and Plane A responses.
- Freshness SLO violations caused by tier logic/caching.

Evidence skills to run:
- `evidence.http_latency.github_actions`
- `evidence.freshness_slo.github_actions`

Do-not-break rules:
- Keep responses bounded; no unpaged list endpoints.
- Preserve entitlements checks for premium/admin surfaces.

