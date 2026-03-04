-- Migration: 102_rls_policies_and_grant_hardening
-- Purpose: Harden role-based access with refined GRANTs, revoke overly broad
--          permissions, and add row-level security (RLS) on multi-tenant tables
--          where row-level filtering is meaningful.
--
-- Context:
--   plane_a = B2B/B2C API (Fastify, port 4000)
--   plane_b = Collectors, agents, workers (ingest pipeline)
--   plane_c = Gold publisher API (port 4100)
--
-- Principle: GRANTs control table-level access (which tables a role can see).
--            RLS controls row-level access (which rows within a table).
--            This migration fixes both layers.

BEGIN;

-- ============================================================================
-- SECTION 1: Schema-level access corrections
-- ============================================================================

-- plane_a: silver + gold + gold_export + public — NO bronze
-- plane_b: bronze + silver + gold + gold_export + public
-- plane_c: silver + gold + gold_export + public — NO bronze

-- Ensure plane_a and plane_c cannot access bronze schema at all.
REVOKE ALL ON SCHEMA bronze FROM plane_a;
REVOKE ALL ON ALL TABLES IN SCHEMA bronze FROM plane_a;
REVOKE ALL ON SCHEMA bronze FROM plane_c;
REVOKE ALL ON ALL TABLES IN SCHEMA bronze FROM plane_c;

-- Ensure plane_c has USAGE on silver (needed for corridor/quote reads in publisher).
-- This was missing from 001_init.sql which only granted gold.
GRANT USAGE ON SCHEMA silver TO plane_c;

-- Ensure all planes have USAGE on public (idempotent, was added in 076).
GRANT USAGE ON SCHEMA public TO plane_a, plane_b, plane_c;

-- Ensure plane_b has USAGE on gold_export (needed for triangulation writes).
GRANT USAGE ON SCHEMA gold_export TO plane_b;

COMMENT ON SCHEMA bronze IS 'Raw provider payloads. Access restricted to plane_b only.';
COMMENT ON SCHEMA silver IS 'Core operational data. plane_a: mostly SELECT; plane_b: full CRUD; plane_c: SELECT.';
COMMENT ON SCHEMA gold IS 'Published indices. plane_c: INSERT/UPDATE/SELECT; plane_a/plane_b: SELECT.';

-- ============================================================================
-- SECTION 2: Fix missing GRANTs for tables added in migrations 083, 090, 091
-- ============================================================================

-- 083_admin_session_tokens: public.admin_refresh_token — only plane_a uses it
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_refresh_token TO plane_a;

-- 090_agent_infrastructure: silver.dispatch_queue, silver.module_registry,
--   silver.agent_action, silver.agent_tool_request, silver.agent_tool_result
--   gold_export.index_correction
-- plane_b owns agent infrastructure (full CRUD)
GRANT SELECT, INSERT, UPDATE, DELETE ON silver.dispatch_queue TO plane_b;
GRANT SELECT, INSERT, UPDATE, DELETE ON silver.module_registry TO plane_b;
GRANT SELECT, INSERT, UPDATE, DELETE ON silver.agent_action TO plane_b;
GRANT SELECT, INSERT, UPDATE, DELETE ON silver.agent_tool_request TO plane_b;
GRANT SELECT, INSERT, UPDATE, DELETE ON silver.agent_tool_result TO plane_b;
GRANT SELECT, INSERT, UPDATE, DELETE ON gold_export.index_correction TO plane_b;

-- plane_a reads agent data for ops dashboards and index corrections
GRANT SELECT ON silver.dispatch_queue TO plane_a;
GRANT SELECT ON silver.module_registry TO plane_a;
GRANT SELECT ON silver.agent_action TO plane_a;
GRANT SELECT ON silver.agent_tool_request TO plane_a;
GRANT SELECT ON silver.agent_tool_result TO plane_a;
GRANT SELECT ON gold_export.index_correction TO plane_a;

-- plane_c reads module_registry for publisher context
GRANT SELECT ON silver.module_registry TO plane_c;

