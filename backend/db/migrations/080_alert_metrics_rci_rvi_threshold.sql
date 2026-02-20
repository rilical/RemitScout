-- Extend alert metrics to support Gold index threshold alerts.
-- rci_threshold is expressed as percent (e.g. 1.2 for 1.2%).
-- rvi_threshold is expressed in bps.

DO $$
DECLARE
  constraint_name TEXT;
  metric_col SMALLINT;
BEGIN
  SELECT attnum
    INTO metric_col
    FROM pg_attribute
   WHERE attrelid = 'silver.alert_rule'::regclass
     AND attname = 'metric'
     AND NOT attisdropped;

  IF metric_col IS NOT NULL THEN
    SELECT conname
      INTO constraint_name
      FROM pg_constraint
     WHERE conrelid = 'silver.alert_rule'::regclass
       AND contype = 'c'
       AND metric_col = ANY (conkey)
     LIMIT 1;
  END IF;

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE silver.alert_rule DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE silver.alert_rule
  ADD CONSTRAINT alert_rule_metric_check
  CHECK (
    metric IN (
      'rate',
      'recipientGets',
      'totalCost',
      'fee',
      'index',
      'midMarketRate',
      'sendScore',
      'rci_threshold',
      'rvi_threshold'
    )
  );
