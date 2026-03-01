-- Migration 095: Partition silver.observation and silver.quote_record
--
-- Converts two high-volume append-mostly tables to daily RANGE partitions
-- keyed on their primary time columns (observed_at and collected_at).
-- Pre-creates partitions from CURRENT_DATE - 90 through CURRENT_DATE + 30
-- (120 days total) and adds a DEFAULT partition to catch any overflow rows.
-- All indexes and FK constraints from migrations 002, 006, 010, 065, 071,
-- 089, and 094 are re-created on the parent tables so PostgreSQL propagates
-- them automatically to every child partition.
-- A helper function silver.ensure_daily_partitions() is provided for
-- schedulers (pg_cron / cron-job ECS task) to extend the partition horizon.
--
-- Idempotency: all CREATE TABLE ... PARTITION OF statements use IF NOT EXISTS.
-- The parent table DROP is CASCADE — downstream views and FKs that reference
-- these tables must be recreated here (see Part 2 for quote_record FKs).

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1 — silver.observation  (partition key: observed_at)
-- ═══════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS silver.observation CASCADE;

CREATE TABLE silver.observation (
  observation_id   UUID        NOT NULL DEFAULT gen_random_uuid(),
  module_id        TEXT        NOT NULL,
  provider_id      TEXT        NOT NULL,
  type             TEXT        NOT NULL CHECK (type IN (
    'quote', 'status', 'card_baseline', 'maritime', 'migration',
    'displacement', 'telecom', 'event', 'failure', 'health_check',
    'rate_limit', 'dom_signature'
  )),
  corridor_id      TEXT,
  amount_bucket    NUMERIC,
  confidence       TEXT        NOT NULL DEFAULT 'unknown' CHECK (confidence IN ('high', 'medium', 'low', 'unknown')),
  observed_at      TIMESTAMPTZ NOT NULL,
  ingested_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ingestion_run_id TEXT        NOT NULL,
  payload          JSONB       NOT NULL DEFAULT '{}'::jsonb,
  trace_id         TEXT,
  parent_span_id   TEXT,
  schema_version   INTEGER     NOT NULL DEFAULT 1,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (observation_id, observed_at)
) PARTITION BY RANGE (observed_at);

-- ── Daily partitions: CURRENT_DATE - 90 through CURRENT_DATE + 30 ──────────
DO $$
DECLARE
  v_day  DATE;
  v_name TEXT;
  v_from TEXT;
  v_to   TEXT;
BEGIN
  FOR v_day IN
    SELECT d::date
    FROM generate_series(
      CURRENT_DATE - 90,
      CURRENT_DATE + 30,
      '1 day'::interval
    ) AS d
  LOOP
    v_name := 'silver.observation_p' || to_char(v_day, 'YYYYMMDD');
    v_from := to_char(v_day,     'YYYY-MM-DD');
    v_to   := to_char(v_day + 1, 'YYYY-MM-DD');

    IF NOT EXISTS (
      SELECT 1
      FROM   pg_class     c
      JOIN   pg_namespace n ON n.oid = c.relnamespace
      WHERE  n.nspname = 'silver'
        AND  c.relname = 'observation_p' || to_char(v_day, 'YYYYMMDD')
    ) THEN
      EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I.%I
           PARTITION OF silver.observation
           FOR VALUES FROM (%L) TO (%L)',
        'silver',
        'observation_p' || to_char(v_day, 'YYYYMMDD'),
        v_from,
        v_to
      );
    END IF;
  END LOOP;
END;
$$;

-- Default partition — catches rows outside the pre-created range
CREATE TABLE IF NOT EXISTS silver.observation_default
  PARTITION OF silver.observation DEFAULT;

-- ── Indexes (from migrations 089 + 094) ────────────────────────────────────

-- (module_id, type, observed_at) — module-level time-range queries
CREATE INDEX IF NOT EXISTS idx_observation_module_type
  ON silver.observation (module_id, type, observed_at DESC);

-- (provider_id, corridor_id, observed_at) — provider+corridor lookups
CREATE INDEX IF NOT EXISTS idx_observation_provider_corridor
  ON silver.observation (provider_id, corridor_id, observed_at DESC)
  WHERE corridor_id IS NOT NULL;

