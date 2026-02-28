---
name: remit-scout-export-monitor
description: Monitor export job health — verify export sessions complete, S3 artifacts land, DLQ is empty, and enterprise customer exports are delivered on schedule. Use for daily export audits and SLA compliance.
---

# Remit-Scout Export Monitor

## Overview

Export jobs are the revenue-critical data delivery pipeline for enterprise customers. This skill verifies export sessions are processing, S3 artifacts are landing, no jobs are stuck or failed, and DLQ depth is zero.

## Preconditions
- Database read access (export job tables)
- AWS CLI for S3/SQS/Lambda checks
- `AWS_PROFILE` and `AWS_REGION` set

## Environment selection

```bash
export ENV=prod AWS_PROFILE=rs-prod STACK_PREFIX=remit-scout-prod
```

## Checks

### 1. Export job status (last 24h)

```sql
SELECT
  status,
  COUNT(*) AS job_count,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) AS avg_duration_seconds,
  MAX(EXTRACT(EPOCH FROM (completed_at - created_at))) AS max_duration_seconds
FROM gold_export.export_job
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status
ORDER BY status;
```

Expected statuses: `completed`, `processing`, `queued`. Flag: `failed`, `stuck`, `timeout`.

### 2. Stuck/stale jobs

```sql
SELECT
  id,
  user_id,
  status,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 AS age_minutes,
  export_type,
  corridor_filter
FROM gold_export.export_job
WHERE status IN ('processing', 'queued')
  AND created_at < NOW() - INTERVAL '30 minutes'
ORDER BY created_at;
```

Any job older than 30 minutes in `processing` or `queued` is stuck.

### 3. Failed jobs (with error details)

```sql
SELECT
  id,
  user_id,
  status,
  error_message,
  created_at,
  export_type
FROM gold_export.export_job
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 20;
```

### 4. S3 export artifacts

```bash
aws s3 ls "s3://${STACK_PREFIX}-exports/" --recursive --summarize | tail -5
```

Check for today's artifacts:

```bash
TODAY=$(date -u +%Y/%m/%d)
aws s3 ls "s3://${STACK_PREFIX}-exports/${TODAY}/" --summarize
```

### 5. Export SQS queue depth

```bash
QUEUE_URL=$(aws sqs get-queue-url --queue-name "${STACK_PREFIX}-export-job" --query 'QueueUrl' --output text)
aws sqs get-queue-attributes --queue-url "$QUEUE_URL" \
  --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible \
  --output table
```

### 6. Export DLQ (must be 0)

```bash
DLQ_URL=$(aws sqs get-queue-url --queue-name "${STACK_PREFIX}-export-job-dlq" --query 'QueueUrl' --output text)
aws sqs get-queue-attributes --queue-url "$DLQ_URL" \
  --attribute-names ApproximateNumberOfMessages --output table
```

### 7. Export worker Lambda health

```bash
aws logs filter-log-events \
  --log-group-name "/aws/lambda/${STACK_PREFIX}-export-worker" \
  --start-time $(($(date +%s) - 86400))000 \
  --filter-pattern "ERROR" \
  --limit 10 \
  --query 'events[].message' --output text
```

### 8. Export corridor-history header validation

Reference: `backend/scripts/export-worker-constants.ts` defines `CORRIDOR_HISTORY_HEADERS` (15 columns). Verify the latest S3 artifact matches:

```bash
LATEST=$(aws s3 ls "s3://${STACK_PREFIX}-exports/" --recursive | sort | tail -1 | awk '{print $4}')
aws s3 cp "s3://${STACK_PREFIX}-exports/${LATEST}" - | head -1
```

Expected header: `corridor_id,send_country,...` (15 columns).

## Output template

```
## Export Monitor — ${ENV}
Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)

### Job Summary (24h)
| Status | Count | Avg Duration | Max Duration |
(table rows)

### Stuck Jobs: <count>
### Failed Jobs: <count> (top error: <msg>)

### S3 Artifacts Today: <count> files, <size>
### Queue Depth: <messages> | DLQ: <depth>

### Lambda Errors (24h): <count>

### Verdict: HEALTHY | DEGRADED | CRITICAL
### Actions needed: (list)
```

## When to run
- **Hourly (prod):** Match export-worker cadence (1 min schedule)
- **Daily (dev/staging):** Verify pipeline wiring
- **After enterprise onboarding:** Confirm first export delivered
- **SLA compliance:** Verify delivery windows

## Central report integration

Write output to **Section 6: Export Delivery** in `ops/reports/daily-ops-report.md`. Update Executive Summary row for "Export Delivery" with the verdict.

## Runbooks
- Check `backend/scripts/export-worker.ts` for mode config (`queue`, `shadow`, `off`)
- Check `backend/scripts/export-worker-constants.ts` for header contract
