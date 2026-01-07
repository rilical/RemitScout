CREATE INDEX IF NOT EXISTS latest_quote_by_provider_fresh_idx
  ON silver.latest_quote_by_provider (corridor_id, amount_bucket, payin, payout, collected_at DESC);
