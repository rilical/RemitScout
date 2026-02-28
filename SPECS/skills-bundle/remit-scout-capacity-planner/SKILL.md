---
name: remit-scout-capacity-planner
description: Project infrastructure capacity limits — predict when RDS storage, Redis memory, SQS throughput, and data volume will hit thresholds. Prevent 3am incidents by planning scaling events weeks in advance.
---

# Remit-Scout Capacity Planner

## Overview

As providers and corridors scale, data volume grows non-linearly. This skill tracks growth trends and projects when current infrastructure will hit limits, giving you weeks of lead time instead of a 3am PagerDuty alert.

## Checks

### 1. Database storage growth

```bash
# RDS storage used over time
aws cloudwatch get-metric-statistics \
  --namespace "AWS/RDS" \
  --dimensions "Name=DBClusterIdentifier,Value=remit-scout-${ENV}" \
  --metric-name "VolumeBytesUsed" \
  --start-time "$(date -u -v-30d +%Y-%m-%dT%H:%M:%SZ)" \
  --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --period 86400 --statistics Average --output json --profile "${AWS_PROFILE}"
```

```sql
-- Table size growth (Silver)
SELECT
  schemaname,
  relname,
  pg_size_pretty(pg_total_relation_size(relid)) AS current_size,
  n_live_tup AS rows
FROM pg_stat_user_tables
WHERE schemaname IN ('silver', 'gold', 'gold_export')
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 20;
```

### 2. Silver quote volume trend

```sql
SELECT
  DATE(created_at) AS day,
  COUNT(*) AS quotes,
  COUNT(DISTINCT provider_id) AS providers,
  COUNT(DISTINCT corridor_id) AS corridors,
  pg_size_pretty(SUM(pg_column_size(qr.*))) AS estimated_size
FROM silver.quote_record qr
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY day;
```

Project: `quotes_per_day * 365 * avg_row_size` = annual storage growth.

### 3. Redis memory usage

```bash
aws elasticache describe-cache-clusters \
  --query "CacheClusters[?contains(CacheClusterId,'remit-scout')].{id:CacheClusterId,type:CacheNodeType}" --output table --profile "${AWS_PROFILE}"

aws cloudwatch get-metric-statistics \
  --namespace "AWS/ElastiCache" \
  --dimensions "Name=ReplicationGroupId,Value=remit-scout-${ENV}-redis" \
  --metric-name "DatabaseMemoryUsagePercentage" \
  --start-time "$(date -u -v-30d +%Y-%m-%dT%H:%M:%SZ)" \
  --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --period 86400 --statistics Maximum --output json --profile "${AWS_PROFILE}"
```

Alert threshold: 80% memory.

### 4. SQS throughput trend

```bash
for queue in ingest-fanout quote-refresh export-job; do
  aws cloudwatch get-metric-statistics \
    --namespace "AWS/SQS" \
    --dimensions "Name=QueueName,Value=${STACK_PREFIX}-${queue}" \
    --metric-name "NumberOfMessagesSent" \
    --start-time "$(date -u -v-30d +%Y-%m-%dT%H:%M:%SZ)" \
    --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --period 86400 --statistics Sum \
    --query "{queue:'${queue}',datapoints:Datapoints}" --output json --profile "${AWS_PROFILE}"
done
```

### 5. Lambda concurrency and duration

```bash
for fn in gold-indices gold-publisher oanda-sync provider-weighting data-health-slo; do
  aws cloudwatch get-metric-statistics \
    --namespace "AWS/Lambda" \
    --dimensions "Name=FunctionName,Value=${STACK_PREFIX}-${fn}" \
    --metric-name "Duration" \
    --start-time "$(date -u -v-7d +%Y-%m-%dT%H:%M:%SZ)" \
    --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --period 86400 --statistics "Average" "Maximum" \
    --query "{fn:'${fn}',avg:Datapoints[0].Average,max:Datapoints[0].Maximum}" --output table --profile "${AWS_PROFILE}"
done
```

If max duration approaches timeout, Lambda needs memory/timeout increase.

### 6. Corridor and provider growth projections

```sql
-- How many corridors and providers are we adding per month?
SELECT
  DATE_TRUNC('month', created_at) AS month,
  COUNT(DISTINCT id) AS new_corridors
FROM silver.corridor
GROUP BY 1 ORDER BY 1;

SELECT
  DATE_TRUNC('month', created_at) AS month,
  COUNT(DISTINCT id) AS new_providers
FROM silver.provider
GROUP BY 1 ORDER BY 1;
```

### 7. Connection pool saturation

```sql
SELECT
  COUNT(*) AS total_connections,
  MAX(EXTRACT(EPOCH FROM (NOW() - backend_start))) / 3600 AS oldest_connection_hours,
  setting::int AS max_connections
FROM pg_stat_activity, pg_settings
WHERE pg_settings.name = 'max_connections'
GROUP BY setting;
```

## Projections (formula)

```
days_until_80pct = (limit * 0.8 - current_value) / daily_growth_rate
```

Apply to: RDS storage, Redis memory, connection pool, SQS throughput.

## Output template

```
## Capacity Plan — ${ENV}
Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)

### Storage
| Resource | Current | Limit | Daily Growth | Days to 80% |
| RDS | <size> | <max> | <rate>/day | <days> |
| S3 Bronze | <size> | unlimited | <rate>/day | — |
| S3 Exports | <size> | unlimited | <rate>/day | — |

### Memory
| Resource | Current % | Daily Growth | Days to 80% |
| Redis | <pct> | <rate>/day | <days> |
| RDS FreeableMemory | <pct> | — | — |

### Throughput
| Queue | Current msgs/day | 30d Trend | Projected 90d |
(table rows)

### Compute
| Lambda | Avg Duration | Max Duration | Timeout | Headroom |
(table rows)

### Connections
- Current: <n> / <max>
- Pool utilization: <pct>%

### Growth
- Corridors: <n> total (+<n>/month)
- Providers: <n> total (+<n>/month)
- Quotes/day: <n> (30d avg)

### Projections
| Resource | Projected Date at 80% | Action Needed |
(table rows)

### Verdict: AMPLE_HEADROOM | PLAN_SCALING (<resource, <days>) | URGENT (<resource>)
```

## Central report integration

Write output to **Section 20: Capacity Plan** in `ops/reports/daily-ops-report.md`.

## When to run
- **Weekly (all envs):** Trend analysis
- **Before adding providers:** Project impact
- **Monthly:** Infrastructure review
