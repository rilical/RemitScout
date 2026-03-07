---
entrypoints:
  - "frontend/pages/send-money/[from]-to-[to].vue"
  - "frontend/pages/pulse/index.vue"
  - "frontend/server/api/health.get.ts"
evidence_skills:
  - "evidence.http_latency.github_actions"
common_reason_codes:
  - "http.p95_high"
---
# Frontend (AGENTS)

What this directory is:
Nuxt frontend for the public product and admin surfaces.

Entrypoints:
- `frontend/pages/send-money/[from]-to-[to].vue`
- `frontend/pages/pulse/index.vue`
- `frontend/server/api/health.get.ts`

Common failure modes:
- Frontend expects fields that Plane A no longer returns (contract drift).
- Slow endpoints causing user-facing latency spikes.

Evidence skills to run:
- `evidence.http_latency.github_actions`

Do-not-break rules:
- Keep API contracts snapshot-able and stable (avoid silent shape changes).
