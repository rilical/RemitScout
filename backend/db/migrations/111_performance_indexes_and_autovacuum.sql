-- Migration 111: Performance indexes and autovacuum tuning
--
-- Adds missing indexes identified during query-plan review and tunes
-- autovacuum settings for high-churn tables that accumulate dead tuples
-- faster than the default thresholds can reclaim.
--
-- NOTE: CREATE INDEX CONCURRENTLY cannot run inside a transaction block.
-- This migration must NOT be wrapped in BEGIN/COMMIT.

-- ============================================================
-- Missing indexes
-- ============================================================

-- H4: Currency-pair lookups on silver.corridor (currently seq scan)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_corridor_currency_pair
  ON silver.corridor (source_currency, dest_currency);

-- H5: Provider-leading queries on silver.latest_quote_by_provider
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_latest_quote_provider_corridor
  ON silver.latest_quote_by_provider (provider_id, corridor_id, collected_at DESC);

-- M6: Email lookups on silver.user_account (case-insensitive)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_account_email_lower
  ON silver.user_account (LOWER(email));

-- M6: created_at ordering on silver.user_account
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_account_created_at
  ON silver.user_account (created_at DESC);

-- M11: created_at on silver.ingestion_run for provider health queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ingestion_run_provider_created
  ON silver.ingestion_run (provider_id, created_at DESC);

-- ============================================================
-- Autovacuum tuning for hot tables (H2)
-- ============================================================

-- Hot upsert table: every quote triggers ON CONFLICT DO UPDATE
ALTER TABLE silver.latest_quote_by_provider SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

-- Frequent status transitions: pending -> dispatched -> completed
ALTER TABLE silver.dispatch_queue SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

-- Updated on every authenticated request
ALTER TABLE silver.user_session SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- Updated on every alert evaluation cycle
ALTER TABLE silver.alert_state SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- Frequent status updates during ingest runs
ALTER TABLE silver.ingestion_run SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- Frequent writes from agent cycles
ALTER TABLE silver.agent_action SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);
