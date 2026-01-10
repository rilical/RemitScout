CREATE TABLE IF NOT EXISTS silver.ad_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  brand_color TEXT NOT NULL,
  url TEXT NOT NULL,
  cta_text TEXT,
  rating DOUBLE PRECISION,
  review_count TEXT,
  logo_letter TEXT,
  weight INT NOT NULL DEFAULT 1,
  label TEXT,
  is_affiliate BOOLEAN NOT NULL DEFAULT FALSE,
  provider_id TEXT,
  kind TEXT NOT NULL DEFAULT 'sponsored' CHECK (kind IN ('sponsored', 'house')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS silver.ad_placement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES silver.ad_inventory(id) ON DELETE CASCADE,
  placement TEXT NOT NULL,
  layout TEXT,
  priority INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ad_placement_ad_id_idx
  ON silver.ad_placement (ad_id);

CREATE INDEX IF NOT EXISTS ad_placement_placement_idx
  ON silver.ad_placement (placement);

CREATE TABLE IF NOT EXISTS silver.ad_impression (
  id BIGSERIAL PRIMARY KEY,
  ad_id UUID NOT NULL REFERENCES silver.ad_inventory(id) ON DELETE CASCADE,
  placement TEXT NOT NULL,
  session_id TEXT,
  anon_id TEXT,
  user_id UUID REFERENCES silver.user_account(user_id) ON DELETE SET NULL,
  corridor_id TEXT,
  page_path TEXT,
  served_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ad_impression_ad_id_idx
  ON silver.ad_impression (ad_id, served_at DESC);

CREATE INDEX IF NOT EXISTS ad_impression_placement_idx
  ON silver.ad_impression (placement, served_at DESC);

CREATE TABLE IF NOT EXISTS silver.ad_click (
  id BIGSERIAL PRIMARY KEY,
  ad_id UUID NOT NULL REFERENCES silver.ad_inventory(id) ON DELETE CASCADE,
  placement TEXT NOT NULL,
  session_id TEXT,
  anon_id TEXT,
  user_id UUID REFERENCES silver.user_account(user_id) ON DELETE SET NULL,
  corridor_id TEXT,
  page_path TEXT,
  target_url TEXT,
  is_affiliate BOOLEAN NOT NULL DEFAULT FALSE,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ad_click_ad_id_idx
  ON silver.ad_click (ad_id, clicked_at DESC);

CREATE INDEX IF NOT EXISTS ad_click_placement_idx
  ON silver.ad_click (placement, clicked_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON silver.ad_inventory, silver.ad_placement, silver.ad_impression, silver.ad_click TO plane_a;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relkind = 'S'
       AND c.relname = 'ad_impression_id_seq'
       AND n.nspname = 'silver'
  ) THEN
    GRANT USAGE, SELECT ON SEQUENCE silver.ad_impression_id_seq TO plane_a;
  END IF;

  IF EXISTS (
    SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relkind = 'S'
       AND c.relname = 'ad_click_id_seq'
       AND n.nspname = 'silver'
  ) THEN
    GRANT USAGE, SELECT ON SEQUENCE silver.ad_click_id_seq TO plane_a;
  END IF;
END $$;
