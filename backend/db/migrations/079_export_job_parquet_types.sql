-- Extend export_job_type enum with parquet export jobs.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'export_job_type'
      AND e.enumlabel = 'history_parquet'
  ) THEN
    ALTER TYPE export_job_type ADD VALUE 'history_parquet';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'export_job_type'
      AND e.enumlabel = 'watchlist_parquet'
  ) THEN
    ALTER TYPE export_job_type ADD VALUE 'watchlist_parquet';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'export_job_type'
      AND e.enumlabel = 'alerts_parquet'
  ) THEN
    ALTER TYPE export_job_type ADD VALUE 'alerts_parquet';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'export_job_type'
      AND e.enumlabel = 'all_parquet'
  ) THEN
    ALTER TYPE export_job_type ADD VALUE 'all_parquet';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'export_job_type'
      AND e.enumlabel = 'indices_parquet'
  ) THEN
    ALTER TYPE export_job_type ADD VALUE 'indices_parquet';
  END IF;
END $$;
