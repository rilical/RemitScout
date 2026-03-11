-- Migration 114: institutional_client / ad_inventory CASCADE -> SET NULL / RESTRICT
--
-- Prevents accidental data loss when an institutional_client or ad_inventory
-- row is deleted.  Usage logs and analytics rows should survive parent deletion
-- (with a NULL FK) to preserve audit and billing history.
--
-- For api_daily_usage_counter the client_id is part of the PK and cannot be
-- nullable, so we use RESTRICT instead — the counter rows must be explicitly
-- cleaned up (or the client cannot be deleted while counters exist).
--
-- Same dynamic pg_constraint lookup pattern as migration 113.

DO $$
DECLARE
  _cname text;
BEGIN
  -- ================================================================
  -- 1. api_usage_log.client_id -> institutional_client.id
  --    CASCADE -> SET NULL  (drop NOT NULL first)
  -- ================================================================
  ALTER TABLE public.api_usage_log ALTER COLUMN client_id DROP NOT NULL;

  FOR _cname IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE n.nspname = 'public'
      AND t.relname = 'api_usage_log'
      AND a.attname = 'client_id'
      AND c.contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE public.api_usage_log DROP CONSTRAINT %I', _cname);
  END LOOP;

  ALTER TABLE public.api_usage_log
    ADD CONSTRAINT api_usage_log_client_id_fk
    FOREIGN KEY (client_id) REFERENCES public.institutional_client(id)
    ON DELETE SET NULL;

  -- ================================================================
  -- 2. institutional_export_log.client_id -> institutional_client.id
  --    CASCADE -> SET NULL  (drop NOT NULL first; NULL in UNIQUE is OK in PG)
  -- ================================================================
  ALTER TABLE public.institutional_export_log ALTER COLUMN client_id DROP NOT NULL;

  FOR _cname IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE n.nspname = 'public'
      AND t.relname = 'institutional_export_log'
      AND a.attname = 'client_id'
      AND c.contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE public.institutional_export_log DROP CONSTRAINT %I', _cname);
  END LOOP;

  ALTER TABLE public.institutional_export_log
    ADD CONSTRAINT institutional_export_log_client_id_fk
    FOREIGN KEY (client_id) REFERENCES public.institutional_client(id)
    ON DELETE SET NULL;

  -- ================================================================
  -- 3. api_daily_usage_counter.client_id -> institutional_client.id
  --    CASCADE -> RESTRICT  (PK column, cannot be nullable)
  -- ================================================================
  FOR _cname IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE n.nspname = 'public'
      AND t.relname = 'api_daily_usage_counter'
      AND a.attname = 'client_id'
      AND c.contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE public.api_daily_usage_counter DROP CONSTRAINT %I', _cname);
  END LOOP;

  ALTER TABLE public.api_daily_usage_counter
    ADD CONSTRAINT api_daily_usage_counter_client_id_fk
    FOREIGN KEY (client_id) REFERENCES public.institutional_client(id)
    ON DELETE RESTRICT;

  -- ================================================================
  -- 4. ad_placement.ad_id -> ad_inventory.id
  --    CASCADE -> SET NULL  (drop NOT NULL first)
  -- ================================================================
  ALTER TABLE silver.ad_placement ALTER COLUMN ad_id DROP NOT NULL;

  FOR _cname IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE n.nspname = 'silver'
      AND t.relname = 'ad_placement'
      AND a.attname = 'ad_id'
      AND c.contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE silver.ad_placement DROP CONSTRAINT %I', _cname);
  END LOOP;

  ALTER TABLE silver.ad_placement
    ADD CONSTRAINT ad_placement_ad_id_fk
    FOREIGN KEY (ad_id) REFERENCES silver.ad_inventory(id)
    ON DELETE SET NULL;

  -- ================================================================
  -- 5. ad_impression.ad_id -> ad_inventory.id
  --    CASCADE -> SET NULL  (drop NOT NULL first)
  -- ================================================================
  ALTER TABLE silver.ad_impression ALTER COLUMN ad_id DROP NOT NULL;

  FOR _cname IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE n.nspname = 'silver'
      AND t.relname = 'ad_impression'
      AND a.attname = 'ad_id'
      AND c.contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE silver.ad_impression DROP CONSTRAINT %I', _cname);
  END LOOP;

  ALTER TABLE silver.ad_impression
    ADD CONSTRAINT ad_impression_ad_id_fk
    FOREIGN KEY (ad_id) REFERENCES silver.ad_inventory(id)
    ON DELETE SET NULL;

  -- ================================================================
  -- 6. ad_click.ad_id -> ad_inventory.id
  --    CASCADE -> SET NULL  (drop NOT NULL first)
  -- ================================================================
  ALTER TABLE silver.ad_click ALTER COLUMN ad_id DROP NOT NULL;

  FOR _cname IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE n.nspname = 'silver'
      AND t.relname = 'ad_click'
      AND a.attname = 'ad_id'
      AND c.contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE silver.ad_click DROP CONSTRAINT %I', _cname);
  END LOOP;

  ALTER TABLE silver.ad_click
    ADD CONSTRAINT ad_click_ad_id_fk
    FOREIGN KEY (ad_id) REFERENCES silver.ad_inventory(id)
    ON DELETE SET NULL;
END $$;
