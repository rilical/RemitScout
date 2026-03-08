BEGIN;

ALTER TABLE silver.discovery_scan
  ADD COLUMN IF NOT EXISTS review_status TEXT,
  ADD COLUMN IF NOT EXISTS approved_by TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS apply_status TEXT,
  ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS apply_errors_json JSONB,
  ADD COLUMN IF NOT EXISTS apply_result_json JSONB;

UPDATE silver.discovery_scan
   SET review_status = CASE
         WHEN status = 'running' THEN 'pending_review'
         WHEN diff_json IS NULL OR diff_json = 'null'::jsonb THEN 'not_required'
         ELSE 'pending_review'
       END
 WHERE review_status IS NULL;

UPDATE silver.discovery_scan
   SET apply_status = CASE
         WHEN status = 'running' THEN 'not_requested'
         WHEN diff_json IS NULL OR diff_json = 'null'::jsonb THEN 'not_applicable'
         ELSE 'not_requested'
       END
 WHERE apply_status IS NULL;

ALTER TABLE silver.discovery_scan
  ALTER COLUMN review_status SET DEFAULT 'pending_review',
  ALTER COLUMN review_status SET NOT NULL,
  ALTER COLUMN apply_status SET DEFAULT 'not_requested',
  ALTER COLUMN apply_status SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'discovery_scan_review_status_check'
  ) THEN
    ALTER TABLE silver.discovery_scan
      ADD CONSTRAINT discovery_scan_review_status_check
      CHECK (review_status IN (
        'pending_review',
        'approved',
        'automation_approved',
        'dismissed',
        'not_required'
      ));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'discovery_scan_apply_status_check'
  ) THEN
    ALTER TABLE silver.discovery_scan
      ADD CONSTRAINT discovery_scan_apply_status_check
      CHECK (apply_status IN (
        'not_requested',
        'pending_apply',
        'applying',
        'applied',
        'failed',
        'dismissed',
        'not_applicable'
      ));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_discovery_scan_pending_review
  ON silver.discovery_scan (review_status, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_discovery_scan_apply_status
  ON silver.discovery_scan (apply_status, completed_at DESC);

CREATE TABLE IF NOT EXISTS silver.provider_certification_run (
  id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  run_id                TEXT NOT NULL UNIQUE,
  environment           TEXT NOT NULL,
  status                TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  triggered_by          TEXT NOT NULL CHECK (triggered_by IN ('schedule', 'agent', 'manual', 'automation')),
  requested_by          TEXT,
  catalog_count         INTEGER NOT NULL DEFAULT 0,
  provider_count        INTEGER NOT NULL DEFAULT 0,
  certified_count       INTEGER NOT NULL DEFAULT 0,
  degraded_count        INTEGER NOT NULL DEFAULT 0,
  blocked_count         INTEGER NOT NULL DEFAULT 0,
  review_only           BOOLEAN NOT NULL DEFAULT TRUE,
  notes                 TEXT,
  artifact_manifest_json JSONB,
  error_json            JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_provider_certification_run_created
  ON silver.provider_certification_run (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_provider_certification_run_status
  ON silver.provider_certification_run (status, created_at DESC);

CREATE TABLE IF NOT EXISTS silver.provider_certification_result (
  id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  run_id                TEXT NOT NULL REFERENCES silver.provider_certification_run(run_id) ON DELETE CASCADE,
  provider_id           TEXT NOT NULL,
  status                TEXT NOT NULL CHECK (status IN ('certified', 'degraded', 'blocked')),
  evidence_confidence   TEXT NOT NULL CHECK (evidence_confidence IN ('api', 'playwright', 'hybrid', 'static_fallback')),
  evidence_lane         TEXT NOT NULL CHECK (evidence_lane IN ('api', 'playwright', 'hybrid', 'static_fallback')),
  summary               TEXT,
  drift_reasons         TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  artifact_pointers_json JSONB,
  evidence_json         JSONB,
  discovery_scan_id     BIGINT REFERENCES silver.discovery_scan(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (run_id, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_provider_certification_result_provider
  ON silver.provider_certification_result (provider_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_provider_certification_result_status
  ON silver.provider_certification_result (status, created_at DESC);

COMMIT;
