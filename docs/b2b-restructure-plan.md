# B2B Backend Restructure Plan (Sweep Redesign)

## Goals
- Guarantee Tier-2 completion within target cadence (default 6h, fallback 24h for Tier-3).
- Enforce invariants: $500 exact bucket, bank-transfer first with cash fallback, rights matrix + capability gating.
- Produce stable Bronze -> Silver -> Gold output for TEER/RCI/RVI + Pulse.
- Keep sweeps observable, idempotent, and versioned.

## Non-negotiable invariants (from ARCHITECTURE.md)
- Rights matrix is authoritative; empty country lists match nothing.
- Amount bucket must be exact ($500), no reuse of unrelated buckets.
- Method filters must match provider capabilities.
- Tier assignments are versioned (no live rewrites).
- Bronze write before Silver normalization.

## Current pain points
- Fanout messages are provider-shard based, which increases duplicates and makes drain time unpredictable.
- RPM planning is static and not tied to corridor count vs target time.
- Sweep completion is not tracked at a corridor/provider level for ETA or coverage certainty.

## Target architecture (corridor-first)
1) Build corridor manifest for each provider:
   - Start with provider supported corridors.
   - Filter by rights matrix (allowed_collect, allowed_b2b, stoplist).
   - Filter by provider capability (payin/payout).
2) Build sweep plan:
   - Observation mode: all corridors treated as tier-2.
   - Tiered mode: use tier snapshot version for tier1/2/3 selection.
3) Enqueue one message per corridor:
   - Message includes all eligible providers for that corridor.
   - Each provider task includes collector type, methods, amount bucket, and rpm overrides.
4) Fanout worker executes provider tasks:
   - Run bank transfer first; on capability failure, fallback to cash when allowed.
   - Only requeue failed providers for the corridor; do not duplicate successes.
5) Write Bronze then Silver; update sweep tracking and freshness metrics.
6) Gold jobs run on cadence (6h) to compute TEER/RCI/RVI for $500 bucket only.

## Queue/message design
- New message schema (corridor_v1):
  - corridorId
  - providers[]: providerId, collectorType, amountBuckets, payinMethod, payoutMethod, rpmOverride, perCorridorRpmOverride
  - requestedAt, attempt
- Idempotency key: sweep_id + corridor_id + provider_id + method + amount_bucket.

## Cadence and RPM math
- For each provider in tier:
  - required_rpm = eligible_corridors / target_minutes
  - safe_rpm = 0.7 * provider_max_rpm
  - if required_rpm > safe_rpm: raise cadence or reduce corridor set.
- Observation default: 6h until 2-3 clean cycles.
- Tier-2 production: 6h once safe_rpm checks pass.
- Hard max: cap target cadence at 24h and alarm if queue age exceeds 24h.

## Tiering model
- Tier-1: reserved hot corridors (disabled for now).
- Tier-2: >=3 active B2B-eligible providers; cadence 6h.
- Tier-3: <3 active B2B-eligible providers; cadence 24h.
- Suggestions are logged; enforcement comes from snapshot versioning.

## Tier versioning (v0 baseline)
- Versioning exists to preserve backtests and historical consistency when corridors move between tiers.
- v0 is the initial hard-coded list version (currently empty) stored in `backend/plane-b/src/services/corridor-tier-lists.ts`.
- When `PLANE_B_B2B_TIER_VERSION` matches a hard-coded list version, only listed corridors are scheduled.
- Promotions/demotions must create a new version (v1, v2, etc). Do not edit older versions in-place.

## Data flow impact
- Bronze: raw payloads per attempt.
- Silver: normalized quote with $500 bucket + methods.
- Gold: TEER/RCI/RVI per corridor and time slice; update every 6h.

## Implementation changes (by area)
- Ingest planning:
  - backend/plane-b/src/ingest.ts
  - Build corridor manifest, use corridor-first fanout, compute rpm overrides.
- Fanout worker:
  - backend/scripts/ingest-fanout-worker.ts
  - Add corridor_v1 handling, provider-level retries.
- Rights/capability gating:
  - backend/plane-b/src/services/rights-matrix-filter.ts
  - backend/plane-b/src/repositories/implementations/provider-capability-repository.ts
- Provider method fallback:
  - backend/plane-b/src/providers/*/collector.ts
  - Bank-transfer first, cash fallback when allowed.
- Infra wiring:
  - infrastructure/cdk/lib/ecs-tasks.ts (new envs)
  - monitoring thresholds for queue age and sweep completion.

## Sweep tracking (new tables)
- sweep_run (sweep_id, tier, started_at, target_minutes, status)
- sweep_task (sweep_id, corridor_id, provider_id, status, attempt_count)
- Use to compute ETA and coverage %.

## Rollout plan
1) Dev observation 6h with corridor-first fanout.
2) Validate: queue drain < target window, low 403/429, stable Silver writes.
3) Fix providers with repeated failures (capabilities/rights/methods).
4) Keep Tier-2 at 6h once safe RPM checks pass.
5) Add tier snapshot versioning for production.

## Monitoring and SLOs
- Queue depth + age, per-provider success rate, avg task duration.
- Sweep completion % by tier within target window.
- DLQ depth must remain 0.

## Open questions
- Exact criteria for tier-1 promotion (corridor hotness definition).
- Provider-specific RPM ceilings for prod (legal/contractual limits).
- Gold job triggers: fixed cadence vs sweep completion.
