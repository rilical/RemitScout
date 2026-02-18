---
entrypoints:
  - "frontend/server/api/health.get.ts"
  - "frontend/server/api/providers.get.ts"
  - "frontend/server/api/pulse/[...path].ts"
evidence_skills:
  - "evidence.http_latency.github_actions"
common_reason_codes:
  - "http.timeout_rate_high"
---
# Frontend Server API (AGENTS)

What this directory is:
Nuxt server endpoints (proxies/edge APIs) that sit between frontend pages and Plane A.

Entrypoints:
- `frontend/server/api/health.get.ts`
- `frontend/server/api/providers.get.ts`
- `frontend/server/api/pulse/[...path].ts`

Common failure modes:
- Proxy endpoints not setting timeouts or retry policies.
- Accidental caching of error responses.

Evidence skills to run:
- `evidence.http_latency.github_actions`

Do-not-break rules:
- Always cap response payloads and set explicit timeouts.

