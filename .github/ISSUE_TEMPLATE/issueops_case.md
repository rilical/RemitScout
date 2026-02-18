---
name: "IssueOps Case"
about: "Create a Remit-Scout Case (PRD/Plan/Run under .remit-scout/)"
title: "[case] <short description>"
labels: ["issueops:case"]
---

## Case ID
Suggested format: `case-YYYYMMDD-<shortslug>` (example: `case-20260218-wise-probe-failures`)

case_id:

## Environment
env: dev | staging | prod

## Severity
severity: sev0 | sev1 | sev2 | sev3

## Domain
domain: provider_health | queue | api_latency | freshness | indices | exports | infra_drift | security | other

## Symptoms (short)

## Suspected Components
- planes: plane_a | plane_b | plane_c
- services:
- providers:
- queues:

## Signal Sources
- (example: CloudWatch alarm, GitHub Actions probe run, Synthetics canary, Sentry issue)

## Links
- GitHub Issue:
- CloudWatch alarm(s):
- Dashboards:

## Next Step
Create contracts at:
- `.remit-scout/cases/<case_id>/prd.yaml`
- `.remit-scout/cases/<case_id>/plan.yaml`

