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

