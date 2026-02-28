---
name: remit-scout-aws-resource-audit
description: Count and verify all AWS resources (ECS, Lambda, EventBridge, RDS, Redis, S3, SQS) per environment; use for daily infra audits, pre-deploy checks, and ensuring no orphaned or unaccounted resources exist.
---

# Remit-Scout AWS Resource Audit

## Overview

Deterministic, read-only audit of every AWS resource that Remit-Scout provisions per environment. Replaces the need for a human infrastructure engineer to manually verify resource state. Run daily or before any deployment.

## Preconditions
- AWS CLI v2 available
- `AWS_PROFILE` set: `rs-dev` (dev), `rs-staging` (staging), `rs-prod` (prod)
- `AWS_REGION` set (default: `us-east-1`)

## Environment selection

Set the target before running:

```bash
# Dev
export ENV=dev AWS_PROFILE=rs-dev AWS_REGION=us-east-1 STACK_PREFIX=remit-scout-dev

# Staging
export ENV=staging AWS_PROFILE=rs-staging AWS_REGION=us-east-1 STACK_PREFIX=remit-scout-staging

# Prod
export ENV=prod AWS_PROFILE=rs-prod AWS_REGION=us-east-1 STACK_PREFIX=remit-scout-prod
```

## Audit checklist (run all sequentially)

### 1. ECS Services (desired vs running)

```bash
aws ecs list-services --cluster "${STACK_PREFIX}-cluster" --query 'serviceArns' --output text | tr '\t' '\n' | while read svc; do
  aws ecs describe-services --cluster "${STACK_PREFIX}-cluster" --services "$svc" \
    --query 'services[].{name:serviceName,desired:desiredCount,running:runningCount,status:status}' --output table
done
```

Expected (dev paused): all desired=0, running=0.
Expected (prod): PlaneA >= 2, PlaneB >= 1, workers >= 1.

### 2. Lambda functions (count + last invocation)

```bash
aws lambda list-functions --query "Functions[?starts_with(FunctionName,'${STACK_PREFIX}')].{name:FunctionName,runtime:Runtime,lastModified:LastModified,timeout:Timeout,memory:MemorySize}" --output table
```

Expected count: ~30+ functions (scheduled jobs + probes + ops-pause + API handlers).

### 3. EventBridge rules (enabled vs disabled)

```bash
aws events list-rules --name-prefix "${STACK_PREFIX}" \
  --query 'Rules[].{name:Name,state:State,schedule:ScheduleExpression}' --output table
```

Expected (dev paused): all DISABLED.
Expected (prod): all ENABLED.

### 4. RDS/Aurora clusters

```bash
aws rds describe-db-clusters \
  --query "DBClusters[?contains(DBClusterIdentifier,'remit-scout')].{id:DBClusterIdentifier,status:Status,engine:Engine,instances:DBClusterMembers[].DBInstanceIdentifier}" --output table
```

Expected (dev paused): stopped.
Expected (prod): available.

### 5. ElastiCache Redis

```bash
aws elasticache describe-replication-groups \
  --query "ReplicationGroups[?contains(ReplicationGroupId,'remit-scout')].{id:ReplicationGroupId,status:Status,nodes:NodeGroups[].NodeGroupMembers[].CacheClusterId}" --output table
```

### 6. SQS queues (depth + DLQ)

```bash
for q in b2b-ingest b2c-refresh fx-rate-refresh export-job; do
  QUEUE_URL=$(aws sqs get-queue-url --queue-name "${STACK_PREFIX}-${q}" --query 'QueueUrl' --output text 2>/dev/null)
  if [ -n "$QUEUE_URL" ]; then
    aws sqs get-queue-attributes --queue-url "$QUEUE_URL" \
      --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible \
      --query "{queue:'${q}',messages:Attributes.ApproximateNumberOfMessages,inflight:Attributes.ApproximateNumberOfMessagesNotVisible}" --output table
  fi
done
```

DLQ check (must be 0 in prod):

```bash
for q in b2b-ingest-dlq b2c-refresh-dlq export-job-dlq; do
  QUEUE_URL=$(aws sqs get-queue-url --queue-name "${STACK_PREFIX}-${q}" --query 'QueueUrl' --output text 2>/dev/null)
  if [ -n "$QUEUE_URL" ]; then
    aws sqs get-queue-attributes --queue-url "$QUEUE_URL" \
      --attribute-names ApproximateNumberOfMessages \
      --query "{dlq:'${q}',depth:Attributes.ApproximateNumberOfMessages}" --output table
  fi
done
```

### 7. S3 buckets

```bash
aws s3api list-buckets --query "Buckets[?contains(Name,'remit-scout')].{name:Name,created:CreationDate}" --output table
```

### 8. CloudWatch alarms (in ALARM state)

```bash
aws cloudwatch describe-alarms --state-value ALARM \
  --query "MetricAlarms[?contains(AlarmName,'remit-scout')].{name:AlarmName,state:StateValue,reason:StateReason}" --output table
```

### 9. Synthetics canaries

```bash
aws synthetics describe-canaries \
  --query "Canaries[?contains(Name,'remit-scout')].{name:Name,status:Status.State,lastRun:Status.StateReasonCode}" --output table
```

## Output template (for automations)

```
## AWS Resource Audit — ${ENV}
Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)
Identity: $(aws sts get-caller-identity --query 'Arn' --output text)

### ECS Services
| Service | Desired | Running | Status |
(table rows)

### Lambda Functions: <count> total
### EventBridge Rules: <enabled>/<total> enabled
### Aurora: <status>
### Redis: <status>
### SQS Queues: <messages in flight> | DLQ depth: <n>
### CloudWatch Alarms in ALARM: <count>
### Synthetics: <passing>/<total>

### Verdict: HEALTHY | DEGRADED | ACTION_REQUIRED
### Actions needed: (list if any)
```

## When to run
- **Daily (dev):** Confirm paused state to avoid cost
- **Pre-deploy (staging/prod):** Confirm all resources are provisioned and healthy
- **Post-deploy:** Confirm no regressions
- **On-demand:** Cost spike triage

## Central report integration

Write output to **Section 1: AWS Resources** in `ops/reports/daily-ops-report.md`. Replace the `(awaiting data)` placeholder with the full output template. Update the Executive Summary row for "AWS Resources" with the verdict.

## Runbooks
- `docs/runbooks/cost-spike.md`
- `docs/runbooks/dev-pause-resume.md`
