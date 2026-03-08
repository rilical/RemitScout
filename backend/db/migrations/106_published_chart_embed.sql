-- Durable published embeds for Enterprise static publishing surfaces.

CREATE TABLE IF NOT EXISTS silver.published_chart_embed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES silver.user_account(user_id) ON DELETE CASCADE,
  surface_kind TEXT NOT NULL CHECK (surface_kind IN ('pulse', 'indices')),
  chart_key TEXT,
  index_key TEXT,
  title TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'dark',
  filters_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  payload_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  CONSTRAINT published_chart_embed_surface_key_ck CHECK (
    (surface_kind = 'pulse' AND chart_key IS NOT NULL AND index_key IS NULL)
    OR
    (surface_kind = 'indices' AND chart_key IS NULL AND index_key IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS published_chart_embed_owner_published_at_idx
  ON silver.published_chart_embed (owner_user_id, published_at DESC);

CREATE INDEX IF NOT EXISTS published_chart_embed_surface_revoked_idx
  ON silver.published_chart_embed (surface_kind, revoked_at, published_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON silver.published_chart_embed TO plane_a;
