-- Migration 090: Agent Infrastructure Tables
-- Creates tables for agent dispatch, module registry, index corrections,
-- agent actions, tool requests/results, and knowledge plane.

BEGIN;

-- silver.dispatch_queue — tracks agent dispatch items
CREATE TABLE IF NOT EXISTS silver.dispatch_queue (
  dispatch_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name      TEXT NOT NULL,
  module_id       TEXT,
  priority        INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'dispatched', 'processing', 'completed', 'failed', 'expired'
  )),
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  max_attempts    INTEGER NOT NULL DEFAULT 3,
  attempt         INTEGER NOT NULL DEFAULT 0,
  scheduled_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dispatched_at   TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispatch_queue_status
  ON silver.dispatch_queue (queue_name, status, priority DESC, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_dispatch_queue_module
  ON silver.dispatch_queue (module_id, status)
  WHERE module_id IS NOT NULL;

-- silver.module_registry — runtime module registration and state tracking
CREATE TABLE IF NOT EXISTS silver.module_registry (
  module_id       TEXT PRIMARY KEY,
  provider_id     TEXT NOT NULL,
  collector_type  TEXT NOT NULL,
  display_name    TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'candidate' CHECK (status IN (
    'candidate', 'sandbox', 'beta', 'production', 'deprecated', 'quarantined'
  )),
  policy          JSONB NOT NULL DEFAULT '{}'::jsonb,
  supported_corridors TEXT[] NOT NULL DEFAULT '{}',
  supported_amount_buckets NUMERIC[] NOT NULL DEFAULT '{}',
  payin_method    TEXT NOT NULL DEFAULT 'bank_transfer',
  payout_method   TEXT NOT NULL DEFAULT 'bank_transfer',
  spec_version    INTEGER NOT NULL DEFAULT 1,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  parse_error_rate NUMERIC NOT NULL DEFAULT 0,
  quarantine_reason TEXT,
  quarantined_at  TIMESTAMPTZ,
  last_health_check_at TIMESTAMPTZ,
  registered_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_module_registry_provider
  ON silver.module_registry (provider_id, status);

CREATE INDEX IF NOT EXISTS idx_module_registry_status
  ON silver.module_registry (status);

-- gold.index_correction — tracks manual or agent corrections to gold indices
CREATE TABLE IF NOT EXISTS gold_export.index_correction (
  correction_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corridor_id     TEXT NOT NULL,
  amount_bucket   NUMERIC NOT NULL,
  method_profile  TEXT NOT NULL,
  date            DATE NOT NULL,
  field_name      TEXT NOT NULL,
  old_value       NUMERIC,
  new_value       NUMERIC,
  reason          TEXT NOT NULL,
  corrected_by    TEXT NOT NULL,
  methodology_version TEXT,
  approved_by     TEXT,
  approved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_index_correction_corridor
  ON gold_export.index_correction (corridor_id, date DESC);

-- silver.agent_action — audit trail for all agent actions
CREATE TABLE IF NOT EXISTS silver.agent_action (
  action_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        TEXT NOT NULL,
  module_id       TEXT,
  action_type     TEXT NOT NULL,
  description     TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'executing', 'completed', 'failed', 'rejected'
  )),
  requires_approval BOOLEAN NOT NULL DEFAULT TRUE,
  approved_by     TEXT,
  approved_at     TIMESTAMPTZ,
  result          JSONB,
  error_message   TEXT,
  duration_ms     INTEGER,
  trace_id        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agent_action_agent
  ON silver.agent_action (agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_action_module
  ON silver.agent_action (module_id, created_at DESC)
  WHERE module_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agent_action_pending
  ON silver.agent_action (status, created_at)
  WHERE status IN ('pending', 'approved', 'executing');

-- silver.agent_tool_request — tool gateway request log
CREATE TABLE IF NOT EXISTS silver.agent_tool_request (
  request_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        TEXT NOT NULL,
  module_id       TEXT,
  tool_type       TEXT NOT NULL,
  operation       TEXT NOT NULL,
  params          JSONB NOT NULL DEFAULT '{}'::jsonb,
  requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
  ttl_ms          INTEGER NOT NULL DEFAULT 30000,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tool_request_agent
  ON silver.agent_tool_request (agent_id, submitted_at DESC);

-- silver.agent_tool_result — tool gateway result log
CREATE TABLE IF NOT EXISTS silver.agent_tool_result (
  result_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      UUID NOT NULL REFERENCES silver.agent_tool_request(request_id),
  success         BOOLEAN NOT NULL,
  data            JSONB,
  error_message   TEXT,
  duration_ms     INTEGER NOT NULL,
  approved        BOOLEAN NOT NULL DEFAULT TRUE,
  approved_by     TEXT,
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tool_result_request
  ON silver.agent_tool_result (request_id);

COMMIT;
