-- Institutional daily export log for per-client S3 drops (TEER/RCI/RVI).
-- Depends on Section 3 migration that creates `public.institutional_client (id ...)`.

DO $$ BEGIN
  CREATE TYPE institutional_export_kind AS ENUM (
    'teer',
    'rci',
    'rvi'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE institutional_export_status AS ENUM (
    'done',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.institutional_export_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.institutional_client(id) ON DELETE CASCADE,
  export_date DATE NOT NULL,
  export_kind institutional_export_kind NOT NULL,
  file_key TEXT NOT NULL,
  row_count INT NOT NULL,
  status institutional_export_status NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_id, export_date, export_kind)
);

CREATE INDEX IF NOT EXISTS institutional_export_log_export_date_idx
  ON public.institutional_export_log (export_date);

CREATE INDEX IF NOT EXISTS institutional_export_log_client_date_idx
  ON public.institutional_export_log (client_id, export_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.institutional_export_log TO plane_c;
