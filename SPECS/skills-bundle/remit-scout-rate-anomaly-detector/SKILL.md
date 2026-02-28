---
name: remit-scout-rate-anomaly-detector
description: Detect and quarantine anomalous quotes (poisoned rates, fee spikes, impossible receive amounts) before they corrupt Gold indices. Runs across ALL tiers and providers, not just tier-1. Includes Codex prompt to diagnose and fix the root cause.
---

# Remit-Scout Rate & Pricing Anomaly Detector

## Overview

If a provider returns garbage data (rate of 0.01 instead of 17.5, zero fees, impossible receive amounts), that data flows through Silver, enters Gold weighting, and poisons TEER/RCI/RVI for every corridor it touches. The existing anomaly detector only runs for tier-1, only checks `implied_fx_rate`, and only alerts — it does not quarantine. This skill catches anomalies across ALL tiers and ALL providers, diagnoses the root cause, and triggers automated fixes.

## Why this is existential

- `TEER = mid_market_rate * (1 - RCI)` — one bad quote in the weighted RCI poisons TEER
- `RVI = weighted stdev of effective_rate` — one outlier explodes the dispersion metric
- Provider weighting only *downweights* via `spreadScore`, it does NOT reject
- Gold outlier suppression runs AFTER aggregation — too late, the weighted average is already distorted
- A single corrupted `implied_fx_rate` in a low-provider corridor (3 providers) contributes 33% of the index

## What exists today (and its gaps)

| Component | What it does | Gap |
|-----------|-------------|-----|
| `anomaly-detector.ts` | Z-score > 2 on `implied_fx_rate`, 24h baseline | Only tier-1 collectors; only alerts, no quarantine |
| `gold-indices-job.ts` outlier | Suppress if TEER vs mid-market ratio < 0.5 or > 2.0 | Post-aggregation; already corrupted the weighted inputs |
| `provider-weighting-job.ts` spread_score | Downweights providers far from median | Doesn't reject; a very bad quote still has non-zero weight |
| `quality-flags.ts` | Parse/business flags | No rate-anomaly flag |

## Detection rules

### Rule 1: Implied FX rate vs corridor rolling median (z-score)

```sql
WITH baseline AS (
  SELECT
    corridor_id,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY implied_fx_rate) AS median_rate,
    STDDEV(implied_fx_rate) AS std_rate,
    AVG(implied_fx_rate) AS avg_rate,
    COUNT(*) AS sample_count
  FROM silver.quote_record
  WHERE created_at > NOW() - INTERVAL '7 days'
    AND status = 'ok'
    AND implied_fx_rate > 0
  GROUP BY corridor_id
  HAVING COUNT(*) >= 10
)
SELECT
  qr.quote_id,
  p.slug AS provider,
  c.send_country || '-' || c.receive_country AS corridor,
  qr.implied_fx_rate,
  b.median_rate,
  b.std_rate,
  ABS(qr.implied_fx_rate - b.median_rate) / NULLIF(b.std_rate, 0) AS z_score,
  'RATE_ZSCORE' AS anomaly_type
FROM silver.quote_record qr
JOIN silver.provider p ON p.id = qr.provider_id
JOIN silver.corridor c ON c.id = qr.corridor_id
JOIN baseline b ON b.corridor_id = qr.corridor_id
WHERE qr.created_at > NOW() - INTERVAL '1 hour'
  AND qr.status = 'ok'
  AND b.std_rate > 0
  AND ABS(qr.implied_fx_rate - b.median_rate) / b.std_rate > 3.0
ORDER BY z_score DESC;
```

Threshold: z-score > 3.0 (configurable). Flag if > 3, quarantine if > 5.

### Rule 2: Implied FX rate vs OANDA mid-market rate

