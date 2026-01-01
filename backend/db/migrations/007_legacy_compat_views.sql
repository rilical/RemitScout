-- Replace legacy silver tables with compatibility views backed by canonical tables.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'silver'
      AND c.relname = 'providers'
      AND c.relkind = 'r'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'silver'
      AND c.relname = 'providers_legacy'
      AND c.relkind = 'r'
  ) THEN
    ALTER TABLE silver.providers RENAME TO providers_legacy;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'silver'
      AND c.relname = 'corridors'
      AND c.relkind = 'r'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'silver'
      AND c.relname = 'corridors_legacy'
      AND c.relkind = 'r'
  ) THEN
    ALTER TABLE silver.corridors RENAME TO corridors_legacy;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'silver'
      AND c.relname = 'provider_quotes'
      AND c.relkind = 'r'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'silver'
      AND c.relname = 'provider_quotes_legacy'
      AND c.relkind = 'r'
  ) THEN
    ALTER TABLE silver.provider_quotes RENAME TO provider_quotes_legacy;
  END IF;
END $$;

CREATE OR REPLACE VIEW silver.providers AS
SELECT
  provider_id AS id,
  display_name AS name,
  NULL::text AS logo_url,
  NULL::numeric AS reliability,
  ARRAY[]::text[] AS methods,
  NULL::text AS best_for,
  NULL::text AS homepage_url,
  created_at,
  updated_at
FROM silver.provider;

CREATE OR REPLACE VIEW silver.corridors AS
SELECT
  corridor_id AS id,
  source_country AS from_country,
  dest_country AS to_country,
  source_currency AS send_currency,
  dest_currency AS recv_currency,
  corridor_id AS label,
  updated_at
FROM silver.corridor;

CREATE OR REPLACE VIEW silver.provider_quotes AS
SELECT DISTINCT ON (provider_id, corridor_id)
  NULL::bigint AS id,
  provider_id,
  corridor_id,
  fee_amount AS fee,
  NULL::numeric AS margin_pct,
  implied_fx_rate AS fx_rate,
  NULL::text AS delivery,
  ARRAY[payin, payout]::text[] AS methods,
  NULL::numeric AS reliability,
  NULL::text AS best_for,
  updated_at
FROM silver.latest_quote_by_provider
ORDER BY provider_id, corridor_id, collected_at DESC, updated_at DESC;

COMMENT ON VIEW silver.providers IS 'READ ONLY view for legacy compatibility. Source of truth is silver.provider.';
COMMENT ON VIEW silver.corridors IS 'READ ONLY view for legacy compatibility. Source of truth is silver.corridor.';
COMMENT ON VIEW silver.provider_quotes IS 'READ ONLY view for legacy compatibility. Source of truth is silver.latest_quote_by_provider.';

GRANT SELECT ON silver.providers TO plane_a, plane_b, plane_c;
GRANT SELECT ON silver.corridors TO plane_a, plane_b, plane_c;
GRANT SELECT ON silver.provider_quotes TO plane_a, plane_b, plane_c;
