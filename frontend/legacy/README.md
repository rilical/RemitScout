# Legacy UI Quarantine

This folder holds UI components that were replaced during Phase 2 frontend refactor.

## Why this exists
We want shippable slices without deleting code that may still be referenced in edge routes.
Anything moved here should have a clear replacement and a follow-up deletion plan.

## What was moved
- `components/pulse/PulseChartCard.vue`
  - Replaced by `domains/pulse/ui/ChartPreviewCard.vue`.
  - The Pulse chart grid now uses the domain-owned preview card.

## Deletion plan
1. Verify no routes import the legacy components (search for the filename).
2. Remove the legacy component(s) in a dedicated PR after at least one deploy.