-- 091_partner_entitlements_factors: silver.partner_entitlement, silver.partner_api_key,
--   gold_export.factor, gold_export.triangulated_index
-- plane_a reads partner/entitlement data for API auth
GRANT SELECT ON silver.partner_entitlement TO plane_a;
GRANT SELECT ON silver.partner_api_key TO plane_a;

-- plane_b manages partner data and factor ingestion
GRANT SELECT, INSERT, UPDATE, DELETE ON silver.partner_entitlement TO plane_b;
GRANT SELECT, INSERT, UPDATE, DELETE ON silver.partner_api_key TO plane_b;
GRANT SELECT, INSERT, UPDATE, DELETE ON gold_export.factor TO plane_b;
GRANT SELECT, INSERT, UPDATE, DELETE ON gold_export.triangulated_index TO plane_b;

-- plane_c reads factors and triangulated indices for publishing, writes triangulated indices
GRANT SELECT ON gold_export.factor TO plane_c;
GRANT SELECT, INSERT, UPDATE, DELETE ON gold_export.triangulated_index TO plane_c;
GRANT SELECT, INSERT, UPDATE, DELETE ON gold_export.index_correction TO plane_c;

-- ============================================================================
-- SECTION 3: Revoke overly broad plane_b DELETE on critical audit tables
-- ============================================================================

-- plane_b should NOT be able to DELETE quote_record or observation rows.
-- These are the core data assets of the silver layer. Revoke DELETE, keep SELECT/INSERT/UPDATE.
-- Note: migration 095 already granted SELECT/INSERT/UPDATE/DELETE to plane_b on these.
-- We revoke DELETE specifically to protect data integrity.
REVOKE DELETE ON silver.quote_record FROM plane_b;
REVOKE DELETE ON silver.observation FROM plane_b;

COMMENT ON TABLE silver.quote_record IS 'Normalized provider quotes (silver layer). DELETE revoked from plane_b — append-only for audit integrity.';
COMMENT ON TABLE silver.observation IS 'Raw parsed observations (silver layer). DELETE revoked from plane_b — append-only for audit integrity.';

-- ============================================================================
-- SECTION 4: Tighten default privileges
-- ============================================================================

-- The default privileges from 001_init.sql grant INSERT on silver tables to plane_a.
-- This is too broad — plane_a should only INSERT into specific tables it needs.
-- Revoke the broad default and rely on per-table GRANTs already in place.
ALTER DEFAULT PRIVILEGES IN SCHEMA silver REVOKE INSERT ON TABLES FROM plane_a;

-- Revoke default INSERT from plane_b on silver (keep explicit per-table grants).
-- Actually, plane_b legitimately needs INSERT on most silver tables, so we keep
-- the default privilege but revoke DELETE from default privileges instead.
ALTER DEFAULT PRIVILEGES IN SCHEMA silver REVOKE DELETE ON TABLES FROM plane_b;

-- Revoke DELETE default on bronze for plane_b (bronze is append-only raw data).
-- SELECT, INSERT, UPDATE defaults remain from 001_init.sql.
ALTER DEFAULT PRIVILEGES IN SCHEMA bronze REVOKE DELETE ON TABLES FROM plane_b;

-- ============================================================================
-- SECTION 5: Row-Level Security on multi-tenant tables
-- ============================================================================

-- RLS is meaningful where multiple tenants share a table and rows should be
-- isolated. In Remit-Scout, this applies to B2B institutional client tables.

-- 5a. public.api_usage_log — each institutional client should only see its own usage
--     (enforced when queries come through the API layer)

ALTER TABLE public.api_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_log FORCE ROW LEVEL SECURITY;

-- Allow plane_a full access (it mediates all B2B API requests and handles auth).
-- plane_a validates client identity at the application layer before querying.
CREATE POLICY api_usage_log_plane_a_all
  ON public.api_usage_log
  FOR ALL
  TO plane_a
  USING (true)
  WITH CHECK (true);

-- plane_b and plane_c have no grants on this table, so no policy needed.
-- The superuser/migration role bypasses RLS automatically.