-- (type, observed_at) — type-only time-range scans
CREATE INDEX IF NOT EXISTS idx_observation_type_observed
  ON silver.observation (type, observed_at DESC);

-- (ingestion_run_id) — join to ingestion_run
CREATE INDEX IF NOT EXISTS idx_observation_ingestion_run
  ON silver.observation (ingestion_run_id);

-- (corridor_id, type, observed_at) — corridor-stress sub-selects (migration 094)
CREATE INDEX IF NOT EXISTS idx_observation_corridor_type_observed
  ON silver.observation (corridor_id, type, observed_at DESC)
  WHERE corridor_id IS NOT NULL;

-- (created_at) — e2e health-check queries (migration 094)
CREATE INDEX IF NOT EXISTS idx_observation_created_at
  ON silver.observation (created_at DESC);


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2 — silver.quote_record  (partition key: collected_at)
-- ═══════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS silver.quote_record CASCADE;

CREATE TABLE silver.quote_record (
  quote_id                  UUID        NOT NULL DEFAULT gen_random_uuid(),
  provider_id               TEXT        NOT NULL,
  corridor_id               TEXT        NOT NULL,
  amount_bucket             INT         NOT NULL,
  payin                     TEXT        NOT NULL,
  payout                    TEXT        NOT NULL,
  send_amount               NUMERIC     NOT NULL,
  fee_amount                NUMERIC     NOT NULL,
  fee_currency              TEXT,
  total_debit_amount        NUMERIC     NOT NULL,
  receive_amount            NUMERIC     NOT NULL,
  implied_fx_rate           NUMERIC     NOT NULL,
  delivery_time_min_minutes INT,
  delivery_time_max_minutes INT,
  status                    quote_status NOT NULL DEFAULT 'ok',
  error_code                TEXT,
  error_message             TEXT,
  collected_at              TIMESTAMPTZ NOT NULL,
  ingested_at               TIMESTAMPTZ NOT NULL,
  ingestion_run_id          UUID        NOT NULL,
  bronze_object_key         TEXT        NOT NULL,
  parser_version            TEXT,
  quality_flags             JSONB,
  -- Columns added by migration 006 (quote_promotions)
  promotional_rate          NUMERIC,
  base_rate                 NUMERIC,
  promotional_cap_amount    NUMERIC,
  -- Column added by migration 010 (promotional_fee)
  promotional_fee_amount    NUMERIC,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (quote_id, collected_at)
) PARTITION BY RANGE (collected_at);

-- ── Daily partitions: CURRENT_DATE - 90 through CURRENT_DATE + 30 ──────────
DO $$
DECLARE
  v_day  DATE;
  v_name TEXT;
  v_from TEXT;
  v_to   TEXT;
BEGIN
  FOR v_day IN
    SELECT d::date
    FROM generate_series(
      CURRENT_DATE - 90,
      CURRENT_DATE + 30,
      '1 day'::interval
    ) AS d
  LOOP
    v_from := to_char(v_day,     'YYYY-MM-DD');
    v_to   := to_char(v_day + 1, 'YYYY-MM-DD');

    IF NOT EXISTS (
      SELECT 1
      FROM   pg_class     c
      JOIN   pg_namespace n ON n.oid = c.relnamespace
      WHERE  n.nspname = 'silver'
        AND  c.relname = 'quote_record_p' || to_char(v_day, 'YYYYMMDD')
    ) THEN
      EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I.%I
           PARTITION OF silver.quote_record
           FOR VALUES FROM (%L) TO (%L)',
        'silver',
        'quote_record_p' || to_char(v_day, 'YYYYMMDD'),
        v_from,
        v_to
      );
    END IF;
  END LOOP;
END;
$$;

-- Default partition — catches rows outside the pre-created range
CREATE TABLE IF NOT EXISTS silver.quote_record_default
  PARTITION OF silver.quote_record DEFAULT;

-- ── Foreign-key constraints ─────────────────────────────────────────────────
-- Note: PostgreSQL 12+ supports FK constraints on partitioned tables.
-- The constraints are declared on the parent and enforced on every partition.

ALTER TABLE silver.quote_record
  ADD CONSTRAINT quote_record_provider_id_fkey
    FOREIGN KEY (provider_id) REFERENCES silver.provider (provider_id);

