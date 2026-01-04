CREATE TABLE IF NOT EXISTS silver.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  actor_id TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'admin', 'system', 'service', 'api_key')),
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  resource_type TEXT,
  resource_id TEXT,
  before_snapshot JSONB,
  after_snapshot JSONB,
  changes JSONB,
  reason TEXT,
  evidence_links JSONB,
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,
  session_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical')) DEFAULT 'info',
  category TEXT NOT NULL CHECK (category IN ('user_action', 'security', 'compliance', 'admin', 'system', 'billing', 'data_access')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_log_actor_id_idx
  ON silver.audit_log (actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_log_actor_type_idx
  ON silver.audit_log (actor_type, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_log_action_idx
  ON silver.audit_log (action, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_log_entity_idx
  ON silver.audit_log (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_log_category_idx
  ON silver.audit_log (category, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_log_severity_idx
  ON silver.audit_log (severity, created_at DESC)
  WHERE severity IN ('error', 'critical');

CREATE INDEX IF NOT EXISTS audit_log_created_at_idx
  ON silver.audit_log (created_at DESC);

CREATE INDEX IF NOT EXISTS audit_log_request_id_idx
  ON silver.audit_log (request_id)
  WHERE request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS audit_log_session_id_idx
  ON silver.audit_log (session_id)
  WHERE session_id IS NOT NULL;

GRANT SELECT, INSERT ON silver.audit_log TO plane_a;
GRANT SELECT ON silver.audit_log TO plane_b;
