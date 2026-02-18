---
entrypoints:
  - "backend/plane-b/src/providers/index.ts"
  - ".remit-scout/providers/catalog.json"
  - "backend/shared/provider-catalog.ts"
  - "backend/scripts/provider-scaffold.ts"
evidence_skills:
  - "evidence.provider_health.github_actions"
  - "probe.provider.github_actions"
common_reason_codes:
  - "provider.no_recent_success"
  - "provider.blocked.http_403"
---
# Providers (Plane B) (AGENTS)

What this directory is:
Provider implementations and the provider registry used by collectors and probes.

Entrypoints:
- `backend/plane-b/src/providers/index.ts`
- `.remit-scout/providers/catalog.json`
- `backend/shared/provider-catalog.ts`
- `backend/scripts/provider-scaffold.ts`

Common failure modes:
- New provider added but registry/catalog not updated.
- Limits misconfigured causing 429/403 storms.

Evidence skills to run:
- `evidence.provider_health.github_actions`
- `probe.provider.github_actions`

Do-not-break rules:
- Provider inventory must have a single source of truth (prefer `.remit-scout/providers/catalog.json`).

