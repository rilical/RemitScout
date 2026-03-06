---
entrypoints:
  - "frontend/pages/send-money/[from]-to-[to].vue"
  - "frontend/pages/providers.vue"
  - "frontend/pages/pulse/index.vue"
evidence_skills:
  - "evidence.http_latency.github_actions"
common_reason_codes:
  - "http.error_rate_high"
---
# Frontend Pages (AGENTS)

What this directory is:
Nuxt route pages for public UI flows (send money, pulse, providers, indices, etc).

Entrypoints:
- `frontend/pages/send-money/[from]-to-[to].vue`
- `frontend/pages/providers.vue`
- `frontend/pages/pulse/index.vue`

Common failure modes:
- Unbounded client-side computations on large payloads.
- Page-level API calls fanning out without caching.

Evidence skills to run:
- `evidence.http_latency.github_actions`

Do-not-break rules:
- Keep pages resilient to partial API failures (bounded fallbacks, clear empty states).
