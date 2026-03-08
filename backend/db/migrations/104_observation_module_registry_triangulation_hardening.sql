-- Migration 104: Observation/module registry hardening + triangulation storage expansion
--
-- Adds canonical observation lineage fields, split module ownership fields,
-- and composite triangulation payload columns needed by corridor-level outputs.

BEGIN;

ALTER TABLE silver.observation
  ADD COLUMN IF NOT EXISTS owner_kind TEXT NOT NULL DEFAULT 'provider',
  ADD COLUMN IF NOT EXISTS owner_id TEXT,
  ADD COLUMN IF NOT EXISTS signal_layer TEXT NOT NULL DEFAULT 'quote',
  ADD COLUMN IF NOT EXISTS capture_method TEXT,
  ADD COLUMN IF NOT EXISTS parser_version TEXT,
  ADD COLUMN IF NOT EXISTS source_ref TEXT,
  ADD COLUMN IF NOT EXISTS lineage JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE silver.observation
SET owner_id = provider_id
WHERE owner_id IS NULL;

ALTER TABLE silver.observation
  ALTER COLUMN owner_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'observation_owner_kind_check'
  ) THEN
    ALTER TABLE silver.observation
      ADD CONSTRAINT observation_owner_kind_check
      CHECK (owner_kind IN ('provider', 'signal_source'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'observation_signal_layer_check'
  ) THEN
    ALTER TABLE silver.observation
      ADD CONSTRAINT observation_signal_layer_check
      CHECK (signal_layer IN ('quote', 'factor', 'stress', 'health', 'failure', 'event'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_observation_owner_corridor
  ON silver.observation (owner_kind, owner_id, corridor_id, observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_observation_signal_layer
  ON silver.observation (signal_layer, observed_at DESC);

ALTER TABLE silver.module_registry
  ADD COLUMN IF NOT EXISTS owner_kind TEXT NOT NULL DEFAULT 'provider',
  ADD COLUMN IF NOT EXISTS owner_id TEXT,
  ADD COLUMN IF NOT EXISTS signal_layer TEXT NOT NULL DEFAULT 'quote',
  ADD COLUMN IF NOT EXISTS capture_method TEXT,
  ADD COLUMN IF NOT EXISTS rollout_state TEXT NOT NULL DEFAULT 'enabled',
  ADD COLUMN IF NOT EXISTS schema_version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS lineage JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE silver.module_registry
SET owner_id = provider_id
WHERE owner_id IS NULL;

ALTER TABLE silver.module_registry
  ALTER COLUMN owner_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'module_registry_owner_kind_check'
  ) THEN
    ALTER TABLE silver.module_registry
      ADD CONSTRAINT module_registry_owner_kind_check
      CHECK (owner_kind IN ('provider', 'signal_source'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'module_registry_signal_layer_check'
  ) THEN
    ALTER TABLE silver.module_registry
      ADD CONSTRAINT module_registry_signal_layer_check
      CHECK (signal_layer IN ('quote', 'factor', 'stress', 'health', 'event'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'module_registry_rollout_state_check'
  ) THEN
    ALTER TABLE silver.module_registry
      ADD CONSTRAINT module_registry_rollout_state_check
      CHECK (rollout_state IN ('enabled', 'shadow', 'disabled'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_module_registry_owner
  ON silver.module_registry (owner_kind, owner_id, status);

CREATE INDEX IF NOT EXISTS idx_module_registry_signal_layer
  ON silver.module_registry (signal_layer, status);

ALTER TABLE gold_export.triangulated_index
  ADD COLUMN IF NOT EXISTS composite_rvi_bps NUMERIC,
  ADD COLUMN IF NOT EXISTS contributing_signals JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS lineage JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_triangulated_index_method_date
  ON gold_export.triangulated_index (method_profile, date DESC);

COMMIT;
