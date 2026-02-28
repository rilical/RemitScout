---
name: remit-scout-provider-api-change-detector
description: Detect when provider APIs change their response structure, field names, or data format — before silent parser failures corrupt Silver data. Compares live responses against stored fixtures and type definitions.
---

# Remit-Scout Provider API Change Detector

## Overview

Providers change their websites and APIs without notice. When a provider's response structure changes, the parser may silently return wrong data (wrong field mapped to rate), empty data (new field name not recognized), or partial data (missing required fields). This skill detects structural changes by comparing live Bronze payloads against known-good fixtures and type definitions.

## Preconditions
- Database read access (Silver + Bronze S3 references)
- AWS S3 read access for Bronze payloads
- Access to `backend/plane-b/src/providers/` for parser and type files

## Detection methods

### Method 1: Response structure fingerprinting

For each provider, extract the JSON key structure from the latest Bronze payload and compare against the fixture/test expectation.

```bash
# For each provider, get latest Bronze object key
for provider in remitly westernunion worldremit instarem wirebarley alansari intermex xoom xe transfergo paysend pangea orbitremit koronapay remitbee ria dahabshiil sendwave mukuru wise wellsfargo; do
  LATEST_KEY=$(psql "$DB_URL" -t -c "
    SELECT bronze_object_key
    FROM silver.quote_record qr
    JOIN silver.provider p ON p.id = qr.provider_id
    WHERE p.slug = '${provider}' AND qr.status = 'ok'
    ORDER BY qr.collected_at DESC LIMIT 1;
  ")
  if [ -n "$LATEST_KEY" ]; then
    # Download and extract JSON structure (keys only)
    aws s3 cp "s3://${STACK_PREFIX}-bronze/${LATEST_KEY}" - 2>/dev/null | \
      jq -r '[paths | join(".")]' > "/tmp/schema_live_${provider}.json"

    # Compare against fixture if exists
    FIXTURE=$(ls "backend/plane-b/src/providers/${provider}/fixtures/"*.json 2>/dev/null | head -1)
    if [ -n "$FIXTURE" ]; then
      jq -r '[paths | join(".")]' "$FIXTURE" > "/tmp/schema_fixture_${provider}.json"
      DIFF=$(diff "/tmp/schema_fixture_${provider}.json" "/tmp/schema_live_${provider}.json" || true)
      if [ -n "$DIFF" ]; then
        echo "SCHEMA_CHANGE: ${provider}"
        echo "$DIFF"
      fi
    fi
  fi
done
```

### Method 2: Parser output field completeness

```sql
-- Check for quotes with NULL in fields that should never be NULL
SELECT
  p.slug AS provider,
  COUNT(*) AS total_quotes_1h,
  COUNT(*) FILTER (WHERE qr.implied_fx_rate IS NULL OR qr.implied_fx_rate = 0) AS null_rate,
  COUNT(*) FILTER (WHERE qr.receive_amount IS NULL OR qr.receive_amount = 0) AS null_receive,
  COUNT(*) FILTER (WHERE qr.fee_amount IS NULL) AS null_fee,
  COUNT(*) FILTER (WHERE qr.send_amount IS NULL OR qr.send_amount = 0) AS null_send,
  COUNT(*) FILTER (WHERE qr.quality_flags ? 'parse_error') AS parse_errors,
  COUNT(*) FILTER (WHERE qr.quality_flags ? 'partial_data') AS partial_data,
  ROUND(100.0 * COUNT(*) FILTER (WHERE qr.quality_flags ? 'parse_error') / NULLIF(COUNT(*), 0), 1) AS parse_error_pct
FROM silver.quote_record qr
JOIN silver.provider p ON p.id = qr.provider_id
WHERE qr.created_at > NOW() - INTERVAL '1 hour'
GROUP BY p.slug
HAVING COUNT(*) FILTER (WHERE qr.quality_flags ? 'parse_error') > 0
    OR COUNT(*) FILTER (WHERE qr.implied_fx_rate IS NULL OR qr.implied_fx_rate = 0) > 0
ORDER BY parse_error_pct DESC;
```

