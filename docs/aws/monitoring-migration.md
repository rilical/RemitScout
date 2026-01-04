# Monitoring Migration: Kubernetes to AWS

This document describes the migration from Kubernetes-based monitoring (Prometheus, Grafana, Alertmanager) to AWS-native monitoring (CloudWatch, CloudWatch Synthetics, SNS).

## Overview

The Remit-Scout application previously used Kubernetes-based monitoring stack:
- **Prometheus** for metrics collection
- **Grafana** for dashboards
- **Alertmanager** for alert routing
- **Kubernetes Deployment** for synthetic monitoring

All of these have been replaced with AWS-native equivalents:
- **CloudWatch Metrics** for metrics collection
- **CloudWatch Dashboards** for visualization
- **CloudWatch Alarms** for alerting
- **SNS Topics** for alert routing (Slack, PagerDuty)
- **CloudWatch Synthetics** for synthetic monitoring

## Migration Mapping

### Metrics Collection

| Kubernetes Component | AWS Equivalent | Location |
|---------------------|----------------|----------|
| Prometheus metrics | CloudWatch Metrics | `backend/shared/cloudwatch-metrics.ts` |
| Prometheus exporters | CloudWatch custom metrics | Application code emits directly to CloudWatch |
| Prometheus scrape config | N/A | Metrics pushed from application |

### Dashboards

| Grafana Dashboard | CloudWatch Dashboard | Location |
|------------------|---------------------|----------|
| API Metrics | `remit-scout-{env}` dashboard | `infrastructure/cdk/lib/monitoring.ts` |
| Data Health | Same dashboard (additional widgets) | `infrastructure/cdk/lib/monitoring.ts` |
| Provider Collection | Same dashboard (additional widgets) | `infrastructure/cdk/lib/monitoring.ts` |

### Alerting

| Prometheus Alert Rule | CloudWatch Alarm | Location |
|----------------------|------------------|----------|
| `FreshnessSLOBreach` | `FreshnessSLOAlarm` | `infrastructure/cdk/lib/monitoring.ts` |
| `QuoteSuccessRateDrop` | `QuoteSuccessRateAlarm` | `infrastructure/cdk/lib/monitoring.ts` |
| `ProviderCoverageDrop` | `ProviderCoverageAlarm` | `infrastructure/cdk/lib/monitoring.ts` |
| `DataFreshnessStale` | `DataFreshnessStaleAlarm` | `infrastructure/cdk/lib/monitoring.ts` |
| `HighAPIErrorRate` | `HighAPIErrorRateAlarm` | `infrastructure/cdk/lib/monitoring.ts` |
| `HighAPILatency` | `HighAPILatencyAlarm` | `infrastructure/cdk/lib/monitoring.ts` |
| `APIEndpointDown` | `APIEndpointDownAlarm` | `infrastructure/cdk/lib/monitoring.ts` |
| `GoldBatchJobFailure` | `GoldJobFailureAlarm` | `infrastructure/cdk/lib/monitoring.ts` |
| `GoldBatchJobStuck` | `GoldPublisherStuckAlarm` | `infrastructure/cdk/lib/monitoring.ts` |
| `ProviderCollectionFailureSpike` | `ProviderCollectionFailureAlarm` | `infrastructure/cdk/lib/monitoring.ts` |
| `CircuitBreakerOpen` | `CircuitBreakerOpenAlarm` | `infrastructure/cdk/lib/monitoring.ts` |
| `ProviderCompletelyDown` | `ProviderCompletelyDownAlarm` | `infrastructure/cdk/lib/monitoring.ts` |
| `HighDatabaseQueryLatency` | `HighDatabaseQueryLatencyAlarm` | `infrastructure/cdk/lib/monitoring.ts` |
| `DatabaseQueryErrors` | `DatabaseQueryErrorsAlarm` | `infrastructure/cdk/lib/monitoring.ts` |
| `DatabaseConnectionPoolExhausted` | `DatabaseConnectionPoolExhaustedAlarm` | `infrastructure/cdk/lib/monitoring.ts` |

### Alert Routing

