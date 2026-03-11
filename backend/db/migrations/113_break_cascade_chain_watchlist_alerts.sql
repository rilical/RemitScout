-- Migration 113: Break CASCADE chain on watchlist/alert FK constraints
--
-- The account-deletion service now performs explicit ordered DELETEs
-- (alert_event -> alert_state -> alert_rule -> watchlist_item) before
-- deleting user_account.  With the application handling cleanup, the DB
-- no longer needs ON DELETE CASCADE — switching to RESTRICT catches any
-- code path that forgets to clean up children first.
--
-- Because the original inline FK constraints may have auto-generated names,
-- we look them up dynamically via pg_constraint + pg_attribute.

DO $$
DECLARE
  _cname text;
BEGIN
  -- ================================================================
  -- 1. watchlist_item.user_id -> user_account.user_id  (CASCADE -> RESTRICT)
  -- ================================================================
  FOR _cname IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE n.nspname = 'silver'
      AND t.relname = 'watchlist_item'
      AND a.attname = 'user_id'
      AND c.contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE silver.watchlist_item DROP CONSTRAINT %I', _cname);
  END LOOP;

  ALTER TABLE silver.watchlist_item
    ADD CONSTRAINT watchlist_item_user_id_fk
    FOREIGN KEY (user_id) REFERENCES silver.user_account(user_id)
    ON DELETE RESTRICT;

  -- ================================================================
  -- 2. alert_rule.watchlist_item_id -> watchlist_item.id
  --    There may be TWO constraints: an unnamed inline FK plus the
  --    named alert_rule_watchlist_item_fk.  Drop ALL, recreate ONE.
  -- ================================================================
  FOR _cname IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE n.nspname = 'silver'
      AND t.relname = 'alert_rule'
      AND a.attname = 'watchlist_item_id'
      AND c.contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE silver.alert_rule DROP CONSTRAINT %I', _cname);
  END LOOP;

  ALTER TABLE silver.alert_rule
    ADD CONSTRAINT alert_rule_watchlist_item_fk
    FOREIGN KEY (watchlist_item_id) REFERENCES silver.watchlist_item(id)
    ON DELETE RESTRICT;

  -- ================================================================
  -- 3. alert_state.alert_id -> alert_rule.id  (CASCADE -> RESTRICT)
  -- ================================================================
  FOR _cname IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE n.nspname = 'silver'
      AND t.relname = 'alert_state'
      AND a.attname = 'alert_id'
      AND c.contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE silver.alert_state DROP CONSTRAINT %I', _cname);
  END LOOP;

  ALTER TABLE silver.alert_state
    ADD CONSTRAINT alert_state_alert_id_fk
    FOREIGN KEY (alert_id) REFERENCES silver.alert_rule(id)
    ON DELETE RESTRICT;

  -- ================================================================
  -- 4. alert_event.alert_id -> alert_rule.id  (CASCADE -> RESTRICT)
  -- ================================================================
  FOR _cname IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE n.nspname = 'silver'
      AND t.relname = 'alert_event'
      AND a.attname = 'alert_id'
      AND c.contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE silver.alert_event DROP CONSTRAINT %I', _cname);
  END LOOP;

  ALTER TABLE silver.alert_event
    ADD CONSTRAINT alert_event_alert_id_fk
    FOREIGN KEY (alert_id) REFERENCES silver.alert_rule(id)
    ON DELETE RESTRICT;
END $$;
