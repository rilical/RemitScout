-- Persist stress signals so they survive engine restarts.
-- Signals are written through from the in-memory map and rehydrated on startup.

BEGIN;

CREATE TABLE silver.stress_signal (
  signal_id    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  corridor_id  TEXT          NOT NULL,
  signal_type  TEXT          NOT NULL,
  intensity    NUMERIC       NOT NULL CHECK (intensity >= 0 AND intensity <= 1),
  source       TEXT          NOT NULL,
  detected_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ   NOT NULL,
  metadata     JSONB         NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stress_signal_corridor
  ON silver.stress_signal (corridor_id, signal_type, detected_at DESC);

CREATE INDEX idx_stress_signal_expires
  ON silver.stress_signal (expires_at) WHERE expires_at > NOW();

GRANT SELECT, INSERT, DELETE ON silver.stress_signal TO plane_b;

COMMIT;
