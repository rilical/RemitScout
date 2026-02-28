---
name: aws-cost-operations
description: Optimize AWS cost and operational posture using billing and pricing analysis, CloudWatch monitoring, CloudTrail audit trails, and security posture checks. Use when estimating pre-deploy cloud spend, diagnosing cost spikes, setting budgets and alarms, right-sizing resources, investigating incidents, or producing cost-control action plans.
---

# AWS Cost Operations

## Scope

Use this skill to deliver practical AWS spend and operations outcomes:
- Estimate cost before provisioning.
- Detect and explain spend anomalies.
- Propose right-sizing and cleanup actions with expected savings.
- Define CloudWatch alarms and dashboards for reliability.
- Audit operational or security-relevant API activity.
- Produce prioritized remediation plans with owner and timeline.

## Inputs to Confirm First

Collect these before deep analysis:
1. AWS account or organization scope.
2. Environment scope (`dev`, `staging`, `prod`).
3. Time range (`7d`, `30d`, `90d`, or explicit dates).
4. Primary objective (`estimate`, `cost spike`, `optimization`, `audit`, `monitoring`).
5. Guardrails (business-critical services, no-downtime constraints).

If context is missing, state assumptions explicitly and keep recommendations reversible.

## Execution Workflow

1. Baseline spend.
- Pull spend by service and environment.
- Compare against prior period and budget.
- Highlight top absolute and percentage movers.

2. Diagnose drivers.
- Map spend changes to usage metrics (requests, duration, storage, data transfer).
- Separate expected growth from inefficiency.
- Identify waste candidates (idle, unattached, over-provisioned).

3. Recommend actions.
- Prioritize by impact, risk, and effort.
- Include expected savings range and rollback path.
- Mark quick wins versus structural fixes.

4. Add operational controls.
- Define missing alarms for golden signals and cost guardrails.
- Add audit checks for sensitive resource changes.
- Propose cadence for monthly and weekly reviews.

5. Report decision-ready output.
- Use: `Issue`, `Evidence`, `Action`, `Owner`, `ETA`, `Risk`.
- Keep output short, ranked, and execution-oriented.

## References

Load only what is needed:
- `references/operations-patterns.md` for recurring workflows and triage playbooks.
- `references/cloudwatch-alarms.md` for alarm templates by AWS service.

For CLI-centric runs, prefer reproducible commands and include account and region context in outputs.

## Scripts

Use bundled scripts for repeatable cost diagnostics:

1. Capture baseline snapshot:
`scripts/monthly_cost_snapshot.py --start 2026-01-01 --end 2026-02-01 --granularity DAILY --group-key SERVICE --output /tmp/cost-baseline.json`

2. Capture current snapshot:
`scripts/monthly_cost_snapshot.py --start 2026-02-01 --end 2026-03-01 --granularity DAILY --group-key SERVICE --output /tmp/cost-current.json`

3. Detect anomalies:
`scripts/cost_anomaly_diff.py --baseline /tmp/cost-baseline.json --current /tmp/cost-current.json --min-absolute 100 --min-percent 25 --output /tmp/cost-anomalies.json`

If account access is unavailable, run with `--dry-run` on snapshot script to emit the exact AWS CLI command for manual execution.

## Guardrails

- Do not recommend destructive cleanup without verification steps.
- For production changes, prefer staged rollout and rollback notes.
- Treat cost optimization as a reliability tradeoff problem, not only a spend reduction exercise.
- When proposing security or audit actions, tie each action to a specific risk being reduced.
