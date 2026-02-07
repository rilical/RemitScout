# Providers domain

**Purpose**: provider directory, reviews, and affiliate outbound flows.

## Boundaries

- Owns: provider list/profile/review presentation + outbound tracking UX.
- Does not own: shared UI primitives (ui), generic formatting (shared/lib).

## Public exports

- Import from `frontend/domains/providers/index.ts`.

## How to add a feature

1. Add provider types/rules in `domain/`.
2. Add use-cases/composables in `application/`.
3. Add API adapters in `infrastructure/`.
4. Add Vue UI in `ui/` rendered by thin Nuxt pages.

## Forbidden

- No direct HTTP calls from `ui/`.
- No Vue/Nuxt imports from `domain/`.
