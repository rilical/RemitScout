-- Migration 112: Aggressive autovacuum tuning for observation and quote_record
--
-- silver.observation and silver.quote_record are the two highest-write tables
-- in the system — every ingest cycle appends rows to both.  Migration 111
-- tuned autovacuum on six other hot tables but missed these two because they
-- are partitioned: settings on the parent do NOT retroactively propagate to
-- existing child partitions, and Postgres rejects these storage parameters on
-- the partitioned parent itself.
--
-- Strategy:
--   Loop over every existing partition (via pg_inherits + pg_class) and apply
--   the aggressive settings directly. Future partitions must be tuned by the
--   partition-creation path because the parent relation cannot carry these
--   storage parameters.
--
-- Scale factors chosen:
--   vacuum_scale_factor  = 0.02   (vacuum after 2% dead tuples)
--   analyze_scale_factor = 0.01   (re-analyze after 1% row changes)
--
-- These are more aggressive than the 0.05/0.02 used in migration 111 for
-- lower-write tables, reflecting the much higher write volume here.

-- ============================================================
-- silver.observation — existing partitions
-- ============================================================
DO $$
DECLARE
  v_partition TEXT;
BEGIN
  FOR v_partition IN
    SELECT n.nspname || '.' || c.relname
    FROM   pg_inherits  i
    JOIN   pg_class      c ON c.oid = i.inhrelid
    JOIN   pg_namespace  n ON n.oid = c.relnamespace
    WHERE  i.inhparent = 'silver.observation'::regclass
    ORDER  BY c.relname
  LOOP
    EXECUTE format(
      'ALTER TABLE %s SET (autovacuum_vacuum_scale_factor = 0.02, autovacuum_analyze_scale_factor = 0.01)',
      v_partition
    );
  END LOOP;
END;
$$;

-- ============================================================
-- silver.quote_record — existing partitions
-- ============================================================
DO $$
DECLARE
  v_partition TEXT;
BEGIN
  FOR v_partition IN
    SELECT n.nspname || '.' || c.relname
    FROM   pg_inherits  i
    JOIN   pg_class      c ON c.oid = i.inhrelid
    JOIN   pg_namespace  n ON n.oid = c.relnamespace
    WHERE  i.inhparent = 'silver.quote_record'::regclass
    ORDER  BY c.relname
  LOOP
    EXECUTE format(
      'ALTER TABLE %s SET (autovacuum_vacuum_scale_factor = 0.02, autovacuum_analyze_scale_factor = 0.01)',
      v_partition
    );
  END LOOP;
END;
$$;
