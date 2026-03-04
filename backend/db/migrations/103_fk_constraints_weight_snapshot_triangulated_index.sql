-- Migration 103: Add FK constraints to gold.provider_weight_snapshot and
-- gold_export.triangulated_index (P2-8, P2-10).
--
-- FKs are DEFERRABLE INITIALLY DEFERRED for bulk-load compatibility.
-- Uses DO blocks to add constraints only if they do not already exist.

BEGIN;

-- P2-8: gold.provider_weight_snapshot -> silver.provider(provider_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_weight_snapshot_provider'
  ) THEN
    ALTER TABLE gold.provider_weight_snapshot
      ADD CONSTRAINT fk_weight_snapshot_provider
      FOREIGN KEY (provider_id) REFERENCES silver.provider(provider_id)
      DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

-- P2-8: gold.provider_weight_snapshot -> silver.corridor(corridor_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_weight_snapshot_corridor'
  ) THEN
    ALTER TABLE gold.provider_weight_snapshot
      ADD CONSTRAINT fk_weight_snapshot_corridor
      FOREIGN KEY (corridor_id) REFERENCES silver.corridor(corridor_id)
      DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

-- P2-10: gold_export.triangulated_index.leg1_corridor -> silver.corridor(corridor_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_triangulated_index_leg1_corridor'
  ) THEN
    ALTER TABLE gold_export.triangulated_index
      ADD CONSTRAINT fk_triangulated_index_leg1_corridor
      FOREIGN KEY (leg1_corridor) REFERENCES silver.corridor(corridor_id)
      DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

-- P2-10: gold_export.triangulated_index.leg2_corridor -> silver.corridor(corridor_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_triangulated_index_leg2_corridor'
  ) THEN
    ALTER TABLE gold_export.triangulated_index
      ADD CONSTRAINT fk_triangulated_index_leg2_corridor
      FOREIGN KEY (leg2_corridor) REFERENCES silver.corridor(corridor_id)
      DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

COMMIT;
