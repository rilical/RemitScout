-- Migration: 100_api_daily_usage_counter
-- Purpose: Persistent daily request counter for institutional client rate limiting.
-- The counter survives Redis failures so daily limits cannot be bypassed.

CREATE TABLE IF NOT EXISTS public.api_daily_usage_counter (
  client_id UUID NOT NULL REFERENCES public.institutional_client(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  request_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (client_id, usage_date)
);

CREATE INDEX IF NOT EXISTS api_daily_usage_counter_date_idx
  ON public.api_daily_usage_counter (usage_date);

GRANT SELECT, INSERT, UPDATE ON public.api_daily_usage_counter TO plane_a;
