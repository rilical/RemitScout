-- Performance indexes for export-worker pagination and API key listings.

CREATE INDEX IF NOT EXISTS idx_api_key_user_id_created
  ON silver.api_key (user_id, created_at DESC);

-- Supports JOIN on alert_id and keyset pagination ORDER BY triggered_at DESC, id DESC.
CREATE INDEX IF NOT EXISTS idx_alert_event_alert_id_triggered_id
  ON silver.alert_event (alert_id, triggered_at DESC, id DESC);

-- Supports JOIN from watchlist -> alert_rule with stable id keyset pagination.
CREATE INDEX IF NOT EXISTS idx_alert_rule_watchlist_item_id_id
  ON silver.alert_rule (watchlist_item_id, id);