| Alertmanager Receiver | SNS Topic | Location |
|----------------------|-----------|----------|
| `slack-critical` | `CriticalAlertsTopic` | `infrastructure/cdk/lib/sns-subscriptions.ts` |
| `slack-warning` | `WarningAlertsTopic` | `infrastructure/cdk/lib/sns-subscriptions.ts` |
| `slack-ops` | `OpsAlertsTopic` | `infrastructure/cdk/lib/sns-subscriptions.ts` |
| `pagerduty-critical` | `CriticalAlertsTopic` (PagerDuty subscription) | `infrastructure/cdk/lib/sns-subscriptions.ts` |

### Synthetic Monitoring

| Kubernetes Deployment | CloudWatch Synthetics | Location |
|---------------------|----------------------|----------|
| `synthetic-monitor` pod | `HealthCheckCanary` + `QuotesCanary` | `infrastructure/cdk/lib/synthetics.ts` |

## Key Differences

### Metrics Namespace

**Before (Prometheus):**
- Metrics exposed via `/metrics` endpoint
- Scraped by Prometheus
- Queried using PromQL

**After (CloudWatch):**
- Metrics pushed directly to CloudWatch
- Namespace: `RemitScout` (custom metrics)
- Also uses AWS service namespaces (`AWS/ApiGateway`, `AWS/Lambda`, etc.)

### Alert Evaluation

**Before (Prometheus):**
- Prometheus evaluates alert rules continuously
- Alertmanager handles routing and deduplication

**After (CloudWatch):**
- CloudWatch Alarms evaluate metrics at specified intervals
- SNS handles routing
- No built-in deduplication (can be added via SNS filtering)

### Dashboard Configuration

**Before (Grafana):**
- JSON dashboard definitions in `k8s/grafana-dashboards/`
- Imported into Grafana UI
- Supports templating and variables

**After (CloudWatch):**
- Dashboard defined in CDK code (`monitoring.ts`)
- Deployed automatically with infrastructure
- Limited templating support

### Synthetic Monitoring

**Before (Kubernetes):**
- Node.js script running in pod
- Exposes Prometheus metrics
- Monitored via Prometheus alerts

**After (CloudWatch Synthetics):**
- CloudWatch Synthetics canaries
- Runs in managed Lambda functions
- Native CloudWatch metrics and alarms

## Migration Checklist

### Pre-Migration

- [x] Create CloudWatch metrics namespace (`RemitScout`)
- [x] Update application code to emit CloudWatch metrics
- [x] Create CDK constructs for monitoring
- [x] Create CloudWatch Synthetics canaries
- [x] Create SNS topics and subscriptions
- [x] Create CloudWatch Alarms for all Prometheus alerts
- [x] Create CloudWatch Dashboards

### Deployment

- [ ] Deploy CDK stack with monitoring resources
- [ ] Verify CloudWatch metrics are being emitted
- [ ] Verify CloudWatch Synthetics canaries are running
- [ ] Test SNS subscriptions (Slack, PagerDuty)
- [ ] Verify CloudWatch Alarms are evaluating correctly
- [ ] Verify CloudWatch Dashboards are displaying data

### Post-Migration

- [ ] Remove Kubernetes monitoring resources
- [ ] Update documentation
- [ ] Train team on CloudWatch console
- [ ] Set up CloudWatch Insights queries
- [ ] Configure CloudWatch Logs Insights for log analysis

## Configuration

### Environment Variables

For SNS subscriptions, set these context variables or environment variables:

```bash
# Slack webhook URL
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# PagerDuty integration key
export PAGERDUTY_INTEGRATION_KEY=xxx
```

Or via CDK context:

```bash
cdk deploy -c slackWebhookUrl=https://hooks.slack.com/services/... \
           -c pagerDutyIntegrationKey=xxx
```

### CloudWatch Synthetics

Synthetics canaries are configured in `infrastructure/cdk/lib/synthetics.ts`:

- **Health Check Canary**: Runs every 1 minute, tests `/healthz` endpoint
- **Quotes Canary**: Runs every 5 minutes, tests `/api/quotes/current` endpoint

Both canaries:
- Store artifacts in S3 bucket
- Emit metrics to CloudWatch
- Trigger alarms on failure

### SNS Subscriptions

