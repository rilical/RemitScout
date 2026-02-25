# New Relic Observability Runbook (Staging + Prod)

Last updated: 2026-02-25

## Purpose

Canonical steps to keep Remit-Scout New Relic dashboards and alert mirrors consistent across staging and production.

CloudWatch remains deploy-gate source of truth. New Relic is the mirrored visibility and triage layer.

## Required environment variables

```bash
export NEW_RELIC_USER_API_KEY=...
export NEW_RELIC_ACCOUNT_ID=7756888
export NEW_RELIC_REGION=US
export NEW_RELIC_INGEST_KEY=...
export NEW_RELIC_STAGING_AWS_ACCOUNT_ID=010630709504
export NEW_RELIC_PROD_AWS_ACCOUNT_ID=938998270127
```

## Runtime telemetry requirements

Backend services (Plane A/B/C + workers) must have:

```bash
TRACING_EXPORTER=otlp
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp.nr-data.net/v1/traces
OTEL_EXPORTER_OTLP_HEADERS=api-key=<NEW_RELIC_INGEST_KEY>
# or set NEW_RELIC_INGEST_KEY directly and omit OTEL_EXPORTER_OTLP_HEADERS
```

## Step 1: Upsert dashboards

```bash
node ops/newrelic/bootstrap-dashboards.mjs
```

Expected:
- `Remit-Scout Staging Ops`
- `Remit-Scout Production Ops`

## Step 1a: Full bootstrap (preferred)

If provisioning a fresh account or reconciling drift, run this once:

```bash
NEW_RELIC_ALERT_EMAIL=omar@remit-scout.com node ops/newrelic/bootstrap-all.mjs
```

It upserts dashboards, mirrored alerts, workloads, and incident workflows in one pass.

## Step 2: Upsert mirrored alert policies

```bash
node ops/newrelic/sync-alerts.mjs
```

Expected policies:
- `Remit-Scout STAGING CloudWatch Mirror`
- `Remit-Scout PROD CloudWatch Mirror`

Each policy should contain 5 static NRQL conditions:
- `api-error-rate-high (mirror)`
- `api-p99-latency-high (mirror)`
- `dlq-depth-high (mirror)`
- `slo-breach-total (mirror)`
- `provider-probe-failures-high (mirror)`

## Step 3: Link AWS accounts to New Relic

For each AWS env account, create role `NewRelicInfrastructure-Integrations-RemitScout` with:
- trusted principal: `arn:aws:iam::754728514883:root`
- external id: `7756888`

Attach at least:
- `arn:aws:iam::aws:policy/ReadOnlyAccess`
- `arn:aws:iam::aws:policy/AWSSupportAccess`

Then run:

```bash
NEW_RELIC_STAGING_AWS_ROLE_ARN=arn:aws:iam::010630709504:role/NewRelicInfrastructure-Integrations-RemitScout \
NEW_RELIC_PROD_AWS_ROLE_ARN=arn:aws:iam::938998270127:role/NewRelicInfrastructure-Integrations-RemitScout \
node ops/newrelic/sync-cloud-links.mjs
```

This upserts:
- staging/prod `PUSH` + `PULL` links
- API polling integrations needed by Remit-Scout
- metadata/tags integrations for stream mode

## Step 4: Verify signal readiness

Staging:

```bash
NEW_RELIC_TARGET_ENV=staging node ops/newrelic/verify-signals.mjs
```

Production:

```bash
NEW_RELIC_TARGET_ENV=prod node ops/newrelic/verify-signals.mjs
```

The check fails if any required signal group is missing:
- `Metric`
- `Log`
- `Span`
- `AWS/ApiGateway` metrics
- `AWS/SQS` metrics
- key custom `RemitScout` metrics

## Step 5: Workloads and incident routing

If not using full bootstrap:

```bash
NEW_RELIC_ALERT_EMAIL=omar@remit-scout.com node ops/newrelic/sync-workloads.mjs
NEW_RELIC_ALERT_EMAIL=omar@remit-scout.com node ops/newrelic/sync-notifications-workflows.mjs
```

Expected workloads:
- `Remit-Scout Global Workload`
- `Remit-Scout STAGING Workload`
- `Remit-Scout PROD Workload`

Expected workflows:
- `Remit-Scout STAGING Incident Workflow`
- `Remit-Scout PROD Incident Workflow`

## Troubleshooting: account mismatch

If `verify-signals` fails with only New Relic integration entities (for example `NewRelic-Delivery-Stream`) and no `remit-scout-*` entities:

1) Verify AWS account receiving New Relic metrics:

```sql
FROM Metric SELECT latest(aws.accountId), uniqueCount(aws.accountId) SINCE 24 hours ago
```

2) Compare to deployment account:

```bash
aws sts get-caller-identity --profile rs-staging
```

If these account IDs differ, New Relic is linked to the wrong AWS account. Re-run the AWS integration install in the correct account and region.

## Promotion rule

Do not treat New Relic as operationally ready until `verify-signals` passes for staging and production.

## Notes

- New Relic alert conditions must not include `SINCE` in NRQL (NerdGraph validation fails).
- Deploy rollback gates remain CloudWatch alarms in `.github/workflows/deploy.yml`.
