---
name: remit-scout-queue-corridor-watchdog
description: Validate every single corridor through the queue and worker pipeline — verify B2B sweep enqueue, ingest fanout processing, B2C refresh delivery, FX rate sync, export jobs, DLQ health, sweep run completion, and per-corridor circuit breaker state. Catches silently dropped corridors.
---

# Remit-Scout Queue & Corridor Pipeline Watchdog

## Overview

Corridors can silently disappear in the queue/worker pipeline. A corridor might be in the macro-corridors list but never enqueued, enqueued but never processed, or processed but failed with no alert. This skill validates every corridor end-to-end through every queue stage: B2B sweep → ingest fanout → Silver write → Gold publish. It also covers B2C refresh, FX rate sync, export delivery, and notification queues.

## Pipeline map (what this skill verifies)

```
B2B sweep scheduler
  ↓ (enqueues corridors by tier)
  ├── ingest-fanout (tier 1) → ingest-fanout-worker → Silver
  └── ingest-fanout-tier2 (tier 2) → ingest-fanout-worker → Silver
                                                      ↓
B2C user request (Plane A)                         Gold jobs
  ↓                                                   ↓
  quote-refresh → b2c-refresh-worker → Silver    Gold publish
                                                      ↓
FX rate scheduler                                 Export queue
  ↓                                                   ↓
  fx-rate-refresh → fx-rate-refresh-worker       export-worker → S3
                                                      ↓
                                                 Notifications
                                                      ↓
                                                 ops-alerts
```

## Preconditions
- Database read access (Silver + Gold schemas)
- AWS CLI for SQS metrics and CloudWatch
- `AWS_PROFILE` and `AWS_REGION` set

## Checks

### 1. Corridor universe validation (are we covering everything?)

```sql
-- All corridors that SHOULD be in the B2B sweep
WITH macro AS (
  SELECT DISTINCT corridor_id
  FROM silver.corridor_tier_snapshot
  WHERE version = 0
),
expected AS (
  SELECT DISTINCT m.corridor_id
  FROM macro m
  JOIN silver.corridor c ON c.id = m.corridor_id
  JOIN silver.rights_matrix rm
    ON rm.allowed_b2b = true
   AND rm.allowed_collect = true
   AND rm.status = 'production'
   AND rm.stoplist_status = 'active'
   AND rm.source_countries IS NOT NULL
   AND rm.destination_countries IS NOT NULL
   AND c.send_country = ANY(rm.source_countries)
   AND c.receive_country = ANY(rm.destination_countries)
)
SELECT
  COUNT(*) AS total_expected_corridors,
  (SELECT COUNT(*) FROM macro) AS macro_corridors,
  COUNT(*) AS sweep_eligible_corridors
FROM expected;
```

### 2. B2B sweep run completeness (last 24h)

```sql
-- Are sweep runs completing?
SELECT
  run_id,
  priority_tier,
  status,
  corridors_total,
  providers_total,
  enqueued_at,
  started_at,
  finished_at,
  EXTRACT(EPOCH FROM (COALESCE(finished_at, NOW()) - enqueued_at)) / 60 AS duration_minutes,
  CASE
    WHEN status = 'completed' THEN 'OK'
    WHEN status = 'running' AND enqueued_at < NOW() - INTERVAL '60 minutes' THEN 'STUCK'
    WHEN status = 'failed' THEN 'FAILED'
    ELSE 'IN_PROGRESS'
  END AS health
FROM silver.b2b_sweep_run
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### 3. Per-corridor sweep task status (last 24h)

```sql
-- Which corridors completed, failed, or were skipped?
SELECT
  status,
  COUNT(*) AS tasks,
  COUNT(DISTINCT corridor_id) AS corridors,
  COUNT(DISTINCT provider_id) AS providers,
  AVG(attempt_count) AS avg_attempts,
  MAX(attempt_count) AS max_attempts
FROM silver.b2b_sweep_task
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status
ORDER BY status;
```

### 4. Corridors that were enqueued but never completed

```sql
-- Stuck or dropped corridor tasks
SELECT
  t.corridor_id,
  c.send_country || '-' || c.receive_country AS corridor,
  p.slug AS provider,
  t.status,
  t.attempt_count,
  t.enqueued_at,
  t.error_reason,
  EXTRACT(EPOCH FROM (NOW() - t.enqueued_at)) / 60 AS age_minutes
FROM silver.b2b_sweep_task t
JOIN silver.corridor c ON c.id = t.corridor_id
JOIN silver.provider p ON p.id = t.provider_id
WHERE t.status IN ('pending', 'processing')
  AND t.enqueued_at < NOW() - INTERVAL '30 minutes'