SNS topics are created in `infrastructure/cdk/lib/sns-subscriptions.ts`:

- **CriticalAlertsTopic**: Critical severity alerts → Slack `#alerts-critical` + PagerDuty
- **WarningAlertsTopic**: Warning severity alerts → Slack `#alerts-warning`
- **OpsAlertsTopic**: Ops-related alerts → Slack `#ops-alerts`

## Monitoring Best Practices

### Metrics

1. **Use appropriate namespaces**: Custom metrics in `RemitScout`, AWS service metrics in their respective namespaces
2. **Set dimensions carefully**: High-cardinality dimensions increase costs
3. **Use statistics appropriately**: `Average`, `Sum`, `p95`, etc.
4. **Set retention periods**: CloudWatch metrics are retained for 15 months by default

### Alarms

1. **Set appropriate thresholds**: Based on SLOs and historical data
2. **Use evaluation periods**: Multiple periods reduce false positives
3. **Configure treatMissingData**: Decide how to handle missing data
4. **Add alarm descriptions**: Helpful for on-call engineers

### Dashboards

1. **Group related metrics**: Use widget titles and organization
2. **Set appropriate periods**: Match alarm evaluation periods
3. **Use annotations**: Mark deployments and incidents
4. **Share dashboards**: Use CloudWatch dashboard sharing

### Synthetic Monitoring

1. **Test critical paths**: Focus on user-facing endpoints
2. **Set appropriate intervals**: Balance coverage vs. cost
3. **Monitor canary health**: Set up alarms for canary failures
4. **Review canary reports**: Check for flaky tests

## Troubleshooting

### Metrics Not Appearing

1. Check IAM permissions for CloudWatch `PutMetricData`
2. Verify metric namespace matches alarm configuration
3. Check CloudWatch Logs for metric emission errors
4. Verify application is emitting metrics (check logs)

### Alarms Not Firing

1. Check alarm state in CloudWatch console
2. Verify metric data exists for the alarm period
3. Check alarm threshold and evaluation periods
4. Verify SNS topic has subscriptions

### SNS Not Delivering

1. Check SNS subscription status (confirmed/pending)
2. Verify webhook URLs are correct
3. Check SNS delivery logs
4. Verify IAM permissions for SNS

### Synthetics Failing

1. Check canary execution logs in CloudWatch Logs
2. Verify canary code is correct
3. Check network connectivity from canary to target
4. Review canary reports in CloudWatch Synthetics console

## Cost Considerations

### CloudWatch Metrics

- **Custom metrics**: $0.30 per metric per month
- **API requests**: $0.01 per 1,000 requests
- **Alarms**: $0.10 per alarm per month

### CloudWatch Synthetics

- **Canary runs**: $0.0012 per canary run
- **Data processing**: $0.0000166667 per GB processed
- **Storage**: Standard S3 pricing for artifacts

### SNS

- **Notifications**: $0.50 per 100,000 notifications
- **Data transfer**: Standard AWS data transfer pricing

### Cost Optimization

1. **Reduce custom metric cardinality**: Use fewer dimensions
2. **Increase alarm evaluation periods**: Reduce alarm evaluation frequency
3. **Optimize synthetic canary frequency**: Balance coverage vs. cost
4. **Use CloudWatch Insights**: More cost-effective than custom metrics for logs

## Legacy Files

The following files in `k8s/` are **deprecated** and not used in AWS deployment:

- `k8s/prometheus-alert-rules.yaml` - Replaced by CloudWatch Alarms
- `k8s/alertmanager-config.yaml` - Replaced by SNS subscriptions
- `k8s/grafana-dashboards/*.json` - Replaced by CloudWatch Dashboards
- `k8s/synthetic-monitor-deployment.yaml` - Replaced by CloudWatch Synthetics

These files are kept for reference but should not be used in AWS deployments.

## References

- [CloudWatch Metrics Documentation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/working_with_metrics.html)
- [CloudWatch Alarms Documentation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html)
- [CloudWatch Synthetics Documentation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Canaries.html)
- [SNS Documentation](https://docs.aws.amazon.com/sns/latest/dg/welcome.html)
- [CDK Monitoring Constructs](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudwatch-readme.html)

