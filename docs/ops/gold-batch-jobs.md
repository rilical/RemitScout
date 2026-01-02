# Gold Cache Batch Jobs

## Overview
Three batch jobs populate Gold cache tables from Silver data:
- `gold:popular-corridors`: updates `gold.popular_corridors` from `silver.recent_searches` and recent quotes.
- `gold:fx-rates`: updates `gold.fx_rates` with weighted FX averages.
- `gold:pulse-cache`: updates `gold.pulse_cache` entries used by the Pulse UI.

Each job uses distributed locking via Redis to avoid concurrent runs and supports graceful shutdown.

## How To Run
```bash
pnpm -C backend gold:popular-corridors
pnpm -C backend gold:fx-rates
pnpm -C backend gold:pulse-cache
```

## Environment Variables
- `GOLD_POPULAR_CORRIDORS_LOCK_TTL_SECONDS` (default: 600)
- `GOLD_FX_RATES_LOCK_TTL_SECONDS` (default: 300)
- `GOLD_PULSE_CACHE_LOCK_TTL_SECONDS` (default: 900)

## Recommended Schedules
- `gold:popular-corridors`: every 15-30 minutes
- `gold:fx-rates`: every 10-15 minutes
- `gold:pulse-cache`: every 15-30 minutes

## Monitoring
Each job logs:
- `job_start` with lock info
- `[entity]_processed` and `[entity]_inserted` or `[entity]_upserted`
- `job_complete` with duration
- `job_failed` and `job_fatal_error` on failure

Lock keys:
- `gold-popular-corridors-job`
- `gold-fx-rates-job`
- `gold-pulse-cache-job`

## Troubleshooting
- If a job exits immediately with `lock_already_held`, check Redis connectivity and ensure no stuck lock.
- If a job logs SQL errors, validate Silver data freshness and schema changes.
- If `gold:pulse-cache` is missing keys, verify each query output and confirm the Pulse defaults still include any fallback entries.