ORDER BY age_minutes DESC;
```

### 5. Corridors in macro list but missing from last sweep

```sql
-- Corridors that should be swept but weren't enqueued in last 24h
WITH expected AS (
  SELECT DISTINCT cts.corridor_id
  FROM silver.corridor_tier_snapshot cts
  JOIN silver.corridor c ON c.id = cts.corridor_id
  JOIN silver.rights_matrix rm
    ON rm.allowed_b2b = true
   AND rm.allowed_collect = true
   AND rm.status = 'production'
   AND rm.stoplist_status = 'active'
   AND rm.source_countries IS NOT NULL
   AND rm.destination_countries IS NOT NULL
   AND c.send_country = ANY(rm.source_countries)
   AND c.receive_country = ANY(rm.destination_countries)
  WHERE cts.version = 0
),
swept AS (
  SELECT DISTINCT corridor_id
  FROM silver.b2b_sweep_task
  WHERE created_at > NOW() - INTERVAL '24 hours'
)
SELECT
  e.corridor_id,
  c.send_country || '-' || c.receive_country || '-' || c.send_currency || '-' || c.receive_currency AS corridor
FROM expected e
LEFT JOIN swept s ON s.corridor_id = e.corridor_id
JOIN silver.corridor c ON c.id = e.corridor_id
WHERE s.corridor_id IS NULL
ORDER BY corridor;
```

Flag: Any corridor here was silently dropped from the sweep.

### 6. Per-corridor data delivery (did quotes actually land in Silver?)

```sql
-- For each corridor in last sweep, did Silver get quotes?
WITH last_sweep AS (
  SELECT DISTINCT corridor_id, provider_id
  FROM silver.b2b_sweep_task
  WHERE status = 'success'
    AND created_at > NOW() - INTERVAL '24 hours'
)
SELECT
  c.send_country || '-' || c.receive_country AS corridor,
  p.slug AS provider,
  COUNT(qr.id) AS quotes_received,
  MAX(qr.created_at) AS latest_quote,
  CASE
    WHEN COUNT(qr.id) > 0 THEN 'DELIVERED'
    ELSE 'SWEEP_SUCCESS_BUT_NO_QUOTES'
  END AS delivery_status
FROM last_sweep ls
JOIN silver.corridor c ON c.id = ls.corridor_id
JOIN silver.provider p ON p.id = ls.provider_id
LEFT JOIN silver.quote_record qr
  ON qr.corridor_id = ls.corridor_id
  AND qr.provider_id = ls.provider_id
  AND qr.created_at > NOW() - INTERVAL '24 hours'
GROUP BY corridor, p.slug
HAVING COUNT(qr.id) = 0
ORDER BY corridor, p.slug;
```

Flag: `SWEEP_SUCCESS_BUT_NO_QUOTES` means the task succeeded but no data arrived — silent failure.

### 7. SQS queue health (all 9 queues)

```bash
for queue in quote-refresh fx-rate-refresh export-job alert-evaluation ingest-fanout ingest-fanout-tier2 gold-live notifications ops-alerts; do
  QUEUE_URL=$(aws sqs get-queue-url --queue-name "${STACK_PREFIX}-${queue}" --query 'QueueUrl' --output text 2>/dev/null)
  DLQ_URL=$(aws sqs get-queue-url --queue-name "${STACK_PREFIX}-${queue}-dlq" --query 'QueueUrl' --output text 2>/dev/null)
  
  if [ -n "$QUEUE_URL" ]; then
    Q_ATTRS=$(aws sqs get-queue-attributes --queue-url "$QUEUE_URL" \
      --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible ApproximateNumberOfMessagesDelayed \
      --output json)
    D_ATTRS=""
    if [ -n "$DLQ_URL" ]; then
      D_ATTRS=$(aws sqs get-queue-attributes --queue-url "$DLQ_URL" \
        --attribute-names ApproximateNumberOfMessages --output json)
    fi
    echo "${queue}: visible=$(echo $Q_ATTRS | jq -r '.Attributes.ApproximateNumberOfMessages') inflight=$(echo $Q_ATTRS | jq -r '.Attributes.ApproximateNumberOfMessagesNotVisible') dlq=$(echo $D_ATTRS | jq -r '.Attributes.ApproximateNumberOfMessages // "N/A"')"
  fi
