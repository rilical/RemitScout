# Plus Domain

## Purpose
Subscription/upgrade UX and Plus value messaging. Owns Plus page UI and upgrade flows.

## Public exports
Only export from `domains/plus/index.ts`.

## Boundaries
- `domain/`: types + invariants only
- `application/`: orchestration and use-cases
- `infrastructure/`: API calls / billing adapters
- `ui/`: presentational components

## Forbidden imports (policy)
- `domain/**` must not import from Vue/Nuxt/runtime UI modules.
- `ui/**` must not call backend directly.