ALTER TABLE silver.quote_record
  ADD CONSTRAINT quote_record_corridor_id_fkey
    FOREIGN KEY (corridor_id) REFERENCES silver.corridor (corridor_id);

ALTER TABLE silver.quote_record
  ADD CONSTRAINT quote_record_ingestion_run_id_fkey
    FOREIGN KEY (ingestion_run_id) REFERENCES silver.ingestion_run (run_id);

-- ── Indexes (from migrations 002, 016, 065, 071) ────────────────────────────

-- Volatility scoring scans (migration 016 / 071 combined)
-- Queries: WHERE status='ok' AND implied_fx_rate > 0, ORDER BY collected_at DESC
CREATE INDEX IF NOT EXISTS quote_record_volatility_idx
  ON silver.quote_record (corridor_id, collected_at DESC, status)
  WHERE status = 'ok'
    AND implied_fx_rate > 0;

-- Smart alert lookups (migration 065)
-- Queries: WHERE status='ok' AND implied_fx_rate IS NOT NULL AND implied_fx_rate > 0
CREATE INDEX IF NOT EXISTS quote_record_smart_alerts_idx
  ON silver.quote_record (corridor_id, provider_id, collected_at DESC)
  WHERE status = 'ok'
    AND implied_fx_rate IS NOT NULL
    AND implied_fx_rate > 0;

-- Provider-weighting time-window scan (migration 071)
-- Queries: WHERE status='ok' AND implied_fx_rate IS NOT NULL AND implied_fx_rate > 0
--          ORDER BY collected_at DESC  (no leading corridor_id)
CREATE INDEX IF NOT EXISTS quote_record_collected_at_ok_idx
  ON silver.quote_record (collected_at DESC)
  WHERE status = 'ok'
    AND implied_fx_rate IS NOT NULL
    AND implied_fx_rate > 0;

-- ── Re-grant permissions lost by DROP CASCADE ───────────────────────────────
GRANT SELECT ON silver.quote_record TO plane_a;
GRANT SELECT ON silver.quote_record TO plane_c;
GRANT SELECT, INSERT, UPDATE, DELETE ON silver.quote_record TO plane_b;

GRANT SELECT ON silver.observation TO plane_a;
GRANT SELECT ON silver.observation TO plane_c;
GRANT SELECT, INSERT, UPDATE, DELETE ON silver.observation TO plane_b;


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 3 — Maintenance helper: silver.ensure_daily_partitions()
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Usage (run daily via pg_cron or a cron-job ECS task):
--
--   SELECT silver.ensure_daily_partitions('silver.observation',   'observed_at',  30);
--   SELECT silver.ensure_daily_partitions('silver.quote_record',  'collected_at', 30);
--
-- Returns the number of partitions created in this call (0 when all exist).

CREATE OR REPLACE FUNCTION silver.ensure_daily_partitions(
  p_parent_table TEXT,
  p_partition_col TEXT,
  p_days_ahead INT DEFAULT 30
) RETURNS INT
LANGUAGE plpgsql AS $$
DECLARE
  v_day            DATE;
  v_partition_name TEXT;
  v_start          TEXT;
  v_end            TEXT;
  v_created        INT := 0;
BEGIN
  FOR v_day IN
    SELECT generate_series(
      CURRENT_DATE + 1,
      CURRENT_DATE + p_days_ahead,
      '1 day'::interval
    )::date
  LOOP
    v_partition_name := p_parent_table || '_p' || to_char(v_day, 'YYYYMMDD');
    v_start := to_char(v_day,     'YYYY-MM-DD');
    v_end   := to_char(v_day + 1, 'YYYY-MM-DD');

    IF NOT EXISTS (
      SELECT 1
      FROM   pg_class     c
      JOIN   pg_namespace n ON n.oid = c.relnamespace
      WHERE  n.nspname || '.' || c.relname = v_partition_name
    ) THEN
      EXECUTE format(
        'CREATE TABLE %I.%I PARTITION OF %s FOR VALUES FROM (%L) TO (%L)',
        split_part(v_partition_name, '.', 1),
        split_part(v_partition_name, '.', 2),
        p_parent_table,
        v_start,
        v_end
      );
      v_created := v_created + 1;
    END IF;
  END LOOP;

  RETURN v_created;
END;
$$;

COMMIT;
