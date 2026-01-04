# Shared Directory

## Purpose
The `shared/` directory contains code used by **multiple planes** (Plane A, Plane B, Plane C).

Documentation index: `../README.md`

## Criteria for Inclusion
A file belongs in `shared/` if:
1. ✅ Used by 2+ planes (A, B, or C)
2. ✅ Pure utility functions with no plane-specific logic
3. ✅ Stateless or minimal state (config, constants)
4. ✅ No dependencies on plane-specific repositories or services

## What Does NOT Belong Here
- ❌ Plane-specific business logic (→ `plane-{a,b,c}/src/`)
- ❌ Provider-specific configurations (→ `plane-b/src/providers/{provider}/`)
- ❌ Services that use plane-specific repositories (→ `plane-{a,b,c}/src/services/`)
- ❌ Routes or API handlers (→ `plane-{a,b,c}/src/routes/`)

## Current Contents
- `config.ts` - Environment configuration (used by all planes)
- `db.ts` - Database connection utilities (used by all planes)
- `logger.ts` - Structured logging (used by all planes)
- `redis.ts` - Redis client (used by all planes)
- `cache.ts` - TTL cache abstraction (used by Plane A)
- `amount-bucket.ts` - Bucket selection logic (used by Plane A, B)
- `corridor.ts` - Corridor ID parsing (used by Plane A, B)
- `countries-currencies.ts` - Country/currency constants (used by all planes)
- `sharding.ts` - Sharding utilities (used by Plane B)
- `health-corridors.ts` - Health check corridors (used by scripts, Plane A ops)