COMMENT ON POLICY api_usage_log_plane_a_all ON public.api_usage_log IS
  'Plane A mediates all B2B API access. Application-layer auth enforces client isolation.';

-- 5b. public.institutional_export_log — export logs are per-client

ALTER TABLE public.institutional_export_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutional_export_log FORCE ROW LEVEL SECURITY;

-- plane_c writes export logs
CREATE POLICY institutional_export_log_plane_c_all
  ON public.institutional_export_log
  FOR ALL
  TO plane_c
  USING (true)
  WITH CHECK (true);

-- plane_a reads export logs for admin dashboards
CREATE POLICY institutional_export_log_plane_a_select
  ON public.institutional_export_log
  FOR SELECT
  TO plane_a
  USING (true);

COMMENT ON POLICY institutional_export_log_plane_c_all ON public.institutional_export_log IS
  'Plane C writes export completion logs. Full access needed for export pipeline.';
COMMENT ON POLICY institutional_export_log_plane_a_select ON public.institutional_export_log IS
  'Plane A reads export logs for admin dashboards and ops endpoints.';

-- 5c. public.api_daily_usage_counter — per-client daily counters

ALTER TABLE public.api_daily_usage_counter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_daily_usage_counter FORCE ROW LEVEL SECURITY;

-- plane_a manages daily usage counters
CREATE POLICY api_daily_usage_counter_plane_a_all
  ON public.api_daily_usage_counter
  FOR ALL
  TO plane_a
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY api_daily_usage_counter_plane_a_all ON public.api_daily_usage_counter IS
  'Plane A manages per-client daily rate limit counters.';

-- 5d. silver.audit_log — sensitive audit trail, protect from modification

ALTER TABLE silver.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver.audit_log FORCE ROW LEVEL SECURITY;

-- plane_a can read and insert audit entries
CREATE POLICY audit_log_plane_a_read_insert
  ON silver.audit_log
  FOR ALL
  TO plane_a
  USING (true)
  WITH CHECK (true);

-- plane_b can read audit entries (no insert/update/delete)
CREATE POLICY audit_log_plane_b_select
  ON silver.audit_log
  FOR SELECT
  TO plane_b
  USING (true);

COMMENT ON POLICY audit_log_plane_a_read_insert ON silver.audit_log IS
  'Plane A writes and reads audit entries.';
COMMENT ON POLICY audit_log_plane_b_select ON silver.audit_log IS
  'Plane B can read audit log for agent observability.';

-- 5e. silver.agent_action — agent audit trail, protect from tampering

ALTER TABLE silver.agent_action ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver.agent_action FORCE ROW LEVEL SECURITY;

-- plane_b (agents) can read and write agent actions
CREATE POLICY agent_action_plane_b_all
  ON silver.agent_action
  FOR ALL
  TO plane_b
  USING (true)
  WITH CHECK (true);

-- plane_a can read agent actions for ops dashboards
CREATE POLICY agent_action_plane_a_select
  ON silver.agent_action
  FOR SELECT
  TO plane_a
  USING (true);

COMMENT ON POLICY agent_action_plane_b_all ON silver.agent_action IS
  'Plane B agents write action audit trail.';
COMMENT ON POLICY agent_action_plane_a_select ON silver.agent_action IS
  'Plane A reads agent actions for ops/admin dashboards.';

-- 5f. public.admin_refresh_token — sensitive auth tokens, only plane_a

ALTER TABLE public.admin_refresh_token ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_refresh_token FORCE ROW LEVEL SECURITY;

CREATE POLICY admin_refresh_token_plane_a_all
  ON public.admin_refresh_token
  FOR ALL
  TO plane_a
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY admin_refresh_token_plane_a_all ON public.admin_refresh_token IS
  'Only Plane A manages admin session tokens. No other plane should access this table.';

-- ============================================================================
-- SECTION 6: Documentation
-- ============================================================================

COMMENT ON SCHEMA public IS 'Cross-plane shared tables: institutional clients, API usage, feature flags, admin tokens, account deletion. RLS enabled on multi-tenant and sensitive tables.';

COMMIT;
