-- Migration 098: Add validation constraint on silver.observation.ingestion_run_id
--
-- Context: silver.observation.ingestion_run_id is TEXT, while
-- silver.ingestion_run.run_id is UUID. A direct FK constraint is not feasible
-- because of this type mismatch, and changing the column type on a partitioned
-- table (RANGE on observed_at, migration 095) would require rebuilding all
-- partitions.
--
-- This migration adds:
--   1. A CHECK constraint ensuring ingestion_run_id is never NULL or empty.
--   2. A COMMENT documenting the FK gap for future schema work.
--
-- The index idx_observation_ingestion_run already exists (migration 095, line 109)
-- so no new index is needed.
--
-- Idempotency: Uses NOT VALID + VALIDATE to avoid full table lock on existing
-- rows during ALTER, and wraps the ADD CONSTRAINT in a DO block that checks
-- pg_constraint first.

BEGIN;

-- ── 1. CHECK constraint: ingestion_run_id must be non-null and non-empty ──────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint c
    JOIN   pg_namespace  n ON n.oid = c.connamespace
    WHERE  n.nspname   = 'silver'
      AND  c.conname   = 'observation_ingestion_run_id_not_empty'
      AND  c.contype   = 'c'
  ) THEN
    ALTER TABLE silver.observation
      ADD CONSTRAINT observation_ingestion_run_id_not_empty
      CHECK (ingestion_run_id IS NOT NULL AND ingestion_run_id != '')
      NOT VALID;
  END IF;
END;
$$;

-- Validate the constraint against existing rows (acquires SHARE UPDATE EXCLUSIVE
-- lock, not ACCESS EXCLUSIVE, so reads are not blocked).
ALTER TABLE silver.observation
  VALIDATE CONSTRAINT observation_ingestion_run_id_not_empty;

-- ── 2. Document the FK gap ────────────────────────────────────────────────────
COMMENT ON COLUMN silver.observation.ingestion_run_id IS
  'References silver.ingestion_run.run_id logically but no FK constraint exists '
  'because this column is TEXT while ingestion_run.run_id is UUID. A type '
  'migration on a partitioned table requires rebuilding all partitions. '
  'See migration 098 for the CHECK constraint that validates non-empty values. '
  'Future work: migrate column to UUID and add a proper FK.';

COMMIT;
