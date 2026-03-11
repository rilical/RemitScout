-- Migration: 116_rls_user_facing_tables
-- Purpose: Full RLS rollout for 10 user-facing tables (T4 M7).
--          These tables hold per-user data managed exclusively by Plane A,
--          with one exception: pulse_pinned_corridor is also read by Plane B
--          (for pulse cache generation).
--
-- Pattern: ENABLE + FORCE RLS, then one permissive policy per role that needs
--          access. The superuser/migration role bypasses RLS automatically.
--
-- Future: Once app.user_id is set in transactions, policies can be narrowed
--         from USING (true) to USING (user_id = current_setting('app.user_id')::uuid).

BEGIN;

-- ============================================================================
-- 1. silver.watchlist_item
-- ============================================================================

ALTER TABLE silver.watchlist_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver.watchlist_item FORCE ROW LEVEL SECURITY;

CREATE POLICY watchlist_item_plane_a_all
  ON silver.watchlist_item
  FOR ALL
  TO plane_a
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY watchlist_item_plane_a_all ON silver.watchlist_item IS
  'Plane A manages user watchlist items. Only plane that needs access.';

-- ============================================================================
-- 2. silver.alert_rule
-- ============================================================================

ALTER TABLE silver.alert_rule ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver.alert_rule FORCE ROW LEVEL SECURITY;

CREATE POLICY alert_rule_plane_a_all
  ON silver.alert_rule
  FOR ALL
  TO plane_a
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY alert_rule_plane_a_all ON silver.alert_rule IS
  'Plane A manages user alert rules via CRUD endpoints.';

-- ============================================================================
-- 3. silver.alert_state
-- ============================================================================

ALTER TABLE silver.alert_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver.alert_state FORCE ROW LEVEL SECURITY;

CREATE POLICY alert_state_plane_a_all
  ON silver.alert_state
  FOR ALL
  TO plane_a
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY alert_state_plane_a_all ON silver.alert_state IS
  'Plane A manages alert evaluation state.';

-- ============================================================================
-- 4. silver.alert_event
-- ============================================================================

ALTER TABLE silver.alert_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver.alert_event FORCE ROW LEVEL SECURITY;

CREATE POLICY alert_event_plane_a_all
  ON silver.alert_event
  FOR ALL
  TO plane_a
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY alert_event_plane_a_all ON silver.alert_event IS
  'Plane A records and reads alert trigger events.';

-- ============================================================================
-- 5. silver.notification_pref
-- ============================================================================

ALTER TABLE silver.notification_pref ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver.notification_pref FORCE ROW LEVEL SECURITY;

CREATE POLICY notification_pref_plane_a_all
  ON silver.notification_pref
  FOR ALL
  TO plane_a
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY notification_pref_plane_a_all ON silver.notification_pref IS
  'Plane A manages user notification preferences.';

-- ============================================================================
-- 6. silver.user_plan
-- ============================================================================

ALTER TABLE silver.user_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver.user_plan FORCE ROW LEVEL SECURITY;

CREATE POLICY user_plan_plane_a_all
  ON silver.user_plan
  FOR ALL
  TO plane_a
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY user_plan_plane_a_all ON silver.user_plan IS
  'Plane A manages user billing plans and entitlements.';

-- ============================================================================
-- 7. silver.api_key
-- ============================================================================

ALTER TABLE silver.api_key ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver.api_key FORCE ROW LEVEL SECURITY;

CREATE POLICY api_key_plane_a_all
  ON silver.api_key
  FOR ALL
  TO plane_a
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY api_key_plane_a_all ON silver.api_key IS
  'Plane A manages user API keys for B2B access.';

-- ============================================================================
-- 8. silver.user_session
-- ============================================================================

ALTER TABLE silver.user_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver.user_session FORCE ROW LEVEL SECURITY;

CREATE POLICY user_session_plane_a_all
  ON silver.user_session
  FOR ALL
  TO plane_a
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY user_session_plane_a_all ON silver.user_session IS
  'Plane A manages user sessions. No other plane should access session data.';

-- ============================================================================
-- 9. silver.published_chart_embed
-- ============================================================================

ALTER TABLE silver.published_chart_embed ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver.published_chart_embed FORCE ROW LEVEL SECURITY;

CREATE POLICY published_chart_embed_plane_a_all
  ON silver.published_chart_embed
  FOR ALL
  TO plane_a
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY published_chart_embed_plane_a_all ON silver.published_chart_embed IS
  'Plane A manages published chart embeds for users.';

-- ============================================================================
-- 10. silver.pulse_pinned_corridor
-- ============================================================================

ALTER TABLE silver.pulse_pinned_corridor ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver.pulse_pinned_corridor FORCE ROW LEVEL SECURITY;

CREATE POLICY pulse_pinned_corridor_plane_a_all
  ON silver.pulse_pinned_corridor
  FOR ALL
  TO plane_a
  USING (true)
  WITH CHECK (true);

-- plane_b reads pinned corridors for pulse cache generation
CREATE POLICY pulse_pinned_corridor_plane_b_select
  ON silver.pulse_pinned_corridor
  FOR SELECT
  TO plane_b
  USING (true);

COMMENT ON POLICY pulse_pinned_corridor_plane_a_all ON silver.pulse_pinned_corridor IS
  'Plane A manages user-pinned corridors for the pulse dashboard.';
COMMENT ON POLICY pulse_pinned_corridor_plane_b_select ON silver.pulse_pinned_corridor IS
  'Plane B reads pinned corridors to drive pulse cache refresh.';

COMMIT;
