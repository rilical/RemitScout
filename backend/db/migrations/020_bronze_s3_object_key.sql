ALTER TABLE bronze.provider_raw
  ADD COLUMN IF NOT EXISTS s3_object_key TEXT;
