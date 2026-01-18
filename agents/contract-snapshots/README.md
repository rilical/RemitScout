# Contract Snapshots

Purpose: store minimal response snapshots for top public endpoints to detect frontend/API drift.

Add a new snapshot whenever a contract changes:
- `quotes.sample.json`
- `providers.sample.json`
- `rates.sample.json`
- `pulse.sample.json`

Notes:
- Pulse endpoints require entitlements; unauthenticated snapshots may be `{"error":"unauthorized"}` in dev.
