# Transfers domain

**Purpose**: quote + comparison flows for sending money (corridors, amounts, rankings).

## Boundaries

- Owns: corridor inputs, quote ranking, provider selection UI flows.
- Does not own: auth/session (platform), generic UI primitives (shared), formatting helpers (shared/lib).

## Public exports

- Import from `frontend/domains/transfers/index.ts`.
- Avoid deep imports into subfolders from outside this domain.

## How to add a feature

1. Add/extend business types and rules in `domain/`.
2. Add orchestration/composables in `application/`.
3. Add API adapters in `infrastructure/` (via `platform/http`).
4. Add Vue components/pages in `ui/`, rendered by thin Nuxt route shells in `pages/**`.

## Forbidden

- `ui/` must not call `fetch/$fetch/axios` directly.
- `domain/` must not import Vue/Nuxt modules.
