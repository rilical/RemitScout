# PII Classification Completion Plan

## Current State
- Email fields are classified.
- Remaining schema-level annotations across backend entities are incomplete.

## Completion Scope
- Plane A user/account/session entities
- Billing/subscription entities
- Alert/watchlist/contact entities
- Export payload schemas

## Classification Labels
- `public`
- `internal`
- `sensitive`
- `regulated_pii`

## Required Outputs
1. Entity-by-entity annotation map committed in backend schema layer.
2. Erasure-path verification for PostgreSQL, Redis, logs, and export artifacts.
3. Compliance signoff update linked from `docs/compliance-signoff-2026-02-11.md`.

