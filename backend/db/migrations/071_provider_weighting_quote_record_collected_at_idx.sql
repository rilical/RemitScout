-- Provider-weighting performance index
--
-- Provider-weighting scans recent `silver.quote_record` rows across *all* corridors.
-- Existing quote_record indexes lead with `corridor_id`, which does not help time-window scans.

CREATE INDEX IF NOT EXISTS quote_record_collected_at_ok_idx
  ON silver.quote_record (collected_at DESC)
  WHERE status = 'ok'
    AND implied_fx_rate IS NOT NULL
    AND implied_fx_rate > 0;

