# New Relic Ops Bootstrap

Use these scripts to manage Remit-Scout New Relic dashboards, mirrored alerts, and readiness checks via NerdGraph.

## Required env

- `NEW_RELIC_USER_API_KEY` (NerdGraph user key)
- `NEW_RELIC_ACCOUNT_ID`
- `NEW_RELIC_REGION` (`US` or `EU`, default `US`)
- `NEW_RELIC_ALERT_EMAIL` (optional, defaults to `austrilic@gmail.com` for notification routing)
- `NEW_RELIC_STAGING_AWS_ACCOUNT_ID` / `NEW_RELIC_PROD_AWS_ACCOUNT_ID` (optional, improves env scoping in verification)

## 0) Full bootstrap (recommended)

```bash
NEW_RELIC_USER_API_KEY=... \
NEW_RELIC_ACCOUNT_ID=7756888 \
NEW_RELIC_REGION=US \
NEW_RELIC_ALERT_EMAIL=omar@remit-scout.com \
node ops/newrelic/bootstrap-all.mjs
```

This runs, in order:
- dashboards
- mirrored alert policies/conditions
- cloud links (when both role ARN env vars are provided)
- workloads
- destinations/channels/workflows (incident routing)

## 1) Upsert dashboards

```bash
NEW_RELIC_USER_API_KEY=... \
NEW_RELIC_ACCOUNT_ID=7756888 \
NEW_RELIC_REGION=US \
node ops/newrelic/bootstrap-dashboards.mjs
```

Idempotent behavior:
- creates dashboards if missing
- updates dashboards if they already exist
- prints dashboard URLs on success

Dashboards:
- `Remit-Scout Staging Ops`
- `Remit-Scout Production Ops`

Key dashboard pages include:
- `Incident Command` (deploy/smoke gate view)
- `API Reliability` / `Queue + Worker Health` / `Provider Reliability`
- `Business Growth + Revenue` (sessions, searches, visits, affiliate clicks, conversions, conversion value)

## 2) Upsert mirrored alert policies/conditions

```bash
NEW_RELIC_USER_API_KEY=... \
NEW_RELIC_ACCOUNT_ID=7756888 \
NEW_RELIC_REGION=US \
node ops/newrelic/sync-alerts.mjs
```

Policies:
- `Remit-Scout STAGING CloudWatch Mirror`
- `Remit-Scout PROD CloudWatch Mirror`

## 3) Link AWS cloud integrations (staging + prod)

Create a role in each AWS account and trust New Relic AWS principal account `754728514883`
with external ID `7756888`, then run:

```bash
NEW_RELIC_USER_API_KEY=... \
NEW_RELIC_ACCOUNT_ID=7756888 \
NEW_RELIC_REGION=US \
NEW_RELIC_STAGING_AWS_ROLE_ARN=arn:aws:iam::010630709504:role/NewRelicInfrastructure-Integrations-RemitScout \
NEW_RELIC_PROD_AWS_ROLE_ARN=arn:aws:iam::938998270127:role/NewRelicInfrastructure-Integrations-RemitScout \
node ops/newrelic/sync-cloud-links.mjs
```

This links both PUSH + PULL integrations per env and configures:
- pull: API Gateway, Route53 Resolver, WAFV2, X-Ray, Billing, CloudFront, CloudTrail, EC2, ECS, ElastiCache, Health, IAM, Lambda, RDS, S3, SQS
- stream metadata: metadata, tags, ElastiCache entities

## 4) Upsert workloads

```bash
NEW_RELIC_USER_API_KEY=... \
NEW_RELIC_ACCOUNT_ID=7756888 \
NEW_RELIC_REGION=US \
node ops/newrelic/sync-workloads.mjs
```

Workloads:
- `Remit-Scout Global Workload`
- `Remit-Scout STAGING Workload`
- `Remit-Scout PROD Workload`

## 5) Upsert notifications and incident workflows

```bash
NEW_RELIC_USER_API_KEY=... \
NEW_RELIC_ACCOUNT_ID=7756888 \
NEW_RELIC_REGION=US \
NEW_RELIC_ALERT_EMAIL=omar@remit-scout.com \
node ops/newrelic/sync-notifications-workflows.mjs
```

Creates/updates:
- destination: `Remit-Scout Ops Email Destination`
- channels:
  - `Remit-Scout Ops Email Channel`
  - `Remit-Scout Prod Email Channel`
- workflows:
  - `Remit-Scout STAGING Incident Workflow`
  - `Remit-Scout PROD Incident Workflow`

## 6) Verify signal readiness

```bash
NEW_RELIC_USER_API_KEY=... \
NEW_RELIC_ACCOUNT_ID=7756888 \
NEW_RELIC_REGION=US \
NEW_RELIC_TARGET_ENV=staging \
NEW_RELIC_STAGING_AWS_ACCOUNT_ID=010630709504 \
node ops/newrelic/verify-signals.mjs
```

Defaults:
- checks both `staging` and `prod`
- fails when required signal groups are missing (`Metric`, `Log`, `Span`, `AWS/ApiGateway`, `AWS/SQS`, key custom metrics)
- prints top namespaces/entities diagnostics when checks fail (useful for AWS-account mismatch)

## OTLP trace auth (required for New Relic traces)

Set for backend services:

```bash
TRACING_EXPORTER=otlp
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp.nr-data.net/v1/traces
OTEL_EXPORTER_OTLP_HEADERS=api-key=<NEW_RELIC_INGEST_KEY>
# or set NEW_RELIC_INGEST_KEY and omit OTEL_EXPORTER_OTLP_HEADERS
```
