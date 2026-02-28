---
name: remit-scout-daily-ops-report
description: Generate a comprehensive daily operations report covering AWS resources, provider health, data pipeline status, export delivery, SLO compliance, and cost. Replaces a dedicated infrastructure engineer's morning check.
---

# Remit-Scout Daily Ops Report

## Overview

Single-command daily operations report that aggregates output from all monitoring skills into one actionable summary. Designed to be the first thing you read each morning — or schedule via Codex automation to land in your inbox before you wake up.

## Preconditions
- AWS CLI v2 with profiles: `rs-dev`, `rs-staging`, `rs-prod`
- Database read access per environment
- All other remit-scout skills installed (this skill orchestrates them)

## Environment selection

```bash
# Run for a single environment
export ENV=prod AWS_PROFILE=rs-prod STACK_PREFIX=remit-scout-prod

# Or run for all environments (recommended for daily report)
export ENVS="dev staging prod"
```

## Report sections (run sequentially)

### Section 1: AWS Resource State

Run `remit-scout-aws-resource-audit` for each environment.

Key outputs:
- ECS service counts (desired vs running)
- EventBridge rules (enabled vs disabled)
- Aurora cluster status
- Redis status
- SQS queue depths + DLQ
- CloudWatch alarms in ALARM state
- Synthetics canary results

### Section 2: Provider Health

Run `remit-scout-provider-health-probe` for prod (and optionally staging).

Key outputs:
- All 25 providers: probe status, quote freshness, rights-matrix state
- Tier coverage vs SLO
- Any stoplisted production providers

### Section 3: Gold Indices Pipeline

Run `remit-scout-gold-indices-integrity` for prod.

Key outputs:
- FX rates freshness (OANDA)
- Weighting snapshot quality
- TEER/RCI/RVI computation status
- Indices SLO pass/fail
- Export table population

### Section 4: Export Delivery

Run `remit-scout-export-monitor` for prod.

Key outputs:
- Export job completion rate
- Stuck/failed jobs
- S3 artifact delivery
- DLQ depth

### Section 5: Database Health

Run `remit-scout-db-observer` for prod.

Key outputs:
- Pipeline throughput (hourly)
- Connection pool utilization
- Table health (bloat, vacuum)
- RDS CloudWatch metrics

### Section 5b: Queue & Corridor Pipeline

Run `remit-scout-queue-corridor-watchdog` for prod.

Key outputs:
- Corridor universe coverage (expected vs swept)
- Sweep run completion rates
- Per-corridor task status (success/failed/stuck/skipped)
- All 9 SQS queue depths + DLQ depths
- DB fallback queue health (B2C refresh, FX rate refresh)
- Circuit breaker state (tripped providers/corridors)
- Worker ECS service health
- Processing rate per hour
- Top failure reasons

### Section 6: Cost Snapshot

```bash
# Current month spend
aws ce get-cost-and-usage \
  --time-period "Start=$(date -u +%Y-%m-01),End=$(date -u +%Y-%m-%d)" \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --profile rs-prod \
  --query 'ResultsByTime[0].Groups[?Metrics.BlendedCost.Amount!=`0`].{service:Keys[0],cost:Metrics.BlendedCost.Amount}' \
  --output table
```

Dev cost guard:

```bash
# Is dev paused?
make status-dev 2>/dev/null | head -20
```

### Section 7: SLO Summary

Aggregate from data-health-slo CloudWatch metrics:

```bash
for metric in freshness_p95_tier1 freshness_p95_tier2 quote_success_rate_tier1 quote_success_rate_tier2 provider_coverage_tier1 provider_coverage_tier2; do
  aws cloudwatch get-metric-statistics \
    --namespace "RemitScout/DataHealth" \
    --metric-name "$metric" \
    --start-time "$(date -u -v-24H +%Y-%m-%dT%H:%M:%SZ)" \
    --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --period 86400 --statistics Average \
    --query "{metric:'${metric}',value:Datapoints[0].Average}" --output table \
    --profile rs-prod
done
```

SLO targets (from ARCHITECTURE.md):
- API p95 latency: prod <= 800ms
- Freshness: Tier-1 <= 900s, Tier-2 <= 10800s
- Quote success: Tier-1 >= 0.98, Tier-2 >= 0.95
- Provider coverage: >= 3 per tier
- DLQ depth: 0
- Indices readiness: available >= 0.80, suppressed <= 0.20, confidence p10 >= 0.30

### Section 8: Codebase Changes (last 24h)

```bash
git log --since="24 hours ago" --oneline --no-merges
```

## Output template

```
# Remit-Scout Daily Ops Report
Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)

## Executive Summary
- Overall status: GREEN | YELLOW | RED
- Environments: dev (<status>), staging (<status>), prod (<status>)
- Providers: <n>/25 healthy
- Gold pipeline: <status>
- Exports: <completed>/<total> delivered
- SLO compliance: <n>/<total> passing
- Cost MTD: $<amount>

## Section 1: AWS Resources
(output from aws-resource-audit)

## Section 2: Provider Health
(output from provider-health-probe)

## Section 3: Gold Indices
(output from gold-indices-integrity)

## Section 4: Exports
(output from export-monitor)

## Section 5: Database
(output from db-observer)

## Section 6: Cost
| Service | MTD Cost |
(table rows)
Dev paused: YES/NO

## Section 7: SLOs
| Metric | Value | Target | Status |
(table rows)

## Section 8: Code Changes (24h)
- <n> commits
- Key changes: (list)

## Action Items
1. (prioritized list of issues found)
```

## Scheduling

| Environment | Frequency | Trigger |
|-------------|-----------|---------|
| Prod | Daily 06:00 UTC | Codex automation |
| Staging | Daily 07:00 UTC | Codex automation |
| Dev | Daily 08:00 UTC (if unpaused) | Codex automation |
| All | On-demand | Manual trigger |

## Central report integration

All section outputs are written to `ops/reports/daily-ops-report.md`. Each sub-skill writes to its designated section. The daily-ops-report skill orchestrates the execution and fills in the Executive Summary and SLO Compliance sections (Section 11). At end of day, archive to `ops/reports/archive/YYYY-MM-DD.md`. The self-healing automation (`remit-scout-self-healing`) then reads the completed report and acts on any issues found.

## B2B/B2C awareness

Provider health sections are split into B2B (Section 2) and B2C (Section 3) because provider counts differ. B2B providers feed Gold indices; B2C providers are visible in the API. Run `remit-scout-b2b-b2c-corridor-diagnostics` for Section 4 to get the full corridor-level coverage picture.

## Codex automation prompt (copy-paste ready)

```
Run the remit-scout-daily-ops-report skill for prod environment.
Execute all sections sequentially, writing each to ops/reports/daily-ops-report.md.
Split provider health into B2B and B2C sections.
Include remit-scout-b2b-b2c-corridor-diagnostics for Section 4.
If any section returns CRITICAL or RED status, flag it prominently at the top.
After completion, hand off to remit-scout-self-healing to diagnose and fix any issues.
End with a prioritized action items list.
Archive previous report to ops/reports/archive/.
```
