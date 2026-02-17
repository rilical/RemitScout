-- Extend export_job_type enum with indices export jobs.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'export_job_type'
      AND e.enumlabel = 'indices_csv'
  ) THEN
    ALTER TYPE export_job_type ADD VALUE 'indices_csv';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'export_job_type'
      AND e.enumlabel = 'indices_pdf'
  ) THEN
    ALTER TYPE export_job_type ADD VALUE 'indices_pdf';
  END IF;
END $$;