done
```

SLO: DLQ depth = 0 for all queues.

### 8. Queue age (oldest message)

```bash
for queue in ingest-fanout ingest-fanout-tier2 quote-refresh fx-rate-refresh; do
  aws cloudwatch get-metric-statistics \
    --namespace "AWS/SQS" \
    --dimensions "Name=QueueName,Value=${STACK_PREFIX}-${queue}" \
    --metric-name "ApproximateAgeOfOldestMessage" \
    --start-time "$(date -u -v-1H +%Y-%m-%dT%H:%M:%SZ)" \
    --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --period 300 --statistics Maximum \
    --query "{queue:'${queue}',max_age_seconds:Datapoints[0].Maximum}" --output table \
    --profile "${AWS_PROFILE}"
done
```

Thresholds:
- ingest-fanout: max age < 300s (5 min) for tier-1, < 10800s (3h) for tier-2
- quote-refresh: max age < 300s
- fx-rate-refresh: max age < 600s

### 9. B2C refresh queue (DB fallback)

```sql
-- DB fallback queue health
SELECT
  status,
  COUNT(*) AS count,
  MIN(created_at) AS oldest,
  MAX(created_at) AS newest,
  EXTRACT(EPOCH FROM (NOW() - MIN(created_at))) / 60 AS oldest_age_minutes
FROM silver.quote_refresh_request
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;
```

```sql
-- Stuck processing items (> 30 min)
SELECT
  request_id,
  provider_id,
  corridor_id,
  processed_at,
  EXTRACT(EPOCH FROM (NOW() - processed_at)) / 60 AS stuck_minutes
FROM silver.quote_refresh_request
WHERE status = 'processing'
  AND processed_at < NOW() - INTERVAL '30 minutes';
```

### 10. FX rate refresh queue (DB fallback)

```sql
SELECT
  status,
  COUNT(*) AS count,
  MIN(created_at) AS oldest,
  MAX(created_at) AS newest
FROM silver.fx_rate_refresh_request
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;
```

### 11. Circuit breaker state (which providers/corridors are tripped?)

```sql
-- Redis circuit breakers (via DB mirror if available)
SELECT
  provider_id,
  corridor_id,
  state,
  failure_count,
  last_failure_at,
  cooldown_until
FROM silver.circuit_breaker
WHERE state != 'closed'
ORDER BY last_failure_at DESC;
```

```bash
# Check Redis circuit breaker keys
# (run from inside the VPC or via bastion)
redis-cli -h "${REDIS_HOST}" --scan --pattern "cb:*" | head -50
```

### 12. Worker ECS service health

```bash
for svc in ingest-fanout-tier1 ingest-fanout-tier2 b2c-refresh fx-rate-refresh gold-live notifications ops-alerts; do
  aws ecs describe-services \
    --cluster "${STACK_PREFIX}-cluster" \
    --services "${STACK_PREFIX}-${svc}" \
    --query "services[0].{name:serviceName,desired:desiredCount,running:runningCount,pending:pendingCount,status:status}" \
    --output table --profile "${AWS_PROFILE}" 2>/dev/null
done
```

### 13. Ingest fanout processing rate

```sql
-- Processing rate per hour (last 24h)
SELECT
  date_trunc('hour', finished_at) AS hour,
  COUNT(*) FILTER (WHERE status = 'success') AS succeeded,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed,
  COUNT(*) FILTER (WHERE status = 'skipped') AS skipped,
  COUNT(DISTINCT corridor_id) AS corridors,
  COUNT(DISTINCT provider_id) AS providers,
  ROUND(AVG(EXTRACT(EPOCH FROM (finished_at - started_at))), 1) AS avg_process_seconds
FROM silver.b2b_sweep_task
WHERE finished_at > NOW() - INTERVAL '24 hours'
GROUP BY 1
ORDER BY 1 DESC;
```

Flag: Hours with 0 tasks but within expected sweep cadence.

### 14. Failed tasks diagnosis (top error reasons)

```sql
SELECT
  error_reason,
  COUNT(*) AS occurrences,
  COUNT(DISTINCT provider_id) AS providers_affected,
  COUNT(DISTINCT corridor_id) AS corridors_affected,
  array_agg(DISTINCT p.slug) AS provider_list
FROM silver.b2b_sweep_task t
JOIN silver.provider p ON p.id = t.provider_id
WHERE t.status = 'failed'
  AND t.created_at > NOW() - INTERVAL '24 hours'
GROUP BY error_reason
ORDER BY occurrences DESC
LIMIT 20;
```

### 15. Tier-1 vs Tier-2 queue split verification

```sql
-- Verify tier routing is correct
SELECT
  cts.tier,
  COUNT(DISTINCT t.corridor_id) AS corridors_swept,
  COUNT(*) AS total_tasks,
  COUNT(*) FILTER (WHERE t.status = 'success') AS succeeded,
  COUNT(*) FILTER (WHERE t.status = 'failed') AS failed
