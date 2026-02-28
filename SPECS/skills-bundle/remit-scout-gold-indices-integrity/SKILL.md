---
name: remit-scout-gold-indices-integrity
description: Verify Gold indices (TEER/RCI/RVI) are computing correctly — FX rates fresh, weighting snapshots populated, indices values reasonable, and export tables filled. Use for data integrity audits, post-deploy validation, and SLO compliance.
---

# Remit-Scout Gold Indices Integrity

## Overview

End-to-end verification of the Gold indices pipeline: OANDA FX rates sync, provider weighting snapshots, TEER/RCI/RVI computation, and export table population. Catches stale FX data, broken weighting jobs, missing indices, and export gaps before they reach customers.

## Preconditions
- Database read access to Gold schema
- AWS CLI for Lambda invocation logs
- `AWS_PROFILE` and `AWS_REGION` set

## Environment selection

```bash
# Dev
export ENV=dev AWS_PROFILE=rs-dev STACK_PREFIX=remit-scout-dev

# Staging / Prod (same pattern)
export ENV=prod AWS_PROFILE=rs-prod STACK_PREFIX=remit-scout-prod
```

## Checks

### 1. FX rates freshness (OANDA sync)

```sql
SELECT
  currency_pair,
  rate,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - updated_at)) / 3600 AS age_hours,
  CASE
    WHEN updated_at > NOW() - INTERVAL '2 hours' THEN 'FRESH'
    WHEN updated_at > NOW() - INTERVAL '6 hours' THEN 'STALE'
    ELSE 'CRITICAL'
  END AS status
FROM gold.fx_rates
ORDER BY age_hours DESC
LIMIT 20;
```

SLO: All rates < 2 hours old. Config gate: `GOLD_INDICES_FX_MAX_AGE_HOURS` (default: 6).

### 2. FX rate history coverage

```sql
SELECT
  COUNT(*) AS total_rows,
  COUNT(DISTINCT currency_pair) AS pairs,
  MIN(rate_date) AS earliest,
  MAX(rate_date) AS latest,
  MAX(rate_date) = CURRENT_DATE AS today_covered
FROM gold.fx_rate_history;
```

### 3. Provider weighting snapshots

```sql
SELECT
  snapshot_date,
  COUNT(*) AS weight_rows,
  COUNT(DISTINCT provider_id) AS providers,
  COUNT(DISTINCT corridor_id) AS corridors,
  AVG(weight_confidence) AS avg_confidence,
  MIN(weight_confidence) AS min_confidence,
  PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY weight_confidence) AS p10_confidence
FROM gold.provider_weight_snapshot
WHERE snapshot_date >= CURRENT_DATE - 7
GROUP BY snapshot_date
ORDER BY snapshot_date DESC;
```

SLO: `p10_confidence >= 0.30`.

### 4. Indices computation (TEER/RCI/RVI)

```sql
SELECT
  index_type,
  method_profile,
  COUNT(*) AS corridor_count,
  AVG(value) AS avg_value,
  MIN(computed_at) AS oldest_computation,
  MAX(computed_at) AS newest_computation,
  EXTRACT(EPOCH FROM (NOW() - MAX(computed_at))) / 3600 AS newest_age_hours
FROM gold.indices_latest
GROUP BY index_type, method_profile
ORDER BY index_type, method_profile;
```

Expected: TEER, RCI, RVI each with method profiles `cash_pickup`, `standard_bank`, `standard_card`.

### 5. Indices readiness (Tier-0 SLO)

```sql
SELECT
  slo_date,
  available_ratio,
  suppressed_ratio,
  weight_confidence_p10,
  CASE
    WHEN available_ratio >= 0.80
      AND suppressed_ratio <= 0.20
      AND weight_confidence_p10 >= 0.30 THEN 'PASS'
    ELSE 'FAIL'
  END AS slo_status
FROM gold_export.cdp_daily
WHERE slo_date >= CURRENT_DATE - 7
ORDER BY slo_date DESC;
```

### 6. Export tables populated

```sql
SELECT
  'corridor_history' AS table_name,
  COUNT(*) AS rows,
  MAX(updated_at) AS latest
FROM gold_export.corridor_history
UNION ALL
SELECT
  'indices_series',
  COUNT(*),
  MAX(computed_at)
FROM gold_export.indices_series
UNION ALL
SELECT
  'popular_corridors',
  COUNT(*),
  MAX(updated_at)
FROM gold.popular_corridors;
```

### 7. Gold job Lambda health

```bash
for job in gold-indices gold-publisher gold-popular-corridors gold-pulse-cache gold-reconciliation gold-fx-rates provider-weighting oanda-sync; do
  LAST_ERROR=$(aws logs filter-log-events \
    --log-group-name "/aws/lambda/${STACK_PREFIX}-${job}" \
    --start-time $(($(date +%s) - 86400))000 \
    --filter-pattern "ERROR" \
    --limit 3 \
    --query 'events[].message' --output text 2>/dev/null)
  echo "${job}: ${LAST_ERROR:-NO_ERRORS_24H}"
done
```

### 8. Data-health-SLO job output

```bash
aws cloudwatch get-metric-statistics \
  --namespace "RemitScout/DataHealth" \
  --metric-name "freshness_p95_tier1" \
  --start-time "$(date -u -v-24H +%Y-%m-%dT%H:%M:%SZ)" \
  --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --period 3600 --statistics Average --output table
```

## Output template

```
## Gold Indices Integrity — ${ENV}
Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)

### FX Rates
- Total pairs: <n>
- Freshest: <pair> (<age>)
- Stalest: <pair> (<age>)
- Status: FRESH | STALE | CRITICAL

### Weighting Snapshots (last 7d)
| Date | Weights | Providers | Corridors | Avg Confidence | P10 Confidence |
(table rows)

### Indices
| Type | Profile | Corridors | Avg Value | Newest Age (h) |
(table rows)

### Indices SLO (last 7d)
| Date | Available | Suppressed | Confidence P10 | Status |
(table rows)

### Export Tables
| Table | Rows | Latest Update |
(table rows)

### Lambda Errors (24h): <count>
### Verdict: HEALTHY | DEGRADED | CRITICAL
### Actions needed: (list)
```

## When to run
- **Every 4 hours (prod):** Match gold-indices job cadence
- **Daily (dev/staging):** Catch stale FX or broken jobs
- **Post-deploy:** Confirm indices pipeline is producing
- **Incident triage:** Pinpoint where the pipeline broke

## Central report integration

Write output to **Section 5: Gold Indices Pipeline** in `ops/reports/daily-ops-report.md`. Update Executive Summary row for "Gold Indices Pipeline" with the verdict.

## Runbooks
- `docs/runbooks/indices-readiness.md`
