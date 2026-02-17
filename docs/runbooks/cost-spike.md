# Runbook: Cost Spike (Dev Kill-Switch + Triage)

## Trigger
- AWS Budget email (ACTUAL or FORECASTED) exceeds threshold
- Cost Anomaly Detection email/SNS fires
- Unexpected daily spend in `rs-dev` / `rs-prod`

## Immediate containment (dev)
1) **Pause dev now (stops Aurora + scales ECS to 0 + disables schedules)**
   ```sh
   make ops-pause-dev
   ```
2) **Reconcile desired state (prevents redeploy from re-enabling spend)**
   ```sh
   make pause-dev
   ```

## Quick attribution checklist (10 minutes)
1) **ECS**
   - Verify no services running:
     ```sh
     make status-dev
     ```
2) **EventBridge rules**
   - Confirm `remit-scout-dev-*` rules are `DISABLED` (see `make status-dev` output).
3) **Aurora**
   - Confirm the cluster is `stopped`:
     ```sh
     AWS_PROFILE=rs-dev aws rds describe-db-clusters \
       --region us-east-1 \
       --query 'DBClusters[].{id:DBClusterIdentifier,status:Status}' \
       --output table
     ```
4) **SQS backlogs (symptom + signal)**
   - Check queue depth + DLQs:
     ```sh
     AWS_PROFILE=rs-dev aws sqs list-queues --region us-east-1 --queue-name-prefix remit-scout-dev
     ```
5) **Lambda probe failures**
   - Check Wise/WU probe error spikes in CloudWatch Logs and `Errors` metric.

## Root-cause triage (what usually burns money)
- **Aurora IO (most common):** a heavy job (provider-weighting, gold indices backfills) running too frequently or retrying.
- **ECS always-on polling:** workers running with empty queues (desired > 0 with no messages).
- **Schedules firing into failures:** EventBridge rules enabled while downstream is broken → retries + DLQs.
- **Network egress / public IPv4:** NAT / public IP usage (less common here; dev often uses public subnets intentionally).

## Recovery (manual resume)
1) Deploy the desired unpaused state:
   ```sh
   make resume-dev
   ```
2) Validate health:
   - Provider probes succeeding (Wise/WU)
   - `fx-rate-refresh` worker processes >0 when queue has messages
   - `gold-live` queue drains; DLQ stops growing

## Post-incident
- Add/adjust alarm thresholds (DLQ depth, queue age, job failure rates).
- Reduce dev cadences/lookback windows for heavy jobs.
- Confirm nightly auto-pause + cost guardrail auto-pause are still wired.

## Cost guardrail configuration (explicit values)

Deploy now passes these values to CDK context for all environments:
- `costBudgetAmountUsd`
- `costAnomalyThresholdUsd`
- `costAlertEmails`

Recommended values currently wired in `.github/workflows/deploy.yml`:

- **dev**: `50`, `20`, `alerts@remit-scout.com`
- **staging**: `100`, `60`, `alerts@remit-scout.com`
- **prod**: `500`, `100`, `alerts@remit-scout.com`

GitHub environment variables (or repo vars) currently resolve this order:

- `COST_BUDGET_AMOUNT_USD`:
  - dev uses this directly (fallback `50`)
  - staging prefers `COST_BUDGET_AMOUNT_USD`, then `STAGING_COST_BUDGET_AMOUNT_USD`, fallback `100`
  - prod prefers `COST_BUDGET_AMOUNT_USD`, then `PROD_COST_BUDGET_AMOUNT_USD`, fallback `500`
- `COST_ANOMALY_THRESHOLD_USD`:
  - dev uses this directly (fallback `20`)
  - staging prefers `COST_ANOMALY_THRESHOLD_USD`, then `STAGING_COST_ANOMALY_THRESHOLD_USD`, fallback `60`
  - prod prefers `COST_ANOMALY_THRESHOLD_USD`, then `PROD_COST_ANOMALY_THRESHOLD_USD`, fallback `100`
- `COST_ALERT_EMAILS`:
  - staging prefers `COST_ALERT_EMAILS`, then `STAGING_COST_ALERT_EMAILS`, fallback `alerts@remit-scout.com`
  - prod prefers `COST_ALERT_EMAILS`, then `PROD_COST_ALERT_EMAILS`, fallback `alerts@remit-scout.com`
  - dev uses `COST_ALERT_EMAILS` directly (fallback `alerts@remit-scout.com`)
- `COST_ALERT_EMAILS` accepts comma-separated emails (for example: `alerts@a.com,alerts@b.com`) and is split by comma in deploy context.

Operational check:
1. In each GitHub environment (`dev`, `staging`, `prod`), confirm budget variables are set to current policy values.
2. Confirm recipients in `COST_ALERT_EMAILS` are actively monitored.
3. If alerting is missing, validate that these values were actually passed in the workflow logs under the `CDK Diff` / `CDK Deploy` steps.

## Monthly Ghost-Resource Cleanup Checklist
Run once per month from the payer account:

1) **Unattached EBS volumes**
   ```sh
   aws ec2 describe-volumes \
     --filters Name=status,Values=available \
     --query 'Volumes[].{id:VolumeId,size:Size,state:State,create:CreateTime,az:AvailabilityZone}' \
     --output table
   ```

2) **RDS / ElastiCache snapshots outside retention**
   ```sh
   aws rds describe-db-snapshots --snapshot-type automated --query 'DBSnapshots[].{id:DBSnapshotIdentifier,created:SnapshotCreateTime,status:Status}'
   aws elasticache describe-snapshots --query 'Snapshots[].{name:Name,created:SnapshotCreateTime}'
   ```

3) **Unassociated Elastic IPs**
   ```sh
   aws ec2 describe-addresses --query 'Addresses[].{AllocationId:AllocationId,AssocId:AssociationId,PublicIp:PublicIp}'
   ```

4) **Orphaned ENIs**
   ```sh
   aws ec2 describe-network-interfaces \
     --filters Name=status,Values=available \
     --query 'NetworkInterfaces[].{id:NetworkInterfaceId,desc:Description,subnet:SubnetId,az:AvailabilityZone,ageDays:CreateTime}' \
     --output table
   ```

5) **Old AMIs from past deploys**
   ```sh
   aws ec2 describe-images \
     --owners self \
     --query 'Images[].{id:ImageId,name:Name,created:CreationDate}' \
     --output table
   ```

6) **Cost Explorer by environment tag**
   - Verify `environment=dev|staging|prod` daily spend trend and any unusual spikes (especially after deployments or weekend runs).
