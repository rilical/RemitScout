# Content domain

**Purpose**: marketing, SEO/content, legal, and support pages.

## Boundaries

- Owns: content composition + presentation that should remain business-logic-light.
- Does not own: transfer quoting logic, dashboard logic, provider ranking (those belong to other domains).

## Public exports

- Import from `frontend/domains/content/index.ts`.

## How to add a feature

1. Keep logic minimal; prefer shared UI primitives.
2. If business logic appears, move it to the appropriate domain instead of growing this one.

## Forbidden

- No cross-domain business logic aggregation.
