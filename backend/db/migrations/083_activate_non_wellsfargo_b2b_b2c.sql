-- Activate all provider rows for B2B/B2C except wellsfargo.
-- Policy:
-- - For every provider except wellsfargo: collect+b2c+b2b enabled, active stoplist, production status.
-- - Wells Fargo remains disabled and candidate.

WITH provider_universe AS (
  SELECT DISTINCT LOWER(provider_id) AS provider_id
  FROM silver.provider
)
INSERT INTO silver.rights_matrix (
  provider_id,
  allowed_collect,
  allowed_b2c,
  allowed_b2b,
  stoplist_status,
  status,
  notes,
  last_reviewed_at
)
SELECT
  provider_id,
  TRUE,
  TRUE,
  TRUE,
  'active',
  'production',
  'policy_activation_non_wellsfargo_b2b_b2c',
  NOW()
FROM provider_universe
WHERE provider_id <> 'wellsfargo'
ON CONFLICT (provider_id) DO UPDATE SET
  allowed_collect = EXCLUDED.allowed_collect,
  allowed_b2c = EXCLUDED.allowed_b2c,
  allowed_b2b = EXCLUDED.allowed_b2b,
  stoplist_status = EXCLUDED.stoplist_status,
  status = EXCLUDED.status,
  notes = EXCLUDED.notes,
  last_reviewed_at = EXCLUDED.last_reviewed_at,
  updated_at = NOW();

INSERT INTO silver.rights_matrix (
  provider_id,
  allowed_collect,
  allowed_b2c,
  allowed_b2b,
  stoplist_status,
  status,
  notes,
  last_reviewed_at
)
VALUES (
  'wellsfargo',
  FALSE,
  FALSE,
  FALSE,
  'active',
  'candidate',
  'policy_keep_wellsfargo_disabled',
  NOW()
)
ON CONFLICT (provider_id) DO UPDATE SET
  allowed_collect = EXCLUDED.allowed_collect,
  allowed_b2c = EXCLUDED.allowed_b2c,
  allowed_b2b = EXCLUDED.allowed_b2b,
  stoplist_status = EXCLUDED.stoplist_status,
  status = EXCLUDED.status,
  notes = EXCLUDED.notes,
  last_reviewed_at = EXCLUDED.last_reviewed_at,
  updated_at = NOW();
