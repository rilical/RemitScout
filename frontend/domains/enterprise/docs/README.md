# Enterprise domain

**Purpose**: enterprise plan marketing + gated enterprise features like exports.

## Boundaries

- Owns: enterprise UX flows, exports/institutions presentation.
- Does not own: shared UI primitives (ui), auth primitives (platform), HTTP client (platform/http).

## Public exports

- Import from `frontend/domains/enterprise/index.ts`.

## How to add a feature

1. Add domain contracts in `domain/`.
2. Add use-cases/composables in `application/`.
3. Add API adapters in `infrastructure/`.
4. Add UI in `ui/` and render via thin Nuxt pages.

## Forbidden

- No direct HTTP calls from `ui/`.
- No Vue/Nuxt imports from `domain/`.
