---
name: remit-scout-dev-cost-guard
description: Check and enforce that Remit-Scout dev is paused (ECS=0, schedules disabled, Aurora stopped) to avoid spend; use for daily guardrails, cost-spike triage, and pre-weekend shutdown checks.
---

# Remit-Scout Dev Cost Guard

## Overview

Dev is allowed to be “off” most of the time. This skill provides a deterministic, read-only-first checklist and the safe pause/resume commands.

## Preconditions
- AWS CLI available
- `AWS_PROFILE` set (default in repo: `rs-dev`)
- `AWS_REGION` set (default in repo: `us-east-1`)

## Quick start (status)

From repo root:

```bash
make status-dev
```

Interpretation:
- **Paused dev**: ECS desired=0, EventBridge rules DISABLED, Aurora stopped.
- **Unpaused dev**: anything running or scheduled is a cost leak risk.

## Pause dev (safe path)

This sets desired state *and* applies runtime pause (preferred):

```bash
make pause-dev
```

## Emergency pause (fast, no deploy)

```bash
make ops-pause-dev
```

Follow up with `make pause-dev` to reconcile drift (see runbook).

## Minimal extra evidence (read-only)

Aurora:

```bash
AWS_PROFILE=rs-dev aws rds describe-db-clusters \
  --region us-east-1 \
  --query 'DBClusters[].{id:DBClusterIdentifier,status:Status}' \
  --output table
```

EventBridge rules (dev):

```bash
AWS_PROFILE=rs-dev aws events list-rules \
  --name-prefix remit-scout-dev \
  --region us-east-1 \
  --query 'Rules[].{name:Name,state:State,expr:ScheduleExpression}' \
  --output table
```

## Runbook
- `docs/runbooks/cost-spike.md`
- `docs/runbooks/dev-pause-resume.md`

## Output template (for automations/inbox items)
Include:
- AWS identity (`aws sts get-caller-identity` short summary)
- ECS desired/running summary (from `make status-dev`)
- EventBridge rule states (from `make status-dev`)
- Verdict: `PAUSED_OK` or `ACTION_REQUIRED` + exact command to run

## Central report integration

Write output to **Section 10: Cost** in `ops/reports/daily-ops-report.md`. Update Executive Summary row for "Cost" with the verdict.
