---
name: remit-scout-env-drift-detector
description: Detect configuration and infrastructure drift between dev, staging, and prod environments — mismatched secrets, divergent CDK context, missing resources, and env-var gaps. Use before promotions and as a weekly governance check.
---

# Remit-Scout Environment Drift Detector

## Overview

Environments must be mirrors of each other (with expected differences like capacity and cadence). This skill detects unintended drift: secrets that exist in dev but not staging, CDK context differences, missing EventBridge rules, divergent env vars, and infrastructure state mismatches.

## Preconditions
- AWS CLI v2 with all profiles: `rs-dev`, `rs-staging`, `rs-prod`
- `AWS_REGION=us-east-1`

## Checks

### 1. Secrets Manager parity

```bash
for profile in rs-dev rs-staging rs-prod; do
  echo "=== ${profile} ==="
  aws secretsmanager list-secrets \
    --filters "Key=name,Values=remit-scout" \
    --query 'SecretList[].Name' --output text \
    --profile "$profile" | tr '\t' '\n' | sort
done
```

Diff dev vs staging, staging vs prod. Flag any secret in one environment but not others.

### 2. EventBridge rules parity

```bash
for env in dev staging prod; do
  echo "=== ${env} ==="
  aws events list-rules --name-prefix "remit-scout-${env}" \
    --query 'Rules[].{name:Name,state:State,schedule:ScheduleExpression}' \
    --output json --profile "rs-${env}" | jq -r '.[] | "\(.name | sub("remit-scout-'${env}'-"; "")) \(.state) \(.schedule)"' | sort
done
```

Compare rule names (stripped of env prefix) across environments.

### 3. Lambda function parity

```bash
for env in dev staging prod; do
  echo "=== ${env} ==="
  aws lambda list-functions \
    --query "Functions[?starts_with(FunctionName,'remit-scout-${env}')].FunctionName" \
    --output text --profile "rs-${env}" | tr '\t' '\n' | sed "s/remit-scout-${env}-//" | sort
done
```

### 4. ECS service parity

```bash
for env in dev staging prod; do
  echo "=== ${env} ==="
  aws ecs list-services --cluster "remit-scout-${env}-cluster" \
    --query 'serviceArns' --output text --profile "rs-${env}" 2>/dev/null | tr '\t' '\n' | sed 's|.*/||' | sed "s/remit-scout-${env}-//" | sort
done
```

### 5. CDK context drift

```bash
# Compare CDK context files
diff <(jq -S 'del(.["aws:cdk:lookup"])' infrastructure/cdk/cdk.context.json) \
     <(echo '{}') 2>/dev/null || echo "Context file exists with values"

# Check for env-specific CDK context overrides
rg "devPaused|envName|isStrictConfig" infrastructure/cdk/lib/ --glob '*.ts'
```

### 6. Database migration parity

Check if all environments have the same migration level:

```bash
for env in dev staging prod; do
  echo "=== ${env} ==="
  # Via ECS run-task or direct DB query
  echo "SELECT MAX(version) FROM schema_migrations;" | psql "${DB_URL_${env}}" 2>/dev/null
done
```

Alternatively, check migration files applied:

```bash
ls -1 backend/db/migrations/ | tail -5
```

Flag: `072_add_webhook_secret.sql` is untracked and pending for staging/prod.

### 7. Environment variable drift

Compare env vars across ECS task definitions:

```bash
for env in dev staging prod; do
  TASK_DEF=$(aws ecs describe-services \
    --cluster "remit-scout-${env}-cluster" \
    --services "remit-scout-${env}-plane-a" \
    --query 'services[0].taskDefinition' --output text --profile "rs-${env}" 2>/dev/null)
  if [ -n "$TASK_DEF" ] && [ "$TASK_DEF" != "None" ]; then
    echo "=== ${env} ==="
    aws ecs describe-task-definition --task-definition "$TASK_DEF" \
      --query 'taskDefinition.containerDefinitions[0].environment[].name' \
      --output text --profile "rs-${env}" | tr '\t' '\n' | sort
  fi
done
```

### 8. SQS queue parity

```bash
for env in dev staging prod; do
  echo "=== ${env} ==="
  aws sqs list-queues --queue-name-prefix "remit-scout-${env}" \
    --query 'QueueUrls' --output text --profile "rs-${env}" 2>/dev/null | tr '\t' '\n' | sed 's|.*/||' | sed "s/remit-scout-${env}-//" | sort
done
```

### 9. IAM role parity

```bash
for env in dev staging prod; do
  echo "=== ${env} ==="
  aws iam list-roles \
    --query "Roles[?contains(RoleName,'remit-scout-${env}')].RoleName" \
    --output text --profile "rs-${env}" | tr '\t' '\n' | sed "s/remit-scout-${env}-//" | sort
done
```

### 10. CloudFormation stack drift detection

```bash
for env in dev staging prod; do
  STACK="remit-scout-${env}"
  echo "=== ${env} ==="
  aws cloudformation detect-stack-drift --stack-name "$STACK" --profile "rs-${env}" 2>/dev/null
  sleep 10
  aws cloudformation describe-stack-drift-detection-status \
    --stack-drift-detection-id "$(aws cloudformation detect-stack-drift --stack-name "$STACK" --profile "rs-${env}" --query 'StackDriftDetectionId' --output text 2>/dev/null)" \
    --query '{status:DetectionStatus,driftedResources:DriftedStackResourceCount}' \
    --output table --profile "rs-${env}" 2>/dev/null
done
```

## Expected differences (not drift)

| Dimension | Dev | Staging | Prod |
|-----------|-----|---------|------|
| ECS desired count | 0 (paused) | >= 1 | >= 2 |
| EventBridge rules | DISABLED (paused) | ENABLED | ENABLED |
| Aurora | stopped (paused) | available | available |
| Probe cadence | 30 min | 5 min | 5 min |
| Synthetics cadence | 15 min | 1–5 min | 1–5 min |
| `devPaused` | true/false | always false | always false |
| `PLANE_B_DISABLE_TIER1` | 1 | 0 | 0 |

## Output template

```
## Environment Drift Report
Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)

### Secrets
| Secret | Dev | Staging | Prod | Drift? |
(table rows)

### EventBridge Rules
| Rule | Dev | Staging | Prod | Drift? |
(table rows)

### Lambda Functions
| Function | Dev | Staging | Prod | Drift? |
(table rows)

### ECS Services
| Service | Dev | Staging | Prod | Drift? |
(table rows)

### DB Migrations
| Env | Latest Migration | Drift? |
(table rows)

### CloudFormation Drift
| Env | Status | Drifted Resources |
(table rows)

### Verdict: IN_SYNC | MINOR_DRIFT (<list>) | MAJOR_DRIFT (<list>)
### Actions needed: (prioritized list)
```

## Central report integration

Write output to **Section 9: Environment Drift** in `ops/reports/daily-ops-report.md`. Update Executive Summary row for "Environment Drift" with the verdict.

## When to run
- **Before staging deploy:** Ensure dev → staging promotion is clean
- **Before prod deploy:** Ensure staging → prod promotion is clean
- **Weekly:** Catch gradual drift
- **After CDK changes:** Confirm all environments are updated
