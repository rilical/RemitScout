# Dashboard Domain

## Purpose
User-facing dashboard experience (signed-in and signed-out). Owns dashboard page composition and dashboard-specific UI logic.

## Public exports
Only export from `frontend/domains/dashboard/index.ts`.

## Boundaries
- `domain/`: types + invariants only (no Vue/Nuxt, no HTTP)
- `application/`: orchestration (may call `infrastructure/`, may expose composables)
- `infrastructure/`: API calls / adapters
- `ui/`: presentational components (no direct API calls)

## How To Add A Feature
1. Add domain state/types in `domain/`.
2. Add orchestration/composables in `application/`.
3. Add API adapters in `infrastructure/`.
4. Add UI in `ui/` and render via thin Nuxt pages.

## Forbidden Imports (Policy)
- `domain/**` must not import from `vue`, `nuxt`, `~/pages`, `~/components`, `~/composables`, `~/server`, `~/lib`.
- `ui/**` must not call backend directly; use `application/**`.