```sql
SELECT
  qr.quote_id,
  p.slug AS provider,
  c.send_country || '-' || c.receive_country AS corridor,
  c.send_currency || '/' || c.receive_currency AS pair,
  qr.implied_fx_rate,
  COALESCE(fxh.rate, fx.rate) AS mid_market_rate,
  ABS(qr.implied_fx_rate - COALESCE(fxh.rate, fx.rate)) / NULLIF(COALESCE(fxh.rate, fx.rate), 0) AS deviation_pct,
  CASE
    WHEN qr.implied_fx_rate / NULLIF(COALESCE(fxh.rate, fx.rate), 0) < 0.5 THEN 'RATE_TOO_LOW'
    WHEN qr.implied_fx_rate / NULLIF(COALESCE(fxh.rate, fx.rate), 0) > 2.0 THEN 'RATE_TOO_HIGH'
    WHEN ABS(qr.implied_fx_rate - COALESCE(fxh.rate, fx.rate)) / NULLIF(COALESCE(fxh.rate, fx.rate), 0) > 0.15 THEN 'RATE_DEVIATION'
    ELSE 'OK'
  END AS anomaly_type
FROM silver.quote_record qr
JOIN silver.provider p ON p.id = qr.provider_id
JOIN silver.corridor c ON c.id = qr.corridor_id
LEFT JOIN gold.fx_rate_history fxh
  ON fxh.currency_pair = c.send_currency || '/' || c.receive_currency
  AND fxh.rate_date = DATE(qr.collected_at)
LEFT JOIN gold.fx_rates fx
  ON fx.currency_pair = c.send_currency || '/' || c.receive_currency
WHERE qr.created_at > NOW() - INTERVAL '1 hour'
  AND qr.status = 'ok'
  AND (
    qr.implied_fx_rate / NULLIF(COALESCE(fxh.rate, fx.rate), 0) < 0.5
    OR qr.implied_fx_rate / NULLIF(COALESCE(fxh.rate, fx.rate), 0) > 2.0
    OR ABS(qr.implied_fx_rate - COALESCE(fxh.rate, fx.rate)) / NULLIF(COALESCE(fxh.rate, fx.rate), 0) > 0.15
  )
ORDER BY deviation_pct DESC;
```

### Rule 3: Fee anomalies

```sql
WITH fee_baseline AS (
  SELECT
    corridor_id,
    provider_id,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY fee_amount) AS median_fee,
    STDDEV(fee_amount) AS std_fee,
    AVG(fee_amount) AS avg_fee
  FROM silver.quote_record
  WHERE created_at > NOW() - INTERVAL '7 days'
    AND status = 'ok'
    AND fee_amount >= 0
  GROUP BY corridor_id, provider_id
  HAVING COUNT(*) >= 5
)
SELECT
  qr.quote_id,
  p.slug AS provider,
  c.send_country || '-' || c.receive_country AS corridor,
  qr.fee_amount,
  fb.median_fee,
  CASE
    WHEN qr.fee_amount = 0 AND fb.median_fee > 1 THEN 'FEE_SUDDENLY_ZERO'
    WHEN fb.std_fee > 0 AND ABS(qr.fee_amount - fb.median_fee) / fb.std_fee > 3.0 THEN 'FEE_ZSCORE'
    WHEN fb.median_fee > 0 AND qr.fee_amount > fb.median_fee * 5 THEN 'FEE_SPIKE'
  END AS anomaly_type
FROM silver.quote_record qr
JOIN silver.provider p ON p.id = qr.provider_id
JOIN silver.corridor c ON c.id = qr.corridor_id
JOIN fee_baseline fb ON fb.corridor_id = qr.corridor_id AND fb.provider_id = qr.provider_id
WHERE qr.created_at > NOW() - INTERVAL '1 hour'
  AND qr.status = 'ok'
  AND (
    (qr.fee_amount = 0 AND fb.median_fee > 1)
    OR (fb.std_fee > 0 AND ABS(qr.fee_amount - fb.median_fee) / fb.std_fee > 3.0)
    OR (fb.median_fee > 0 AND qr.fee_amount > fb.median_fee * 5)
  )
ORDER BY anomaly_type;
```

