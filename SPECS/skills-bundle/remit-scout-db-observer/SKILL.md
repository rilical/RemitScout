---
name: remit-scout-db-observer
description: Continuous database health observation — monitor Bronze/Silver/Gold pipeline throughput, connection pool health, table growth, vacuum stats, and long-running queries. Use as a persistent watchdog replacing a dedicated DBA.
---

# Remit-Scout DB Observer

## Overview

Long-running database health monitor that watches the full Bronze → Silver → Gold data pipeline. Designed to run continuously or on-schedule to detect pipeline stalls, connection exhaustion, table bloat, and data integrity issues before they cascade.

## Preconditions
- Database read access (all schemas: bronze, silver, gold, gold_export)
- For AWS RDS metrics: AWS CLI + `AWS_PROFILE`
- Connection string via `DATABASE_URL` or environment-specific proxy endpoint

## Environment selection

```bash
# Dev
export ENV=dev DB_HOST="<dev-rds-proxy>" AWS_PROFILE=rs-dev

# Staging
export ENV=staging DB_HOST="<staging-rds-proxy>" AWS_PROFILE=rs-staging

# Prod
export ENV=prod DB_HOST="<prod-rds-proxy>" AWS_PROFILE=rs-prod
```

## Observation checks

### 1. Pipeline throughput (hourly windows)

```sql
-- Silver ingest rate (last 24h, hourly buckets)
SELECT
  date_trunc('hour', created_at) AS hour,
  COUNT(*) AS quotes,
  COUNT(DISTINCT provider_id) AS providers,
  COUNT(DISTINCT corridor_id) AS corridors
FROM silver.quote_record
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY 1
ORDER BY 1 DESC;
```

Flag: Any hour with 0 quotes during expected collection windows (Tier-1: every 10 min, Tier-2: every 3h).

### 2. Bronze→Silver lag

```sql
SELECT
  ir.collector_type,
  COUNT(*) AS runs_24h,
  AVG(EXTRACT(EPOCH FROM (ir.completed_at - ir.started_at))) AS avg_run_seconds,
  MAX(EXTRACT(EPOCH FROM (ir.completed_at - ir.started_at))) AS max_run_seconds,
  MAX(ir.completed_at) AS last_completed,
  EXTRACT(EPOCH FROM (NOW() - MAX(ir.completed_at))) / 60 AS minutes_since_last
FROM silver.ingestion_run ir
WHERE ir.started_at > NOW() - INTERVAL '24 hours'
GROUP BY ir.collector_type
ORDER BY minutes_since_last DESC;
```

### 3. Gold freshness

```sql
SELECT
  'popular_corridors' AS artifact,
  MAX(updated_at) AS latest,
  EXTRACT(EPOCH FROM (NOW() - MAX(updated_at))) / 3600 AS age_hours
FROM gold.popular_corridors
UNION ALL
SELECT 'pulse_cache', MAX(updated_at), EXTRACT(EPOCH FROM (NOW() - MAX(updated_at))) / 3600
FROM gold.pulse_cache
UNION ALL
SELECT 'fx_rates', MAX(updated_at), EXTRACT(EPOCH FROM (NOW() - MAX(updated_at))) / 3600
FROM gold.fx_rates
UNION ALL
SELECT 'indices_latest', MAX(computed_at), EXTRACT(EPOCH FROM (NOW() - MAX(computed_at))) / 3600
FROM gold.indices_latest;
```

### 4. Connection pool and active queries

```sql
-- Active connections by application
SELECT
  application_name,
  state,
  COUNT(*) AS connections,
  MAX(EXTRACT(EPOCH FROM (NOW() - state_change))) AS oldest_seconds
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY application_name, state
ORDER BY connections DESC;
```

