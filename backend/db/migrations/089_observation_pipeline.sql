-- Migration 089: Agent-Native Observation Pipeline
-- Creates tables for the universal observation pipeline, job tracking, and failure bundles.

BEGIN;

-- silver.observation — universal event stream for all collection observations
CREATE TABLE IF NOT EXISTS silver.observation (
  observation_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id       TEXT NOT NULL,
  provider_id     TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN (
    'quote', 'status', 'card_baseline', 'maritime', 'migration',
    'displacement', 'telecom', 'event', 'failure', 'health_check',
    'rate_limit', 'dom_signature'
  )),
  corridor_id     TEXT,
  amount_bucket   NUMERIC,
  confidence      TEXT NOT NULL DEFAULT 'unknown' CHECK (confidence IN ('high', 'medium', 'low', 'unknown')),
  observed_at     TIMESTAMPTZ NOT NULL,
  ingested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ingestion_run_id TEXT NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  trace_id        TEXT,
  parent_span_id  TEXT,
  schema_version  INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_observation_module_type
  ON silver.observation (module_id, type, observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_observation_provider_corridor
  ON silver.observation (provider_id, corridor_id, observed_at DESC)
  WHERE corridor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_observation_type_observed
  ON silver.observation (type, observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_observation_ingestion_run
  ON silver.observation (ingestion_run_id);

-- silver.job_run — tracks execution of collection jobs, agent actions, maintenance tasks
CREATE TABLE IF NOT EXISTS silver.job_run (
  job_run_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id       TEXT NOT NULL,
  job_type        TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'running', 'completed', 'failed', 'cancelled', 'timed_out'
  )),
  queued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  items_processed INTEGER NOT NULL DEFAULT 0,
  items_failed    INTEGER NOT NULL DEFAULT 0,
  duration_ms     INTEGER,
  error_message   TEXT,
  error_type      TEXT,
  attempt         INTEGER NOT NULL DEFAULT 1,
  max_attempts    INTEGER NOT NULL DEFAULT 3,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_run_module_status
  ON silver.job_run (module_id, status, queued_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_run_type_status
  ON silver.job_run (job_type, status, queued_at DESC);

-- silver.failure_bundle — aggregated failure evidence for agent self-healing
CREATE TABLE IF NOT EXISTS silver.failure_bundle (
  bundle_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id       TEXT NOT NULL,
  provider_id     TEXT NOT NULL,
  collector_type  TEXT NOT NULL,
  severity        TEXT NOT NULL CHECK (severity IN ('transient', 'degraded', 'persistent', 'critical')),
  category        TEXT NOT NULL CHECK (category IN (
    'network', 'parse', 'rate_limit', 'auth', 'dom_change',
    'data_integrity', 'timeout', 'server_error', 'unknown'
  )),
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  first_failure_at     TIMESTAMPTZ NOT NULL,
  last_failure_at      TIMESTAMPTZ NOT NULL,
  error_message        TEXT NOT NULL,
  error_type           TEXT NOT NULL,
  http_statuses        INTEGER[] NOT NULL DEFAULT '{}',
  affected_corridors   TEXT[] NOT NULL DEFAULT '{}',
  dom_signature_hash   TEXT,
  previous_dom_signature_hash TEXT,
  observation_ids      UUID[] NOT NULL DEFAULT '{}',
  repair_attempted     BOOLEAN NOT NULL DEFAULT FALSE,
  repair_outcome       TEXT CHECK (repair_outcome IN (
    'pending', 'proposed', 'applied', 'rejected', 'failed'
  )),
  repair_pr_url        TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_failure_bundle_module
  ON silver.failure_bundle (module_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_failure_bundle_severity
  ON silver.failure_bundle (severity, created_at DESC)
  WHERE repair_attempted = FALSE;

CREATE INDEX IF NOT EXISTS idx_failure_bundle_provider
  ON silver.failure_bundle (provider_id, collector_type, created_at DESC);

COMMIT;
