# Providers Architecture

## One-screen quick map
Canonical provider inventory:
- `/Users/omarghabyen/Desktop/Remit-Scout Production V2/.remit-scout/providers/catalog.json`

Provider registry (collector entrypoints):
- `/Users/omarghabyen/Desktop/Remit-Scout Production V2/backend/plane-b/src/providers/index.ts`

Provider code:
- `/Users/omarghabyen/Desktop/Remit-Scout Production V2/backend/plane-b/src/providers/<provider_id>/`

Provider scaffolder:
- `/Users/omarghabyen/Desktop/Remit-Scout Production V2/backend/scripts/provider-scaffold.ts`

## Provider onboarding (target state)
Goal: “one command + one PR”.
- Scaffolder creates provider folder skeleton.
- Scaffolder updates:
  - provider catalog
  - provider-catalog TS types
  - config defaults (limits)
  - provider registry (index.ts)
  - onboarding doc registry list (keeps CI green)

## Operational evidence
Evidence skills (GitHub Actions):
- `evidence.provider_health.github_actions`
- `probe.provider.github_actions` (legacy, still supported)

Forensics (local):
- `forensics.corridor_provider.local`

