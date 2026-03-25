-- Migration: 118_expand_rights_matrix_audit_fields
-- Purpose: Expand the field_changed CHECK constraint on silver.rights_matrix_audit_log
--          to cover all mutable rights matrix fields (status, reviewer, stoplist_status,
--          uptime/latency metrics, and collection/access flags), not just corridor lists.
--          Also adds a change_source column to distinguish manual edits from automated
--          discovery-driven changes, and grants plane_b INSERT access so collectors and
--          agents can record audit entries directly.

BEGIN;

-- ============================================================================
-- 1. Replace narrow CHECK constraint with expanded set of allowed field names
-- ============================================================================

-- Drop the auto-generated constraint created by migration 108.
ALTER TABLE silver.rights_matrix_audit_log
  DROP CONSTRAINT IF EXISTS rights_matrix_audit_log_field_changed_check;

ALTER TABLE silver.rights_matrix_audit_log
  ADD CONSTRAINT rights_matrix_audit_log_field_changed_check
  CHECK (field_changed IN (
    'source_countries',
    'destination_countries',
    'status',
    'reviewer',
    'stoplist_status',
    'uptime_last_30d',
    'avg_quote_latency_ms',
    'allowed_collect',
    'allowed_b2c',
    'allowed_b2b'
  ));

-- ============================================================================
-- 2. Add change_source column to record the origin of each audit entry
-- ============================================================================

ALTER TABLE silver.rights_matrix_audit_log
  ADD COLUMN IF NOT EXISTS change_source TEXT DEFAULT 'manual';

-- ============================================================================
-- 3. Grant plane_b INSERT so collectors/agents can write audit entries
-- ============================================================================

GRANT INSERT ON silver.rights_matrix_audit_log TO plane_b;

COMMIT;

-- @rollback
BEGIN;

REVOKE INSERT ON silver.rights_matrix_audit_log FROM plane_b;

ALTER TABLE silver.rights_matrix_audit_log
  DROP COLUMN IF EXISTS change_source;

ALTER TABLE silver.rights_matrix_audit_log
  DROP CONSTRAINT IF EXISTS rights_matrix_audit_log_field_changed_check;

ALTER TABLE silver.rights_matrix_audit_log
  ADD CONSTRAINT rights_matrix_audit_log_field_changed_check
  CHECK (field_changed IN (
    'source_countries',
    'destination_countries'
  ));

COMMIT;
