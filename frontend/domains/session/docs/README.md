# Session Domain

## Purpose
Authentication/session state and entitlements facade used by other domains.

This is a transitional bounded context. In Phase 2 it can wrap existing composables (`useAuth`, `useEntitlements`) so pages/domains have one import surface.

## Public exports
Only export from `domains/session/index.ts`.

## Boundaries
- `domain/`: types only
- `application/`: orchestration, composables (may wrap legacy composables)
- `infrastructure/`: auth provider adapters (Supabase, etc)
- `ui/`: presentation only

