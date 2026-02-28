---
name: remit-scout-silver-gold-reconciliation
description: Verify Silver and Gold data are in sync — no corridors dropped during aggregation, no quote counts diverging, no indices missing corridors that have Silver data. Catches silent data loss in the publish pipeline.
---

# Remit-Scout Silver↔Gold Data Reconciliation

## Overview

Data flows Bronze → Silver → Gold → Export. At each stage, data can be silently lost: a corridor might have 50 quotes in Silver but zero entries in Gold aggregates. The gold-reconciliation-job runs every 15 minutes, but nothing reads its output and acts on discrepancies. This skill closes that loop.

## Checks

### 1. Silver quote volume vs Gold aggregate inputs

```sql
-- Corridors with Silver data but missing from Gold aggregates
WITH silver_active AS (
  SELECT
    corridor_id,
    COUNT(*) AS silver_quotes,
    COUNT(DISTINCT provider_id) AS silver_providers,
    MAX(created_at) AS latest_silver
  FROM silver.quote_record
  WHERE created_at > NOW() - INTERVAL '24 hours'
    AND status = 'ok'
  GROUP BY corridor_id
),
gold_active AS (
  SELECT DISTINCT corridor_id
  FROM gold.indices_latest
  WHERE computed_at > NOW() - INTERVAL '24 hours'
)
SELECT
  c.send_country || '-' || c.receive_country AS corridor,
  sa.silver_quotes,
  sa.silver_providers,
  sa.latest_silver,
  CASE WHEN ga.corridor_id IS NULL THEN 'MISSING_FROM_GOLD' ELSE 'OK' END AS status
FROM silver_active sa
JOIN silver.corridor c ON c.id = sa.corridor_id
LEFT JOIN gold_active ga ON ga.corridor_id = sa.corridor_id
WHERE ga.corridor_id IS NULL
  AND sa.silver_providers >= 3
ORDER BY sa.silver_quotes DESC;
```

### 2. Gold publisher output vs Silver source

```sql
-- Compare published Gold corridors against Silver eligible corridors
WITH gold_published AS (
  SELECT corridor_id, COUNT(DISTINCT provider_id) AS gold_providers, MAX(updated_at) AS gold_latest
  FROM gold.corridor_history
  WHERE updated_at > NOW() - INTERVAL '24 hours'
  GROUP BY corridor_id
),
silver_eligible AS (
  SELECT
    qr.corridor_id,
    COUNT(DISTINCT qr.provider_id) AS silver_providers,
    MAX(qr.created_at) AS silver_latest
  FROM silver.quote_record qr
  JOIN silver.rights_matrix rm ON rm.corridor_id = qr.corridor_id AND rm.provider_id = qr.provider_id
  WHERE qr.created_at > NOW() - INTERVAL '24 hours'
    AND qr.status = 'ok'
    AND rm.allowed_b2b = true AND rm.status = 'production' AND rm.stoplist_status = 'active'
  GROUP BY qr.corridor_id
)
SELECT
  c.send_country || '-' || c.receive_country AS corridor,
  se.silver_providers,
  COALESCE(gp.gold_providers, 0) AS gold_providers,
  se.silver_providers - COALESCE(gp.gold_providers, 0) AS provider_gap,
  CASE
    WHEN gp.corridor_id IS NULL THEN 'NOT_PUBLISHED'
    WHEN se.silver_providers - gp.gold_providers > 2 THEN 'PROVIDER_DROP'
    ELSE 'OK'
  END AS status
FROM silver_eligible se
JOIN silver.corridor c ON c.id = se.corridor_id
LEFT JOIN gold_published gp ON gp.corridor_id = se.corridor_id
WHERE gp.corridor_id IS NULL OR se.silver_providers - COALESCE(gp.gold_providers, 0) > 2
ORDER BY provider_gap DESC;
```

### 3. Indices coverage vs Silver coverage

```sql
WITH silver_corridors AS (
  SELECT DISTINCT corridor_id FROM silver.quote_record
  WHERE created_at > NOW() - INTERVAL '24 hours' AND status = 'ok'
),
gold_indices_corridors AS (
  SELECT DISTINCT corridor_id FROM gold.indices_latest
  WHERE computed_at > NOW() - INTERVAL '24 hours'
)
SELECT
  (SELECT COUNT(*) FROM silver_corridors) AS silver_corridor_count,
  (SELECT COUNT(*) FROM gold_indices_corridors) AS gold_indices_corridor_count,
  (SELECT COUNT(*) FROM silver_corridors sc LEFT JOIN gold_indices_corridors gic ON gic.corridor_id = sc.corridor_id WHERE gic.corridor_id IS NULL) AS missing_from_indices;
```

### 4. Export table completeness vs Gold

```sql
WITH gold_corridors AS (
  SELECT DISTINCT corridor_id FROM gold.corridor_history WHERE updated_at > NOW() - INTERVAL '24 hours'
),
export_corridors AS (
  SELECT DISTINCT corridor_id FROM gold_export.corridor_history WHERE updated_at > NOW() - INTERVAL '24 hours'
)
SELECT
  (SELECT COUNT(*) FROM gold_corridors) AS gold_count,
  (SELECT COUNT(*) FROM export_corridors) AS export_count,
  (SELECT COUNT(*) FROM gold_corridors gc LEFT JOIN export_corridors ec ON ec.corridor_id = gc.corridor_id WHERE ec.corridor_id IS NULL) AS missing_from_export;
```

### 5. Reconciliation job output

```bash
aws logs filter-log-events \
  --log-group-name "/aws/lambda/${STACK_PREFIX}-gold-reconciliation" \
  --start-time $(($(date +%s) - 86400))000 \
  --filter-pattern "discrepancy" \
  --limit 20 \
  --query 'events[].message' --output text
```

## Output template

```
## Silver↔Gold Reconciliation — ${ENV}
Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)

### Pipeline Totals (24h)
| Stage | Corridors | Providers |
| Silver | <n> | <n> |
| Gold Published | <n> | <n> |
| Gold Indices | <n> | — |
| Export | <n> | — |

### Missing from Gold: <count> corridors
### Provider Drop (Silver > Gold by 2+): <count> corridors
### Missing from Indices: <count> corridors
### Missing from Export: <count> corridors

### Verdict: IN_SYNC | DATA_LOSS (<details>) | CRITICAL
```

## Central report integration

Write output to **Section 18: Data Reconciliation** in `ops/reports/daily-ops-report.md`.

## When to run
- **Every 4 hours (prod):** Match Gold publish cadence
- **Daily (dev/staging):** Pipeline wiring validation
- **After Gold job failures:** Verify data recovery
