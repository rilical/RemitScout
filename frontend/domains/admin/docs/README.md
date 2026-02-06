# Admin domain

**Purpose**: internal consoles (telemetry, audit, internal admin surfaces).

## Boundaries

- Owns: internal admin query models + dense console UI.
- Does not own: shared UI primitives (shared/ui), generic platform logging/telemetry primitives (platform).

## Public exports

- Import from `frontend/domains/admin/index.ts`.

## How to add a feature

1. Add domain types/rules in `domain/`.
2. Add orchestration/composables in `application/`.
3. Add API adapters in `infrastructure/`.
4. Add UI in `ui/` and render via thin Nuxt pages.

## Forbidden

- No direct HTTP calls from `ui/`.
- No Vue/Nuxt imports from `domain/`.
