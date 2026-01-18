-- Weekly alert frequencies and smart alert window fields

ALTER TABLE silver.corridor_signals
  ADD COLUMN IF NOT EXISTS best_window_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS best_window_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confidence INT,
  ADD COLUMN IF NOT EXISTS sample_days INT;

-- Normalize legacy alert frequencies
UPDATE silver.alert_rule
SET frequency = CASE
  WHEN metric = 'sendScore' THEN 'weekly'
  WHEN frequency IN ('realtime', 'hourly') THEN 'daily'
  ELSE frequency
END
WHERE frequency IN ('realtime', 'hourly') OR metric = 'sendScore';

-- Align cooldowns with new frequencies
UPDATE silver.alert_rule
SET cooldown_minutes = CASE
  WHEN frequency = 'weekly' THEN 10080
  WHEN frequency = 'daily' THEN 1440
  ELSE cooldown_minutes
END
WHERE frequency IN ('weekly', 'daily');

-- Drop existing frequency check constraint (if any) and replace
DO $$
DECLARE
  constraint_name TEXT;
  frequency_col SMALLINT;
BEGIN
  SELECT attnum
    INTO frequency_col
    FROM pg_attribute
   WHERE attrelid = 'silver.alert_rule'::regclass
     AND attname = 'frequency'
     AND NOT attisdropped;

  IF frequency_col IS NOT NULL THEN
    SELECT conname
      INTO constraint_name
      FROM pg_constraint
     WHERE conrelid = 'silver.alert_rule'::regclass
       AND contype = 'c'
       AND frequency_col = ANY (conkey)
     LIMIT 1;
  END IF;

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE silver.alert_rule DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE silver.alert_rule
  ADD CONSTRAINT alert_rule_frequency_check
  CHECK (frequency IN ('weekly', 'daily'));

ALTER TABLE silver.alert_rule
  ALTER COLUMN frequency SET DEFAULT 'weekly';
