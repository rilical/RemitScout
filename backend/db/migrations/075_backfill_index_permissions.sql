-- Backfill index permissions for all active B2B providers that were
-- missed by migration 061 (providers added after that migration or
-- inserted at runtime without index flags).
--
-- This migration ensures all active B2B providers are eligible for Gold indices
-- by setting allowed_in_rvi/rci/teer, allowed_resell_b2b, and status = 'production'.

UPDATE silver.rights_matrix
SET
  allowed_in_rvi = true,
  allowed_in_rci = true,
  allowed_in_teer = true,
  allowed_resell_b2b = true,
  status = 'production'
WHERE allowed_collect = true
  AND allowed_b2b = true
  AND stoplist_status = 'active'
  AND (
    allowed_in_rvi = false
    OR allowed_in_rci = false
    OR allowed_in_teer = false
    OR allowed_resell_b2b = false
    OR status != 'production'
  );