### Method 3: Ingestion error rate spike

```sql
-- Compare current error rate vs 7-day baseline per provider
WITH current_hour AS (
  SELECT
    provider_id,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE error_message IS NOT NULL) AS errors
  FROM silver.ingestion_run
  WHERE started_at > NOW() - INTERVAL '1 hour'
  GROUP BY provider_id
),
baseline AS (
  SELECT
    provider_id,
    ROUND(AVG(daily_errors), 0) AS avg_daily_errors,
    ROUND(STDDEV(daily_errors), 0) AS std_daily_errors
  FROM (
    SELECT provider_id, DATE(started_at) AS day, COUNT(*) FILTER (WHERE error_message IS NOT NULL) AS daily_errors
    FROM silver.ingestion_run
    WHERE started_at > NOW() - INTERVAL '7 days'
    GROUP BY provider_id, DATE(started_at)
  ) d
  GROUP BY provider_id
)
SELECT
  p.slug,
  ch.total AS runs_1h,
  ch.errors AS errors_1h,
  b.avg_daily_errors AS baseline_daily_errors,
  CASE
    WHEN ch.errors > b.avg_daily_errors + 3 * COALESCE(b.std_daily_errors, 1) THEN 'SPIKE'
    WHEN ch.errors > 0 AND b.avg_daily_errors = 0 THEN 'NEW_ERRORS'
    ELSE 'NORMAL'
  END AS status
FROM current_hour ch
JOIN silver.provider p ON p.id = ch.provider_id
LEFT JOIN baseline b ON b.provider_id = ch.provider_id
WHERE ch.errors > 0
ORDER BY ch.errors DESC;
```

### Method 4: Type definition vs live response diff

```bash
# Check parser types match live response fields
for provider in remitly wise xe westernunion worldremit; do
  TYPES_FILE="backend/plane-b/src/providers/${provider}/types.ts"
  if [ -f "$TYPES_FILE" ]; then
    # Extract expected field names from TypeScript types
    rg -o "(\w+)\s*[?:]" "$TYPES_FILE" | sort -u > "/tmp/types_${provider}.txt"
    # Compare against live schema
    if [ -f "/tmp/schema_live_${provider}.json" ]; then
      jq -r '.[]' "/tmp/schema_live_${provider}.json" | sort -u > "/tmp/live_${provider}.txt"
      NEW_FIELDS=$(comm -13 "/tmp/types_${provider}.txt" "/tmp/live_${provider}.txt" | head -20)
      REMOVED_FIELDS=$(comm -23 "/tmp/types_${provider}.txt" "/tmp/live_${provider}.txt" | head -20)
      if [ -n "$NEW_FIELDS" ] || [ -n "$REMOVED_FIELDS" ]; then
        echo "TYPE_DRIFT: ${provider} new_fields=${NEW_FIELDS} removed_fields=${REMOVED_FIELDS}"
      fi
    fi
  fi
done
```

## Output template

```
## Provider API Change Report — ${ENV}
Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)

### Schema Changes Detected
| Provider | Change Type | Details | Impact |
(table rows)

### Parse Error Spikes
| Provider | Quotes 1h | Parse Errors | Error % | Baseline |
(table rows)

### Ingestion Error Spikes
| Provider | Runs 1h | Errors 1h | Baseline Daily | Status |
(table rows)

### Verdict: NO_CHANGES | CHANGES_DETECTED | CRITICAL (<providers>)
### Actions needed: (list parser.ts files to update)
```

## Central report integration

Write output to **Section 16: Provider API Changes** in `ops/reports/daily-ops-report.md`.

## When to run
- **Every 4 hours:** Match provider weighting cadence
- **After sweep cycle:** Detect changes from latest collection
- **After provider parser PR:** Validate no regressions