### Rule 4: Impossible amounts (receive_amount sanity)

```sql
SELECT
  qr.quote_id,
  p.slug AS provider,
  c.send_country || '-' || c.receive_country AS corridor,
  qr.send_amount,
  qr.receive_amount,
  qr.fee_amount,
  qr.implied_fx_rate,
  CASE
    WHEN qr.receive_amount <= 0 THEN 'ZERO_RECEIVE'
    WHEN qr.receive_amount > qr.send_amount * 1000 THEN 'RECEIVE_TOO_HIGH'
    WHEN qr.send_amount > 0 AND qr.receive_amount < qr.send_amount * 0.01 THEN 'RECEIVE_TOO_LOW'
    WHEN qr.fee_amount < 0 THEN 'NEGATIVE_FEE'
    WHEN qr.fee_amount > qr.send_amount THEN 'FEE_EXCEEDS_SEND'
    WHEN qr.total_debit_amount < qr.send_amount THEN 'DEBIT_LESS_THAN_SEND'
  END AS anomaly_type
FROM silver.quote_record qr
JOIN silver.provider p ON p.id = qr.provider_id
JOIN silver.corridor c ON c.id = qr.corridor_id
WHERE qr.created_at > NOW() - INTERVAL '1 hour'
  AND qr.status = 'ok'
  AND (
    qr.receive_amount <= 0
    OR qr.receive_amount > qr.send_amount * 1000
    OR (qr.send_amount > 0 AND qr.receive_amount < qr.send_amount * 0.01)
    OR qr.fee_amount < 0
    OR qr.fee_amount > qr.send_amount
    OR qr.total_debit_amount < qr.send_amount
  );
```

### Rule 5: Provider-wide anomaly (all corridors from one provider are off)

```sql
WITH provider_anomaly_rate AS (
  SELECT
    p.slug AS provider,
    COUNT(*) AS total_quotes_1h,
    COUNT(*) FILTER (WHERE
      ABS(qr.implied_fx_rate - b.median_rate) / NULLIF(b.std_rate, 0) > 3.0
    ) AS anomalous_quotes
  FROM silver.quote_record qr
  JOIN silver.provider p ON p.id = qr.provider_id
  JOIN (
    SELECT corridor_id,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY implied_fx_rate) AS median_rate,
      STDDEV(implied_fx_rate) AS std_rate
    FROM silver.quote_record
    WHERE created_at > NOW() - INTERVAL '7 days' AND status = 'ok' AND implied_fx_rate > 0
    GROUP BY corridor_id HAVING COUNT(*) >= 10
  ) b ON b.corridor_id = qr.corridor_id
  WHERE qr.created_at > NOW() - INTERVAL '1 hour'
    AND qr.status = 'ok'
    AND b.std_rate > 0
  GROUP BY p.slug
)
SELECT
  provider,
  total_quotes_1h,
  anomalous_quotes,
  ROUND(100.0 * anomalous_quotes / NULLIF(total_quotes_1h, 0), 1) AS anomaly_pct
FROM provider_anomaly_rate
WHERE anomalous_quotes > 0
  AND 100.0 * anomalous_quotes / NULLIF(total_quotes_1h, 0) > 20
ORDER BY anomaly_pct DESC;
```

If > 20% of a provider's quotes in the last hour are anomalous, the entire provider is suspect.

## Impact assessment

For each anomaly found, assess Gold indices impact:

```sql
-- How much weight does this provider have in affected corridors?
SELECT
  p.slug,
  pws.corridor_id,
  c.send_country || '-' || c.receive_country AS corridor,
  pws.raw_weight,
  pws.normalized_weight,
  pws.weight_confidence,
  CASE
    WHEN pws.normalized_weight > 0.3 THEN 'HIGH_IMPACT'
    WHEN pws.normalized_weight > 0.1 THEN 'MEDIUM_IMPACT'
    ELSE 'LOW_IMPACT'
  END AS impact
FROM gold.provider_weight_snapshot pws
JOIN silver.provider p ON p.id = pws.provider_id
JOIN silver.corridor c ON c.id = pws.corridor_id
WHERE p.slug = '<anomalous_provider>'
  AND pws.snapshot_date >= CURRENT_DATE - 1
ORDER BY pws.normalized_weight DESC;
```

