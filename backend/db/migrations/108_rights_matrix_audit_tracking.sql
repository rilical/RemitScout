-- Rights matrix audit tracking: adds last_audited_at and audit log table
-- for tracking discovery-driven rights matrix changes with full audit trail.

BEGIN;

-- Track when a provider's rights matrix was last audited via discovery
ALTER TABLE silver.rights_matrix
  ADD COLUMN IF NOT EXISTS last_audited_at TIMESTAMPTZ;

-- Audit log for all rights matrix changes made via discovery
CREATE TABLE IF NOT EXISTS silver.rights_matrix_audit_log (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider_id         TEXT NOT NULL,
  field_changed       TEXT NOT NULL CHECK (field_changed IN (
    'source_countries', 'destination_countries'
  )),
  previous_value      JSONB,
  new_value           JSONB,
  discovery_scan_id   BIGINT REFERENCES silver.discovery_scan(id),
  approved_by         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rights_matrix_audit_log_provider
  ON silver.rights_matrix_audit_log (provider_id);

CREATE INDEX IF NOT EXISTS idx_rights_matrix_audit_log_scan
  ON silver.rights_matrix_audit_log (discovery_scan_id);

COMMIT;
