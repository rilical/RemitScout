Plane A has no Bronze access.

## Bronze
Purpose: Immutable raw ingestion ledger for audit and replay.
Retention: Indefinite.
Access roles: plane_b read/write; plane_a none; plane_c none.

## Silver
Purpose: Operational truth for quotes and product state.
Retention: Bounded operational window.
Access roles: plane_a read; plane_b read/write; plane_c read.

## Gold
Purpose: Derived datasets for analytics and publishing.
Retention: Indefinite with append-only restatements.
Access roles: plane_a read; plane_b read/write; plane_c read.

## Supabase
Purpose: Auth and minimal user identity data.
Retention: Until user deletion.
Access roles: plane_a via Supabase; plane_b none; plane_c none.

## Redis
Purpose: Cache and rate limiting.
Retention: TTL-based.
Access roles: plane_a (future); plane_b none; plane_c none.