## Output template

```
## Rate Anomaly Report — ${ENV}
Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)
Window: last 1 hour

### Anomalies Found
| Quote ID | Provider | Corridor | Type | Value | Baseline | Z-Score/Deviation | Impact |
(table rows)

### Provider-Wide Anomalies
| Provider | Quotes 1h | Anomalous | % | Action |
(table rows)

### Summary
- Total quotes (1h): <n>
- Anomalous quotes: <n> (<pct>%)
- Providers affected: <list>
- Corridors affected: <list>
- High-impact corridors (provider weight > 0.3): <list>

### Verdict: CLEAN | ANOMALIES_DETECTED | PROVIDER_COMPROMISED
### Actions needed: (list)
```

## Self-healing integration

| Anomaly | Classification | Auto-fixable? | Action |
|---------|---------------|--------------|--------|
| Single quote z-score > 5 | DATA_FIX | Yes | Quarantine quote (set status='quarantined') |
| Provider > 20% anomalous | PROVIDER_DOWN | Partial | Auto-stoplist, diagnose parser |
| Fee suddenly zero | CODE_FIX | Maybe | Check parser for changed API response |
| Impossible amounts | CODE_FIX | Maybe | Check normalizer for new edge case |
| Rate deviation > 15% from mid-market | DATA_FIX | No | Flag for manual review |

## Central report integration

Write output to **Section 15: Rate Anomalies** in `ops/reports/daily-ops-report.md`. Update Executive Summary with verdict.

---

## Codex Prompt: Diagnose and Fix Rate Anomaly (copy-paste into Codex automation)

```
You are the Remit-Scout rate anomaly fixer. A rate anomaly has been detected.

## Context
- Read `ARCHITECTURE.md` for system invariants (especially: "Pulse endpoints must never fabricate freshness timestamps or demo values")
- Read `agents/rag/data-lineage.md` and `agents/rag/plane-b-ingest-collectors.md`
- The anomaly detector found quotes with anomalous rates. Your job is to diagnose WHY and fix the root cause.

## Input (provided by the anomaly detector)
- Provider: ${PROVIDER_SLUG}
- Corridor: ${CORRIDOR}
- Anomaly type: ${ANOMALY_TYPE} (RATE_ZSCORE | RATE_DEVIATION | FEE_SUDDENLY_ZERO | FEE_SPIKE | ZERO_RECEIVE | RECEIVE_TOO_HIGH | PROVIDER_COMPROMISED)
- Anomalous value: ${VALUE}
- Baseline value: ${BASELINE}
- Z-score or deviation: ${ZSCORE_OR_DEVIATION}

## Diagnosis steps (execute in order)

### Step 1: Check if the provider's API response changed
Read the provider's parser: `backend/plane-b/src/providers/${PROVIDER_SLUG}/parser.ts`
Read the provider's types: `backend/plane-b/src/providers/${PROVIDER_SLUG}/types.ts`

Look for:
- Hardcoded field names that might have changed in the provider's API
- Missing null checks on amount/rate fields
- Division by zero or NaN propagation in rate calculation

### Step 2: Check recent Bronze payloads
Query the latest raw payload from this provider:
```sql
SELECT bronze_object_key, collected_at
FROM silver.quote_record
WHERE provider_id = (SELECT id FROM silver.provider WHERE slug = '${PROVIDER_SLUG}')
  AND corridor_id = '${CORRIDOR_ID}'
