-- Track data availability transitions for smart alert degradation notifications
ALTER TABLE silver.alert_state
  ADD COLUMN IF NOT EXISTS data_available BOOLEAN,
  ADD COLUMN IF NOT EXISTS data_unavailable_since TIMESTAMPTZ;

COMMENT ON COLUMN silver.alert_state.data_available IS
  'Whether the last evaluation had sufficient data. NULL = never evaluated for data availability. Used to detect data-dries-up transitions for sendScore alerts.';

COMMENT ON COLUMN silver.alert_state.data_unavailable_since IS
  'Timestamp when data first became unavailable (set on true→false transition). Cleared on recovery.';
