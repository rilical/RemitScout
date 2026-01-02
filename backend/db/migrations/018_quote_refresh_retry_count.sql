-- Track retry attempts for B2C quote refresh requests.

ALTER TABLE silver.quote_refresh_request
  ADD COLUMN IF NOT EXISTS retry_count INT NOT NULL DEFAULT 0;