ORDER BY collected_at DESC LIMIT 5;
```
Read the Bronze S3 object to see what the provider actually returned.
Compare the raw response structure against what the parser expects.

### Step 3: Check the normalizer
Read: `backend/plane-b/src/normalize/quote-normalizer.ts`
Verify `implied_fx_rate` derivation: is `receive_amount / send_amount` producing the expected result?
Check if `promotional_rate` or `base_rate` override is activating incorrectly.

### Step 4: Check for provider API changes
Compare the current raw payload against the fixture files:
`backend/plane-b/src/providers/${PROVIDER_SLUG}/fixtures/` (if they exist)
Or compare against `backend/tests/${PROVIDER_SLUG}-*.test.ts` mock data.

### Step 5: Determine root cause
Classify as one of:
- **PARSER_BROKEN**: Provider changed their API response format → fix parser.ts
- **NORMALIZER_BUG**: Edge case in quote-normalizer.ts → fix normalizer
- **PROVIDER_API_DOWN**: Provider returning error/empty data → auto-stoplist
- **PROVIDER_PROMO_CHANGE**: Provider introduced a promotion that looks anomalous → acceptable, update baseline
- **FX_DATA_STALE**: Mid-market rate is stale making deviation look worse → fix OANDA sync
- **LEGITIMATE_CHANGE**: Provider genuinely changed pricing → update baseline, no fix needed

### Step 6: Apply fix

If PARSER_BROKEN:
1. Read the raw Bronze payload to understand new format
2. Update `backend/plane-b/src/providers/${PROVIDER_SLUG}/parser.ts` to handle new format
3. Update `backend/plane-b/src/providers/${PROVIDER_SLUG}/types.ts` if needed
4. Update tests in `backend/tests/${PROVIDER_SLUG}-*.test.ts`
5. Run: `pnpm -C backend test --run --grep "${PROVIDER_SLUG}"`
6. If tests pass: create branch, commit, push PR

If NORMALIZER_BUG:
1. Fix the edge case in `backend/plane-b/src/normalize/quote-normalizer.ts`
2. Add a test case to `backend/tests/` for this specific scenario
3. Run: `pnpm -C backend test --run`
4. Create branch, commit, push PR

If PROVIDER_API_DOWN:
1. Auto-stoplist:
```sql
UPDATE silver.rights_matrix
SET stoplist_status = 'paused', stoplist_notes = 'auto_paused:anomalous_rates_${ANOMALY_TYPE}'
WHERE provider_id = (SELECT id FROM silver.provider WHERE slug = '${PROVIDER_SLUG}')
  AND stoplist_status = 'active';
```
2. Log in Self-Healing Log
3. stoplist-auto-resume will re-enable after cooldown

### Step 7: Quarantine affected quotes
For quotes with z-score > 5 or impossible amounts:
```sql
UPDATE silver.quote_record
SET status = 'quarantined', quality_flags = COALESCE(quality_flags, '{}'::jsonb) || '{"rate_anomaly": true}'::jsonb
WHERE quote_id IN (${ANOMALOUS_QUOTE_IDS})
  AND status = 'ok';
```

### Step 8: Validate fix
After fix is applied:
1. Wait for next collection cycle
2. Run this anomaly detector again
3. Verify no new anomalies from this provider
4. Verify Gold indices are producing reasonable values

## Output
Return:
- Root cause classification
- Fix applied (with file paths and changes)
- Quotes quarantined (count)
- Provider stoplisted (yes/no)
- PR link (if code fix)
- Validation status

## Guardrails
- NEVER delete quote data — only quarantine (set status, add quality flag)
- NEVER modify Gold data directly — let the pipeline recompute
- ALWAYS run tests before committing
- ALWAYS create a feature branch, never push to develop
- If unsure about root cause, flag for manual review instead of auto-fixing
```

## When to run
- **Every 15 minutes (prod):** Catch anomalies within one collection cycle
- **After provider onboarding:** Validate new provider's data quality
- **After parser changes:** Confirm no regressions
- **Incident triage:** When indices look wrong, start here
