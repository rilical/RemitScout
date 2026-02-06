# Dashboard domain

**Purpose**: authenticated user home (saved corridors, watchlist, alerts, history).

## Boundaries

- Owns: dashboard query models, watchlist/alerts UX.
- Does not own: shared UI primitives (shared/ui), auth/session primitives (platform).

## Public exports

- Import from `frontend/domains/dashboard/index.ts`.

## How to add a feature

1. Add domain state/types in `domain/`.
2. Add orchestration/composables in `application/`.
3. Add API adapters in `infrastructure/`.
4. Add UI in `ui/` and render via thin Nuxt pages.

## Forbidden

- No direct HTTP calls from `ui/`.
- No Vue/Nuxt imports from `domain/`.
