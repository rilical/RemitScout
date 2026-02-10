-- Provider RPM guardrails
--
-- Prevents corrupted or runaway RPM values from being persisted and causing
-- uncontrolled cost/traffic.

-- Clamp any existing out-of-range values before enforcing constraints.
UPDATE silver.provider_rate_config
SET
  rpm = LEAST(GREATEST(rpm, 1), 100000),
  per_corridor_rpm = CASE
    WHEN per_corridor_rpm IS NULL THEN NULL
    ELSE LEAST(GREATEST(per_corridor_rpm, 1), 100000)
  END
WHERE
  rpm < 1
  OR rpm > 100000
  OR per_corridor_rpm IS NOT NULL AND (per_corridor_rpm < 1 OR per_corridor_rpm > 100000);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'silver.provider_rate_config'::regclass
       AND conname = 'provider_rate_config_rpm_check'
  ) THEN
    ALTER TABLE silver.provider_rate_config
      ADD CONSTRAINT provider_rate_config_rpm_check
      CHECK (rpm >= 1 AND rpm <= 100000);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'silver.provider_rate_config'::regclass
       AND conname = 'provider_rate_config_per_corridor_rpm_check'
  ) THEN
    ALTER TABLE silver.provider_rate_config
      ADD CONSTRAINT provider_rate_config_per_corridor_rpm_check
      CHECK (per_corridor_rpm IS NULL OR (per_corridor_rpm >= 1 AND per_corridor_rpm <= 100000));
  END IF;
END $$;

