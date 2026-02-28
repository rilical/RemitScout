---
name: remit-scout-fx-rate-anomaly-detector
description: Detect anomalies in OANDA FX rates — stale rates, sudden jumps, missing currency pairs, rate inversions. OANDA is the mid-market source of truth; if it's wrong, every TEER calculation is wrong.
---

# Remit-Scout FX Rate Anomaly Detector

## Overview

OANDA mid-market rates are the denominator in every TEER and cost_ratio calculation: `TEER = mid_market_rate * (1 - RCI)` and `FX_markup = ((send_amount - fee_amount) * (mid_market - implied_fx_rate)) / mid_market`. If OANDA returns a stale, inverted, or zero rate, every downstream index is corrupted.

## Checks

### 1. Stale rates (per currency pair)

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
ORDER BY age_hours DESC;
```

### 2. Rate jumps (> 2% change from previous)

```sql
WITH rate_changes AS (
  SELECT
    currency_pair,
    rate,
    rate_date,
    LAG(rate) OVER (PARTITION BY currency_pair ORDER BY rate_date) AS prev_rate,
    ABS(rate - LAG(rate) OVER (PARTITION BY currency_pair ORDER BY rate_date)) /
      NULLIF(LAG(rate) OVER (PARTITION BY currency_pair ORDER BY rate_date), 0) AS change_pct
  FROM gold.fx_rate_history
  WHERE rate_date >= CURRENT_DATE - 7
)
SELECT currency_pair, rate, prev_rate, ROUND(change_pct * 100, 2) AS change_pct, rate_date
FROM rate_changes
WHERE change_pct > 0.02
ORDER BY change_pct DESC;
```

### 3. Missing currency pairs (expected vs actual)

```sql
WITH expected_pairs AS (
  SELECT DISTINCT send_currency || '/' || receive_currency AS pair
  FROM silver.corridor c
  JOIN silver.corridor_tier_snapshot cts ON cts.corridor_id = c.id
  WHERE cts.version = 0
)
SELECT ep.pair
FROM expected_pairs ep
LEFT JOIN gold.fx_rates fx ON fx.currency_pair = ep.pair
WHERE fx.currency_pair IS NULL;
```

### 4. Rate inversions (pair and inverse should be reciprocal)

```sql
SELECT
  a.currency_pair AS pair_a,
  a.rate AS rate_a,
  b.currency_pair AS pair_b,
  b.rate AS rate_b,
  a.rate * b.rate AS product,
  ABS(a.rate * b.rate - 1) AS inversion_error
FROM gold.fx_rates a
JOIN gold.fx_rates b ON b.currency_pair = SPLIT_PART(a.currency_pair, '/', 2) || '/' || SPLIT_PART(a.currency_pair, '/', 1)
WHERE ABS(a.rate * b.rate - 1) > 0.01;
```

Product should be ~1.0. Deviation > 1% indicates a problem.

### 5. Zero or negative rates

```sql
SELECT currency_pair, rate, updated_at
FROM gold.fx_rates WHERE rate <= 0;

SELECT currency_pair, rate, rate_date
FROM gold.fx_rate_history WHERE rate <= 0 AND rate_date >= CURRENT_DATE - 30;
```

### 6. OANDA sync Lambda health

```bash
aws logs filter-log-events \
  --log-group-name "/aws/lambda/${STACK_PREFIX}-oanda-sync" \
  --start-time $(($(date +%s) - 86400))000 \
  --filter-pattern "ERROR" \
  --limit 10 \
  --query 'events[].message' --output text
```

## Output template

```
## FX Rate Anomaly Report — ${ENV}
Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)

### Stale Rates: <count> pairs > 6h old
### Rate Jumps (>2%): <count> in last 7 days
### Missing Pairs: <count>
### Rate Inversions: <count>
### Zero/Negative: <count>
### OANDA Sync Errors: <count>

### Verdict: CLEAN | STALE | ANOMALOUS | CRITICAL
```

## Central report integration

Write output to **Section 19: FX Rate Health** in `ops/reports/daily-ops-report.md`.

## When to run
- **Hourly (prod):** Match OANDA sync cadence
- **After OANDA sync Lambda runs:** Validate new data
- **Incident triage:** When TEER values look wrong
