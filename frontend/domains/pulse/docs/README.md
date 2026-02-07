# Pulse Domain

## Purpose
Pulse analytics surfaces: charts, tables, filters, and gating (Plus entitlements).

## Public exports
Only export from `domains/pulse/index.ts`.

## Boundaries
- `domain/`: types + invariants only
- `application/`: orchestration (filter state, view mode, fetching)
- `infrastructure/`: Pulse API calls/adapters
- `ui/`: presentational components and page composition (no direct API calls)

## Forbidden imports (policy)
- `domain/**` must not import from Vue/Nuxt/runtime.
- `ui/**` must not import `~/lib/pulseApi` directly; that belongs in `infrastructure/**`.

