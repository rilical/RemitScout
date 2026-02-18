---
entrypoints:
  - "backend/plane-a/AGENTS.md"
  - "backend/plane-b/AGENTS.md"
  - "backend/plane-c/AGENTS.md"
  - "backend/shared/AGENTS.md"
  - "backend/scripts/AGENTS.md"
  - "backend/db/AGENTS.md"
evidence_skills:
  - "evidence.provider_health.github_actions"
  - "evidence.queue_backlog.github_actions"
  - "evidence.db_health.github_actions"
common_reason_codes:
  - "evidence.error"
---
# Backend (AGENTS)

What this directory is:
All backend code across planes A/B/C plus scripts and DB migrations.

Entrypoints:
- `backend/plane-a/AGENTS.md`
- `backend/plane-b/AGENTS.md`
- `backend/plane-c/AGENTS.md`
- `backend/scripts/AGENTS.md`
- `backend/shared/AGENTS.md`
- `backend/db/AGENTS.md`

Common failure modes:
- Plane boundary violations (shared secrets/data crossing planes).
- Unbounded queries or responses causing timeouts and noisy evidence.

Evidence skills to run:
- `evidence.*.github_actions` (see `.remit-scout/skills/catalog.yaml`)

Do-not-break rules:
- Preserve the 3-plane boundary invariants from `ARCHITECTURE.md`.