FROM silver.b2b_sweep_task t
JOIN silver.corridor_tier_snapshot cts ON cts.corridor_id = t.corridor_id AND cts.version = 0
WHERE t.created_at > NOW() - INTERVAL '24 hours'
GROUP BY cts.tier;
```

Verify: Tier-1 corridors go to `ingest-fanout`, Tier-2 to `ingest-fanout-tier2`.

### 16. Export queue end-to-end

```sql
SELECT
  ej.status,
  COUNT(*) AS jobs,
  AVG(EXTRACT(EPOCH FROM (ej.finished_at - ej.created_at))) AS avg_seconds,
  COUNT(*) FILTER (WHERE ej.s3_key IS NOT NULL) AS s3_delivered
FROM gold_export.export_job ej
WHERE ej.created_at > NOW() - INTERVAL '24 hours'
GROUP BY ej.status;
```

### 17. Notification and ops-alerts queue depth

```sql
-- If notifications use DB queue
SELECT
  status,
  COUNT(*) AS count
FROM silver.signal_history
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;
```

## Output template (written to ops/reports/daily-ops-report.md Section 14)

```
## Section 14: Queue & Corridor Pipeline

### Corridor Coverage
- Expected corridors (macro + rights): <n>
- Swept in last 24h: <n>
- Missing from sweep: <n> (CRITICAL if > 0)

### Sweep Runs (24h)
| Run ID | Tier | Status | Corridors | Providers | Duration (min) | Health |
(table rows)

### Task Summary (24h)
| Status | Tasks | Corridors | Providers | Avg Attempts |
| success | <n> | <n> | <n> | <n> |
| failed | <n> | <n> | <n> | <n> |
| pending | <n> | <n> | <n> | <n> |
| processing | <n> | <n> | <n> | <n> |
| skipped | <n> | <n> | <n> | <n> |

### Stuck Tasks (>30 min): <count>
### Silent Failures (sweep OK but no quotes): <count>

### Queue Health (all 9)
| Queue | Visible | In-flight | DLQ | Max Age (s) | Status |
(table rows)

### DB Fallback
| Queue | Pending | Processing | Stuck (>30m) |
| quote-refresh | <n> | <n> | <n> |
| fx-rate-refresh | <n> | <n> | <n> |

### Circuit Breakers Open: <count>
| Provider | Corridor | State | Failures | Cooldown Until |
(table rows)

### Worker Services
| Service | Desired | Running | Status |
(table rows)

### Processing Rate (hourly)
| Hour | Succeeded | Failed | Skipped | Corridors | Avg Process (s) |
(table rows)

### Top Failed Errors
| Error | Count | Providers | Corridors |
(table rows)

### Tier Routing
| Tier | Corridors | Tasks | Succeeded | Failed |
(table rows)

### Verdict: ALL_CORRIDORS_FLOWING | CORRIDORS_DROPPED (<list>) | CRITICAL (<details>)
### Actions needed: (list)
```

## Self-healing integration

Issues found by this skill feed into the self-healing automation:

| Issue | Classification | Auto-fixable? | Playbook |
|-------|---------------|--------------|----------|
| Corridors missing from sweep | DATA_FIX | No (investigate rights matrix or macro-corridors) | Check rights + tier snapshot |
| Stuck tasks > 30 min | PROVIDER_DOWN | Partial | Kill stuck task, re-enqueue |
| DLQ depth > 0 | SLO_BREACH | No | Inspect DLQ messages, root cause |
| Sweep success but no quotes | PROVIDER_DOWN | Partial | Check collector logs, auto-stoplist if confirmed |
| Circuit breakers tripped | PROVIDER_DOWN | No (self-healing via cooldown) | Monitor, extend cooldown if needed |
| Worker desired = 0 | INFRA_FIX | Yes (if dev paused → resume) | CDK deploy or ops-resume |
| Queue age exceeds threshold | SLO_BREACH | No | Scale workers or reduce sweep cadence |

## When to run
- **Every 15 minutes (prod):** Catch dropped corridors fast
- **After each B2B sweep cycle:** Verify all corridors were processed
- **Daily (dev/staging):** Pipeline wiring validation
- **Incident triage:** Pinpoint which corridor/provider/queue is failing

## Central report integration

Write output to **Section 14: Queue & Corridor Pipeline** in `ops/reports/daily-ops-report.md`. Update Executive Summary row for "Queue & Corridor Pipeline" with the verdict.
