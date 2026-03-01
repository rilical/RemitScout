-- Migration 094: Missing Performance Indexes
--
-- Purpose: Add indexes identified during the 2026-03-01 database audit.
-- Covers three families of missing indexes:
--
--   1. silver.ingestion_run — queries filter on (provider_id, collector_type)
--      and ORDER BY (finished_at DESC). The table has no non-PK indexes.
--
--   2. silver.observation (corridor_id, type, observed_at) — corridor-stress
--      queries perform repeated correlated sub-selects on this triple. The
--      existing idx_observation_provider_corridor leads with provider_id, not
--      corridor_id, so those queries cannot use it.
--
--   3. silver.observation.created_at — e2e health-check queries filter on
--      created_at rather than observed_at but no index exists for it.
--
-- All statements are idempotent (IF NOT EXISTS).

-- ─── silver.ingestion_run ────────────────────────────────────────────────────

-- Supports:
--   getLastSweepAgeSeconds:  WHERE provider_id = $1 AND collector_type = $2  ORDER BY COALESCE(finished_at, started_at) DESC
--   b2b-sweep-dispatch:      WHERE provider_id = ANY($1) AND collector_type = ANY($2)
--   loadLatestSweepDurations: WHERE collector_type IN (...) AND finished_at IS NOT NULL  ORDER BY provider_id, finished_at DESC
--   provider-health-evidence: WHERE provider_id = $1 AND created_at >= $2
CREATE INDEX IF NOT EXISTS idx_ingestion_run_provider_collector_finished
  ON silver.ingestion_run (provider_id, collector_type, finished_at DESC NULLS LAST);

-- Supports the collector_type-only scan with ORDER BY provider_id, finished_at DESC
-- (loadLatestSweepDurations uses DISTINCT ON (provider_id))
CREATE INDEX IF NOT EXISTS idx_ingestion_run_collector_type_finished
  ON silver.ingestion_run (collector_type, finished_at DESC NULLS LAST)
  WHERE finished_at IS NOT NULL;

-- ─── silver.observation — corridor-level stress queries ─────────────────────

-- Supports all corridor-stress sub-selects that filter on
-- (corridor_id, type, observed_at) without a leading provider_id:
--
--   SELECT … FROM silver.observation
--     WHERE corridor_id = $1 AND type = 'quote'
--       AND observed_at >= NOW() - INTERVAL '1 hour'
--
--   SELECT DISTINCT corridor_id FROM silver.observation
--     WHERE type = 'quote' AND observed_at >= NOW() - INTERVAL '24 hours'
--       AND corridor_id IS NOT NULL
--
-- The existing idx_observation_provider_corridor leads with provider_id and
-- cannot satisfy these queries. The existing idx_observation_type_observed
-- leads with type but does not include corridor_id as a second column.

CREATE INDEX IF NOT EXISTS idx_observation_corridor_type_observed
  ON silver.observation (corridor_id, type, observed_at DESC)
  WHERE corridor_id IS NOT NULL;

-- ─── silver.observation — created_at health-check filter ────────────────────

-- Supports: e2e-agent-health-check.ts
--   SELECT COUNT(*) FROM silver.observation WHERE created_at > NOW() - $1::interval
CREATE INDEX IF NOT EXISTS idx_observation_created_at
  ON silver.observation (created_at DESC);
