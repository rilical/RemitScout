ALTER TABLE silver.notification_device
  ADD COLUMN IF NOT EXISTS sns_endpoint_arn TEXT,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS last_error_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS notification_device_sns_endpoint_idx
  ON silver.notification_device (sns_endpoint_arn)
  WHERE sns_endpoint_arn IS NOT NULL;
