# Dashboard Domain

## Purpose
User-facing dashboard experience (signed-in and signed-out). Owns the Dashboard page composition and any dashboard-specific UI logic.

## Public exports
Only export from `domains/dashboard/index.ts`.

## Boundaries
- `domain/`: types + invariants only (no Vue/Nuxt, no HTTP)
- `application/`: orchestration (may call `infrastructure/`, may expose composables)
- `infrastructure/`: API calls / adapters (may call `~/composables/useApi` and `~/server/**` via platform wrappers later)
- `ui/`: presentational components (no direct API calls)

## Forbidden imports (policy)
- `domain/**` must not import from `vue`, `nuxt`, `~/pages`, `~/components`, `~/composables`, `~/server`, `~/lib`.
- `ui/**` must not call backend directly; use `application/**`.

