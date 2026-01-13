-- Intermex provider seed

INSERT INTO silver.provider (provider_id, display_name)
VALUES
  ('intermex', 'Intermex')
ON CONFLICT (provider_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  updated_at = NOW();

INSERT INTO silver.rights_matrix
  (provider_id, allowed_collect, allowed_b2c, allowed_b2b, stoplist_status, collection_method, notes, last_reviewed_at)
VALUES
  ('intermex', true, true, true, 'active', 'http', 'seed:S3.0', NOW())
ON CONFLICT (provider_id) DO UPDATE SET
  allowed_collect = EXCLUDED.allowed_collect,
  allowed_b2c = EXCLUDED.allowed_b2c,
  allowed_b2b = EXCLUDED.allowed_b2b,
  stoplist_status = EXCLUDED.stoplist_status,
  collection_method = EXCLUDED.collection_method,
  notes = EXCLUDED.notes,
  last_reviewed_at = EXCLUDED.last_reviewed_at,
  updated_at = NOW();
