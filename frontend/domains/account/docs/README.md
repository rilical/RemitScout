# Account domain

**Purpose**: authentication flows, account management, and billing/subscriptions UX.

## Boundaries

- Owns: sign-in/up flows, password reset, subscription UX (pages/components).
- Does not own: low-level auth/session primitives (platform), shared UI (shared/ui).

## Public exports

- Import from `frontend/domains/account/index.ts`.

## How to add a feature

1. Add domain types/rules in `domain/`.
2. Add application services/composables in `application/`.
3. Add API adapters in `infrastructure/`.
4. Add UI in `ui/` and render via thin `pages/**` shells.

## Forbidden

- `ui/` must not call `fetch/$fetch/axios` directly.
- `domain/` must not import Vue/Nuxt modules.