```sql
-- Long-running queries (> 60s)
SELECT
  pid,
  application_name,
  state,
  EXTRACT(EPOCH FROM (NOW() - query_start)) AS duration_seconds,
  LEFT(query, 200) AS query_preview
FROM pg_stat_activity
WHERE datname = current_database()
  AND state != 'idle'
  AND query_start < NOW() - INTERVAL '60 seconds'
ORDER BY duration_seconds DESC;
```

### 5. Table size and bloat

```sql
SELECT
  schemaname,
  relname AS table_name,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  pg_size_pretty(pg_relation_size(relid)) AS table_size,
  pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) AS index_size,
  n_live_tup AS live_rows,
  n_dead_tup AS dead_rows,
  ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_pct,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname IN ('bronze', 'silver', 'gold', 'gold_export')
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 30;
```

Flag: `dead_pct > 20%` or `last_autovacuum` > 7 days ago.

### 6. RDS CloudWatch metrics

```bash
CLUSTER_ID=$(aws rds describe-db-clusters \
  --query "DBClusters[?contains(DBClusterIdentifier,'remit-scout-${ENV}')].DBClusterIdentifier" --output text)

for metric in CPUUtilization FreeableMemory DatabaseConnections ReadIOPS WriteIOPS; do
  aws cloudwatch get-metric-statistics \
    --namespace "AWS/RDS" \
    --dimensions "Name=DBClusterIdentifier,Value=${CLUSTER_ID}" \
    --metric-name "$metric" \
    --start-time "$(date -u -v-6H +%Y-%m-%dT%H:%M:%SZ)" \
    --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --period 900 --statistics Average Maximum \
    --query "{metric:'${metric}',avg:Datapoints[0].Average,max:Datapoints[0].Maximum}" --output table
done
```

### 7. Data integrity spot checks

```sql
-- Orphaned quote records (no matching ingestion run)
SELECT COUNT(*) AS orphaned_quotes
FROM silver.quote_record qr
LEFT JOIN silver.ingestion_run ir ON ir.id = qr.ingestion_run_id
WHERE ir.id IS NULL AND qr.created_at > NOW() - INTERVAL '7 days';

-- Corridors in tier snapshot but no quotes in 7 days
SELECT COUNT(*) AS starved_corridors
FROM silver.corridor_tier_snapshot cts
LEFT JOIN silver.quote_record qr
  ON qr.corridor_id = cts.corridor_id
  AND qr.created_at > NOW() - INTERVAL '7 days'
WHERE cts.version = 0 AND qr.id IS NULL;
```

## Output template

```
## DB Observer Report — ${ENV}
Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)
Observation window: last 24 hours

### Pipeline Throughput
- Silver quotes (24h): <total>
- Active providers: <n>
- Active corridors: <n>
- Hours with 0 quotes: <list>

### Bronze→Silver Lag
| Collector | Runs (24h) | Avg Duration | Last Completed | Minutes Since |
(table rows)

### Gold Freshness
| Artifact | Latest Update | Age (hours) | Status |
(table rows)

### Connection Pool
- Total connections: <n>
- Long-running queries (>60s): <n>

### Table Health
- Tables with >20% dead rows: <list>
- Missing autovacuum (>7d): <list>

### RDS Metrics
- CPU avg/max: <n>/<n>
- Memory free: <n>
- Connections: <n>

### Integrity
- Orphaned quotes: <n>
- Starved corridors: <n>

### Verdict: HEALTHY | DEGRADED | CRITICAL
### Actions needed: (list)
```

## Scheduling recommendations
- **Continuous (prod):** Run every 15 minutes via EventBridge or Codex automation
- **Hourly (staging):** Catch issues before they reach prod
- **On-demand (dev):** After resume or data load
- **Deep scan (weekly):** Include table bloat + vacuum stats

## Central report integration

Write output to **Section 7: Database Health** in `ops/reports/daily-ops-report.md`. Update Executive Summary row for "Database Health" with the verdict.

## Runbooks
- `docs/runbooks/provider-outage.md`
- `docs/runbooks/indices-readiness.md`
